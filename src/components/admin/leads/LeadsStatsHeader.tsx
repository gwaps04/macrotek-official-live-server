"use client";

import React from 'react';
import * as Icons from 'lucide-react';
import { UnifiedLead } from './types';

// FILE: src/components/admin/leads/LeadsStatsHeader.tsx

interface LeadsStatsHeaderProps {
  leads: UnifiedLead[];
}

export default function LeadsStatsHeader({ leads }: LeadsStatsHeaderProps) {
  const totalLeads = leads.length;
  const appointmentCount = leads.filter(l => l.type === 'appointment').length;
  const enrollmentCount = leads.filter(l => l.type === 'enrollment').length;
  const pendingCount = leads.filter(l => l.status === 'Pending' || l.paymentStatus === 'Pending').length;

  const STATS = [
    {
      label: 'Total Inbound Leads',
      value: totalLeads,
      subtext: 'Combined inquiries & enrollments',
      icon: Icons.Users,
      color: 'text-zinc-900',
      bgColor: 'bg-zinc-100',
      borderColor: 'border-zinc-200'
    },
    {
      label: 'Consultation Bookings',
      value: appointmentCount,
      subtext: '1-on-1 scheduled appointments',
      icon: Icons.CalendarCheck,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    },
    {
      label: 'Class Enrollments',
      value: enrollmentCount,
      subtext: 'Workshop & masterclass students',
      icon: Icons.GraduationCap,
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    },
    {
      label: 'Action Required',
      value: pendingCount,
      subtext: 'Pending status or payment',
      icon: Icons.Clock,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {STATS.map((stat) => {
        const Icon = stat.icon;
        return (
          <div 
            key={stat.label} 
            className="p-5 bg-white rounded-2xl border border-zinc-200 shadow-xs flex flex-col justify-between transition-all hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {stat.label}
              </span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.bgColor} ${stat.color}`}>
                <Icon size={18} />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-extrabold text-zinc-950 tracking-tight">
                {stat.value}
              </p>
              <p className="text-xs text-zinc-500 mt-1 font-medium">
                {stat.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
