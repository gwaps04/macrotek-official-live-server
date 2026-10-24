// FILE: src/app/(admin)/dashboard/documents/document-editor.actions.ts
"use server";

import { sql } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// ====================================================================================
// WOZ UPGRADE: MACROBIZ WEBHOOK DISPATCHER (EDITOR VERSION)
// ====================================================================================
async function dispatchToMacrobizFromEditor(docId: string) {
  try {
    // 1. Check if Macrobiz is active
    const mbzCheck = await sql`
      SELECT is_active, credentials 
      FROM platform_integrations 
      WHERE provider = 'macrobiz' LIMIT 1
    `;
    
    const config = mbzCheck[0];
    if (!config || !config.is_active || !config.credentials?.apiKey) return;

    const { apiKey } = config.credentials;

    // 2. Fetch the Document to get the lead_id
    const docData = await sql`SELECT lead_id, document_json FROM lead_documents WHERE id = ${docId}`;
    if (!docData.length) return;
    
    const doc = docData[0];
    const leadId = doc.lead_id;
    const docSchema = doc.document_json || {};

    // 3. Fetch Lead Data
    let leadData;
    const apptCheck = await sql`SELECT client_first_name as first, client_last_name as last, client_email as email, client_phone as phone FROM appointments WHERE id::text = ${leadId}`;
    
    if (apptCheck.length > 0) {
      leadData = apptCheck[0];
    } else {
      const classCheck = await sql`SELECT student_first_name as first, student_last_name as last, student_email as email, student_phone as phone FROM class_enrollments WHERE id::text = ${leadId}`;
      leadData = classCheck[0];
    }

    if (!leadData) return;

    // Extract price (checking multiple possible schema keys)
    const amount = Number(docSchema['{{contractPrice}}'] || docSchema['contractPrice'] || docSchema['price'] || 0);

    // 4. Construct Payload
    const payload = {
      customer: {
        name: `${leadData.first} ${leadData.last}`.trim(),
        email: leadData.email,
        phone: leadData.phone
      },
      invoice: {
        amount: amount,
        description: `Contract ID: ${docId.split('-')[0].toUpperCase()} (Staged via Editor)`
      }
    };

    // 5. Fire Webhook
    const macrobizUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000/api/v1/invoices/external'
      : 'https://your-macrobiz-domain.com/api/v1/invoices/external';

    const response = await fetch(macrobizUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error("[Macrobiz Editor Integration Failed]:", await response.text());
    } else {
      console.log("[Macrobiz Editor Integration Success]: Deal staged in Macrobiz Inbox!");
    }
  } catch (error) {
    console.error("[Macrobiz Editor Integration Error]:", error);
  }
}

// ====================================================================================
// EDITOR SAVE ACTION
// ====================================================================================
export async function updateLeadDocumentAction(docId: string, documentJson: any, status: string) {
  try {
    // 1. Save Document
    await sql`
      UPDATE lead_documents
      SET 
        document_json = ${documentJson}::jsonb, 
        status = ${status}, 
        updated_at = NOW()
      WHERE id = ${docId}
    `;
    
    // 2. WOZ FIX: Fire webhook if Editor marks it as Completed
    if (status === 'Completed (E-Signed)' || status === 'Completed') {
      dispatchToMacrobizFromEditor(docId).catch(console.error);
    }
    
    revalidatePath(`/dashboard/documents/${docId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}