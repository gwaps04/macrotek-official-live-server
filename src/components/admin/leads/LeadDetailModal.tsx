"use client";

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import { UnifiedLead } from './types';
import { LeadTypeBadge, LeadStatusBadge } from './LeadStatusBadge';
import { 
  updateLeadStatusAction, 
  updateEnrollmentPaymentAction, 
  deleteLeadAction, 
  resendLeadWebhookAction 
} from '@/app/(admin)/dashboard/leads/leads.actions';

// FILE: src/components/admin/leads/LeadDetailModal.tsx

interface LeadDetailModalProps {
  lead: UnifiedLead | null;
  onClose: () => void;
  onRefresh: () => void;
}

export default function LeadDetailModal({ lead, onClose, onRefresh }: LeadDetailModalProps) {
  const [isPending, startTransition] = useTransition();
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [webhookFeedback, setWebhookFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  if (!lead) return null;

  const handleCopyClickUp = () => {
    const text = [
      `Lead: ${lead.fullName} - ${lead.phone}`,
      '',
      `👤 CLIENT LEAD DETAILS:`,
      `• Full Name: ${lead.fullName}`,
      `• First Name: ${lead.firstName}`,
      `• Last Name: ${lead.lastName}`,
      `• Email: ${lead.email}`,
      `• Mobile No: ${lead.phone}`,
      `• Address: ${lead.address || 'N/A'}`,
      '',
      `📅 INBOUND DETAILS:`,
      `• Type: ${lead.type === 'appointment' ? '1-on-1 Consultation' : 'Class Enrollment'}`,
      `• Title: ${lead.title}`,
      `• Date: ${lead.date}`,
      `• Time: ${lead.time}`,
      lead.price !== undefined ? `• Price: ₱${lead.price}` : '',
      `• Notes: ${lead.notes || 'None'}`,
      '',
      lead.prequalificationAnswers && Object.keys(lead.prequalificationAnswers).length > 0
        ? `📋 PRE-QUALIFICATION ANSWERS:\n` + Object.entries(lead.prequalificationAnswers)
            .map(([q, a]) => `❓ ${q}\n   ✅ ${Array.isArray(a) ? a.join(', ') : a}`)
            .join('\n\n')
        : ''
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(text);
    setCopyFeedback('Copied CRM / ClickUp dossier to clipboard!');
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  const contractPath = `/contract/${lead.id}?type=${lead.type}`;
  const contractUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${contractPath}` 
    : contractPath;

  const handleCopyContractLink = () => {
    navigator.clipboard.writeText(contractUrl);
    setCopyFeedback('Copied contract & e-sign link to clipboard!');
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  const handleCopyInviteMessage = () => {
    const msg = `Hi ${lead.firstName}, please review and electronically sign our Standard Service Agreement with Macrotek Digital Solutions here: ${contractUrl}`;
    navigator.clipboard.writeText(msg);
    setCopyFeedback('Copied client invite message to clipboard!');
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  const handleResendWebhook = () => {
    setWebhookFeedback(null);
    startTransition(async () => {
      const res = await resendLeadWebhookAction(lead.id, lead.type);
      if (res.success) {
        setWebhookFeedback({ success: true, msg: 'Webhook dispatched successfully to n8n / ClickUp!' });
      } else {
        setWebhookFeedback({ success: false, msg: res.reason || 'Failed to dispatch webhook' });
      }
      setTimeout(() => setWebhookFeedback(null), 4000);
    });
  };

  const handleStatusChange = (newStatus: string) => {
    startTransition(async () => {
      await updateLeadStatusAction(lead.id, lead.type, newStatus);
      onRefresh();
    });
  };

  const handlePaymentChange = (newPayment: 'Paid' | 'Pending') => {
    startTransition(async () => {
      await updateEnrollmentPaymentAction(lead.id, newPayment);
      onRefresh();
    });
  };

  const handleDelete = () => {
    if (!window.confirm(`Are you sure you want to delete the lead for ${lead.fullName}?`)) return;
    startTransition(async () => {
      await deleteLeadAction(lead.id, lead.type);
      onClose();
      onRefresh();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-zinc-200 flex flex-col overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-zinc-50 border-b border-zinc-200 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-zinc-900 text-white flex items-center justify-center text-lg font-bold tracking-tight">
              {lead.firstName.charAt(0)}{lead.lastName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-zinc-950">{lead.fullName}</h3>
                <LeadTypeBadge type={lead.type} />
                <LeadStatusBadge status={lead.status} />
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Captured {new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-zinc-200/80 hover:bg-zinc-300 text-zinc-600 flex items-center justify-center transition-colors"
          >
            <Icons.X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-sm text-zinc-800">
          
          {/* Quick Contact & Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Link
              href={contractPath}
              target="_blank"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              <Icons.FileCheck size={14} />
              Contract &amp; e-Sign
            </Link>
            <button
              onClick={handleCopyContractLink}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-semibold transition-colors"
            >
              <Icons.Share2 size={14} className="text-zinc-600" />
              Copy Contract Link
            </button>
            <a 
              href={`mailto:${lead.email}`}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-semibold transition-colors"
            >
              <Icons.Mail size={14} className="text-zinc-600" />
              Email Customer
            </a>
            <a 
              href={`tel:${lead.phone.replace(/\s+/g, '')}`}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-semibold transition-colors"
            >
              <Icons.Phone size={14} className="text-zinc-600" />
              Call / WhatsApp
            </a>
            <button 
              onClick={handleCopyClickUp}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-semibold transition-colors"
            >
              <Icons.Copy size={14} />
              Copy for ClickUp / CRM
            </button>
            <button 
              onClick={handleResendWebhook}
              disabled={isPending}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200/80 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Icons.Send size={14} />
              {isPending ? 'Sending...' : 'Trigger Webhook'}
            </button>
          </div>

          {copyFeedback && (
            <div className="p-3 bg-emerald-100/70 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
              <Icons.CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              {copyFeedback}
            </div>
          )}

          {webhookFeedback && (
            <div className={`p-3 border rounded-xl text-xs font-medium flex items-center gap-2 ${webhookFeedback.success ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              <Icons.Info size={16} className="shrink-0" />
              {webhookFeedback.msg}
            </div>
          )}

          {/* Dossier Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Contact Details Card */}
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
                <Icons.UserCheck size={14} /> Contact Details
              </h4>
              <div>
                <span className="text-[11px] text-zinc-500 block">Email Address</span>
                <span className="font-semibold text-zinc-900 select-all">{lead.email}</span>
              </div>
              <div>
                <span className="text-[11px] text-zinc-500 block">Phone / Mobile</span>
                <span className="font-semibold text-zinc-900 select-all">{lead.phone}</span>
              </div>
              <div>
                <span className="text-[11px] text-zinc-500 block">Physical Address</span>
                <span className="font-medium text-zinc-800">{lead.address || 'Not provided'}</span>
              </div>
            </div>

            {/* Inbound Schedule Card */}
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
                <Icons.CalendarDays size={14} /> Schedule & Service
              </h4>
              <div>
                <span className="text-[11px] text-zinc-500 block">Item / Topic</span>
                <span className="font-semibold text-zinc-900">{lead.title}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] text-zinc-500 block">Date</span>
                  <span className="font-medium text-zinc-900">{lead.date}</span>
                </div>
                <div>
                  <span className="text-[11px] text-zinc-500 block">Time</span>
                  <span className="font-medium text-zinc-900">{lead.time}</span>
                </div>
              </div>
              {lead.price !== undefined && (
                <div>
                  <span className="text-[11px] text-zinc-500 block">Enrollment Fee</span>
                  <span className="font-bold text-zinc-950">
                    {lead.price === 0 ? 'FREE' : `₱${lead.price.toLocaleString()}`}
                  </span>
                </div>
              )}
            </div>

          </div>

          {/* Notes Card */}
          {lead.notes && (
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1 flex items-center gap-1.5">
                <Icons.FileText size={14} /> Customer Notes & Objective
              </h4>
              <p className="text-zinc-700 font-medium whitespace-pre-wrap">{lead.notes}</p>
            </div>
          )}

          {/* Pre-qualification Questionnaire Answers */}
          {lead.prequalificationAnswers && Object.keys(lead.prequalificationAnswers).length > 0 && (
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Icons.HelpCircle size={14} /> Pre-qualification Responses
              </h4>
              <div className="space-y-3">
                {Object.entries(lead.prequalificationAnswers).map(([q, ans], idx) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-emerald-100">
                    <p className="text-xs font-bold text-zinc-800">Q: {q}</p>
                    <p className="text-xs text-emerald-900 mt-1 font-medium bg-emerald-50/80 p-2 rounded-lg">
                      {Array.isArray(ans) ? ans.join(', ') : String(ans)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Standard Service Agreement Card */}
          <div className="p-4 bg-gradient-to-br from-zinc-900 to-zinc-950 text-white rounded-2xl border border-zinc-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Icons.FileText size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Standard Service Agreement
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Online e-sign contract with client information pre-filled.
                  </p>
                </div>
              </div>

              <Link
                href={contractPath}
                target="_blank"
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
              >
                <span>Open Contract</span>
                <Icons.ExternalLink size={12} />
              </Link>
            </div>

            {/* Ready-to-Send Client Message */}
            <div className="bg-zinc-800/80 p-3 rounded-xl border border-zinc-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-zinc-300">Shareable Invite Message:</span>
                <button
                  onClick={handleCopyInviteMessage}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  <Icons.Copy size={12} />
                  Copy Message
                </button>
              </div>
              <p className="text-xs text-zinc-300 font-mono bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-800 select-all leading-relaxed">
                Hi {lead.firstName}, please review and electronically sign our Standard Service Agreement with Macrotek Digital Solutions here: {contractUrl}
              </p>
            </div>
          </div>

          {/* Status & Pipeline Control */}
          <div className="p-4 bg-zinc-900 text-white rounded-2xl space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Pipeline Status Control
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Lead Status</label>
                <select 
                  value={lead.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={isPending}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Pending">Pending Review</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Registered">Registered</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {lead.type === 'enrollment' && (
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Payment Status</label>
                  <select 
                    value={lead.paymentStatus || 'Pending'}
                    onChange={(e) => handlePaymentChange(e.target.value as 'Paid' | 'Pending')}
                    disabled={isPending}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Pending">Payment Pending</option>
                    <option value="Paid">Mark as Paid</option>
                  </select>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
          <button 
            onClick={handleDelete}
            disabled={isPending}
            className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Icons.Trash2 size={14} />
            Delete Record
          </button>
          
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
