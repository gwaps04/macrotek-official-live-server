// FILE: src/app/contract/contract.actions.ts
"use server";

import { sql } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function signDocumentAction(accessCode: string, signatureBase64: string | null) {
  try {
    // 1. Update the document with the signature data and mark as Completed
    const result = await sql`
      UPDATE lead_documents
      SET 
        signature_data = ${signatureBase64},
        signed_at = NOW(),
        status = 'Completed',
        updated_at = NOW()
      WHERE access_code = ${accessCode}
      RETURNING id
    `;

    if (result.length === 0) {
      throw new Error("Document not found or invalid access code.");
    }

    // 2. Revalidate the public client route so it instantly shows the "Completed" state
    revalidatePath(`/contract/${accessCode}`);
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}