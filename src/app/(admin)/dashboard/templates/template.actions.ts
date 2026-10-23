// FILE: src/app/(admin)/dashboard/templates/template.actions.ts
"use server";

import { sql } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function getTemplatesListAction() {
  try {
    const templates = await sql`
      SELECT 
        t.id, 
        t.title, 
        t.description, 
        t.type, 
        t.is_active, 
        t.created_at,
        COUNT(d.id)::int as usage_count
      FROM form_templates t
      LEFT JOIN lead_documents d ON t.id = d.template_id
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `;
    return { success: true, templates };
  } catch (error: any) {
    console.error('[Template Action Error - Fetch]:', error);
    return { success: false, error: error.message };
  }
}

export async function toggleTemplateStatusAction(templateId: string, currentStatus: boolean) {
  try {
    const newStatus = !currentStatus;
    await sql`UPDATE form_templates SET is_active = ${newStatus} WHERE id = ${templateId}`;
    revalidatePath('/dashboard/templates');
    return { success: true, is_active: newStatus };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function duplicateTemplateAction(templateId: string) {
  try {
    const result = await sql`
      INSERT INTO form_templates (title, description, type, schema_json, is_active)
      SELECT title || ' (Copy)', description, type, schema_json, false 
      FROM form_templates WHERE id = ${templateId}
      RETURNING id
    `;
    revalidatePath('/dashboard/templates');
    return { success: true, newId: result[0].id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteTemplateAction(templateId: string) {
  try {
    const usageCheck = await sql`SELECT COUNT(id)::int as count FROM lead_documents WHERE template_id = ${templateId}`;
    if (usageCheck[0].count > 0) {
      return { success: false, error: `Cannot delete template. It is actively attached to ${usageCheck[0].count} lead document(s).` };
    }
    await sql`DELETE FROM form_templates WHERE id = ${templateId}`;
    revalidatePath('/dashboard/templates');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getTemplateByIdAction(id: string) {
  try {
    // WOZ FIX: Added ::text cast to prevent strict UUID inference crashes in Neon
    const result = await sql`SELECT * FROM form_templates WHERE id::text = ${id}`;
    if (!result.length) return { success: false, error: 'Template not found' };
    return { success: true, template: result[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function saveTemplateAction(id: string | 'new', payload: {
  title: string;
  description: string;
  type: string;
  schema_json: any;
}) {
  try {
    const jsonStringPayload = JSON.stringify(payload.schema_json);

    if (id === 'new') {
      const res = await sql`
        INSERT INTO form_templates (title, description, type, schema_json, is_active)
        VALUES (${payload.title}, ${payload.description}, ${payload.type}, ${jsonStringPayload}::jsonb, true)
        RETURNING id
      `;
      revalidatePath('/dashboard/templates');
      return { success: true, id: res[0].id };
    } else {
      await sql`
        UPDATE form_templates 
        SET title = ${payload.title}, 
            description = ${payload.description}, 
            type = ${payload.type}, 
            schema_json = ${jsonStringPayload}::jsonb,
            updated_at = NOW()
        WHERE id = ${id}
      `;
      revalidatePath('/dashboard/templates');
      return { success: true, id };
    }
  } catch (error: any) {
    console.error('[Template Action Error - Save]:', error);
    return { success: false, error: error.message };
  }
}