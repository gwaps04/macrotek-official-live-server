import { sql } from '@/lib/db';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import * as Icons from 'lucide-react';
import { CSSProperties } from 'react';
import Image from 'next/image';
import { dispatchWebhook } from '@/lib/webhookDispatcher';

export const dynamic = 'force-dynamic';

export interface CustomCSS extends CSSProperties {
  [key: `--${string}`]: string | number | undefined;
}

const COUNTRY_CODES = [
  { code: '+63', label: '🇵🇭 +63' },
  { code: '+1', label: '🇺🇸 +1' },
  { code: '+44', label: '🇬🇧 +44' },
  { code: '+61', label: '🇦🇺 +61' },
  { code: '+65', label: '🇸🇬 +65' },
  { code: '+81', label: '🇯🇵 +81' },
  { code: '+971', label: '🇦🇪 +971' },
];

// ============================================================================
// WOZ FIX: LEXICAL SCOPE EXTRACTION
// We move these functions outside the React Component. 
// This prevents Next.js from trying to serialize them into the Server Action.
// ============================================================================
function formatTime(time24: string) {
  if (!time24) return '';
  const [h, m] = time24.split(':');
  let hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${m} ${ampm}`;
}

function formatPHP(amount: number | string) {
  if (Number(amount) === 0) return 'FREE';
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(amount));
}

export default async function ClassEnrollmentPage(props: { 
  params: Promise<{ scheduleId: string }>,
  searchParams: Promise<{ success?: string, error?: string }>
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const scheduleId = params.scheduleId;
  const isSuccess = searchParams.success === 'true';
  const hasConflictError = searchParams.error === 'full';
  const hasDuplicateUserError = searchParams.error === 'duplicate_user';

  const [configResult, scheduleData] = await Promise.all([
    sql`SELECT * FROM site_config WHERE is_singleton = TRUE LIMIT 1`,
    sql`
      SELECT 
        cs.id as schedule_id, cs.schedule_date, cs.start_time, cs.end_time,
        c.title, c.instructor_name, c.price, c.max_capacity, c.image_url, c.icon_identifier,
        (SELECT COUNT(*) FROM class_enrollments ce WHERE ce.schedule_id = cs.id AND ce.status != 'Cancelled') as current_enrollments
      FROM class_schedules cs
      INNER JOIN classes c ON cs.class_id = c.id
      WHERE cs.id = ${scheduleId}
    `
  ]);

  const config = configResult[0] || {};
  const session = scheduleData[0];

  if (!session) {
    redirect('/classes');
  }

  const isFull = Number(session.current_enrollments) >= Number(session.max_capacity);

  const dateObj = new Date(session.schedule_date);
  const displayDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });

  async function enrollStudentAction(formData: FormData) {
    "use server";
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    
    const countryCode = formData.get('countryCode') as string;
    const phoneRaw = formData.get('phone') as string;
    const fullPhone = `${countryCode} ${phoneRaw.trim()}`;
    
    const address = formData.get('address') as string;

    const activeSessionCheck = await sql`
      SELECT id FROM class_enrollments 
      WHERE (student_email = ${email} OR student_phone = ${fullPhone}) 
      AND schedule_id = ${scheduleId}
      AND status != 'Cancelled'
      LIMIT 1
    `;

    if (activeSessionCheck.length > 0) {
      redirect(`/classes/enroll/${scheduleId}?error=duplicate_user`);
    }

    let insertFailed = false;

    try {
      const result = await sql`
        WITH capacity_check AS (
          SELECT c.max_capacity,
                 (SELECT COUNT(*) FROM class_enrollments ce WHERE ce.schedule_id = ${scheduleId} AND ce.status != 'Cancelled') as current_enrollment
          FROM class_schedules cs
          JOIN classes c ON cs.class_id = c.id
          WHERE cs.id = ${scheduleId}
        )
        INSERT INTO class_enrollments (schedule_id, student_first_name, student_last_name, student_email, student_phone, student_address)
        SELECT ${scheduleId}, ${firstName}, ${lastName}, ${email}, ${fullPhone}, ${address}
        FROM capacity_check
        WHERE current_enrollment < max_capacity
        RETURNING id;
      `;
      
      if (result.length === 0) insertFailed = true;
    } catch (error) {
      insertFailed = true;
    }

    if (insertFailed) {
      redirect(`/classes/enroll/${scheduleId}?error=full`);
    } else {
      
      try {
        await dispatchWebhook('enrollment.created', {
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: fullPhone,
          address: address,
          date: displayDate,
          time: `${formatTime(session.start_time)} - ${formatTime(session.end_time)}`,
          title: session.title,
          instructor: session.instructor_name,
          price: Number(session.price),
        });
      } catch (webhookErr) {
        console.error('Failed to dispatch enrollment webhook:', webhookErr);
      }

      redirect(`/classes/enroll/${scheduleId}?success=true`);
    }
  }

  const pageStyles: CustomCSS = {
    fontFamily: config.classes_font_family || 'ui-sans-serif, system-ui, sans-serif',
    color: config.classes_text_color || '#18181b',
    backgroundColor: config.classes_bg_color || '#f8fafc',
    '--class-primary': config.classes_primary_color || '#4f46e5',
    '--class-card-bg': config.classes_card_bg || '#ffffff',
    '--class-text': config.classes_text_color || '#18181b',
  };

  const Icon = (Icons as any)[session.icon_identifier] || Icons.Users;

  return (
    <div className="flex flex-col min-h-[80vh] transition-colors duration-500" style={pageStyles}>
      <main className="grow w-full py-12 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <Link href="/classes" className="inline-flex items-center gap-2 text-sm font-bold opacity-60 hover:opacity-100 transition-opacity mb-8" style={{ color: 'var(--class-primary)' }}>
            <Icons.ArrowLeft size={16} /> Back to Schedule
          </Link>

          {isSuccess ? (
            <div className="bg-(--class-card-bg) border border-current/10 rounded-2xl p-8 md:p-12 text-center max-w-2xl mx-auto shadow-sm" style={{ color: 'var(--class-primary)' }}>
              <div className="w-20 h-20 bg-current/10 rounded-full flex items-center justify-center mx-auto mb-6 text-current">
                <Icons.CheckCircle2 size={40} />
              </div>
              
              <h1 className="text-3xl font-bold font-display mb-3 text-(--class-text)">Registration Confirmed!</h1>
              
              <p className="text-(--class-text) text-lg opacity-80 mb-8">
                You are successfully enrolled in <strong className="text-current">{session.title}</strong> for <br className="sm:hidden"/>
                <strong className="text-current font-mono tracking-tight">{displayDate}</strong>. We have reserved your spot.
              </p>

              <div className="bg-current/5 border border-current/10 rounded-xl p-6 mb-8 text-left max-w-md mx-auto text-(--class-text) flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-(--class-card-bg) shadow-sm flex items-center justify-center shrink-0" style={{ color: 'var(--class-primary)' }}>
                  <Icons.Mail size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-1">Check your inbox</h4>
                  <p className="text-xs opacity-70 leading-relaxed">
                    Expect a confirmation to be sent to the email used to enroll. It will be sent shortly.
                  </p>
                </div>
              </div>

              <Link href="/classes" className="inline-block bg-(--class-primary) text-(--class-card-bg) hover:opacity-90 transition-opacity px-8 py-3 rounded-xl font-bold shadow-sm">
                Return to Schedule
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              <div className="lg:col-span-5 order-2 lg:order-1">
                <div className="bg-(--class-card-bg) rounded-2xl shadow-sm border border-current/10 overflow-hidden sticky top-24" style={{ color: 'var(--class-primary)' }}>
                  
                  <div className="relative w-full h-48 bg-current/5 border-b border-current/10 flex items-center justify-center">
                    {session.image_url ? (
                      <Image src={session.image_url} alt={session.title} fill className="object-cover opacity-90" />
                    ) : (
                      <Icon size={48} className="opacity-30" />
                    )}
                  </div>

                  <div className="p-8" style={{ color: 'var(--class-text)' }}>
                    <h2 className="text-2xl font-bold font-display mb-1">{session.title}</h2>
                    <p className="text-sm font-medium opacity-60 flex items-center gap-1.5 mb-6">
                      <Icons.UserCheck size={14} /> Instructor: {session.instructor_name}
                    </p>

                    <div className="space-y-4 pt-6 border-t border-current/10">
                      <div className="flex items-start gap-4">
                        <Icons.Calendar className="w-5 h-5 opacity-60 mt-0.5" />
                        <div>
                          <p className="font-bold text-sm">{displayDate}</p>
                          <p className="text-xs opacity-60 mt-0.5">{formatTime(session.start_time)} - {formatTime(session.end_time)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <Icons.MapPin className="w-5 h-5 opacity-60 mt-0.5" />
                        <div>
                          <p className="font-bold text-sm">On-Site Location</p>
                          <p className="text-xs opacity-60 mt-0.5">Please arrive 10 minutes early.</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-current/10 flex items-center justify-between">
                      <span className="font-bold uppercase tracking-widest text-xs opacity-60">Total Due</span>
                      <span className="text-2xl font-bold font-mono" style={{ color: 'var(--class-primary)' }}>
                        {formatPHP(session.price)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 order-1 lg:order-2">
                <div className="bg-(--class-card-bg) p-8 md:p-10 rounded-2xl shadow-sm border border-current/10" style={{ color: 'var(--class-text)' }}>
                  
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold font-display mb-2">
                      {config.enrollment_form_title || 'Attendee Information'}
                    </h2>
                    <p className="opacity-60 text-sm">
                      {config.enrollment_form_subtitle || 'Fill out the details below to secure your spot. Hurry, capacity is limited.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 mb-8 bg-current/5 p-4 rounded-xl border border-current/10">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: 'var(--class-primary)', color: 'var(--class-card-bg)' }}>
                      {session.max_capacity - session.current_enrollments}
                    </div>
                    <div>
                      <p className="font-bold text-sm">Seats Remaining</p>
                      <p className="text-xs opacity-60">Out of {session.max_capacity} total capacity</p>
                    </div>
                  </div>

                  {hasConflictError && (
                    <div className="mb-8 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-start gap-3">
                      <Icons.AlertTriangle size={20} className="shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-sm">Class is Full</h3>
                        <p className="text-xs opacity-80 mt-1">Someone else just claimed the final seat. Please check the schedule for other available dates.</p>
                      </div>
                    </div>
                  )}

                  {hasDuplicateUserError && (
                    <div className="mb-8 bg-amber-50 border border-amber-200 text-amber-800 p-5 rounded-xl flex items-start gap-4 shadow-sm">
                      <Icons.Info size={24} className="shrink-0 mt-0.5 text-amber-600" />
                      <div>
                        <h3 className="font-bold text-base mb-1">You're Already Enrolled!</h3>
                        <p className="text-sm opacity-90 leading-relaxed">
                          It looks like you are already registered for this specific class session. To prevent accidental double-bookings, our system limits one seat per person. 
                          <br/><br/>
                          If you need to reserve an additional seat for a friend or family member, please contact our team directly or use a different email address.
                        </p>
                      </div>
                    </div>
                  )}

                  {isFull ? null : (
                    <form action={enrollStudentAction} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest opacity-60">First Name</label>
                          <input type="text" name="firstName" required className="w-full px-4 py-3 bg-current/5 border border-current/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--class-primary) focus:border-transparent transition-all" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest opacity-60">Last Name</label>
                          <input type="text" name="lastName" required className="w-full px-4 py-3 bg-current/5 border border-current/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--class-primary) focus:border-transparent transition-all" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest opacity-60">Full Address</label>
                        <textarea name="address" required rows={2} placeholder="House No, Street, Brgy, City" className="w-full px-4 py-3 bg-current/5 border border-current/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--class-primary) focus:border-transparent transition-all resize-none" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest opacity-60">Email Address</label>
                          <input type="email" name="email" required className="w-full px-4 py-3 bg-current/5 border border-current/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--class-primary) focus:border-transparent transition-all" />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest opacity-60">Phone Number</label>
                          <div className="flex">
                            <select 
                              name="countryCode" 
                              required 
                              className="px-3 py-3 bg-current/5 border border-current/20 border-r-0 rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--class-primary) focus:border-transparent transition-all font-medium appearance-none cursor-pointer"
                            >
                              {COUNTRY_CODES.map(c => (
                                <option key={c.code} value={c.code}>{c.label}</option>
                              ))}
                            </select>
                            <input 
                              type="tel" 
                              name="phone" 
                              required 
                              placeholder="912 345 6789"
                              className="w-full px-4 py-3 bg-current/5 border border-current/20 rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--class-primary) focus:border-transparent transition-all" 
                            />
                          </div>
                        </div>

                      </div>

                      <div className="pt-4">
                        <button type="submit" className="w-full py-4 rounded-xl font-bold text-sm transition-opacity shadow-md flex items-center justify-center gap-2 hover:opacity-90" style={{ backgroundColor: 'var(--class-primary)', color: 'var(--class-card-bg)' }}>
                          Complete Enrollment <Icons.Check size={18} />
                        </button>
                        <p className="text-[10px] text-center mt-4 opacity-50 uppercase tracking-widest">By enrolling, you agree to our terms of service and attendance policy.</p>
                      </div>
                    </form>
                  )}

                </div>
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}