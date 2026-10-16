"use client";

import React from 'react';
import * as Icons from 'lucide-react';
import { UnifiedLead } from './types';
import { LeadTypeBadge, LeadStatusBadge } from './LeadStatusBadge';

// FILE: src/components/admin/leads/LeadsTable.tsx

interface LeadsTableProps {
  leads: UnifiedLead[];
  onSelectLead: (lead: UnifiedLead) => void;
}

export default function LeadsTable({ leads, onSelectLead }: LeadsTableProps) {
  if (leads.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center flex flex-col items-center justify-center">
        <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400 mb-4">
          <Icons.Inbox size={28} />
        </div>
        <h3 className="text-base font-bold text-zinc-900">No leads match your criteria</h3>
        <p className="text-xs text-zinc-500 max-w-sm mt-1">
          Adjust your filters, search terms, or test a booking/enrollment from the live storefront.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-zinc-600">
          <thead className="bg-zinc-50 border-b border-zinc-200 text-[11px] uppercase font-bold text-zinc-500 tracking-wider">
            <tr>
              <th scope="col" className="px-5 py-3.5">Customer / Lead</th>
              <th scope="col" className="px-4 py-3.5">Source & Details</th>
              <th scope="col" className="px-4 py-3.5">Scheduled For</th>
              <th scope="col" className="px-4 py-3.5">Status</th>
              <th scope="col" className="px-4 py-3.5">Captured</th>
              <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/80">
            {leads.map((lead) => {
              const dateObj = new Date(lead.createdAt);
              const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

              return (
                <tr 
                  key={`${lead.type}-${lead.id}`}
                  onClick={() => onSelectLead(lead)}
                  className="hover:bg-zinc-50/80 transition-colors cursor-pointer group"
                >
                  {/* Customer Info */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {lead.firstName.charAt(0)}{lead.lastName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-zinc-900 text-sm group-hover:text-blue-600 transition-colors truncate">
                          {lead.fullName}
                        </div>
                        <div className="text-xs text-zinc-500 truncate flex items-center gap-2 mt-0.5">
                          <span>{lead.email}</span>
                          <span>•</span>
                          <span>{lead.phone}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Type & Title */}
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <LeadTypeBadge type={lead.type} />
                      <p className="text-xs font-semibold text-zinc-800 truncate max-w-[200px]">
                        {lead.title}
                      </p>
                    </div>
                  </td>

                  {/* Schedule Date & Time */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-xs font-medium text-zinc-900">
                      {lead.date}
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                      {lead.time}
                    </div>
                  </td>

                  {/* Status Badges */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex flex-col items-start gap-1">
                      <LeadStatusBadge status={lead.status} />
                      {lead.type === 'enrollment' && lead.paymentStatus && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${lead.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {lead.paymentStatus === 'Paid' ? 'Paid' : 'Payment Pending'}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Captured timestamp */}
                  <td className="px-4 py-4 whitespace-nowrap text-xs text-zinc-500">
                    <div>{dateStr}</div>
                    <div className="text-[10px] text-zinc-400">{timeStr}</div>
                  </td>

                  {/* Action button */}
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectLead(lead);
                      }}
                      className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>Dossier</span>
                      <Icons.ChevronRight size={13} className="text-zinc-500" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
