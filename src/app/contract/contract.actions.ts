"use server";

import { sql, ensureContractsSchema } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { getDeterministicAccessCode, generateRandomAccessCode } from '@/lib/contractUtils';

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

export async function getOrCreateContractAction(
  leadId: string, 
  leadType: 'appointment' | 'enrollment' = 'appointment'
): Promise<{ success: boolean; contract?: ContractData; error?: string }> {
  try {
    // 0. Ensure schema is synchronized against Neon DB
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
      
      // Auto-generate unique deterministic access code if missing on legacy record
      if (!accessCode || String(accessCode).trim() === '') {
        accessCode = getDeterministicAccessCode(leadId);
        try {
          await sql`UPDATE contracts SET access_code = ${accessCode} WHERE id::text = ${String(c.id)}`;
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
      }
    }

    if (!clientName) {
      clientName = 'Valued Client';
    }

    const accessCode = getDeterministicAccessCode(leadId);

    // 3. Create the draft contract in DB / mockStore with EMPTY financials by default
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
      // Fallback: accommodates tables with legacy column definitions
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
    if (!cleanCode) {
      return { success: false, valid: false, error: 'Access code cannot be empty' };
    }

    const rows = await sql`
      SELECT * FROM contracts WHERE lead_id = ${leadId} OR id::text = ${leadId} LIMIT 1
    `;

    if (rows.length > 0) {
      const contract = rows[0];
      const contractCode = String(contract.access_code || '').trim().replace(/[-\s]/g, '');

      if (!contractCode) {
        return { success: true, valid: true };
      }

      if (contractCode.toLowerCase() === cleanCode.toLowerCase()) {
        return { success: true, valid: true };
      }
    }

    // Check deterministic code for this lead as valid match
    const deterministicCode = getDeterministicAccessCode(leadId);
    if (deterministicCode.toLowerCase() === cleanCode.toLowerCase()) {
      return { success: true, valid: true };
    }

    return { success: true, valid: false };
  } catch (err: any) {
    console.error('[Contract Action Error - verifyCode]:', err);
    // Resilience fallback: match against deterministic code
    const deterministicCode = getDeterministicAccessCode(leadId);
    if (enteredCode.trim().replace(/[-\s]/g, '').toLowerCase() === deterministicCode.toLowerCase()) {
      return { success: true, valid: true };
    }
    return { success: false, valid: false, error: err.message || 'Verification failed' };
  }
}

