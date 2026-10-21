"use server";

import { sql, ensureContractsSchema } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { 
  getDeterministicAccessCode, 
  generateRandomAccessCode, 
  getContractRecord, 
  getMaskedContract, 
  type ContractData 
} from '@/lib/contractUtils';
import { assertAdminSession } from '@/lib/auth';

// FILE: src/app/contract/contract.actions.ts
// WOZ ZERO-LEAK SECURITY CORE: Contract mutations, signature authorization, and RBAC guards.

export type { ContractData };
export { getMaskedContract };

export async function getOrCreateContractAction(
  leadId: string, 
  leadType: 'appointment' | 'enrollment' = 'appointment'
): Promise<{ success: boolean; contract?: ContractData; error?: string }> {
  try {
    const res = await getContractRecord(leadId, leadType);
    if (!res.success || !res.contract) return res;

    // WOZ ZERO-LEAK SECURITY: If invoked via public RPC by an unauthenticated caller,
    // mask the secret PIN, financial terms, and contact PII before returning.
    const adminCheck = await assertAdminSession();
    if (!adminCheck.valid) {
      return {
        success: true,
        contract: getMaskedContract(res.contract)
      };
    }

    return res;
  } catch (err: any) {
    console.error('[Contract Action Error - getOrCreate]:', err);
    return { success: false, error: err.message || 'Failed to initialize contract' };
  }
}

export async function verifyContractAccessCodeAction(
  leadId: string, 
  enteredCode: string
): Promise<{ success: boolean; valid: boolean; contract?: ContractData; error?: string }> {
  try {
    const cleanCode = enteredCode.trim().replace(/[-\s]/g, '');
    if (!cleanCode) {
      return { success: false, valid: false, error: 'Access code cannot be empty' };
    }

    // 1. Check existing contracts matching lead_id or contract id
    const rows = await sql`
      SELECT * FROM contracts 
      WHERE lead_id = ${leadId} OR id::text = ${leadId} 
      ORDER BY (CASE WHEN status = 'Signed' THEN 0 ELSE 1 END), created_at DESC 
      LIMIT 5
    `;

    let hasContractWithCode = false;
    let matched = false;

    for (const contract of rows) {
      const contractCode = String(contract.access_code || '').trim().replace(/[-\s]/g, '');
      if (contractCode) {
        hasContractWithCode = true;
        if (contractCode.toLowerCase() === cleanCode.toLowerCase()) {
          matched = true;
          break;
        }
      }
    }

    // 2. Fallback to deterministic code only if no contract with an access code exists in DB yet
    if (!matched && !hasContractWithCode) {
      const deterministicCode = getDeterministicAccessCode(leadId);
      if (deterministicCode.toLowerCase() === cleanCode.toLowerCase()) {
        matched = true;
      }

      if (!matched && rows.length > 0 && rows[0].lead_id && rows[0].lead_id !== leadId) {
        const secondaryDeterministic = getDeterministicAccessCode(String(rows[0].lead_id));
        if (secondaryDeterministic.toLowerCase() === cleanCode.toLowerCase()) {
          matched = true;
        }
      }
    }

    if (matched) {
      // Securely hydrate and return full confidential contract to authorized client
      const fullRes = await getContractRecord(leadId);
      return { 
        success: true, 
        valid: true, 
        contract: fullRes.contract 
      };
    }

    return { success: true, valid: false };
  } catch (err: any) {
    console.error('[Contract Action Error - verifyCode]:', err);
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

    // WOZ ZERO-LEAK SECURITY: Enforce access code PIN or active administrative session
    const adminCheck = await assertAdminSession();
    if (!adminCheck.valid) {
      if (!payload.accessCode || !payload.accessCode.trim()) {
        return { success: false, error: 'Access code PIN is required to execute signature.' };
      }
      const verify = await verifyContractAccessCodeAction(targetLeadId, payload.accessCode);
      if (!verify.valid) {
        return { success: false, error: 'Invalid access code. Please enter the correct code to sign.' };
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
    // WOZ ZERO-LEAK SECURITY: Enforce active administrative session
    const adminCheck = await assertAdminSession();
    if (!adminCheck.valid) {
      return { success: false, error: 'Unauthorized: Administrative credentials required to modify contract financials' };
    }

    const targetLeadId = payload.leadId || payload.contractId;

    // 0. Ensure schema is synchronized against Neon DB
    await ensureContractsSchema().catch(() => {});

    // 1. Ensure contract record exists in DB first (so update is never dropped)
    await getContractRecord(targetLeadId, payload.leadType || 'appointment');

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
    // WOZ ZERO-LEAK SECURITY: Enforce active administrative session
    const adminCheck = await assertAdminSession();
    if (!adminCheck.valid) {
      return { success: false, error: 'Unauthorized: Administrative credentials required to update contract status' };
    }

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
    // WOZ ZERO-LEAK SECURITY: Enforce active administrative session
    const adminCheck = await assertAdminSession();
    if (!adminCheck.valid) {
      return { success: false, error: 'Unauthorized: Administrative credentials required to regenerate access code' };
    }

    const newCode = generateRandomAccessCode();
    const effectiveLeadId = leadId || contractId;

    // Ensure contract exists before regenerating code
    await getContractRecord(effectiveLeadId);

    await sql`
      UPDATE contracts SET access_code = ${newCode}
      WHERE lead_id = ${effectiveLeadId} OR id::text = ${contractId}
    `;

    try {
      if (leadId) {
        revalidatePath(`/contract/${leadId}`);
      }
      revalidatePath('/dashboard/leads');
    } catch {
      // Revalidation inside server action context can safely ignore out-of-context errors
    }
    return { success: true, newCode };
  } catch (err: any) {
    console.error('[Contract Action Error - regenerateCode]:', err);
    return { success: false, error: err.message || 'Failed to regenerate code' };
  }
}

export async function toggleContractEsignAction(leadId: string, enabled: boolean) {
  try {
    // WOZ ZERO-LEAK SECURITY: Enforce active administrative session
    const adminCheck = await assertAdminSession();
    if (!adminCheck.valid) {
      return { success: false, error: 'Unauthorized: Administrative credentials required to modify e-sign settings' };
    }

    await getContractRecord(leadId);

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

