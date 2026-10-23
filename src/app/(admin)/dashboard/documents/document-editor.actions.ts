// FILE: src/app/(admin)/dashboard/documents/document-editor.actions.ts
"use server";

import { sql } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function updateLeadDocumentAction(docId: string, documentJson: any, status: string) {
  try {
    await sql`
      UPDATE lead_documents
      SET 
        document_json = ${documentJson}::jsonb, 
        status = ${status}, 
        updated_at = NOW()
      WHERE id = ${docId}
    `;
    
    revalidatePath(`/dashboard/documents/${docId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}