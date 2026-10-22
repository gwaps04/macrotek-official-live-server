// FILE: src/app/(admin)/dashboard/leads/page.tsx
import { sql } from '@/lib/db';
import LeadsCommandCenter from '@/components/admin/leads/LeadsCommandCenter';
import { UnifiedLead } from '@/components/admin/leads/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LeadsPage() {
  // Fetch all leads from Neon concurrently (Contracts table query completely removed)
  const [appointments, enrollments] = await Promise.all([
    sql`SELECT * FROM appointments ORDER BY created_at DESC`,
    sql`
      SELECT ce.*, cs.schedule_date, cs.start_time, c.title as class_title, c.price as class_price 
      FROM class_enrollments ce
      LEFT JOIN class_schedules cs ON ce.schedule_id = cs.id
      LEFT JOIN classes c ON cs.class_id = c.id
      ORDER BY ce.created_at DESC
    `
  ]);

  // Unify standard appointments and class enrollments into a single pipeline array
  const unifiedLeads: UnifiedLead[] = [
    ...appointments.map((a: any) => ({
      id: a.id,
      type: 'appointment' as const,
      firstName: a.client_first_name,
      lastName: a.client_last_name,
      fullName: `${a.client_first_name} ${a.client_last_name}`.trim(),
      email: a.client_email,
      phone: a.client_phone,
      address: a.client_address,
      title: 'Consultation Booking',
      date: a.appointment_date ? new Date(a.appointment_date).toISOString().split('T')[0] : 'TBD',
      time: a.appointment_time || 'TBD',
      status: a.status || 'Pending',
      notes: a.client_notes,
      prequalificationAnswers: a.prequalification_answers || {},
      createdAt: a.created_at,
    })),
    ...enrollments.map((e: any) => ({
      id: e.id,
      type: 'enrollment' as const,
      firstName: e.student_first_name,
      lastName: e.student_last_name,
      fullName: `${e.student_first_name} ${e.student_last_name}`.trim(),
      email: e.student_email,
      phone: e.student_phone,
      address: e.student_address,
      title: e.class_title || 'Class Enrollment',
      date: e.schedule_date ? new Date(e.schedule_date).toISOString().split('T')[0] : 'TBD',
      time: e.start_time || 'TBD',
      status: e.status || 'Registered',
      paymentStatus: e.payment_status || 'Pending',
      price: e.class_price ? Number(e.class_price) : undefined,
      createdAt: e.created_at,
    }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="w-full h-full flex flex-col">
      <LeadsCommandCenter initialLeads={unifiedLeads} />
    </div>
  );
}