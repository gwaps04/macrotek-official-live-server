import { sql } from '@/lib/db';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import ClassScheduleList, { ScheduledClass } from '@/components/sections/ClassScheduleList';
import React, { CSSProperties } from 'react';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export interface CustomCSS extends CSSProperties {
  [key: `--${string}`]: string | number | undefined;
}

export default async function ClassesPage() {
  
  const [configResult, classesResult, schedulesResult] = await Promise.all([
    sql`SELECT * FROM site_config WHERE is_singleton = TRUE LIMIT 1`,
    sql`SELECT id, title, description, instructor_name, icon_identifier, image_url, price, max_capacity FROM classes WHERE is_active = TRUE ORDER BY sort_order ASC, created_at DESC`,
    sql`
      SELECT 
        cs.id as schedule_id, cs.schedule_date, cs.start_time, cs.end_time,
        c.id as class_id, c.title, c.instructor_name, c.price, c.max_capacity, c.image_url, c.icon_identifier
      FROM class_schedules cs
      INNER JOIN classes c ON cs.class_id = c.id
      WHERE cs.schedule_date >= CURRENT_DATE AND c.is_active = TRUE
      ORDER BY cs.schedule_date ASC, cs.start_time ASC
    `
  ]);

  const config = configResult[0] || {};
  const isEngineActive = config.enable_enrollments ?? false;
  const businessName = config.contact_business_name || config.tenant_name || 'Our Company';

  const scheduledClasses = schedulesResult as ScheduledClass[];

  const formatPHP = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  };

  const resolveIcon = (iconName: string) => {
    // @ts-ignore
    return Icons[iconName] || Icons.Users;
  };

  const pageStyles: CustomCSS = {
    fontFamily: config.classes_font_family || 'ui-sans-serif, system-ui, sans-serif',
    color: config.classes_text_color || '#18181b',
    ...(config.classes_bg_type === 'gradient' 
      ? { backgroundImage: `linear-gradient(135deg, ${config.classes_bg_color || '#f8fafc'}, ${config.classes_bg_gradient_to || '#ffffff'})` }
      : { backgroundColor: config.classes_bg_color || '#f8fafc' }),
      
    '--class-primary': config.classes_primary_color || '#4f46e5',
    '--class-card-bg': config.classes_card_bg || '#ffffff',
    '--class-text': config.classes_text_color || '#18181b',
  };

  return (
    <div className="w-full min-h-[80vh] py-12 md:py-24 relative z-10 transition-colors duration-500" style={pageStyles}>
      <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-16 text-center max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-bold font-display mb-4 leading-tight">
            {config.classes_title || 'Class Schedule & Enrollment'}
          </h1>
          <p className="opacity-70 text-lg leading-relaxed">
            {config.classes_subtitle || `Find a class, meet our instructors, and secure your spot today at ${businessName}.`}
          </p>
        </div>

        {!isEngineActive ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center bg-(--class-card-bg) rounded-2xl shadow-sm border border-current/10 p-12 max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 bg-current/5 border border-current/10 rounded-full flex items-center justify-center mb-6 opacity-60">
              <Icons.UserX size={32} />
            </div>
            <h2 className="text-2xl font-bold font-display mb-2">Enrollments Paused</h2>
            <p className="opacity-70 max-w-md mx-auto mb-8">
              We are not accepting new class enrollments at this time. Please check back later.
            </p>
            <Link href="/" className="px-6 py-3 bg-(--class-primary) text-(--class-card-bg) rounded-lg font-medium hover:opacity-90 transition-opacity shadow-sm">
              Return to Storefront
            </Link>
          </div>
        ) : (
          <React.Fragment>
            {/* WOZ FIX: Added an ID here so the buttons below can smoothly scroll the user up! */}
            <div id="upcoming-schedule" className="scroll-mt-32">
              <ClassScheduleList schedules={scheduledClasses} />
            </div>

            <div className="flex items-center justify-between mb-8 max-w-5xl mx-auto border-t border-current/10 pt-16">
              <h3 className="text-2xl font-bold font-display opacity-90">Full Curriculum</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {classesResult.map((cls) => {
                const Icon = resolveIcon(cls.icon_identifier);
                
                return (
                  <div 
                    key={cls.id} 
                    className="flex flex-col rounded-2xl bg-(--class-card-bg) shadow-sm hover:shadow-xl border border-current/5 overflow-hidden transition-all duration-300 hover:-translate-y-1 group"
                    style={{ color: 'var(--class-primary)' }}
                  >
                    <div className="relative w-full h-48 bg-current/5 flex items-center justify-center border-b border-current/10">
                      {cls.image_url ? (
                        <Image src={cls.image_url} alt={cls.title} fill className="object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <Icon className="w-16 h-16 opacity-30" strokeWidth={1} />
                      )}
                      <div className="absolute top-4 right-4 bg-(--class-card-bg) text-current text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-current/10 flex items-center gap-1.5">
                        <Icons.Users size={12} /> Max {cls.max_capacity}
                      </div>
                    </div>

                    <div className="p-8 flex-1 flex flex-col" style={{ color: 'var(--class-text)' }}>
                      <div className="mb-6">
                        <h3 className="text-2xl font-bold font-display mb-2 text-current leading-tight group-hover:text-(--class-primary) transition-colors">{cls.title}</h3>
                        <p className="text-sm font-semibold opacity-70 flex items-center gap-1.5">
                          <Icons.UserCheck size={14} /> Instructed by {cls.instructor_name}
                        </p>
                      </div>
                      
                      <p className="text-sm opacity-80 leading-relaxed flex-1 mb-8">
                        {cls.description}
                      </p>
                      
                      <div className="pt-6 border-t border-current/10 flex items-center justify-between mt-auto">
                        <div>
                          <span className="block text-[10px] uppercase tracking-wider opacity-60 font-bold mb-1">Standard Rate</span>
                          <span className="text-2xl font-bold font-mono text-current">
                            {Number(cls.price) === 0 ? 'FREE' : formatPHP(cls.price)}
                          </span>
                        </div>
                        {/* WOZ FIX: Added the Anchor Button so users aren't confused! */}
                        <a 
                          href="#upcoming-schedule" 
                          className="px-4 py-2 border-2 border-current rounded-lg text-xs font-bold hover:bg-current hover:text-(--class-card-bg) transition-colors"
                        >
                          View Dates
                        </a>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}