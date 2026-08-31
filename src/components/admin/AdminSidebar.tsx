"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Icons from 'lucide-react';
import { useState } from 'react';

// WOZ FIX: Import the Logout Button
import LogoutButton from './LogoutButton';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  isHighlight?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface AdminSidebarProps {
  enableAppointments: boolean;
  enableEnrollments: boolean;
}

export default function AdminSidebar({ enableAppointments, enableEnrollments }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const NAV_GROUPS: NavGroup[] = [
    {
      label: 'Platform Core',
      items: [
        { name: 'Site Configuration', href: '/dashboard', icon: Icons.LayoutDashboard },
        { name: 'About & Story', href: '/dashboard/about', icon: Icons.BookOpen },
        { name: 'Footer & Credits', href: '/dashboard/footer', icon: Icons.PanelBottom },
      ]
    },
    {
      label: 'Dynamic Content',
      items: [
        { name: 'Services Grid', href: '/dashboard/services', icon: Icons.Briefcase },
        { name: 'Product Catalog', href: '/dashboard/products', icon: Icons.Package },
        { name: 'Image Gallery', href: '/dashboard/gallery', icon: Icons.Image },
        { name: 'Success Stories', href: '/dashboard/testimonials', icon: Icons.MessageSquare },
        // WOZ FIX: Added the new CMS modules to the navigation
        { name: 'News & Updates', href: '/dashboard/announcements', icon: Icons.Megaphone },
        { name: 'Knowledge Base', href: '/dashboard/faqs', icon: Icons.HelpCircle },
      ]
    }
  ];

  const revenueItems: NavItem[] = [];
  
  if (enableAppointments) {
    revenueItems.push({ name: 'Appointment Calendar', href: '/dashboard/booking', icon: Icons.CalendarCheck, isHighlight: true });
  }
  
  if (enableEnrollments) {
    revenueItems.push({ name: 'Class Curriculum', href: '/dashboard/classes', icon: Icons.GraduationCap, isHighlight: false });
    revenueItems.push({ name: 'Class Calendar', href: '/dashboard/class-schedule', icon: Icons.CalendarDays, isHighlight: true });
  }

  if (revenueItems.length > 0) {
    NAV_GROUPS.push({
      label: 'Revenue Engines',
      items: revenueItems
    });
  }

  NAV_GROUPS.push({
    label: 'Settings & Scale',
    items: [
      { name: 'Contact Details', href: '/dashboard/contact', icon: Icons.Phone },
      { name: 'Webhooks & n8n', href: '/dashboard/integrations', icon: Icons.Workflow },
    ]
  });

  return (
    <>
      <div className="lg:hidden flex items-center justify-between bg-zinc-950 text-white p-4 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-2 font-display font-bold tracking-widest uppercase text-sm">
          <Icons.ShieldCheck className="text-emerald-500" size={18} /> Admin
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="text-zinc-400 hover:text-white transition-colors">
          {isOpen ? <Icons.X size={24} /> : <Icons.Menu size={24} />}
        </button>
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed lg:sticky top-0 h-screen inset-y-0 left-0 z-50 w-64 bg-zinc-950 border-r border-zinc-800 transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        
        <div className="hidden lg:flex h-16 items-center px-6 border-b border-zinc-800/50 flex-shrink-0">
          <div className="flex items-center gap-2 font-display font-bold tracking-widest uppercase text-sm text-white">
            <Icons.ShieldCheck className="text-emerald-500" size={18} /> Command Center
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-6 custom-scrollbar">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <h3 className="px-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                {group.label}
              </h3>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                  const Icon = item.icon;

                  let baseClasses = 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ';
                  if (isActive) {
                    if (item.isHighlight && item.name.includes('Appointment')) {
                      baseClasses += 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                    } else if (item.isHighlight && item.name.includes('Class')) {
                      baseClasses += 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
                    } else {
                      baseClasses += 'bg-zinc-800/80 text-white border border-transparent';
                    }
                  } else {
                    baseClasses += 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100 border border-transparent';
                  }

                  return (
                    <li key={item.name}>
                      <Link 
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={baseClasses}
                      >
                        <Icon size={18} className={isActive ? (item.isHighlight && item.name.includes('Appointment') ? 'text-emerald-400' : item.isHighlight && item.name.includes('Class') ? 'text-indigo-400' : 'text-white') : 'opacity-60 group-hover:opacity-100 transition-opacity'} />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800/50 flex-shrink-0 flex flex-col gap-2">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-xs">
              AD
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-zinc-200 truncate">Admin User</p>
              <p className="text-[10px] text-zinc-500 truncate">Session Secured</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}