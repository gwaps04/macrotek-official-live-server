import { sql } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import * as Icons from 'lucide-react';
import Link from 'next/link';

export default async function DashboardClassSchedule() {
  
  const [configResult, curriculumResult, scheduledResult] = await Promise.all([
    sql`SELECT enable_enrollments FROM site_config WHERE is_singleton = TRUE LIMIT 1`,
    sql`SELECT id, title, instructor_name, max_capacity FROM classes WHERE is_active = TRUE ORDER BY title ASC`,
    // WOZ FIX: Added a subquery to count live enrollments
    sql`
      SELECT 
        cs.id, cs.schedule_date, cs.start_time, cs.end_time, cs.status,
        c.title, c.instructor_name, c.max_capacity,
        (SELECT COUNT(*) FROM class_enrollments ce WHERE ce.schedule_id = cs.id) as current_enrollments
      FROM class_schedules cs
      INNER JOIN classes c ON cs.class_id = c.id
      WHERE cs.schedule_date >= CURRENT_DATE
      ORDER BY cs.schedule_date ASC, cs.start_time ASC
    `
  ]);

  const config = configResult[0] || {};
  const isEngineActive = config.enable_enrollments ?? false;

  async function scheduleClassAction(formData: FormData) {
    "use server";
    const classId = formData.get('classId') as string;
    const scheduleDate = formData.get('scheduleDate') as string;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;

    if (classId && scheduleDate && startTime && endTime) {
      await sql`
        INSERT INTO class_schedules (class_id, schedule_date, start_time, end_time) 
        VALUES (${classId}, ${scheduleDate}::DATE, ${startTime}::TIME, ${endTime}::TIME)
      `;
    }
    revalidatePath('/classes', 'page');
    redirect('/dashboard/class-schedule');
  }

  async function deleteScheduleAction(formData: FormData) {
    "use server";
    const id = formData.get('scheduleId') as string;
    await sql`DELETE FROM class_schedules WHERE id = ${id}`;
    revalidatePath('/classes', 'page');
    redirect('/dashboard/class-schedule');
  }

  if (!isEngineActive) {
    return (
      <div className="max-w-5xl pb-24 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 bg-zinc-200 rounded-full flex items-center justify-center mb-4 text-zinc-500">
          <Icons.CalendarX size={32} />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Enrollment Engine Disabled</h2>
        <p className="text-zinc-500 max-w-md mb-8">
          The Class & Enrollment Engine is currently turned off in your Platform Operating Mode. 
        </p>
        <Link href="/dashboard" className="px-6 py-3 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 transition-colors">
          Go to Settings to Enable
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl pb-24 space-y-12">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Class Calendar & Scheduling</h1>
        <p className="text-zinc-500 text-sm mt-1">Assign your curriculum to specific dates and times to build the public class roster.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: The Scheduling Engine */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-800 text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            <h3 className="text-sm font-semibold uppercase tracking-widest border-b border-zinc-800 pb-2 mb-6">Schedule a Session</h3>
            
            <form action={scheduleClassAction} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400">Select Curriculum Template</label>
                <select name="classId" required className="w-full px-4 py-2 bg-zinc-950 border border-zinc-700 text-white rounded-md text-sm focus:ring-2 focus:ring-indigo-500">
                  {curriculumResult.map(c => (
                    <option key={c.id} value={c.id}>{c.title} ({c.instructor_name})</option>
                  ))}
                  {curriculumResult.length === 0 && <option value="">No Active Classes Found</option>}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400">Event Date</label>
                <input type="date" name="scheduleDate" required className="w-full px-4 py-2 bg-zinc-950 border border-zinc-700 rounded-md text-sm text-white focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400">Start Time</label>
                  <input type="time" name="startTime" required defaultValue="18:00" className="w-full px-4 py-2 bg-zinc-950 border border-zinc-700 rounded-md text-sm text-white focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400">End Time</label>
                  <input type="time" name="endTime" required defaultValue="19:30" className="w-full px-4 py-2 bg-zinc-950 border border-zinc-700 rounded-md text-sm text-white focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="pt-4">
                <button type="submit" disabled={curriculumResult.length === 0} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-md transition-colors text-sm shadow-sm flex items-center justify-center gap-2">
                  <Icons.CalendarPlus size={16} /> Schedule Class
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: The Upcoming Roster */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
            <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-2 mb-6 flex items-center justify-between">
              <span>Upcoming Class Calendar</span>
              <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold">{scheduledResult.length} Sessions</span>
            </h3>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {scheduledResult.map((session) => {
                const dateObj = new Date(session.schedule_date);
                const startStr = session.start_time.substring(0, 5);
                const endStr = session.end_time.substring(0, 5);
                const isFull = Number(session.current_enrollments) >= Number(session.max_capacity);

                return (
                  <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-50 border border-zinc-200 rounded-xl hover:border-indigo-300 transition-colors">
                    
                    <div className="flex items-center gap-4 mb-3 sm:mb-0">
                      <div className="w-14 flex flex-col items-center justify-center bg-indigo-100 text-indigo-700 rounded-lg p-2 flex-shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{dateObj.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })}</span>
                        <span className="text-xl font-display font-black leading-none">{dateObj.getUTCDate()}</span>
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-zinc-900 text-base leading-tight mb-1">{session.title}</h4>
                        <div className="flex items-center gap-3 text-xs font-medium text-zinc-500">
                          <span className="flex items-center gap-1"><Icons.Clock size={12} /> {startStr} - {endStr}</span>
                          <span className="flex items-center gap-1"><Icons.User size={12} /> {session.instructor_name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-3 sm:pt-0 border-t border-zinc-200 sm:border-0">
                      
                      {/* WOZ FIX: Dynamic Roster Link and Enrollment Counters */}
                      <Link 
                        href={`/dashboard/class-schedule/${session.id}`}
                        className={`text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2 transition-colors border ${isFull ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50 shadow-sm'}`}
                      >
                        <Icons.Users size={14} />
                        {session.current_enrollments} / {session.max_capacity} Enrolled
                      </Link>

                      <form action={deleteScheduleAction}>
                        <input type="hidden" name="scheduleId" value={session.id} />
                        <button type="submit" className="text-zinc-400 hover:text-rose-600 p-2 rounded-md hover:bg-rose-50 transition-colors" title="Cancel Session entirely">
                          <Icons.Trash2 size={18} />
                        </button>
                      </form>
                    </div>

                  </div>
                );
              })}

              {scheduledResult.length === 0 && (
                <div className="text-center py-12 text-zinc-400 text-sm flex flex-col items-center">
                  <Icons.Calendar size={32} className="mb-3 opacity-20" />
                  No upcoming classes scheduled. Use the form to add sessions.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}