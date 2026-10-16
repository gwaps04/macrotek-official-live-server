"use server";

import { sql } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { dispatchWebhook } from '@/lib/webhookDispatcher';

// FILE: src/app/contract/contract.actions.ts

export interface ContractData {
  id: string;
  lead_id: string;
  lead_type: 'appointment' | 'enrollment';
  client_name: string;
  company_name: string;
  client_address: string;
  client_email: string;
  client_phone: string;
  project_cost: number;
  currency: string;
  scope_description?: string;
  status: 'Draft' | 'Sent' | 'Signed';
  signature_data?: string | null;
  signature_type?: 'drawn' | 'typed';
  signed_at?: string | null;
  signed_by_name?: string | null;
  signed_by_title?: string | null;
  created_at: string;
}

export async function getOrCreateContractAction(leadId: string, leadType: 'appointment' | 'enrollment' = 'appointment'): Promise<{ success: boolean; contract?: ContractData; error?: string }> {
  try {
    // 1. Check if contract record already exists
    const existing = await sql`
      SELECT * FROM contracts WHERE lead_id = ${leadId} LIMIT 1
    `;

    if (existing.length > 0) {
      const c = existing[0];
      return {
        success: true,
        contract: {
          id: String(c.id),
          lead_id: String(c.lead_id),
          lead_type: (c.lead_type || 'appointment') as 'appointment' | 'enrollment',
          client_name: c.client_name || '',
          company_name: c.company_name || '',
          client_address: c.client_address || '',
          client_email: c.client_email || '',
          client_phone: c.client_phone || '',
          project_cost: Number(c.project_cost) || 1500,
          currency: c.currency || 'USD',
          scope_description: c.scope_description || '',
          status: (c.status || 'Draft') as 'Draft' | 'Sent' | 'Signed',
          signature_data: c.signature_data || null,
          signature_type: c.signature_type || 'drawn',
          signed_at: c.signed_at || null,
          signed_by_name: c.signed_by_name || null,
          signed_by_title: c.signed_by_title || null,
          created_at: c.created_at || new Date().toISOString()
        }
      };
    }

    // 2. Fetch lead info from appointments or enrollments
    let clientName = '';
    let clientEmail = '';
    let clientPhone = '';
    let clientAddress = '';
    let companyName = '';
    let defaultCost = 1500;

    const apptRows = await sql`
      SELECT * FROM appointments WHERE id = ${leadId} LIMIT 1
    `;

    if (apptRows.length > 0) {
      const a = apptRows[0];
      clientName = `${a.client_first_name || ''} ${a.client_last_name || ''}`.trim();
      clientEmail = a.client_email || '';
      clientPhone = a.client_phone || '';
      clientAddress = a.client_address || '';

      // Try extracting company from prequalification answers or notes
      if (a.prequalification_answers) {
        const answers = typeof a.prequalification_answers === 'string' 
          ? JSON.parse(a.prequalification_answers) 
          : a.prequalification_answers;
        for (const [k, v] of Object.entries(answers)) {
          if (/company|business|organization/i.test(k) && typeof v === 'string') {
            companyName = v;
            break;
          }
        }
      }
    } else {
      const enrollRows = await sql`
        SELECT 
          ce.*, c.title as class_title, c.price as class_price
        FROM class_enrollments ce
        LEFT JOIN class_schedules cs ON ce.schedule_id = cs.id
        LEFT JOIN classes c ON cs.class_id = c.id
        WHERE ce.id = ${leadId}
        LIMIT 1
      `;
      if (enrollRows.length > 0) {
        const e = enrollRows[0];
        clientName = `${e.student_first_name || ''} ${e.student_last_name || ''}`.trim();
        clientEmail = e.student_email || '';
        clientPhone = e.student_phone || '';
        clientAddress = e.student_address || '';
        if (e.class_price) defaultCost = Number(e.class_price) || 1500;
      }
    }

    if (!clientName) {
      clientName = 'Client Prospect';
    }

    // 3. Create the draft contract in DB / mockStore
    const inserted = await sql`
      INSERT INTO contracts (
        lead_id, lead_type, client_name, company_name, 
        client_address, client_email, client_phone, 
        project_cost, currency, status
      )
      VALUES (
        ${leadId}, ${leadType}, ${clientName}, ${companyName},
        ${clientAddress}, ${clientEmail}, ${clientPhone},
        ${defaultCost}, 'USD', 'Draft'
      )
      RETURNING *;
    `;

    const row = inserted[0] || {};

    return {
      success: true,
      contract: {
        id: String(row.id || crypto.randomUUID()),
        lead_id: leadId,
        lead_type: leadType,
        client_name: clientName,
        company_name: companyName,
        client_address: clientAddress,
        client_email: clientEmail,
        client_phone: clientPhone,
        project_cost: defaultCost,
        currency: 'USD',
        status: 'Draft',
        created_at: new Date().toISOString()
      }
    };
  } catch (err: any) {
    console.error('[Contract Action Error - getOrCreate]:', err);
    return { success: false, error: err.message || 'Failed to initialize contract' };
  }
}

