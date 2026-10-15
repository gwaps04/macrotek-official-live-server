import { sql } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import * as Icons from 'lucide-react';
import Link from 'next/link';

// WOZ FIX: Import the new Client Component Island
import RemoveStudentButton from '@/components/admin/RemoveStudentButton';

export default async function ClassRosterDashboard(props: { params: Promise<{ scheduleId: string }> }) {
  
  const params = await props.params;
  const scheduleId = params.scheduleId;

  const [scheduleData, rosterData] = await Promise.all([
    sql`
      SELECT 
        cs.id, cs.schedule_date, cs.start_time, cs.end_time,
        c.title, c.instructor_name, c.price, c.max_capacity
      FROM class_schedules cs
      INNER JOIN classes c ON cs.class_id = c.id
      WHERE cs.id = ${scheduleId}
    `,
    sql`
      SELECT 
        id, student_first_name, student_last_name, student_email, student_phone, student_address, payment_status, created_at
      FROM class_enrollments
      WHERE schedule_id = ${scheduleId}
      ORDER BY created_at ASC
    `
  ]);

  const session = scheduleData[0];
  if (!session) redirect('/dashboard/class-schedule');

  async function markPaidAction(formData: FormData) {
    "use server";
    const enrollmentId = formData.get('enrollmentId') as string;
    await sql`UPDATE class_enrollments SET payment_status = 'Paid' WHERE id = ${enrollmentId}`;
    revalidatePath(`/dashboard/class-schedule/${scheduleId}`);
  }

  async function markPendingAction(formData: FormData) {
    "use server";
    const enrollmentId = formData.get('enrollmentId') as string;
    await sql`UPDATE class_enrollments SET payment_status = 'Pending' WHERE id = ${enrollmentId}`;
    revalidatePath(`/dashboard/class-schedule/${scheduleId}`);
  }

  // WOZ FIX: This action remains on the Server, but is passed down into the Client Component
  async function removeStudentAction(formData: FormData) {
    "use server";
    const enrollmentId = formData.get('enrollmentId') as string;
    await sql`DELETE FROM class_enrollments WHERE id = ${enrollmentId}`;
    revalidatePath(`/dashboard/class-schedule/${scheduleId}`);
    // Also revalidate the public classes page so the available seat count instantly updates
    revalidatePath('/classes', 'page'); 
  }

  const dateObj = new Date(session.schedule_date);
  const displayDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
  const formatTime = (time24: string) => {
    const [h, m] = time24.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${m} ${ampm}`;
  };
  const formatPHP = (amount: number) => {
    if (Number(amount) === 0) return 'FREE';
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  };

  const totalEnrolled = rosterData.length;
  const isFull = totalEnrolled >= session.max_capacity;
  const revenuePotential = totalEnrolled * Number(session.price);
  const collectedRevenue = rosterData.filter(r => r.payment_status === 'Paid').length * Number(session.price);

  return (
    <div className="max-w-6xl pb-24 space-y-8">
      
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/class-schedule" className="inline-flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-indigo-600 transition-colors mb-2 uppercase tracking-widest">
            <Icons.ArrowLeft size={14} /> Back to Calendar
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-3">
            {session.title} Roster
            {isFull && <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-widest">Class Full</span>}
          </h1>
          <p className="text-zinc-500 text-sm mt-1 flex items-center gap-4">
            <span className="flex items-center gap-1.5"><Icons.Calendar size={14} /> {displayDate}</span>
            <span className="flex items-center gap-1.5"><Icons.Clock size={14} /> {formatTime(session.start_time)} - {formatTime(session.end_time)}</span>
            <span className="flex items-center gap-1.5"><Icons.UserCheck size={14} /> {session.instructor_name}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Icons.Users size={24} /></div>
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Capacity</p>
            <p className="text-2xl font-bold font-display text-zinc-900">{totalEnrolled} <span className="text-base font-medium text-zinc-400">/ {session.max_capacity}</span></p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Icons.Banknote size={24} /></div>
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Collected Revenue</p>
            <p className="text-2xl font-bold font-mono text-zinc-900">{formatPHP(collectedRevenue)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"><Icons.Wallet size={24} /></div>
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Pending Balance</p>
            <p className="text-2xl font-bold font-mono text-zinc-900">{formatPHP(revenuePotential - collectedRevenue)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
          <h2 className="font-bold text-zinc-800 text-sm uppercase tracking-widest">Enrolled Students ({totalEnrolled})</h2>
        </div>
        
        {totalEnrolled === 0 ? (
          <div className="p-12 text-center text-zinc-400">
            <Icons.ClipboardList size={40} className="mx-auto mb-3 opacity-20" />
            <p>No students have enrolled in this session yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-100 text-xs uppercase tracking-widest font-bold text-zinc-500">
                  <th className="p-4 pl-6">Student Info</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Registered</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm">
                {rosterData.map((student) => {
                  const registeredDate = new Date(student.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <tr key={student.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="font-bold text-zinc-900">{student.student_first_name} {student.student_last_name}</div>
                        <div className="text-xs text-zinc-500 mt-1 line-clamp-1 max-w-[200px]" title={student.student_address}>{student.student_address}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-zinc-900 font-medium">{student.student_phone}</div>
                        <div className="text-xs text-zinc-500 mt-1">{student.student_email}</div>
                      </td>
                      <td className="p-4 text-zinc-500 text-xs">
                        {registeredDate}
                      </td>
                      <td className="p-4">
                        {student.payment_status === 'Paid' ? (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded font-bold text-[10px] uppercase tracking-wider">
                            <Icons.CheckCircle2 size={12} /> Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 px-2.5 py-1 rounded font-bold text-[10px] uppercase tracking-wider">
                            <Icons.Clock size={12} /> Pending
                          </span>
                        )}
                      </td>
                      <td className="p-4 pr-6 text-right space-x-2">
                        {student.payment_status === 'Pending' ? (
                          <form action={markPaidAction} className="inline-block">
                            <input type="hidden" name="enrollmentId" value={student.id} />
                            <button type="submit" className="text-xs font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded transition-colors">
                              Mark Paid
                            </button>
                          </form>
                        ) : (
                          <form action={markPendingAction} className="inline-block">
                            <input type="hidden" name="enrollmentId" value={student.id} />
                            <button type="submit" className="text-xs font-bold text-zinc-500 hover:text-zinc-800 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded transition-colors">
                              Mark Pending
                            </button>
                          </form>
                        )}
                        
                        {/* WOZ FIX: Render the Client Component Island and pass the Server Action as a prop */}
                        <RemoveStudentButton enrollmentId={student.id} removeAction={removeStudentAction} />
                        
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
  );
}