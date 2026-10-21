"use server";

import { sql } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { assertAdminSession } from '@/lib/auth';

// FILE: src/app/(admin)/dashboard/operatingMode.actions.ts

export type PlatformOperatingMode = 'appointment' | 'enrollment';

export async function switchOperatingModeAction(newMode: PlatformOperatingMode) {
  try {
    const adminCheck = await assertAdminSession();
    if (!adminCheck.valid) {
      return { success: false, error: 'Unauthorized: Administrative credentials required' };
    }

    const enableAppointments = newMode === 'appointment';
    const enableEnrollments = newMode === 'enrollment';

    await sql`
      UPDATE site_config SET 
        enable_appointments = ${enableAppointments},
        enable_enrollments = ${enableEnrollments}
      WHERE is_singleton = TRUE
    `;

    // Revalidate storefront layout, admin dashboard layout, and leads center
    revalidatePath('/', 'layout');
    revalidatePath('/dashboard', 'layout');

    return { 
      success: true, 
      mode: newMode,
      message: newMode === 'appointment' 
        ? 'Platform switched to Appointment Mode (1-on-1 Consultations & Bookings active).' 
        : 'Platform switched to Enrollment Mode (Class Curriculum & Capacity Rosters active).'
    };
  } catch (error: any) {
    console.error('Failed to switch platform operating mode:', error);
    return { 
      success: false, 
      error: error?.message || 'Failed to switch operating mode' 
    };
  }
}
