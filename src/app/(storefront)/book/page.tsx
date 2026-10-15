import { sql } from '@/lib/db';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import { CSSProperties } from 'react';

export const dynamic = 'force-dynamic';

export interface CustomCSS extends CSSProperties {
  [key: `--${string}`]: string | number | undefined;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default async function BookingPage(props: { searchParams: Promise<{ month?: string }> }) {
  
  const searchParams = await props.searchParams;
  
  const [settingsResult, blockedDatesResult, configResult, bookedCountsResult] = await Promise.all([
    sql`SELECT * FROM booking_settings WHERE is_singleton = TRUE LIMIT 1`,
    sql`SELECT TO_CHAR(blocked_date, 'YYYY-MM-DD') as date, reason FROM booking_blocked_dates`,
    sql`SELECT contact_business_name, tenant_name FROM site_config WHERE is_singleton = TRUE LIMIT 1`,
    sql`
      SELECT TO_CHAR(appointment_date, 'YYYY-MM-DD') as date, COUNT(*) as taken_slots
      FROM appointments
      WHERE appointment_date >= CURRENT_DATE AND status != 'Cancelled'
      GROUP BY appointment_date
    `
  ]);

  const bookingConfig = settingsResult[0] || {};
  const globalConfig = configResult[0] || {};
  
  const isActive = bookingConfig.is_active ?? true;
  const schedule = bookingConfig.schedule || {};
  const availableTimeSlots = bookingConfig.available_time_slots || ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];
  const totalSlotsPerDay = availableTimeSlots.length;

  const businessName = globalConfig.contact_business_name || globalConfig.tenant_name || 'Our Company';
  const blockedDatesSet = new Set(blockedDatesResult.map(r => r.date));
  
  const bookedCountsMap = bookedCountsResult.reduce((acc: Record<string, number>, row: any) => {
    acc[row.date] = Number(row.taken_slots);
    return acc;
  }, {} as Record<string, number>);

