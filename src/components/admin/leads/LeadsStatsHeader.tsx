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
  const signedContracts = leads.filter(l => l.contractStatus === 'Signed').length;
  const appointmentCount = leads.filter(l => l.type === 'appointment').length;
  const enrollmentCount = leads.filter(l => l.type === 'enrollment').length;

  const STATS = [
    {
      label: 'Total Inbound Leads',
      value: totalLeads,
      subtext: 'Appointments & enrollments',
      icon: Icons.Users,
      color: 'text-zinc-900',
      bgColor: 'bg-zinc-100',
      borderColor: 'border-zinc-200'
    },
    {
      label: 'Signed Agreements',
      value: signedContracts,
      subtext: 'Executed contracts on file',
      icon: Icons.FileCheck2,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    },
    {
      label: 'Consultation Bookings',
      value: appointmentCount,
      subtext: '1-on-1 discovery calls',
      icon: Icons.CalendarCheck,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      label: 'Class Enrollments',
      value: enrollmentCount,
      subtext: 'Enrolled students & cohorts',
      icon: Icons.GraduationCap,
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
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