export async function signContractAction(payload: {
  leadId: string;
  contractId?: string;
  signatureData: string;
  signatureType: 'drawn' | 'typed';
  signedByName: string;
  signedByTitle?: string;
  accessCode?: string;
}) {
  try {
    const targetLeadId = payload.leadId;
    const targetContractId = payload.contractId || payload.leadId;

    // 0. Ensure schema is synchronized against Neon DB
    await ensureContractsSchema().catch(() => {});

    // If access code was provided, verify it with resilience
    if (payload.accessCode && payload.accessCode.trim()) {
      const verify = await verifyContractAccessCodeAction(targetLeadId, payload.accessCode);
      if (!verify.valid) {
        const check = await sql`
          SELECT access_code FROM contracts 
          WHERE lead_id = ${targetLeadId} OR id::text = ${targetLeadId} 
             OR id::text = ${targetContractId} OR lead_id = ${targetContractId} 
          LIMIT 1
        `;
        const codeInDb = check[0]?.access_code ? String(check[0].access_code).trim().replace(/[-\s]/g, '').toLowerCase() : '';
        const entered = payload.accessCode.trim().replace(/[-\s]/g, '').toLowerCase();
        const deterministic = getDeterministicAccessCode(targetLeadId).toLowerCase();
        if (entered !== codeInDb && entered !== deterministic) {
          return { success: false, error: 'Invalid access code. Please enter the correct code to sign.' };
        }
      }
    }

    // Fetch the existing contract to verify e-sign is permitted
    const checkRows = await sql`
      SELECT * FROM contracts 
      WHERE lead_id = ${targetLeadId} OR id::text = ${targetLeadId} 
         OR id::text = ${targetContractId} OR lead_id = ${targetContractId} 
      LIMIT 1
    `;
    if (checkRows.length > 0 && checkRows[0].esign_enabled === false) {
      return { 
        success: false, 
        error: 'Online electronic signature is disabled for this contract by administrator. Please sign face-to-face via hardcopy.' 
      };
    }

    const signedAt = new Date().toISOString();

    const updateRes = await sql`
      UPDATE contracts SET 
        signature_data = ${payload.signatureData},
        signature_svg = ${payload.signatureData},
        signature_type = ${payload.signatureType},
        signed_at = ${signedAt},
        signed_by_name = ${payload.signedByName},
        signed_by = ${payload.signedByName},
        signed_by_title = ${payload.signedByTitle || 'Authorized Client'},
        status = 'Signed',
        signing_method = 'electronic'
      WHERE lead_id = ${targetLeadId} 
         OR id::text = ${targetLeadId} 
         OR id::text = ${targetContractId} 
         OR lead_id = ${targetContractId}
      RETURNING *;
    `;

    // Self-healing fallback if no existing row was matched: insert new signed record
    if (!updateRes || updateRes.length === 0) {
      await sql`
        INSERT INTO contracts (
          lead_id, client_name, client_email, status, signature_data, signature_svg, signature_type, signed_at, signed_by_name, signed_by, signed_by_title, signing_method, esign_enabled
        ) VALUES (
          ${targetLeadId}, ${payload.signedByName}, '', 'Signed', ${payload.signatureData}, ${payload.signatureData}, ${payload.signatureType}, ${signedAt}, ${payload.signedByName}, ${payload.signedByName}, ${payload.signedByTitle || 'Authorized Client'}, 'electronic', true
        )
      `.catch(() => {});
    }

    revalidatePath(`/contract/${targetLeadId}`);
    if (targetContractId !== targetLeadId) {
      revalidatePath(`/contract/${targetContractId}`);
    }
    revalidatePath('/dashboard/leads');

    return { 
      success: true,
      signedAt,
      signedByName: payload.signedByName,
      signedByTitle: payload.signedByTitle || 'Authorized Client'
    };
  } catch (err: any) {
    console.error('[Contract Action Error - sign]:', err);
    return { success: false, error: err.message || 'Failed to submit e-signature' };
  }
}

