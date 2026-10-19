import { sql } from '@/lib/db';
import LeadsCommandCenter from '@/components/admin/leads/LeadsCommandCenter';
import { UnifiedLead } from '@/components/admin/leads/types';
import { getDeterministicAccessCode } from '@/lib/contractUtils';

// FILE: src/app/(admin)/dashboard/leads/page.tsx

export const dynamic = 'force-dynamic';

function format12Hour(timeStr: string | null | undefined): string {
  if (!timeStr) return '';
  const clean = String(timeStr).trim();
  if (!clean.includes(':')) return clean;
  const [h, m] = clean.split(':');
  const hour = parseInt(h, 10);
  if (isNaN(hour)) return clean;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m} ${ampm}`;
}

export default async function LeadsCommandCenterPage() {
  const [appointmentsResult, enrollmentsResult, contractsResult] = await Promise.all([
    sql`
      SELECT 
        id, appointment_date, appointment_time, client_first_name, client_last_name, 
        client_email, client_phone, client_address, client_notes, status, 
        prequalification_answers, created_at 
      FROM appointments 
      ORDER BY created_at DESC
    `,
    sql`
      SELECT 
        ce.id, ce.schedule_id, ce.student_first_name, ce.student_last_name, 
        ce.student_email, ce.student_phone, ce.student_address, ce.status, 
        ce.payment_status, ce.created_at,
        cs.schedule_date, cs.start_time, cs.end_time,
        c.title as class_title, c.price as class_price, c.instructor_name
      FROM class_enrollments ce
      LEFT JOIN class_schedules cs ON ce.schedule_id = cs.id
      LEFT JOIN classes c ON cs.class_id = c.id
      ORDER BY ce.created_at DESC
    `,
    sql`
      SELECT * FROM contracts ORDER BY created_at DESC
    `
  ]);

  // Index contracts by lead_id (prefer Signed contracts and preserve newest)
  const contractMap = new Map<string, any>();
  contractsResult.forEach((c: any) => {
    if (c.lead_id) {
      const key = String(c.lead_id);
      const existing = contractMap.get(key);
      if (!existing) {
        contractMap.set(key, c);
      } else if (existing.status !== 'Signed' && c.status === 'Signed') {
        contractMap.set(key, c);
      }
    }
  });

  const appointmentLeads: UnifiedLead[] = appointmentsResult.map((a: any) => {
    let answers: Record<string, any> = {};
    let extractedCompany = '';
    if (a.prequalification_answers) {
      if (typeof a.prequalification_answers === 'string') {
        try {
          answers = JSON.parse(a.prequalification_answers);
        } catch {
          answers = {};
        }
      } else if (typeof a.prequalification_answers === 'object') {
        answers = a.prequalification_answers;
      }
    }

    // Try extracting company from answers
    for (const [k, v] of Object.entries(answers)) {
      if (/company|business|organization/i.test(k) && typeof v === 'string') {
        extractedCompany = v;
        break;
      }
    }

    const apptDate = a.appointment_date 
      ? String(a.appointment_date).split('T')[0] 
      : 'Unspecified';

    const c = contractMap.get(String(a.id));

    return {
      id: String(a.id),
      type: 'appointment' as const,
      firstName: a.client_first_name || '',
      lastName: a.client_last_name || '',
      fullName: `${a.client_first_name || ''} ${a.client_last_name || ''}`.trim() || 'Anonymous Lead',
      email: a.client_email || '',
      phone: a.client_phone || '',
      address: a.client_address || '',
      date: apptDate,
      time: format12Hour(a.appointment_time),
      title: 'Consultation Booking',
      notes: a.client_notes || '',
      prequalificationAnswers: answers,
      status: a.status || 'Pending',
      createdAt: a.created_at ? new Date(a.created_at).toISOString() : new Date().toISOString(),

      // Contract metadata
      contractId: c ? String(c.id) : undefined,
      contractStatus: c ? (c.status as any) : 'Draft',
      contractAccessCode: c?.access_code || getDeterministicAccessCode(String(a.id)),
      contractTitle: c?.contract_title || 'Master Service Agreement',
      contractScope: c?.scope_description || '',
      contractCustomTerms: c?.custom_terms || '',
      paymentTermsNotes: c?.payment_terms_notes || '',
      contractCost: c && c.project_cost !== null && c.project_cost !== undefined && c.project_cost !== '' && !isNaN(Number(c.project_cost)) ? Number(c.project_cost) : undefined,
      contractCurrency: c?.currency || '',
      contractDownpaymentPct: c && c.downpayment_percentage !== null && c.downpayment_percentage !== undefined && c.downpayment_percentage !== '' && !isNaN(Number(c.downpayment_percentage)) ? Number(c.downpayment_percentage) : undefined,
      contractSignedAt: c ? c.signed_at : null,
      contractSignedBy: c ? c.signed_by_name : null,
      contractSignedByTitle: c ? c.signed_by_title : null,
      contractSignatureData: c ? (c.signature_data || c.signature_svg || null) : null,
      contractSignatureType: c ? (c.signature_type || 'drawn') : 'drawn',
      contractAttachmentUrl: c ? c.attachment_url : null,
      contractAttachmentName: c ? c.attachment_name : null,
      contractSigningMethod: c ? c.signing_method : 'electronic',
      contractEsignEnabled: c ? c.esign_enabled !== false : true,
      companyName: c?.company_name || extractedCompany || ''
    };
  });

  const enrollmentLeads: UnifiedLead[] = enrollmentsResult.map((e: any) => {
    const schedDate = e.schedule_date 
      ? String(e.schedule_date).split('T')[0] 
      : 'Scheduled Session';

    const startTimeFormatted = format12Hour(e.start_time);
    const endTimeFormatted = format12Hour(e.end_time);
    const sessionTime = startTimeFormatted && endTimeFormatted 
      ? `${startTimeFormatted} - ${endTimeFormatted}` 
      : (startTimeFormatted || 'TBA');

    const c = contractMap.get(String(e.id));

    return {
      id: String(e.id),
      type: 'enrollment' as const,
      firstName: e.student_first_name || '',
      lastName: e.student_last_name || '',
      fullName: `${e.student_first_name || ''} ${e.student_last_name || ''}`.trim() || 'Enrolled Student',
      email: e.student_email || '',
      phone: e.student_phone || '',
      address: e.student_address || '',
      date: schedDate,
      time: sessionTime,
      title: e.class_title || 'Masterclass Enrollment',
      instructor: e.instructor_name || '',
      price: e.class_price !== undefined ? Number(e.class_price) : undefined,
      status: e.status || 'Registered',
      paymentStatus: (e.payment_status as 'Paid' | 'Pending') || 'Pending',
      createdAt: e.created_at ? new Date(e.created_at).toISOString() : new Date().toISOString(),

      // Contract metadata
      contractId: c ? String(c.id) : undefined,
      contractStatus: c ? (c.status as any) : 'Draft',
      contractAccessCode: c?.access_code || getDeterministicAccessCode(String(e.id)),
      contractTitle: c?.contract_title || 'Master Service Agreement',
      contractScope: c?.scope_description || '',
      contractCustomTerms: c?.custom_terms || '',
      paymentTermsNotes: c?.payment_terms_notes || '',
      contractCost: c && c.project_cost !== null && c.project_cost !== undefined && c.project_cost !== '' && !isNaN(Number(c.project_cost)) ? Number(c.project_cost) : undefined,
      contractCurrency: c?.currency || '',
      contractDownpaymentPct: c && c.downpayment_percentage !== null && c.downpayment_percentage !== undefined && c.downpayment_percentage !== '' && !isNaN(Number(c.downpayment_percentage)) ? Number(c.downpayment_percentage) : undefined,
      contractSignedAt: c ? c.signed_at : null,
      contractSignedBy: c ? c.signed_by_name : null,
      contractSignedByTitle: c ? c.signed_by_title : null,
      contractSignatureData: c ? (c.signature_data || c.signature_svg || null) : null,
      contractSignatureType: c ? (c.signature_type || 'drawn') : 'drawn',
      contractAttachmentUrl: c ? c.attachment_url : null,
      contractAttachmentName: c ? c.attachment_name : null,
      contractSigningMethod: c ? c.signing_method : 'electronic',
      contractEsignEnabled: c ? c.esign_enabled !== false : true,
      companyName: c?.company_name || ''
    };
  });

  // Combine and sort by newest first
  const allLeads = [...appointmentLeads, ...enrollmentLeads].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="w-full">
      <LeadsCommandCenter initialLeads={allLeads} />
    </div>
  );
}