export async function signContractAction(payload: {
  leadId: string;
  signatureData: string;
  signatureType: 'drawn' | 'typed';
  signedByName: string;
  signedByTitle?: string;
}) {
  try {
    const signedAt = new Date().toISOString();

    await sql`
      UPDATE contracts SET 
        signature_data = ${payload.signatureData},
        signature_type = ${payload.signatureType},
        signed_at = ${signedAt},
        signed_by_name = ${payload.signedByName},
        signed_by_title = ${payload.signedByTitle || 'Client'},
        status = 'Signed'
      WHERE lead_id = ${payload.leadId} OR id = ${payload.leadId}
    `;

    // Fetch the updated contract to dispatch webhook to n8n / ClickUp
    const rows = await sql`
      SELECT * FROM contracts WHERE lead_id = ${payload.leadId} OR id = ${payload.leadId} LIMIT 1
    `;
    const contract = rows[0];

    if (contract) {
      // Trigger instant n8n notification for contract execution
      dispatchWebhook('test.ping', {
        first_name: payload.signedByName.split(' ')[0] || payload.signedByName,
        last_name: payload.signedByName.split(' ').slice(1).join(' ') || '',
        email: contract.client_email || '',
        phone: contract.client_phone || '',
        address: contract.client_address || '',
        title: `CONTRACT SIGNED - Standard Service Agreement (${contract.project_cost || 1500} ${contract.currency || 'USD'})`,
        notes: `Executed via e-Signature by ${payload.signedByName} (${payload.signedByTitle || 'Authorized Representative'}) at ${signedAt}`,
        price: contract.project_cost
      });
    }

    revalidatePath(`/contract/${payload.leadId}`);
    revalidatePath('/dashboard/leads');

    return { success: true };
  } catch (err: any) {
    console.error('[Contract Action Error - sign]:', err);
    return { success: false, error: err.message || 'Failed to submit e-signature' };
  }
}

export async function updateContractTermsAction(payload: {
  contractId: string;
  companyName?: string;
  projectCost?: number;
  currency?: string;
  clientAddress?: string;
}) {
  try {
    if (payload.companyName !== undefined) {
      await sql`UPDATE contracts SET company_name = ${payload.companyName} WHERE id = ${payload.contractId}`;
    }
    if (payload.projectCost !== undefined) {
      await sql`UPDATE contracts SET project_cost = ${payload.projectCost} WHERE id = ${payload.contractId}`;
    }
    if (payload.currency !== undefined) {
      await sql`UPDATE contracts SET currency = ${payload.currency} WHERE id = ${payload.contractId}`;
    }
    if (payload.clientAddress !== undefined) {
      await sql`UPDATE contracts SET client_address = ${payload.clientAddress} WHERE id = ${payload.contractId}`;
    }

    revalidatePath('/dashboard/leads');
    return { success: true };
  } catch (err: any) {
    console.error('[Contract Action Error - updateTerms]:', err);
    return { success: false, error: err.message || 'Failed to update contract terms' };
  }
}
