// FILE: src/app/(admin)/dashboard/leads/document.actions.ts
"use server";

import { sql } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getFormTemplatesAction() {
  try {
    const templates = await sql`SELECT id, title, description, type FROM form_templates WHERE is_active = true ORDER BY title ASC`;
    return { success: true, templates };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getLeadDocumentsAction(leadId: string) {
  try {
    const documents = await sql`SELECT id, title, status, access_code, created_at FROM lead_documents WHERE lead_id = ${leadId} ORDER BY created_at DESC`;
    return { success: true, documents };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function generateDocumentAction(leadId: string, leadType: string, templateId: string) {
  try {
    let lead;
    if (leadType === 'appointment') {
      const rows = await sql`SELECT * FROM appointments WHERE id::text = ${leadId}`;
      lead = rows[0];
    } else {
      const rows = await sql`SELECT * FROM class_enrollments WHERE id::text = ${leadId}`;
      lead = rows[0];
    }
    
    if (!lead) throw new Error("Lead not found in the database.");

    const fullName = leadType === 'appointment' 
      ? `${lead.client_first_name} ${lead.client_last_name}`.trim()
      : `${lead.student_first_name} ${lead.student_last_name}`.trim();
      
    const email = leadType === 'appointment' ? lead.client_email : lead.student_email;
    const phone = leadType === 'appointment' ? lead.client_phone : lead.student_phone;
    const date = leadType === 'appointment' ? lead.appointment_date : lead.schedule_date;
    const time = leadType === 'appointment' ? lead.appointment_time : lead.start_time;
    const address = leadType === 'appointment' ? lead.client_address : lead.student_address;

    const tplRows = await sql`SELECT * FROM form_templates WHERE id::text = ${templateId}`;
    const template = tplRows[0];
    
    if (!template) throw new Error("Template not found.");

    const dictionary: Record<string, string> = {
      '{{client_name}}': fullName || 'Valued Client',
      '{{client_email}}': email || 'No Email Provided',
      '{{client_phone}}': phone || 'No Phone Provided',
      '{{client_address}}': address || 'No Address Provided',
      '{{event_date}}': date ? new Date(date).toLocaleDateString() : 'TBD',
      '{{event_time}}': time || 'TBD'
    };

    let docJsonString = JSON.stringify(template.schema_json);
    
    Object.entries(dictionary).forEach(([tag, value]) => {
      const regex = new RegExp(tag, 'g');
      docJsonString = docJsonString.replace(regex, value);
    });

    const processedJson = JSON.parse(docJsonString);
    
    // THE METADATA SNAPSHOT
    processedJson.clientMeta = {
      fullName: fullName || 'Not provided',
      email: email || 'Not provided',
      phone: phone || 'Not provided',
      address: address || 'Not provided'
    };
    
    const accessCode = Math.floor(100000 + Math.random() * 900000).toString();
    const requireSignature = processedJson.require_signature ?? false;

    // Explicitly use JSON.stringify() in the SQL command to prevent Neon driver data loss
    const jsonStringPayload = JSON.stringify(processedJson);

    const result = await sql`
      INSERT INTO lead_documents (
        lead_id, 
        lead_type, 
        template_id, 
        title, 
        document_json, 
        status, 
        access_code, 
        require_signature
      ) VALUES (
        ${leadId}, 
        ${leadType}, 
        ${template.id}, 
        ${template.title}, 
        ${jsonStringPayload}::jsonb, 
        'Draft', 
        ${accessCode}, 
        ${requireSignature}
      ) RETURNING id, title, status, access_code, created_at
    `;

    revalidatePath('/dashboard/leads');
    return { success: true, document: result[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// WOZ UPGRADE: Secure Deletion Action
export async function deleteDocumentAction(documentId: string) {
  try {
    await sql`DELETE FROM lead_documents WHERE id = ${documentId}`;
    revalidatePath('/dashboard/leads');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
async function dispatchToMacrobiz(leadId: string, docId: string) {
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

    // 2. Fetch Lead & Document Data
    let leadData;
    // Assuming 'appointments' is the primary leads table based on your generateDocumentAction
    const apptCheck = await sql`SELECT client_first_name as first, client_last_name as last, client_email as email, client_phone as phone FROM appointments WHERE id::text = ${leadId}`;
    
    if (apptCheck.length > 0) {
      leadData = apptCheck[0];
    } else {
      const classCheck = await sql`SELECT student_first_name as first, student_last_name as last, student_email as email, student_phone as phone FROM class_enrollments WHERE id::text = ${leadId}`;
      leadData = classCheck[0];
    }

    const docData = await sql`SELECT document_json FROM lead_documents WHERE id = ${docId}`;
    if (!leadData || !docData.length) return;
    
    const docSchema = docData[0].document_json || {};
    
    // Look for standard pricing fields in your JSON template variables
    const amount = Number(docSchema['{{contractPrice}}'] || docSchema['contractPrice'] || 0);

    // 3. Construct Payload
    const payload = {
      customer: {
        name: `${leadData.first} ${leadData.last}`.trim(),
        email: leadData.email,
        phone: leadData.phone
      },
      invoice: {
        amount: amount,
        description: `Contract ID: ${docId.split('-')[0].toUpperCase()} (Auto-Staged)`
      }
    };

    // 4. Fire Webhook
    const macrobizUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000/api/v1/invoices/external'
      : 'https://your-macrobiz-domain.com/api/v1/invoices/external'; // <-- Update this before Vercel deploy!

    const response = await fetch(macrobizUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error("[Macrobiz Integration Failed]:", await response.text());
    } else {
      console.log("[Macrobiz Integration Success]: Deal staged in Macrobiz Inbox!");
    }
  } catch (error) {
    console.error("[Macrobiz Integration Error]:", error);
  }
}

// ====================================================================================
// STATUS UPDATE ACTION (Fires the webhook on completion)
// ====================================================================================
export async function updateDocumentStatusAction(leadId: string, docId: string, newStatus: string) {
  try {
    // 1. Update Database
    await sql`
      UPDATE lead_documents 
      SET status = ${newStatus}, updated_at = NOW() 
      WHERE id = ${docId} AND lead_id = ${leadId}
    `;

    // 2. Fire the Macrobiz trigger silently in the background
    if (newStatus === 'Completed (E-Signed)' || newStatus === 'Completed') {
      dispatchToMacrobiz(leadId, docId).catch(console.error);
    }

    revalidatePath(`/dashboard/leads/${leadId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
