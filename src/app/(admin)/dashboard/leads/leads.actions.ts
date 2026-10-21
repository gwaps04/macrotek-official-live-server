"use server";

import { sql } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { dispatchWebhook } from '@/lib/webhookDispatcher';
import { assertAdminSession } from '@/lib/auth';

// FILE: src/app/(admin)/dashboard/leads/leads.actions.ts
// WOZ ZERO-LEAK SECURITY: Enforce admin session verification on all lead mutation actions.

export async function updateLeadStatusAction(
  leadId: string,
  type: 'appointment' | 'enrollment',
  newStatus: string
) {
  try {
    const adminCheck = await assertAdminSession();
    if (!adminCheck.valid) {
      return { success: false, error: 'Unauthorized: Administrative credentials required' };
    }

    if (type === 'appointment') {
      await sql`UPDATE appointments SET status = ${newStatus} WHERE id = ${leadId}`;
    } else {
      await sql`UPDATE class_enrollments SET status = ${newStatus} WHERE id = ${leadId}`;
    }
    revalidatePath('/dashboard/leads');
    revalidatePath('/dashboard/booking');
    revalidatePath('/dashboard/class-schedule');
    return { success: true };
  } catch (err: any) {
    console.error('[Leads Action Error - Status Update]:', err);
    return { success: false, error: err.message || 'Failed to update status' };
  }
}

export async function updateEnrollmentPaymentAction(
  enrollmentId: string,
  paymentStatus: 'Paid' | 'Pending'
) {
  try {
    const adminCheck = await assertAdminSession();
    if (!adminCheck.valid) {
      return { success: false, error: 'Unauthorized: Administrative credentials required' };
    }

    await sql`UPDATE class_enrollments SET payment_status = ${paymentStatus} WHERE id = ${enrollmentId}`;
    revalidatePath('/dashboard/leads');
    revalidatePath('/dashboard/class-schedule');
    return { success: true };
  } catch (err: any) {
    console.error('[Leads Action Error - Payment Update]:', err);
    return { success: false, error: err.message || 'Failed to update payment status' };
  }
}

export async function deleteLeadAction(
  leadId: string,
  type: 'appointment' | 'enrollment'
) {
  try {
    const adminCheck = await assertAdminSession();
    if (!adminCheck.valid) {
      return { success: false, error: 'Unauthorized: Administrative credentials required' };
    }

    if (type === 'appointment') {
      await sql`DELETE FROM appointments WHERE id = ${leadId}`;
    } else {
      await sql`DELETE FROM class_enrollments WHERE id = ${leadId}`;
    }
    revalidatePath('/dashboard/leads');
    revalidatePath('/dashboard/booking');
    revalidatePath('/dashboard/class-schedule');
    return { success: true };
  } catch (err: any) {
    console.error('[Leads Action Error - Delete]:', err);
    return { success: false, error: err.message || 'Failed to delete lead' };
  }
}

export async function resendLeadWebhookAction(
  leadId: string,
  type: 'appointment' | 'enrollment'
) {
  try {
    const adminCheck = await assertAdminSession();
    if (!adminCheck.valid) {
      return { success: false, reason: 'Unauthorized: Administrative credentials required' };
    }
    if (type === 'appointment') {
      const rows = await sql`
        SELECT 
          id, appointment_date, appointment_time, client_first_name, client_last_name, 
          client_email, client_phone, client_address, client_notes, prequalification_answers
        FROM appointments 
        WHERE id = ${leadId}
        LIMIT 1
      `;
      const lead = rows[0];
      if (!lead) return { success: false, reason: 'Appointment record not found' };

      const formattedTime = (() => {
        const timeStr = String(lead.appointment_time || '');
        if (!timeStr.includes(':')) return timeStr;
        const [h, m] = timeStr.split(':');
        const hour = parseInt(h, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        return `${hour % 12 || 12}:${m} ${ampm}`;
      })();

      const answers = typeof lead.prequalification_answers === 'string'
        ? JSON.parse(lead.prequalification_answers)
        : (lead.prequalification_answers || {});

      const result = await dispatchWebhook('appointment.created', {
        first_name: lead.client_first_name,
        last_name: lead.client_last_name,
        email: lead.client_email,
        phone: lead.client_phone,
        address: lead.client_address || '',
        date: String(lead.appointment_date || '').split('T')[0],
        time: formattedTime,
        notes: lead.client_notes || '',
        answers: answers
      });
      return result;
    } else {
      const rows = await sql`
        SELECT 
          ce.id, ce.student_first_name, ce.student_last_name, ce.student_email, ce.student_phone, 
          ce.student_address, cs.schedule_date, cs.start_time, cs.end_time,
          c.title as class_title, c.price as class_price, c.instructor_name
        FROM class_enrollments ce
        LEFT JOIN class_schedules cs ON ce.schedule_id = cs.id
        LEFT JOIN classes c ON cs.class_id = c.id
        WHERE ce.id = ${leadId}
        LIMIT 1
      `;
      const lead = rows[0];
      if (!lead) return { success: false, reason: 'Enrollment record not found' };

      const formatTime = (t: string) => {
        if (!t || !t.includes(':')) return t;
        const [h, m] = t.split(':');
        const hour = parseInt(h, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        return `${hour % 12 || 12}:${m} ${ampm}`;
      };

      const result = await dispatchWebhook('enrollment.created', {
        first_name: lead.student_first_name,
        last_name: lead.student_last_name,
        email: lead.student_email,
        phone: lead.student_phone,
        address: lead.student_address || '',
        date: String(lead.schedule_date || '').split('T')[0],
        time: `${formatTime(lead.start_time)} - ${formatTime(lead.end_time)}`,
        title: lead.class_title || 'Class Enrollment',
        instructor: lead.instructor_name || '',
        price: Number(lead.class_price) || 0
      });
      return result;
    }
  } catch (err: any) {
    console.error('[Leads Action Error - Webhook Resend]:', err);
    return { success: false, reason: err.message || 'Webhook dispatch failed' };
  }
}
