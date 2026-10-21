"use server";

import { sql } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertAdminSession } from '@/lib/auth';

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Monday' }, { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' }, { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' }, { id: 'saturday', label: 'Saturday' }, { id: 'sunday', label: 'Sunday' }
];

export async function updateSettingsAction(formData: FormData) {
  const adminCheck = await assertAdminSession();
  if (!adminCheck.valid) redirect('/login');

  const newSchedule: Record<string, { active: boolean }> = {};
  DAYS_OF_WEEK.forEach(day => {
    newSchedule[day.id] = { active: formData.get(`day_${day.id}`) === 'on' };
  });

  const timeString = formData.get('timeSlots') as string;
  const timeArray24 = timeString ? timeString.split(',').map(t => t.trim()).filter(Boolean) : [];

  const formTitle = formData.get('formTitle') as string;
  const formSubtitle = formData.get('formSubtitle') as string;
  const isActive = formData.get('isActive') === 'on';

  const rawQuestions = formData.get('prequalificationQuestions') as string;
  const parsedQuestions = rawQuestions ? JSON.parse(rawQuestions) : [];

  await sql`
    UPDATE booking_settings SET 
      is_active = ${isActive},
      schedule = ${newSchedule}::jsonb,
      available_time_slots = ${JSON.stringify(timeArray24)}::jsonb,
      booking_form_title = ${formTitle},
      booking_form_subtitle = ${formSubtitle},
      prequalification_questions = ${JSON.stringify(parsedQuestions)}::jsonb
    WHERE is_singleton = TRUE
  `;

  revalidatePath('/book', 'layout');
  redirect('/dashboard/booking');
}

export async function addBlockedDateAction(formData: FormData) {
  const adminCheck = await assertAdminSession();
  if (!adminCheck.valid) redirect('/login');

  const date = formData.get('blockedDate') as string;
  const reason = formData.get('reason') as string;
  if (date && reason) {
    await sql`INSERT INTO booking_blocked_dates (blocked_date, reason) VALUES (${date}::DATE, ${reason}) ON CONFLICT DO NOTHING`;
  }
  revalidatePath('/book', 'layout');
  redirect('/dashboard/booking');
}

export async function removeBlockedDateAction(formData: FormData) {
  const adminCheck = await assertAdminSession();
  if (!adminCheck.valid) redirect('/login');

  const id = formData.get('blockedId') as string;
  await sql`DELETE FROM booking_blocked_dates WHERE id = ${id}`;
  revalidatePath('/book', 'layout');
  redirect('/dashboard/booking');
}

// This is the function that caused the crash. 
// Now that it lives in a file marked with "use server" at the top, it is 100% safe to pass to Client Components.
export async function updateStatusAction(formData: FormData) {
  const adminCheck = await assertAdminSession();
  if (!adminCheck.valid) redirect('/login');

  const id = formData.get('appointmentId') as string;
  const newStatus = formData.get('status') as string;
  await sql`UPDATE appointments SET status = ${newStatus} WHERE id = ${id}`;
  revalidatePath('/book', 'layout');
  redirect('/dashboard/booking');
}