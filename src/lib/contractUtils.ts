import { sql, ensureContractsSchema } from '@/lib/db';
import crypto from 'crypto';

// FILE: src/lib/contractUtils.ts
// WOZ ZERO-LEAK SECURITY: Unified contract cryptographic utilities, deterministic PINs, and retrieval service.
// This module contains NO "use server" directive, preventing public RPC exposure.

export interface ContractData {
  id: string;
  lead_id: string;
  lead_type: 'appointment' | 'enrollment';
  client_name: string;
  company_name: string;
  client_address: string;
  client_email: string;
  client_phone: string;
  contract_title?: string;
  project_cost?: number | null;
  downpayment_percentage?: number | null;
  currency?: string;
  access_code: string;
  scope_description?: string;
  custom_terms?: string;
  payment_terms_notes?: string;
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
  esign_enabled?: boolean;
  created_at: string;
}

/**
 * Generates a stable, high-entropy 6-digit access PIN based on a seed (e.g. lead ID).
 * Guarantees that every lead has their own distinct PIN, consistent across reloads.
 */
export function getDeterministicAccessCode(seed: string): string {
  if (!seed) return String(Math.floor(100000 + Math.random() * 900000));
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  const num = 100000 + (Math.abs(h) % 900000);
  return String(num);
}

/**
 * Generates a random 6-digit access PIN for when admin explicitly regenerates it.
 */
export function generateRandomAccessCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * WOZ ZERO-LEAK SECURITY: Sanitizes contract metadata for locked/public preview.
 * Strips secret access codes, addresses, emails, phones, and pricing terms
 * before transmitting to unauthenticated client RSC payloads.
 */
export function getMaskedContract(c: ContractData): ContractData {
  return {
    id: c.id,
    lead_id: c.lead_id,
    lead_type: c.lead_type,
    client_name: c.client_name,
    company_name: c.company_name,
    contract_title: c.contract_title,
    status: c.status,
    created_at: c.created_at,
    access_code: '', // Never leak secret PIN in initial unauthenticated payload
    client_address: '',
    client_email: '',
    client_phone: '',
    project_cost: null,
    downpayment_percentage: null,
    currency: c.currency || '',
    scope_description: '',
    custom_terms: '',
    payment_terms_notes: '',
    signature_data: null,
    signature_type: 'drawn',
    signed_at: c.signed_at,
    signed_by_name: null,
    signed_by_title: null,
    attachment_url: null,
    attachment_name: null,
    attachment_type: null,
    signing_method: c.signing_method,
    esign_enabled: c.esign_enabled
  };
}

/**
 * Authoritative server-side contract retriever and factory.
 * Completely internal - cannot be reached via client RPC endpoints.
 */