export async function updateContractFinancialsAction(payload: {
  contractId: string;
  leadId?: string;
  leadType?: 'appointment' | 'enrollment';
  projectCost?: number | null;
  downpaymentPercentage?: number | null;
  currency?: string;
  companyName?: string;
  clientAddress?: string;
  contractTitle?: string;
  scopeDescription?: string;
  customTerms?: string;
  paymentTermsNotes?: string;
  esignEnabled?: boolean;
}) {
  try {
    const targetLeadId = payload.leadId || payload.contractId;

    // 0. Ensure schema is synchronized against Neon DB
    await ensureContractsSchema().catch(() => {});

    // 1. Ensure contract record exists in DB first (so update is never dropped)
    await getOrCreateContractAction(targetLeadId, payload.leadType || 'appointment');

    const esignVal = payload.esignEnabled !== undefined ? payload.esignEnabled : true;
    const projectCostVal = payload.projectCost !== undefined && payload.projectCost !== null && !isNaN(Number(payload.projectCost)) && String(payload.projectCost).trim() !== ''
      ? Number(payload.projectCost) 
      : null;
    const downpaymentVal = payload.downpaymentPercentage !== undefined && payload.downpaymentPercentage !== null && !isNaN(Number(payload.downpaymentPercentage)) && String(payload.downpaymentPercentage).trim() !== ''
      ? Number(payload.downpaymentPercentage) 
      : null;
    const currencyVal = payload.currency !== undefined && payload.currency !== null ? String(payload.currency).trim() : '';
    const titleVal = payload.contractTitle || 'Master Service Agreement';
    const scopeVal = payload.scopeDescription !== undefined && payload.scopeDescription !== null ? String(payload.scopeDescription) : '';
    const customTermsVal = payload.customTerms !== undefined && payload.customTerms !== null ? String(payload.customTerms) : '';
    const paymentTermsVal = payload.paymentTermsNotes !== undefined && payload.paymentTermsNotes !== null ? String(payload.paymentTermsNotes) : '';

    try {
      await sql`
        UPDATE contracts SET 
          project_cost = ${projectCostVal},
          downpayment_percentage = ${downpaymentVal},
          currency = ${currencyVal},
          company_name = ${payload.companyName || ''},
          client_address = ${payload.clientAddress || ''},
          contract_title = ${titleVal},
          project_title = ${titleVal},
          scope_description = ${scopeVal},
          custom_terms = ${customTermsVal},
          payment_terms_notes = ${paymentTermsVal},
          esign_enabled = ${esignVal}
        WHERE lead_id = ${targetLeadId} OR id::text = ${payload.contractId} OR id::text = ${targetLeadId}
      `;
    } catch (primaryUpdateErr) {
      console.warn('[Contract Update Primary Warning, trying fallback]:', primaryUpdateErr);
      // Fallback for tables without scope_description or esign_enabled
      await sql`
        UPDATE contracts SET 
          project_cost = ${projectCostVal},
          downpayment_percentage = ${downpaymentVal},
          currency = ${currencyVal},
          company_name = ${payload.companyName || ''},
          client_address = ${payload.clientAddress || ''},
          contract_title = ${titleVal},
          project_title = ${titleVal},
          custom_terms = ${customTermsVal},
          payment_terms_notes = ${paymentTermsVal}
        WHERE lead_id = ${targetLeadId} OR id::text = ${payload.contractId} OR id::text = ${targetLeadId}
      `;
    }

    // Ensure immediate cache bust across all potential contract URLs
    if (payload.leadId) {
      revalidatePath(`/contract/${payload.leadId}`);
    }
    if (payload.contractId && payload.contractId !== payload.leadId) {
      revalidatePath(`/contract/${payload.contractId}`);
    }
    if (targetLeadId) {
      revalidatePath(`/contract/${targetLeadId}`);
    }
    revalidatePath('/dashboard/leads');

    return { 
      success: true,
      contract: {
        lead_id: targetLeadId,
        project_cost: projectCostVal,
        downpayment_percentage: downpaymentVal,
        currency: currencyVal,
        contract_title: titleVal,
        scope_description: scopeVal,
        custom_terms: customTermsVal,
        payment_terms_notes: paymentTermsVal,
        company_name: payload.companyName || '',
        client_address: payload.clientAddress || '',
        esign_enabled: esignVal
      }
    };
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
    const targetLeadId = payload.leadId || payload.contractId;

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
        WHERE lead_id = ${targetLeadId} OR id::text = ${payload.contractId}
      `;
    } else {
      await sql`
        UPDATE contracts SET 
          status = ${payload.status},
          signing_method = ${payload.signingMethod || 'electronic'},
          signed_at = ${signedAt}
        WHERE lead_id = ${targetLeadId} OR id::text = ${payload.contractId}
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
    const newCode = generateRandomAccessCode();
    const effectiveLeadId = leadId || contractId;

    // Ensure contract exists before regenerating code
    await getOrCreateContractAction(effectiveLeadId);

    await sql`
      UPDATE contracts SET access_code = ${newCode}
      WHERE lead_id = ${effectiveLeadId} OR id::text = ${contractId}
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

export async function toggleContractEsignAction(leadId: string, enabled: boolean) {
  try {
    await getOrCreateContractAction(leadId);

    await sql`
      UPDATE contracts SET esign_enabled = ${enabled}
      WHERE lead_id = ${leadId} OR id::text = ${leadId}
    `;

    revalidatePath(`/contract/${leadId}`);
    revalidatePath('/dashboard/leads');
    return { success: true, esign_enabled: enabled };
  } catch (err: any) {
    console.error('[Contract Action Error - toggleEsign]:', err);
    return { success: false, error: err.message || 'Failed to toggle e-sign status' };
  }
}

