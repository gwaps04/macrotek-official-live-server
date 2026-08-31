import { sql } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import * as Icons from 'lucide-react';
import TimeSlotManager from '@/components/admin/TimeSlotManager';
import QuestionnaireBuilder from '@/components/admin/QuestionnaireBuilder';
import CancelAppointmentForm from '@/components/admin/CancelAppointmentForm';

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Monday' }, { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' }, { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' }, { id: 'saturday', label: 'Saturday' }, { id: 'sunday', label: 'Sunday' }
];

export default async function DashboardBooking() {
  
  const [settingsResult, appointmentsResult, blockedDatesResult] = await Promise.all([
    sql`SELECT * FROM booking_settings WHERE is_singleton = TRUE LIMIT 1`,
    sql`
      SELECT id, appointment_date, appointment_time, client_first_name, client_last_name, client_email, client_phone, client_notes, status, prequalification_answers 
      FROM appointments 
      WHERE appointment_date >= CURRENT_DATE 
      ORDER BY appointment_date ASC, appointment_time ASC
    `,
    sql`SELECT id, TO_CHAR(blocked_date, 'YYYY-MM-DD') as date, reason FROM booking_blocked_dates ORDER BY blocked_date ASC`
  ]);

  const config = settingsResult[0] || {};
  const isEngineActive = config.is_active ?? true;
  const currentSchedule = config.schedule || {};
  const availableTimeSlots = config.available_time_slots || ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];
  
  const prequalificationQuestions = config.prequalification_questions || [];

  async function updateSettingsAction(formData: FormData) {
    "use server";
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

  async function addBlockedDateAction(formData: FormData) {
    "use server";
    const date = formData.get('blockedDate') as string;
    const reason = formData.get('reason') as string;
    if (date && reason) {
      await sql`INSERT INTO booking_blocked_dates (blocked_date, reason) VALUES (${date}::DATE, ${reason}) ON CONFLICT DO NOTHING`;
    }
    revalidatePath('/book', 'layout');
    redirect('/dashboard/booking');
  }

  async function removeBlockedDateAction(formData: FormData) {
    "use server";
    const id = formData.get('blockedId') as string;
    await sql`DELETE FROM booking_blocked_dates WHERE id = ${id}`;
    revalidatePath('/book', 'layout');
    redirect('/dashboard/booking');
  }

  async function updateStatusAction(formData: FormData) {
    "use server";
    const id = formData.get('appointmentId') as string;
    const newStatus = formData.get('status') as string;
    await sql`UPDATE appointments SET status = ${newStatus} WHERE id = ${id}`;
    revalidatePath('/book', 'layout');
    redirect('/dashboard/booking');
  }

  return (
    <div className="max-w-[1600px] pb-24 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Appointment Engine</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage your active booking days, time slots, prequalification questions, and consultations.</p>
      </div>

      {/* WOZ FIX: 12-Column Grid Geometry Upgrade */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8">
        
        {/* LEFT COLUMN: SETTINGS (Wider footprint on standard laptops) */}
        <div className="lg:col-span-5 2xl:col-span-4 space-y-6 xl:space-y-8">
          
          <form action={updateSettingsAction} className="bg-white p-5 xl:p-6 rounded-2xl shadow-sm border border-zinc-200 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2 uppercase tracking-widest">
                <Icons.Settings size={16} className="text-emerald-600" /> Operating Rules
              </h2>
              <label className="flex items-center space-x-2 cursor-pointer bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-md">
                <input type="checkbox" name="isActive" defaultChecked={isEngineActive} className="w-3.5 h-3.5 text-emerald-600 rounded focus:ring-emerald-500" />
                <span className="font-bold text-zinc-900 text-xs">Active</span>
              </label>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block border-b border-zinc-100 pb-2">Active Days</label>
              <div className="grid grid-cols-2 gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <label key={day.id} className={`flex items-center space-x-2 p-2.5 rounded-md border transition-colors cursor-pointer ${currentSchedule[day.id]?.active ? 'bg-emerald-50/50 border-emerald-200' : 'bg-zinc-50 border-zinc-200'}`}>
                    <input type="checkbox" name={`day_${day.id}`} defaultChecked={currentSchedule[day.id]?.active} className="w-3.5 h-3.5 text-emerald-600 rounded focus:ring-emerald-500 bg-white border-zinc-300" />
                    <span className="text-xs font-semibold text-zinc-700">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <TimeSlotManager initialSlots={availableTimeSlots} />

            <div className="pt-4 border-t border-zinc-100">
              <QuestionnaireBuilder initialQuestions={prequalificationQuestions} />
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-100">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Checkout Form Title</label>
                <input type="text" name="formTitle" defaultValue={config.booking_form_title} placeholder="Appointment Details" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Checkout Form Instructions</label>
                <input type="text" name="formSubtitle" defaultValue={config.booking_form_subtitle} className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>

            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg shadow-sm transition-colors text-sm">
              Save Operating Rules
            </button>
          </form>

          <div className="bg-white p-5 xl:p-6 rounded-2xl shadow-sm border border-zinc-200 space-y-6">
            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2 uppercase tracking-widest border-b border-zinc-100 pb-4">
              <Icons.CalendarOff size={16} className="text-rose-600" /> Blocked Dates
            </h2>
            <form action={addBlockedDateAction} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Select Date</label>
                <input type="date" name="blockedDate" required className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-rose-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Reason (Publicly Visible)</label>
                <input type="text" name="reason" required placeholder="e.g. National Holiday" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-rose-500" />
              </div>
              <button type="submit" className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-2 rounded-md transition-colors text-xs uppercase tracking-wider">
                Block Date
              </button>
            </form>

            {blockedDatesResult.length > 0 && (
              <div className="pt-4 border-t border-zinc-100 space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Currently Blocked</label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {blockedDatesResult.map(b => {
                    const d = new Date(b.date);
                    return (
                      <div key={b.id} className="flex items-center justify-between bg-rose-50 text-rose-800 p-2.5 rounded-lg border border-rose-100">
                        <div>
                          <p className="text-xs font-bold leading-none mb-1">{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}</p>
                          <p className="text-[10px] font-medium opacity-80 leading-none">{b.reason}</p>
                        </div>
                        <form action={removeBlockedDateAction}>
                          <input type="hidden" name="blockedId" value={b.id} />
                          <button type="submit" className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded transition-colors" title="Remove Block">
                            <Icons.Trash2 size={14} />
                          </button>
                        </form>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: APPOINTMENT ROSTER */}
        <div className="lg:col-span-7 2xl:col-span-8">
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden h-full flex flex-col">
            <div className="p-5 xl:p-6 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between flex-shrink-0">
              <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2 uppercase tracking-widest">
                <Icons.BookOpen size={16} className="text-emerald-600" /> Upcoming Consultations
              </h2>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest hidden sm:inline-block">
                {appointmentsResult.length} Booked
              </span>
            </div>

            {appointmentsResult.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 flex-1 flex flex-col items-center justify-center">
                <Icons.Calendar size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-medium text-zinc-500">Your calendar is currently clear.</p>
              </div>
            ) : (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/50 border-b border-zinc-100 text-xs uppercase tracking-widest font-bold text-zinc-500">
                      <th className="p-4 pl-6 whitespace-nowrap">Date & Time</th>
                      <th className="p-4 whitespace-nowrap">Client Information</th>
                      <th className="p-4 min-w-[200px]">Notes & Answers</th>
                      <th className="p-4 text-center whitespace-nowrap">Status</th>
                      <th className="p-4 pr-6 text-right whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-sm">
                    {appointmentsResult.map((appt) => {
                      const d = new Date(appt.appointment_date);
                      const displayDate = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
                      
                      const [h, m] = appt.appointment_time.split(':');
                      let hour = parseInt(h, 10);
                      const ampm = hour >= 12 ? 'PM' : 'AM';
                      const displayTime = `${hour % 12 || 12}:${m} ${ampm}`;

                      const isCancelled = appt.status === 'Cancelled';
                      const answers = appt.prequalification_answers || {};
                      const hasAnswers = Object.keys(answers).length > 0;

                      return (
                        <tr key={appt.id} className={`hover:bg-zinc-50/50 transition-colors ${isCancelled ? 'opacity-50 bg-zinc-50' : ''}`}>
                          <td className="p-4 pl-6 align-top whitespace-nowrap">
                            <div className="font-bold text-zinc-900">{displayDate}</div>
                            <div className="text-emerald-600 font-bold font-mono mt-1">{displayTime}</div>
                          </td>
                          <td className="p-4 align-top">
                            <div className="font-bold text-zinc-900 whitespace-nowrap">{appt.client_first_name} {appt.client_last_name}</div>
                            <div className="text-xs text-zinc-500 mt-1 flex flex-col gap-0.5">
                              <span className="whitespace-nowrap">{appt.client_phone}</span>
                              <span className="whitespace-nowrap">{appt.client_email}</span>
                            </div>
                          </td>
                          <td className="p-4 text-xs text-zinc-500 align-top">
                            <p className="line-clamp-2 mb-2" title={appt.client_notes}>{appt.client_notes || 'No standard notes.'}</p>
                            
                            {hasAnswers && (
                              <details className="group mt-2">
                                <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-widest text-emerald-600 hover:text-emerald-700 list-none flex items-center gap-1">
                                  <Icons.ChevronRight size={14} className="group-open:rotate-90 transition-transform flex-shrink-0" />
                                  View Prequalification
                                </summary>
                                <div className="mt-2 pl-2 space-y-2 border-l-2 border-emerald-100">
                                  {Object.entries(answers).map(([question, answer], i) => (
                                    <div key={i}>
                                      <p className="font-semibold text-zinc-700 leading-tight mb-0.5">{question}</p>
                                      <p className="text-zinc-500 italic">
                                        {Array.isArray(answer) ? answer.join(', ') : String(answer)}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            )}
                          </td>
                          <td className="p-4 text-center align-top">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-bold text-[10px] uppercase tracking-wider ${
                              appt.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' :
                              appt.status === 'Cancelled' ? 'bg-rose-100 text-rose-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {appt.status}
                            </span>
                          </td>
                          <td className="p-4 pr-6 text-right align-top">
                            {!isCancelled ? (
                              <CancelAppointmentForm 
                                appointmentId={appt.id} 
                                action={updateStatusAction} 
                              />
                            ) : (
                              <span className="text-xs text-zinc-400 italic">Revoked</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}