"use client";

import React from 'react';
import * as Icons from 'lucide-react';
import { LeadType } from './types';

// FILE: src/components/admin/leads/LeadStatusBadge.tsx

export function LeadTypeBadge({ type }: { type: LeadType }) {
  if (type === 'appointment') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
        <Icons.CalendarCheck size={13} className="text-emerald-600" />
        Appointment
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
      <Icons.GraduationCap size={13} className="text-indigo-600" />
      Enrollment
    </span>
  );
}

export function LeadStatusBadge({ status }: { status: string }) {
  const normalized = (status || '').toLowerCase();

  if (normalized === 'confirmed' || normalized === 'paid' || normalized === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100/70 text-emerald-800">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
        {status}
      </span>
    );
  }

  if (normalized === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100/70 text-amber-800">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
        Pending
      </span>
    );
  }

  if (normalized === 'registered' || normalized === 'attended') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100/70 text-blue-800">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
        {status}
      </span>
    );
  }

  if (normalized === 'cancelled') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600 line-through">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
        Cancelled
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700">
      {status}
    </span>
  );
}
