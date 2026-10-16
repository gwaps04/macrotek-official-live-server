"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import { UnifiedLead } from './types';
import { LeadTypeBadge, LeadStatusBadge } from './LeadStatusBadge';
import { getDeterministicAccessCode } from '@/lib/contractUtils';

// FILE: src/components/admin/leads/LeadsTable.tsx

interface LeadsTableProps {
  leads: UnifiedLead[];
  onSelectLead: (lead: UnifiedLead) => void;
}

export default function LeadsTable({ leads, onSelectLead }: LeadsTableProps) {
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const handleCopyAccessCode = (e: React.MouseEvent, leadId: string, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCodeId(leadId);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

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
              <th scope="col" className="px-4 py-3.5">Source &amp; Details</th>
              <th scope="col" className="px-4 py-3.5">Scheduled For</th>
              <th scope="col" className="px-4 py-3.5">Lead Status</th>
              <th scope="col" className="px-4 py-3.5">Service Agreement</th>
              <th scope="col" className="px-4 py-3.5">Captured</th>
              <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/80">
            {leads.map((lead) => {
              const dateObj = new Date(lead.createdAt);
              const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

              const isContractSigned = lead.contractStatus === 'Signed';
              const currSymbol = lead.contractCurrency === 'PHP' ? '₱' : '$';
              const accessCode = lead.contractAccessCode || getDeterministicAccessCode(lead.id);

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
                        <div className="font-bold text-zinc-900 text-sm group-hover:text-emerald-700 transition-colors truncate">
                          {lead.fullName}
                        </div>
                        <div className="text-xs text-zinc-500 truncate flex items-center gap-2 mt-0.5">
                          <span>{lead.email}</span>
                          <span>&bull;</span>
                          <span>{lead.phone}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Type & Title */}
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <LeadTypeBadge type={lead.type} />
                      <p className="text-xs font-semibold text-zinc-800 truncate max-w-[180px]">
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

                  {/* Service Agreement & Access Code Status */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    {isContractSigned ? (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          <Icons.CheckCircle2 size={12} className="text-emerald-600" />
                          <span>Signed Contract</span>
                        </span>
                        <div className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
                          {lead.contractSigningMethod === 'manual_hardcopy' || lead.contractAttachmentUrl ? (
                            <React.Fragment>
                              <Icons.Paperclip size={11} className="text-indigo-600" />
                              <span>Hardcopy on file</span>
                            </React.Fragment>
                          ) : (
                            <React.Fragment>
                              <Icons.PenTool size={11} className="text-emerald-600" />
                              <span>e-Signed digitally</span>
                            </React.Fragment>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <button
                          type="button"
                          onClick={(e) => handleCopyAccessCode(e, lead.id, accessCode)}
                          className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-colors border border-zinc-200/80"
                          title="Click to copy access code"
                        >
                          <Icons.KeyRound size={11} className="text-zinc-500" />
                          <span>PIN: {accessCode}</span>
                          {copiedCodeId === lead.id ? (
                            <Icons.Check size={11} className="text-emerald-600 ml-0.5" />
                          ) : (
                            <Icons.Copy size={11} className="text-zinc-400 ml-0.5" />
                          )}
                        </button>
                        <div className="text-[10px] text-zinc-500 font-medium">
                          {currSymbol}{Number(lead.contractCost || 50000).toLocaleString()} &bull; {lead.contractDownpaymentPct ?? 50}% dep.
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Captured timestamp */}
                  <td className="px-4 py-4 whitespace-nowrap text-xs text-zinc-500">
                    <div>{dateStr}</div>
                    <div className="text-[10px] text-zinc-400">{timeStr}</div>
                  </td>

                  {/* Action button */}
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      
                      {/* Direct Contract Link / PDF button */}
                      <Link
                        href={`/contract/${lead.id}?type=${lead.type}`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 border ${
                          isContractSigned 
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-2xs' 
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200/80'
                        }`}
                        title={isContractSigned ? 'Download / View Signed Contract' : 'Open Contract & E-Sign'}
                      >
                        {isContractSigned ? <Icons.Download size={13} /> : <Icons.FileCheck size={13} />}
                        <span>{isContractSigned ? 'PDF' : 'Contract'}</span>
                      </Link>

                      {/* Lead Dossier */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectLead(lead);
                        }}
                        className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                      >
                        <span>Dossier</span>
                        <Icons.ChevronRight size={13} className="text-zinc-500" />
                      </button>
                    </div>
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
