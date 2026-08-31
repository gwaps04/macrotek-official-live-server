"use client";

import * as Icons from 'lucide-react';
import { CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export interface CustomCSS extends CSSProperties {
  [key: `--${string}`]: string | number | undefined;
}

export interface ScheduledClass {
  schedule_id: string;
  schedule_date: string | Date;
  start_time: string;
  end_time: string;
  class_id: string;
  title: string;
  instructor_name: string;
  price: number;
  max_capacity: number;
  image_url: string | null;
  icon_identifier: string;
}

interface ClassScheduleListProps {
  schedules: ScheduledClass[];
}

export default function ClassScheduleList({ schedules }: ClassScheduleListProps) {
  
  if (!schedules || schedules.length === 0) {
    return (
      <div className="w-full max-w-5xl mx-auto mb-24">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold font-display opacity-90">Upcoming Schedule</h3>
        </div>
        <div className="text-center py-16 bg-[var(--class-card-bg)] rounded-2xl border border-current/10 shadow-sm" style={{ color: 'var(--class-primary)' }}>
          <Icons.CalendarX size={48} className="mx-auto mb-4 opacity-30" />
          <h3 className="text-2xl font-bold font-display opacity-90 mb-2 text-[var(--class-text)]">No Upcoming Sessions</h3>
          <p className="opacity-60 text-[var(--class-text)] max-w-md mx-auto">
            We currently do not have any specific dates scheduled for our classes. Please check back later or view our full curriculum below!
          </p>
        </div>
      </div>
    );
  }

  const groupedSchedules = schedules.reduce((acc, session) => {
    const d = new Date(session.schedule_date);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(session);
    return acc;
  }, {} as Record<string, ScheduledClass[]>);

  const formatPHP = (amount: number) => {
    if (Number(amount) === 0) return 'FREE';
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  };

  const formatTime = (time24: string) => {
    const [hourStr, minStr] = time24.split(':');
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12;
    return `${hour}:${minStr} ${ampm}`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto mb-24">
      
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-bold font-display opacity-90">Upcoming Schedule</h3>
        <span className="text-xs font-bold uppercase tracking-widest opacity-60 border border-current/20 px-3 py-1 rounded-full">
          {schedules.length} Sessions Available
        </span>
      </div>

      <div className="space-y-12">
        {Object.entries(groupedSchedules).map(([dateStr, sessions]) => {
          const dateObj = new Date(dateStr);
          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
          const monthDay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

          return (
            <div key={dateStr} className="relative">
              <div className="sticky top-20 z-20 flex items-center gap-4 mb-6 bg-[var(--class-card-bg)] py-2">
                <div className="flex flex-col border-l-4 pl-4 border-current">
                  <span className="text-sm font-bold uppercase tracking-widest opacity-60">{dayName}</span>
                  <span className="text-xl font-black font-display tracking-tight opacity-90">{monthDay}</span>
                </div>
                <div className="h-px bg-current/10 flex-1"></div>
              </div>

              <div className="space-y-4">
                {sessions.map((session) => {
                  const Icon = (Icons as any)[session.icon_identifier] || Icons.Users;
                  
                  return (
                    <div 
                      key={session.schedule_id}
                      style={{ color: 'var(--class-primary)' }}
                      className="group flex flex-col md:flex-row items-stretch md:items-center justify-between p-4 md:p-6 rounded-2xl border border-current/10 bg-[var(--class-card-bg)] shadow-sm hover:shadow-md hover:border-current/30 transition-all duration-200"
                    >
                      <div className="flex items-center gap-6 mb-4 md:mb-0">
                        <div className="flex flex-col items-center justify-center w-24 h-full border-r border-current/10 pr-6 text-current">
                          <span className="font-bold text-lg leading-none mb-1">{formatTime(session.start_time)}</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{formatTime(session.end_time)}</span>
                        </div>
                        
                        <div className="w-12 h-12 rounded-xl bg-current/5 flex items-center justify-center flex-shrink-0 border border-current/10 overflow-hidden relative">
                          {session.image_url ? (
                            <Image src={session.image_url} alt={session.title} fill className="object-cover opacity-90" />
                          ) : (
                            <Icon size={20} className="opacity-60 text-current" />
                          )}
                        </div>

                        <div>
                          <h4 style={{ color: 'var(--class-text)' }} className="font-bold text-lg leading-tight mb-1 group-hover:text-[var(--class-primary)] transition-colors">
                            {session.title}
                          </h4>
                          <div className="flex items-center gap-3 text-xs font-medium opacity-60" style={{ color: 'var(--class-text)' }}>
                            <span className="flex items-center gap-1"><Icons.UserCheck size={12} /> {session.instructor_name}</span>
                            <span className="flex items-center gap-1"><Icons.Users size={12} /> Max {session.max_capacity}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t border-current/10 md:border-0 w-full md:w-auto">
                        <div className="font-mono text-xl font-bold opacity-90 text-current">
                          {formatPHP(session.price)}
                        </div>
                        
                        {/* WOZ FIX: Explicit styling injected directly into the DOM node to override caching */}
                        <Link 
                          href={`/classes/enroll/${session.schedule_id}`}
                          style={{ backgroundColor: 'var(--class-primary)', color: 'var(--class-card-bg)' }}
                          className="px-6 py-3 rounded-lg font-bold text-sm transition-opacity shadow-sm flex items-center gap-2 whitespace-nowrap hover:opacity-90"
                        >
                          Enroll Now <Icons.ArrowRight size={16} />
                        </Link>
                        
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}