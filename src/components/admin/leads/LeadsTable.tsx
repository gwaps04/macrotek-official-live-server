// FILE: src/components/admin/leads/LeadsTable.tsx
"use client";

import React from 'react';
import * as Icons from 'lucide-react';
import { UnifiedLead } from './types';
import { LeadTypeBadge, LeadStatusBadge } from './LeadStatusBadge';

interface LeadsTableProps {
  leads: UnifiedLead[];
  onViewLead: (lead: UnifiedLead) => void;
}

export default function LeadsTable({ leads, onViewLead }: LeadsTableProps) {
  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border border-zinc-200 border-dashed">
        <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mb-4 text-zinc-400">
          <Icons.Inbox size={28} />
        </div>
        <h3 className="text-sm font-bold text-zinc-900 mb-1">No leads found</h3>
        <p className="text-xs text-zinc-500 text-center max-w-sm">
          There are currently no appointments or enrollments matching your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-4 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Client / Student</th>
              <th className="px-6 py-4 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Contact Info</th>
              <th className="px-6 py-4 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Schedule</th>
              <th className="px-6 py-4 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-[11px] font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-zinc-50/80 transition-colors group">
                
                {/* Client / Student Column */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                      {lead.firstName.charAt(0)}{lead.lastName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900">{lead.fullName}</p>
                      <div className="mt-1">
                        <LeadTypeBadge type={lead.type} />
                      </div>
                    </div>
                  </div>
                </td>
                
                {/* Contact Info Column */}
                <td className="px-6 py-4">
                  <div className="text-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-zinc-600">
                      <Icons.Mail size={13} className="text-zinc-400" /> 
                      <span className="truncate max-w-[150px]">{lead.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-600">
                      <Icons.Phone size={13} className="text-zinc-400" /> 
                      {lead.phone}
                    </div>
                  </div>
                </td>

                {/* Schedule Column */}
                <td className="px-6 py-4">
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-zinc-800 truncate max-w-[180px]">{lead.title}</p>
                    <div className="flex items-center gap-1.5 text-zinc-500 font-medium">
                      <Icons.Calendar size={13} className="text-zinc-400" /> 
                      {lead.date} &bull; {lead.time}
                    </div>
                  </div>
                </td>

                {/* Status Column */}
                <td className="px-6 py-4">
                  <div className="space-y-1.5">
                    <LeadStatusBadge status={lead.status} />
                    
                    {/* Explicitly show enrollment payment status if applicable */}
                    {lead.type === 'enrollment' && (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                        <span className={`px-2 py-0.5 rounded-md ${
                          lead.paymentStatus === 'Paid' 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {lead.paymentStatus === 'Paid' ? 'Paid' : 'Pending Payment'}
                        </span>
                      </div>
                    )}
                  </div>
                </td>

                {/* Actions Column */}
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onViewLead(lead)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm cursor-pointer"
                  >
                    <Icons.Eye size={14} /> View Dossier
                  </button>
                </td>
                
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}