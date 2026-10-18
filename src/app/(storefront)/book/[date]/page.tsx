import { sql } from '@/lib/db';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import * as Icons from 'lucide-react';
import { CSSProperties } from 'react';
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

export default async function AppointmentFormPage(props: { 
  params: Promise<{ date: string }>,
  searchParams: Promise<{ success?: string, error?: string, time?: string }>
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const targetDate = params.date;
  const isSuccess = searchParams.success === 'true';
  const hasConflictError = searchParams.error === 'conflict';
  const hasDuplicateUserError = searchParams.error === 'duplicate_user';
  const bookedTime = searchParams.time;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) redirect('/book');

  const [settingsResult, existingAppointmentsResult] = await Promise.all([
    sql`SELECT * FROM booking_settings WHERE is_singleton = TRUE LIMIT 1`,
    sql`SELECT TO_CHAR(appointment_time, 'HH24:MI') as time FROM appointments WHERE appointment_date = ${targetDate}::DATE AND status != 'Cancelled'`
  ]);

  const bookingConfig = settingsResult[0] || {};
  if (bookingConfig.is_active === false) redirect('/book');

  const TIME_SLOTS = bookingConfig.available_time_slots || ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];
  const bookedTimes = new Set(existingAppointmentsResult.map(a => a.time));
  
  const prequalQuestions = bookingConfig.prequalification_questions || [];

  // ============================================================================
  // WOZ ALGORITHM: Timezone-Aware Current Time (Legazpi City / Asia/Manila)
  // ============================================================================
  const localNowStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" });
  const localNow = new Date(localNowStr);
  const localTodayStr = `${localNow.getFullYear()}-${String(localNow.getMonth() + 1).padStart(2, '0')}-${String(localNow.getDate()).padStart(2, '0')}`;
  const localTimeStr = `${String(localNow.getHours()).padStart(2, '0')}:${String(localNow.getMinutes()).padStart(2, '0')}`;

  async function submitAppointmentAction(formData: FormData) {
    "use server";
    const time = formData.get('time') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    
    const countryCode = formData.get('countryCode') as string;
    const phoneRaw = formData.get('phone') as string;
    const fullPhone = `${countryCode} ${phoneRaw.trim()}`;
    
    const address = formData.get('address') as string;
    const notes = formData.get('notes') as string;

    const extractedAnswers: Record<string, string | string[]> = {};
    prequalQuestions.forEach((q: any) => {
      const fieldName = `prequal_${q.id}`;
      if (q.type === 'checkbox') {
        const selected = formData.getAll(fieldName);
        if (selected.length > 0) extractedAnswers[q.question] = selected as string[];
      } else {
        const answer = formData.get(fieldName);
        if (answer) extractedAnswers[q.question] = answer as string;
      }
    });

    const activeSessionCheck = await sql`
      SELECT id FROM appointments 
      WHERE (client_email = ${email} OR client_phone = ${fullPhone}) 
      AND status != 'Cancelled' 
      AND appointment_date >= CURRENT_DATE
      LIMIT 1
    `;

    if (activeSessionCheck.length > 0) {
      redirect(`/book/${targetDate}?error=duplicate_user`);
    }

    let insertFailed = false;

    try {
      await sql`
        INSERT INTO appointments (
          appointment_date, appointment_time, client_first_name, client_last_name, 
          client_email, client_phone, client_address, client_notes, prequalification_answers
        )
        VALUES (
          ${targetDate}::DATE, ${time}::TIME, ${firstName}, ${lastName}, 
          ${email}, ${fullPhone}, ${address}, ${notes}, ${JSON.stringify(extractedAnswers)}::jsonb
        )
      `;
    } catch (error) {
      insertFailed = true; 
    }

    if (insertFailed) {
      redirect(`/book/${targetDate}?error=conflict`);
    } else {
      
      const formattedTime = (() => {
        const [h, m] = time.split(':');
        let hour = parseInt(h, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12 || 12;
        return `${hour}:${m} ${ampm}`;
      })();

      dispatchWebhook('appointment.created', {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: fullPhone,
        address: address,
        date: targetDate,
        time: formattedTime,
        notes: notes,
        answers: extractedAnswers, 
      });

      redirect(`/book/${targetDate}?success=true&time=${time}`);
    }
  }

  const pageStyles: CustomCSS = {
    fontFamily: bookingConfig.booking_font_family || 'ui-sans-serif, system-ui, sans-serif',
    color: bookingConfig.booking_text_color || '#18181b',
    ...(bookingConfig.booking_bg_type === 'gradient' 
      ? { backgroundImage: `linear-gradient(135deg, ${bookingConfig.booking_bg_color || '#f8fafc'}, ${bookingConfig.booking_bg_gradient_to || '#ffffff'})` }
      : { backgroundColor: bookingConfig.booking_bg_color || '#f8fafc' }),
      
    '--booking-primary': bookingConfig.booking_primary_color || '#059669',
    '--booking-card-bg': bookingConfig.booking_card_bg || '#ffffff',
    '--booking-text': bookingConfig.booking_text_color || '#18181b',
  };

  const displayDate = new Date(targetDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });

  const formatAmPm = (time24: string) => {
    if (!time24) return '';
    const [h, m] = time24.split(':');
    let hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${m} ${ampm}`;
  };

  return (
    <div className="w-full min-h-[80vh] py-12 transition-colors duration-500" style={pageStyles}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        <Link href="/book" className="inline-flex items-center gap-2 text-sm font-bold opacity-60 hover:opacity-100 transition-opacity mb-8" style={{ color: 'var(--booking-primary)' }}>
          <Icons.ArrowLeft size={16} /> Back to Calendar
        </Link>

        {isSuccess ? (
          <div className="bg-(--booking-card-bg) border border-current/10 rounded-2xl p-8 md:p-12 text-center shadow-sm max-w-2xl mx-auto" style={{ color: 'var(--booking-primary)' }}>
            <div className="w-20 h-20 bg-current/10 rounded-full flex items-center justify-center mx-auto mb-6 text-current">
              <Icons.CheckCircle2 size={40} />
            </div>
            
            <h1 className="text-3xl font-bold font-display mb-3 text-(--booking-text)">Appointment Confirmed!</h1>
            
            <p className="text-(--booking-text) text-lg opacity-80 mb-8">
              You are officially booked for <br className="sm:hidden"/>
              <strong className="text-current">{displayDate}</strong> at <strong className="text-current font-mono tracking-tight">{formatAmPm(bookedTime || '')}</strong>.
            </p>

            <div className="bg-current/5 border border-current/10 rounded-xl p-6 mb-8 text-left max-w-md mx-auto text-(--booking-text) flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-(--booking-card-bg) shadow-sm flex items-center justify-center shrink-0" style={{ color: 'var(--booking-primary)' }}>
                <Icons.Mail size={20} />
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1">Check your inbox</h4>
                <p className="text-xs opacity-70 leading-relaxed">
                  Expect a confirmation to be sent to the email used to book this appointment. It will be sent shortly.
                </p>
              </div>
            </div>

            <Link href="/book" style={{ backgroundColor: 'var(--booking-primary)', color: 'var(--booking-card-bg)' }} className="inline-block px-8 py-3 rounded-xl font-bold shadow-sm hover:opacity-90 transition-opacity">
              Return to Calendar
            </Link>
          </div>
        ) : (
          <div className="bg-(--booking-card-bg) rounded-2xl shadow-sm border border-current/10 overflow-hidden text-(--booking-text)">
            
            <div className="bg-current/5 p-8 border-b border-current/10">
              <h1 className="text-2xl font-bold font-display mb-2">
                {bookingConfig.booking_form_title || 'Appointment Details'}
              </h1>
              <p className="opacity-70 text-sm">
                {bookingConfig.booking_form_subtitle || 'Please select a time and provide your details below.'}
              </p>
              
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-current/20 bg-(--booking-card-bg) font-bold text-sm" style={{ color: 'var(--booking-primary)' }}>
                <Icons.CalendarCheck size={18} /> {displayDate}
              </div>
            </div>

            <div className="p-8">
              
              {hasConflictError && (
                <div className="mb-8 bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-start gap-3">
                  <Icons.AlertTriangle size={20} className="shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-sm">Time Slot Unavailable</h3>
                    <p className="text-xs opacity-80 mt-1">Someone else just booked that exact time slot. Please select a different time.</p>
                  </div>
                </div>
              )}

              {hasDuplicateUserError && (
                <div className="mb-8 bg-amber-50 border border-amber-200 text-amber-800 p-5 rounded-xl flex items-start gap-4 shadow-sm">
                  <Icons.Info size={24} className="shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <h3 className="font-bold text-base mb-1">You're Already Booked!</h3>
                    <p className="text-sm opacity-90 leading-relaxed">
                      It looks like you already have an upcoming session on our calendar. To prevent accidental double-bookings, our system limits one active appointment per person. 
                      <br/><br/>
                      If you need to reschedule, or if you are trying to book an additional slot for a family member, please contact our team directly so we can assist you.
                    </p>
                  </div>
                </div>
              )}

              <form action={submitAppointmentAction} className="space-y-12">
                
                <section>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-4 block border-b border-current/10 pb-2">Step 1: Select a Time</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {TIME_SLOTS.map((time: string) => {
                      // WOZ FIX: Strict Lexicographical Expiration Check
                      const isBooked = bookedTimes.has(time);
                      const isPastToday = targetDate < localTodayStr;
                      const isExpiredToday = targetDate === localTodayStr && time <= localTimeStr;
                      
                      const isDisabled = isBooked || isPastToday || isExpiredToday;

                      return (
                        <label 
                          key={time} 
                          title={isDisabled ? "Slot Unavailable" : "Available"}
                          className={`relative flex items-center justify-center p-3 rounded-lg border text-sm font-bold transition-all ${isDisabled ? 'border-current/10 bg-current/5 opacity-40 cursor-not-allowed' : 'border-current/30 hover:border-current hover:bg-current/5 has-[:checked]:bg-(--booking-primary) has-[:checked]:text-(--booking-card-bg) has-[:checked]:border-(--booking-primary) shadow-sm cursor-pointer'}`}
                        >
                          <input type="radio" name="time" value={time} required disabled={isDisabled} className="sr-only" />
                          {formatAmPm(time)}
                        </label>
                      );
                    })}
                  </div>
                </section>

                {prequalQuestions.length > 0 && (
                  <section>
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-6 block border-b border-current/10 pb-2">Step 2: Prequalification</label>
                    <div className="space-y-8">
                      {prequalQuestions.map((q: any) => (
                        <div key={q.id} className="space-y-3">
                          <label className="text-sm font-bold block">
                            {q.question}
                            {q.required && <span className="text-rose-500 ml-1" title="Required">*</span>}
                          </label>

                          {q.type === 'text' && (
                            <input type="text" name={`prequal_${q.id}`} required={q.required} className="w-full px-4 py-3 bg-current/5 border border-current/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--booking-primary) focus:border-transparent transition-all" />
                          )}

                          {q.type === 'textarea' && (
                            <textarea name={`prequal_${q.id}`} required={q.required} rows={3} className="w-full px-4 py-3 bg-current/5 border border-current/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--booking-primary) focus:border-transparent transition-all resize-none" />
                          )}

                          {q.type === 'radio' && (
                            <div className="space-y-2">
                              {q.options.map((opt: string, i: number) => (
                                <label key={i} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-current/10 hover:bg-current/5 transition-colors">
                                  <input type="radio" name={`prequal_${q.id}`} value={opt} required={q.required} className="w-4 h-4" style={{ accentColor: 'var(--booking-primary)' }} />
                                  <span className="text-sm font-medium">{opt}</span>
                                </label>
                              ))}
                            </div>
                          )}

                          {q.type === 'checkbox' && (
                            <div className="space-y-2">
                              {q.options.map((opt: string, i: number) => (
                                <label key={i} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-current/10 hover:bg-current/5 transition-colors">
                                  <input type="checkbox" name={`prequal_${q.id}`} value={opt} className="w-4 h-4 rounded" style={{ accentColor: 'var(--booking-primary)' }} />
                                  <span className="text-sm font-medium">{opt}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <section>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 mb-4 block border-b border-current/10 pb-2">Step {prequalQuestions.length > 0 ? '3' : '2'}: Your Information</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase opacity-60">First Name</label>
                      <input type="text" name="firstName" required className="w-full px-4 py-3 bg-current/5 border border-current/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--booking-primary) focus:border-transparent transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase opacity-60">Last Name</label>
                      <input type="text" name="lastName" required className="w-full px-4 py-3 bg-current/5 border border-current/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--booking-primary) focus:border-transparent transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase opacity-60">Email Address</label>
                      <input type="email" name="email" required className="w-full px-4 py-3 bg-current/5 border border-current/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--booking-primary) focus:border-transparent transition-all" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase opacity-60">Phone Number</label>
                      <div className="flex">
                        <select 
                          name="countryCode" 
                          required 
                          className="px-3 py-3 bg-current/5 border border-current/20 border-r-0 rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--booking-primary) focus:border-transparent transition-all font-medium appearance-none cursor-pointer"
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
                          className="w-full px-4 py-3 bg-current/5 border border-current/20 rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--booking-primary) focus:border-transparent transition-all" 
                        />
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold uppercase opacity-60">Full Address</label>
                      <textarea name="address" rows={2} className="w-full px-4 py-3 bg-current/5 border border-current/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--booking-primary) focus:border-transparent transition-all resize-none" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold uppercase opacity-60">Notes / Reason for Appointment</label>
                      <textarea name="notes" rows={3} className="w-full px-4 py-3 bg-current/5 border border-current/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--booking-primary) focus:border-transparent transition-all resize-none" />
                    </div>
                  </div>
                </section>

                <div className="pt-4">
                  <button type="submit" style={{ backgroundColor: 'var(--booking-primary)', color: 'var(--booking-card-bg)' }} className="w-full py-4 rounded-xl font-bold text-sm transition-opacity shadow-md flex items-center justify-center gap-2 hover:opacity-90">
                    Confirm Appointment <Icons.Check size={18} />
                  </button>
                </div>
              </form>
              
            </div>
          </div>
        )}
      </div>
    </div>
  );
}