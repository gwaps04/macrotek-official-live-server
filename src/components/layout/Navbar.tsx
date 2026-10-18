"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  tenantName: string;
  logoUrl?: string;
  links: string[];
  navBgColor?: string;
  navTextColor?: string;
  navFontFamily?: string;
  enableAppointments?: boolean;
  enableEnrollments?: boolean;
}

export default function Navbar({ 
  tenantName, 
  logoUrl, 
  links,
  navBgColor = '#ffffff',
  navTextColor = '#3f3f46',
  navFontFamily = 'ui-sans-serif, system-ui, sans-serif',
  enableAppointments = true,
  enableEnrollments = false
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navContainerStyle = {
    backgroundColor: navBgColor,
    fontFamily: navFontFamily,
  };

  const navTextStyle = {
    color: navTextColor,
  };

  return (
    <header 
      className="fixed top-0 w-full z-50 shadow-sm transition-all border-b border-black/5"
      style={navContainerStyle}
    >
      <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          <div className="shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2">
              {logoUrl ? (
                <Image src={logoUrl} alt={tenantName} width={200} height={60} priority className="w-auto h-8 sm:h-10 object-contain" />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black/10 rounded-lg flex items-center justify-center">
                  <span className="font-bold font-display text-sm sm:text-base" style={navTextStyle}>{tenantName.charAt(0)}</span>
                </div>
              )}
              {!logoUrl && (
                <span className="font-bold text-xl tracking-tight hidden sm:block" style={navTextStyle}>
                  {tenantName}
                </span>
              )}
            </Link>
          </div>

          {/* DESKTOP/WIDE TABLET NAVIGATION */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            {links.map((link) => (
              <Link 
                key={link} 
                href={`/#${link.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-sm font-medium opacity-70 hover:opacity-100 transition-opacity whitespace-nowrap"
                style={navTextStyle}
              >
                {link}
              </Link>
            ))}
            
            <div className="flex items-center gap-3 border-l border-black/10 pl-6 ml-2">
              {enableEnrollments && !enableAppointments ? (
                <Link href="/classes" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm transition-colors shadow-sm tracking-wide whitespace-nowrap">
                  View Classes
                </Link>
              ) : (
                <Link href="/book" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm transition-colors shadow-sm tracking-wide whitespace-nowrap">
                  Book Now
                </Link>
              )}
            </div>
          </nav>

          {/* WOZ FIX: MOBILE NAVIGATION TRIGGER - Stripped CTAs to prevent overflow */}
          <div className="flex items-center gap-3 lg:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="focus:outline-none p-2 opacity-70 hover:opacity-100 transition-opacity" style={navTextStyle} aria-label="Toggle menu">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      {isOpen && (
        <div className="lg:hidden shadow-xl absolute w-full border-t border-black/5" style={navContainerStyle}>
          <div className="px-4 pt-2 pb-8 space-y-2 max-h-[85vh] overflow-y-auto">
            {links.map((link) => (
              <Link 
                key={link} 
                href={`/#${link.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-3 rounded-md text-base font-medium hover:bg-black/5 opacity-80 hover:opacity-100"
                style={navTextStyle}
              >
                {link}
              </Link>
            ))}

            {/* Direct single CTA inside the mobile drawer */}
            <div className="pt-4 mt-2 border-t border-black/10 flex flex-col gap-3 px-3">
              {enableEnrollments && !enableAppointments ? (
                <Link href="/classes" onClick={() => setIsOpen(false)} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm text-center transition-colors shadow-sm tracking-wide">
                  View Classes
                </Link>
              ) : (
                <Link href="/book" onClick={() => setIsOpen(false)} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm text-center transition-colors shadow-sm tracking-wide">
                  Book Now
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}