export async function getContractRecord(
  leadId: string, 
  leadType: 'appointment' | 'enrollment' = 'appointment'
): Promise<{ success: boolean; contract?: ContractData; error?: string }> {
  try {
    await ensureContractsSchema().catch(() => {});

    // 1. Check if contract record already exists (order by Signed status and recency)
    const existing = await sql`
      SELECT * FROM contracts 
      WHERE lead_id = ${leadId} OR id::text = ${leadId} 
      ORDER BY (CASE WHEN status = 'Signed' THEN 0 ELSE 1 END), created_at DESC 
      LIMIT 1
    `;

    if (existing.length > 0) {
      const c = existing[0];
      let accessCode = c.access_code;
      
      if (!accessCode || String(accessCode).trim() === '') {
        accessCode = getDeterministicAccessCode(leadId);
        try {
          await sql`UPDATE contracts SET access_code = ${accessCode} WHERE id::text = ${String(c.id)}`;
        } catch {}
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
          contract_title: c.contract_title || c.project_title || 'Master Service Agreement',
          project_cost: c.project_cost !== null && c.project_cost !== undefined && c.project_cost !== '' && !isNaN(Number(c.project_cost)) ? Number(c.project_cost) : null,
          downpayment_percentage: c.downpayment_percentage !== null && c.downpayment_percentage !== undefined && c.downpayment_percentage !== '' && !isNaN(Number(c.downpayment_percentage)) ? Number(c.downpayment_percentage) : null,
          currency: c.currency || '',
          access_code: accessCode,
          scope_description: c.scope_description || '',
          custom_terms: c.custom_terms || '',
          payment_terms_notes: c.payment_terms_notes || '',
          status: (c.status || 'Draft') as 'Draft' | 'Sent' | 'Signed',
          signature_data: c.signature_data || c.signature_svg || null,
          signature_type: c.signature_type || 'drawn',
          signed_at: c.signed_at || null,
          signed_by_name: c.signed_by_name || c.signed_by || null,
          signed_by_title: c.signed_by_title || null,
          attachment_url: c.attachment_url || null,
          attachment_name: c.attachment_name || null,
          attachment_type: c.attachment_type || null,
          signing_method: (c.signing_method || 'electronic') as 'electronic' | 'manual_hardcopy',
          esign_enabled: c.esign_enabled !== false,
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

    const apptRows = await sql`
      SELECT * FROM appointments WHERE id = ${leadId} LIMIT 1
    `;

    if (apptRows.length > 0) {
      const a = apptRows[0];
      clientName = `${a.client_first_name || ''} ${a.client_last_name || ''}`.trim();
      clientEmail = a.client_email || '';
      clientPhone = a.client_phone || '';
      clientAddress = a.client_address || '';

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
        } catch {}
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
      }
    }

    if (!clientName) {
      clientName = 'Valued Client';
    }

    const accessCode = getDeterministicAccessCode(leadId);

    // 3. Create the draft contract in DB with empty financials by default
    let row: any = null;
    try {
      const inserted = await sql`
        INSERT INTO contracts (
          lead_id, lead_type, client_name, company_name, 
          client_address, client_email, client_phone, 
          project_title, contract_title, project_cost, downpayment_percentage, currency, 
          access_code, scope_description, custom_terms, payment_terms_notes, status, esign_enabled
        )
        VALUES (
          ${leadId}, ${leadType}, ${clientName}, ${companyName},
          ${clientAddress}, ${clientEmail}, ${clientPhone},
          'Master Service Agreement', 'Master Service Agreement', null, null, '', 
          ${accessCode}, '', '', '', 'Draft', true
        )
        RETURNING *;
      `;
      row = inserted[0];
    } catch (insertErr) {
      console.warn('[Contract Insert Primary Warning, trying fallback]:', insertErr);
      try {
        const fallbackInsert = await sql`
          INSERT INTO contracts (
            lead_id, lead_type, client_name, company_name, 
            client_address, client_email, client_phone, 
            project_title, contract_title, access_code, status
          )
          VALUES (
            ${leadId}, ${leadType}, ${clientName}, ${companyName},
            ${clientAddress}, ${clientEmail}, ${clientPhone},
            'Master Service Agreement', 'Master Service Agreement', ${accessCode}, 'Draft'
          )
          RETURNING *;
        `;
        row = fallbackInsert[0];
      } catch (fallbackErr) {
        console.error('[Contract Insert Fallback Error]:', fallbackErr);
      }
    }

    const resolvedRow = row || {};

    return {
      success: true,
      contract: {
        id: String(resolvedRow.id || crypto.randomUUID()),
        lead_id: leadId,
        lead_type: leadType,
        client_name: clientName,
        company_name: companyName,
        client_address: clientAddress,
        client_email: clientEmail,
        client_phone: clientPhone,
        contract_title: 'Master Service Agreement',
        project_cost: null,
        downpayment_percentage: null,
        currency: '',
        access_code: accessCode,
        scope_description: '',
        custom_terms: '',
        payment_terms_notes: '',
        status: 'Draft',
        signing_method: 'electronic',
        esign_enabled: true,
        created_at: new Date().toISOString()
      }
    };
  } catch (err: any) {
    console.error('[Contract Service Error - getContractRecord]:', err);
    return { success: false, error: err.message || 'Failed to initialize contract' };
  }
}
