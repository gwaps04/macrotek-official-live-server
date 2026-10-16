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
  downpayment_percentage: number;
  currency: 'PHP' | 'USD' | string;
  access_code: string;
  scope_description?: string;
  status: 'Draft' | 'Sent' | 'Signed';
  signature_data?: string | null;
  signature_type?: 'drawn' | 'typed';
  signed_at?: string | null;
  signed_by_name?: string | null;
  signed_by_title?: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
  signing_method?: 'electronic' | 'manual_hardcopy';
  created_at: string;
}

function generateAccessCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function getOrCreateContractAction(
  leadId: string, 
  leadType: 'appointment' | 'enrollment' = 'appointment'
): Promise<{ success: boolean; contract?: ContractData; error?: string }> {
  try {
    // 1. Check if contract record already exists
    const existing = await sql`
      SELECT * FROM contracts WHERE lead_id = ${leadId} LIMIT 1
    `;

    if (existing.length > 0) {
      const c = existing[0];
      let accessCode = c.access_code;
      
      // Auto-generate access code if missing on legacy record
      if (!accessCode || accessCode.trim() === '') {
        accessCode = generateAccessCode();
        try {
          await sql`UPDATE contracts SET access_code = ${accessCode} WHERE id = ${c.id}`;
        } catch {
          // ignore error if column updating
        }
      }

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
          project_cost: Number(c.project_cost) || 50000,
          downpayment_percentage: Number(c.downpayment_percentage ?? 50),
          currency: (c.currency || 'PHP') as 'PHP' | 'USD',
          access_code: accessCode,
          scope_description: c.scope_description || '',
          status: (c.status || 'Draft') as 'Draft' | 'Sent' | 'Signed',
          signature_data: c.signature_data || null,
          signature_type: c.signature_type || 'drawn',
          signed_at: c.signed_at || null,
          signed_by_name: c.signed_by_name || null,
          signed_by_title: c.signed_by_title || null,
          attachment_url: c.attachment_url || null,
          attachment_name: c.attachment_name || null,
          attachment_type: c.attachment_type || null,
          signing_method: (c.signing_method || 'electronic') as 'electronic' | 'manual_hardcopy',
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
    let defaultCost = 50000;
    const defaultCurrency: 'PHP' | 'USD' = 'PHP';
    const defaultDownpayment = 50;

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
        try {
          const answers = typeof a.prequalification_answers === 'string' 
            ? JSON.parse(a.prequalification_answers) 
            : a.prequalification_answers;
          for (const [k, v] of Object.entries(answers)) {
            if (/company|business|organization/i.test(k) && typeof v === 'string') {
              companyName = v;
              break;
            }
          }
        } catch {
          // silent fallback
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
        if (e.class_price) defaultCost = Number(e.class_price) || 25000;
      }
    }

    if (!clientName) {
      clientName = 'Valued Client';
    }

    const accessCode = generateAccessCode();

    // 3. Create the draft contract in DB / mockStore
    const inserted = await sql`
      INSERT INTO contracts (
        lead_id, lead_type, client_name, company_name, 
        client_address, client_email, client_phone, 
        project_cost, downpayment_percentage, currency, access_code, status
      )
      VALUES (
        ${leadId}, ${leadType}, ${clientName}, ${companyName},
        ${clientAddress}, ${clientEmail}, ${clientPhone},
        ${defaultCost}, ${defaultDownpayment}, ${defaultCurrency}, ${accessCode}, 'Draft'
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
        downpayment_percentage: defaultDownpayment,
        currency: defaultCurrency,
        access_code: accessCode,
        status: 'Draft',
        signing_method: 'electronic',
        created_at: new Date().toISOString()
      }
    };
  } catch (err: any) {
    console.error('[Contract Action Error - getOrCreate]:', err);
    return { success: false, error: err.message || 'Failed to initialize contract' };
  }
}

export async function verifyContractAccessCodeAction(
  leadId: string, 
  enteredCode: string
): Promise<{ success: boolean; valid: boolean; error?: string }> {
  try {
    const cleanCode = enteredCode.trim().replace(/[-\s]/g, '');
    const rows = await sql`
      SELECT * FROM contracts WHERE lead_id = ${leadId} OR id = ${leadId} LIMIT 1
    `;

    if (rows.length === 0) {
      return { success: false, valid: false, error: 'Contract record not found' };
    }

    const contract = rows[0];
    const contractCode = String(contract.access_code || '').trim().replace(/[-\s]/g, '');

    if (!contractCode) {
      // If no code set, default allow
      return { success: true, valid: true };
    }

    const isValid = contractCode.toLowerCase() === cleanCode.toLowerCase();
    return { success: true, valid: isValid };
  } catch (err: any) {
    console.error('[Contract Action Error - verifyCode]:', err);
    return { success: false, valid: false, error: err.message || 'Verification failed' };
  }
}

export async function signContractAction(payload: {
  leadId: string;
  signatureData: string;
  signatureType: 'drawn' | 'typed';
  signedByName: string;
  signedByTitle?: string;
  accessCode?: string;
}) {
  try {
    // If access code was provided, verify it first
    if (payload.accessCode) {
      const verify = await verifyContractAccessCodeAction(payload.leadId, payload.accessCode);
      if (!verify.valid) {
        return { success: false, error: 'Invalid access code. Please enter the correct code to sign.' };
      }
    }

    const signedAt = new Date().toISOString();

    await sql`
      UPDATE contracts SET 
        signature_data = ${payload.signatureData},
        signature_type = ${payload.signatureType},
        signed_at = ${signedAt},
        signed_by_name = ${payload.signedByName},
        signed_by_title = ${payload.signedByTitle || 'Authorized Client'},
        status = 'Signed',
        signing_method = 'electronic'
      WHERE lead_id = ${payload.leadId} OR id = ${payload.leadId}
    `;

    // Fetch the updated contract to dispatch webhook to n8n / ClickUp
    const rows = await sql`
      SELECT * FROM contracts WHERE lead_id = ${payload.leadId} OR id = ${payload.leadId} LIMIT 1
    `;
    const contract = rows[0];

    if (contract) {
      const currSymbol = contract.currency === 'PHP' ? '₱' : '$';
      // Trigger instant n8n notification for contract execution
      dispatchWebhook('test.ping', {
        first_name: payload.signedByName.split(' ')[0] || payload.signedByName,
        last_name: payload.signedByName.split(' ').slice(1).join(' ') || '',
        email: contract.client_email || '',
        phone: contract.client_phone || '',
        address: contract.client_address || '',
        title: `CONTRACT SIGNED - Standard Service Agreement (${currSymbol}${Number(contract.project_cost || 50000).toLocaleString()} ${contract.currency || 'PHP'})`,
        notes: `Digitally executed by ${payload.signedByName} (${payload.signedByTitle || 'Client'}) at ${signedAt} via access code ${contract.access_code || 'verified'}`,
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

export async function updateContractFinancialsAction(payload: {
  contractId: string;
  leadId?: string;
  projectCost: number;
  downpaymentPercentage: number;
  currency: 'PHP' | 'USD';
  companyName?: string;
  clientAddress?: string;
  scopeDescription?: string;
}) {
  try {
    await sql`
      UPDATE contracts SET 
        project_cost = ${payload.projectCost},
        downpayment_percentage = ${payload.downpaymentPercentage},
        currency = ${payload.currency},
        company_name = ${payload.companyName || ''},
        client_address = ${payload.clientAddress || ''},
        scope_description = ${payload.scopeDescription || ''}
      WHERE id = ${payload.contractId} OR lead_id = ${payload.leadId || payload.contractId}
    `;

    if (payload.leadId) {
      revalidatePath(`/contract/${payload.leadId}`);
    }
    revalidatePath('/dashboard/leads');
    return { success: true };
  } catch (err: any) {
    console.error('[Contract Action Error - updateFinancials]:', err);
    return { success: false, error: err.message || 'Failed to update contract terms' };
  }
}

export async function updateContractStatusAndAttachmentAction(payload: {
  contractId: string;
  leadId?: string;
  status: 'Draft' | 'Sent' | 'Signed';
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
  signingMethod?: 'electronic' | 'manual_hardcopy';
  signedByName?: string | null;
}) {
  try {
    const signedAt = payload.status === 'Signed' ? new Date().toISOString() : null;

    if (payload.attachmentUrl) {
      await sql`
        UPDATE contracts SET 
          status = 'Signed',
          attachment_url = ${payload.attachmentUrl},
          attachment_name = ${payload.attachmentName || 'signed-contract-hardcopy.pdf'},
          attachment_type = ${payload.attachmentType || 'pdf'},
          signing_method = 'manual_hardcopy',
          signed_at = ${signedAt},
          signed_by_name = ${payload.signedByName || 'Hardcopy Signatory'}
        WHERE id = ${payload.contractId} OR lead_id = ${payload.leadId || payload.contractId}
      `;
    } else {
      await sql`
        UPDATE contracts SET 
          status = ${payload.status},
          signing_method = ${payload.signingMethod || 'electronic'},
          signed_at = ${signedAt}
        WHERE id = ${payload.contractId} OR lead_id = ${payload.leadId || payload.contractId}
      `;
    }

    if (payload.leadId) {
      revalidatePath(`/contract/${payload.leadId}`);
    }
    revalidatePath('/dashboard/leads');
    return { success: true };
  } catch (err: any) {
    console.error('[Contract Action Error - updateStatusAndAttachment]:', err);
    return { success: false, error: err.message || 'Failed to update status and attachment' };
  }
}

export async function regenerateAccessCodeAction(contractId: string, leadId?: string) {
  try {
    const newCode = generateAccessCode();
    await sql`
      UPDATE contracts SET access_code = ${newCode}
      WHERE id = ${contractId} OR lead_id = ${leadId || contractId}
    `;

    if (leadId) {
      revalidatePath(`/contract/${leadId}`);
    }
    revalidatePath('/dashboard/leads');
    return { success: true, newCode };
  } catch (err: any) {
    console.error('[Contract Action Error - regenerateCode]:', err);
    return { success: false, error: err.message || 'Failed to regenerate code' };
  }
}
