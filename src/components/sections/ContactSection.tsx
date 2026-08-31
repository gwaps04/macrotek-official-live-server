"use client";

import { useEffect, useState, CSSProperties } from 'react';
import * as Icons from 'lucide-react';

// WOZ FIX: Type-Safe CSS Custom Property Interface
export interface CustomCSS extends CSSProperties {
  [key: `--${string}`]: string | number | undefined;
}

interface ContactProps {
  businessName: string;
  phone?: string;
  altPhone?: string;
  email?: string;
  address?: string;
  hours?: Record<string, { active: boolean; open: string; close: string }>;
  
  // Theming Props
  bgColor?: string;
  textColor?: string;
  fontFamily?: string;
  hoursBg?: string;
  hoursText?: string;
  hoursFont?: string;
}

export default function ContactSection({ 
  businessName, phone, altPhone, email, address, hours,
  bgColor = '#ffffff',
  textColor = '#18181b',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  hoursBg = '#fafafa',
  hoursText = '#18181b',
  hoursFont = 'ui-sans-serif, system-ui, sans-serif'
}: ContactProps) {
  
  const [storeStatus, setStoreStatus] = useState<{ label: string; color: string }>({ label: 'Checking Status...', color: 'bg-black/10 text-current' });

  const format12Hour = (time24: string) => {
    if (!time24) return "";
    const [hourStr, minStr] = time24.split(':');
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12;
    return `${hour}:${minStr} ${ampm}`;
  };

  useEffect(() => {
    if (!hours || Object.keys(hours).length === 0) {
      setStoreStatus({ label: 'Hours Not Available', color: 'bg-black/5 opacity-50' });
      return;
    }

    const checkTime = () => {
      const manilaTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
      const currentDay = manilaTime.toLocaleDateString("en-US", { weekday: 'long' }).toLowerCase();
      const todayHours = hours[currentDay];
      
      if (!todayHours?.active) {
        // Semantic colors (Red/Danger) must persist regardless of theme
        setStoreStatus({ label: 'Closed Today', color: 'bg-rose-500 text-white shadow-sm' });
        return;
      }

      const currentHour = manilaTime.getHours();
      const currentMinute = manilaTime.getMinutes();
      const currentTimeVal = currentHour + (currentMinute / 60);

      const [openHour, openMin] = todayHours.open.split(':').map(Number);
      const [closeHour, closeMin] = todayHours.close.split(':').map(Number);
      const openTimeVal = openHour + (openMin / 60);
      const closeTimeVal = closeHour + (closeMin / 60);

      if (currentTimeVal < openTimeVal || currentTimeVal >= closeTimeVal) {
        setStoreStatus({ label: 'Closed Now', color: 'bg-rose-500 text-white shadow-sm' });
      } else if (closeTimeVal - currentTimeVal <= 1) {
        setStoreStatus({ label: 'Closing Soon', color: 'bg-amber-500 text-white shadow-sm' });
      } else {
        setStoreStatus({ label: 'Open Now', color: 'bg-emerald-500 text-white shadow-sm' });
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, [hours]);

  // WOZ LOGIC: Section and Hours Card Theming Engine
  const sectionStyles: CustomCSS = {
    backgroundColor: bgColor,
    color: textColor,
    fontFamily: fontFamily,
    '--hours-bg': hoursBg,
    '--hours-text': hoursText,
    '--hours-font': hoursFont,
  };

  return (
    <section id="contact" className="w-full py-24 relative z-10 border-t border-black/5 transition-colors duration-500" style={sectionStyles}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-stretch">
          
          <div className="space-y-12">
            <div>
              <h2 className="font-semibold tracking-wide uppercase text-sm mb-3 opacity-80">Get in Touch</h2>
              <h3 className="font-display text-4xl font-bold mb-4 leading-tight">Contact Us</h3>
              <p className="opacity-70 text-base max-w-md leading-relaxed">
                We are ready to assist you. Reach out via our channels below or visit our office during operating hours.
              </p>
            </div>

            <div className="space-y-6">
              {phone && (
                <div className="flex items-start gap-4">
                  {/* WOZ FIX: Inherits text color natively, applies 5% opacity for background */}
                  <div className="w-12 h-12 bg-current/5 border border-current/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icons.Phone className="w-5 h-5 opacity-80" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider mb-1 opacity-90">Phone</h4>
                    <p className="font-mono text-lg opacity-80">{phone}</p>
                    {altPhone && <p className="font-mono text-sm mt-1 opacity-60">{altPhone}</p>}
                  </div>
                </div>
              )}

              {email && (
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-current/5 border border-current/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icons.Mail className="w-5 h-5 opacity-80" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider mb-1 opacity-90">Email</h4>
                    <a href={`mailto:${email}`} className="font-medium hover:opacity-70 transition-opacity text-lg opacity-80 underline decoration-current/30 underline-offset-4">{email}</a>
                  </div>
                </div>
              )}

              {address && (
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-current/5 border border-current/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icons.MapPin className="w-5 h-5 opacity-80" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider mb-1 opacity-90">Location</h4>
                    <p className="max-w-[280px] leading-relaxed opacity-80">{address}</p>
                  </div>
                </div>
              )}
            </div>

            {hours && Object.keys(hours).length > 0 && (
              <div 
                className="rounded-2xl p-6 md:p-8 border border-black/5 shadow-sm transition-colors"
                style={{ backgroundColor: 'var(--hours-bg)', color: 'var(--hours-text)', fontFamily: 'var(--hours-font)' }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-bold font-display opacity-90">Operating Hours</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${storeStatus.color}`}>
                    {storeStatus.label}
                  </span>
                </div>
                <ul className="space-y-3">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                    const data = hours[day];
                    if (!data) return null;
                    return (
                      <li key={day} className="flex justify-between items-center text-sm border-b border-current/10 last:border-0 pb-3 last:pb-0">
                        <span className="capitalize font-medium opacity-80">{day}</span>
                        {data.active ? (
                          <span className="font-mono font-medium">{format12Hour(data.open)} - {format12Hour(data.close)}</span>
                        ) : (
                          <span className="font-mono text-rose-500 font-medium">Closed</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <div className="w-full h-[400px] lg:h-full min-h-[400px] lg:min-h-[600px] bg-current/5 rounded-3xl overflow-hidden border border-current/10 relative">
            {address ? (
              <iframe
                title="Business Location"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
                className="absolute inset-0 w-full h-full"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40 p-8 text-center">
                <Icons.Map className="w-12 h-12 mb-4" />
                <p>No address configured.</p>
                <p className="text-xs mt-2">Add an address in the CMS to activate the map.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}