  // ============================================================================
  // WOZ ALGORITHM: Timezone-Aware Current Time (Legazpi City / Asia/Manila)
  // ============================================================================
  const localNowStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" });
  const localNow = new Date(localNowStr);
  const today = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate());
  today.setHours(0, 0, 0, 0);

  const localTodayStr = `${localNow.getFullYear()}-${String(localNow.getMonth() + 1).padStart(2, '0')}-${String(localNow.getDate()).padStart(2, '0')}`;
  const localTimeStr = `${String(localNow.getHours()).padStart(2, '0')}:${String(localNow.getMinutes()).padStart(2, '0')}`;

  let targetYear = today.getFullYear();
  let targetMonth = today.getMonth();

  if (searchParams.month) {
    const [yStr, mStr] = searchParams.month.split('-');
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10) - 1;
    if (!isNaN(y) && !isNaN(m) && m >= 0 && m <= 11) {
      targetYear = y;
      targetMonth = m;
    }
  }

  const isCurrentMonthOrPast = targetYear < today.getFullYear() || (targetYear === today.getFullYear() && targetMonth <= today.getMonth());

  const prevMonthDate = new Date(targetYear, targetMonth - 1, 1);
  const nextMonthDate = new Date(targetYear, targetMonth + 1, 1);
  
  const prevMonthQuery = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const nextMonthQuery = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const targetDateObj = new Date(targetYear, targetMonth, 1);
  const monthName = targetDateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const startDayIndex = targetDateObj.getDay();
  const paddingDays = Array.from({ length: startDayIndex }).fill(null);

  const days = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(targetYear, targetMonth, i);

    const localYear = d.getFullYear();
    const localMonthStr = String(d.getMonth() + 1).padStart(2, '0');
    const localDay = String(d.getDate()).padStart(2, '0');
    const dateStr = `${localYear}-${localMonthStr}-${localDay}`;

    const dayOfWeekName = d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    const isPast = d < today;
    const isDayActive = schedule[dayOfWeekName]?.active === true;
    const isExplicitlyBlocked = blockedDatesSet.has(dateStr);
    const isToday = dateStr === localTodayStr;

    // ============================================================================
    // WOZ FIX: Calculate valid capacity based on the exact minute of the day
    // ============================================================================
    let validSlotsCount = totalSlotsPerDay;
    if (isToday) {
      // Keep only slots where the slot time is greater than the current time.
      validSlotsCount = availableTimeSlots.filter((slot: string) => slot > localTimeStr).length;
    }

    const isFullyBooked = (bookedCountsMap[dateStr] || 0) >= validSlotsCount;
    
    const isBookable = !isPast && isDayActive && !isExplicitlyBlocked && !isFullyBooked;

    let statusType = 'available';
    let displayReason = null;

    if (isPast) {
      statusType = 'past';
    } else if (!isDayActive) {
      statusType = 'closed';
      displayReason = 'Closed';
    } else if (isExplicitlyBlocked) {
      statusType = 'blocked';
      displayReason = blockedDatesResult.find(r => r.date === dateStr)?.reason;
    } else if (isFullyBooked) {
      statusType = 'blocked';
      displayReason = validSlotsCount === 0 ? 'Slots Expired' : 'Fully Booked';
    }

    days.push({ dateStr, dayNumber: i, isBookable, statusType, reason: displayReason });
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

  return (
    <div className="w-full min-h-[80vh] py-12 md:py-24 relative z-10 transition-colors duration-500" style={pageStyles}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold font-display mb-3">
            {bookingConfig.booking_title || 'Schedule an Appointment'}
          </h1>
          <p className="opacity-70 text-lg">
            {bookingConfig.booking_subtitle || `Select an available date below to book a session with ${businessName}.`}
          </p>
        </div>

        {!isActive ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center bg-[var(--booking-card-bg)] rounded-2xl shadow-sm border border-current/10 p-12 max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-current/5 border border-current/10 rounded-full flex items-center justify-center mb-6 opacity-60">
              <Icons.CalendarX size={32} />
            </div>
            <h2 className="text-2xl font-bold font-display mb-2">Bookings Paused</h2>
            <p className="opacity-70 max-w-md text-center mb-8">
              We are not accepting new appointments at this time. Please check back later or contact us directly.
            </p>
            <Link href="/" className="px-6 py-3 bg-[var(--booking-primary)] text-[var(--booking-card-bg)] rounded-lg font-medium hover:opacity-90 transition-opacity shadow-sm">
              Return to Storefront
            </Link>
          </div>
        ) : (
          <div className="bg-[var(--booking-card-bg)] rounded-2xl shadow-sm border border-current/10 overflow-hidden text-[var(--booking-text)] max-w-2xl mx-auto">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-current/10 bg-current/5 gap-4">
              <div>
                <h2 className="font-bold uppercase tracking-widest text-sm flex items-center gap-2 opacity-80 mb-1">
                  <Icons.Calendar size={18} style={{ color: 'var(--booking-primary)' }} />
                  Select an available date
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-widest opacity-80 bg-[var(--booking-card-bg)] px-3 py-2 rounded-lg border border-current/10 shadow-sm">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--booking-primary)' }}></div> Available</div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-current opacity-20"></div> Closed</div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div> Blocked</div>
              </div>
            </div>

            <div className="p-4 sm:p-8">
              
              <div className="flex flex-col">
                
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-current/10">
                  {isCurrentMonthOrPast ? (
                    <div className="w-10 h-10 flex items-center justify-center opacity-20 cursor-not-allowed">
                      <Icons.ChevronLeft size={24} />
                    </div>
                  ) : (
                    <Link href={`?month=${prevMonthQuery}`} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-current/5 transition-colors" style={{ color: 'var(--booking-primary)' }}>
                      <Icons.ChevronLeft size={24} />
                    </Link>
                  )}

                  <div className="font-display font-bold text-xl text-center" style={{ color: 'var(--booking-primary)' }}>
                    {monthName}
                  </div>

                  <Link href={`?month=${nextMonthQuery}`} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-current/5 transition-colors" style={{ color: 'var(--booking-primary)' }}>
                    <Icons.ChevronRight size={24} />
                  </Link>
                </div>
                
                <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
                  {WEEKDAYS.map(day => (
                    <div key={day} className="text-[10px] sm:text-xs font-bold uppercase tracking-widest opacity-50 py-1">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {paddingDays.map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square rounded-lg bg-transparent"></div>
                  ))}

                  {days.map((day, idx) => {
                    
                    if (day.statusType === 'past') {
                      return (
                        <div key={idx} className="aspect-square flex items-center justify-center p-1 rounded-lg opacity-20 cursor-not-allowed">
                          <span className="text-lg sm:text-xl font-display font-bold">{day.dayNumber}</span>
                        </div>
                      );
                    }

                    if (day.isBookable) {
                      return (
                        <Link 
                          key={idx}
                          href={`/book/${day.dateStr}`}
                          style={{ color: 'var(--booking-primary)', borderColor: 'var(--booking-primary)' }}
                          className="aspect-square flex flex-col items-center justify-center p-1 rounded-lg border border-opacity-30 bg-opacity-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:bg-current hover:text-[var(--booking-card-bg)] hover:border-current relative overflow-hidden group"
                        >
                          <span className="text-lg sm:text-xl font-display font-bold leading-none">{day.dayNumber}</span>
                          <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-current opacity-50 group-hover:bg-[var(--booking-card-bg)]"></div>
                        </Link>
                      );
                    } 
                    
                    if (day.statusType === 'blocked') {
                      return (
                        <div 
                          key={idx}
                          className="aspect-square flex flex-col items-center justify-center p-1 rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-600 opacity-80 cursor-not-allowed relative group"
                          title={day.reason || "Blocked"}
                        >
                          <span className="text-lg sm:text-xl font-display font-bold leading-none">{day.dayNumber}</span>
                          <span className="text-[8px] font-bold uppercase tracking-wider text-center leading-tight px-1 line-clamp-1 w-full truncate opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-1">
                            {day.reason}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={idx}
                        className="aspect-square flex flex-col items-center justify-center p-1 rounded-lg border border-current/10 bg-current/5 opacity-30 cursor-not-allowed text-current"
                        title="Closed"
                      >
                        <span className="text-lg sm:text-xl font-display font-bold leading-none">{day.dayNumber}</span>
                      </div>
                    );
                    
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}