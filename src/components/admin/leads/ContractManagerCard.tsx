"use client";

import React, { useState, useTransition, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { UnifiedLead } from './types';
import { 
  updateContractFinancialsAction, 
  updateContractStatusAndAttachmentAction,
  regenerateAccessCodeAction,
  toggleContractEsignAction
} from '@/app/contract/contract.actions';
import { getDeterministicAccessCode } from '@/lib/contractUtils';

// FILE: src/components/admin/leads/ContractManagerCard.tsx

interface ContractManagerCardProps {
  lead: UnifiedLead;
  onRefresh: () => void;
  onUpdateLead?: (updates: Partial<UnifiedLead>) => void;
}

export default function ContractManagerCard({ lead, onRefresh, onUpdateLead }: ContractManagerCardProps) {
  const [isPending, startTransition] = useTransition();

  // Financial State - strictly empty by default if unset in dossier
  const [projectCost, setProjectCost] = useState<string>(
    lead.contractCost !== undefined && lead.contractCost !== null ? String(lead.contractCost) : ''
  );
  const [downpaymentPct, setDownpaymentPct] = useState<string>(
    lead.contractDownpaymentPct !== undefined && lead.contractDownpaymentPct !== null ? String(lead.contractDownpaymentPct) : ''
  );
  const [currency, setCurrency] = useState<string>(lead.contractCurrency || '');
  const [companyName, setCompanyName] = useState<string>(lead.companyName || '');
  const [clientAddress, setClientAddress] = useState<string>(lead.address || '');
  const [esignEnabled, setEsignEnabled] = useState<boolean>(lead.contractEsignEnabled !== false);

  // Contract Content Customization State (Requirement 1: Admin can edit contract contents)
  const [contractTitle, setContractTitle] = useState<string>(
    lead.contractTitle || 'Master Service Agreement'
  );
  const [scopeDescription, setScopeDescription] = useState<string>(
    lead.contractScope || ''
  );
  const [customTerms, setCustomTerms] = useState<string>(
    lead.contractCustomTerms || ''
  );
  const [paymentTermsNotes, setPaymentTermsNotes] = useState<string>(
    lead.paymentTermsNotes || ''
  );

  // Access Code State
  const [accessCode, setAccessCode] = useState<string>(
    lead.contractAccessCode || getDeterministicAccessCode(lead.id)
  );

  // Status & Attachment State
  const [contractStatus, setContractStatus] = useState<'Draft' | 'Sent' | 'Signed'>(
    (lead.contractStatus as any) || 'Draft'
  );
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(lead.contractAttachmentUrl || null);
  const [attachmentName, setAttachmentName] = useState<string | null>(lead.contractAttachmentName || null);
  const [attachmentType, setAttachmentType] = useState<string>('pdf');
  const [fileNamePreview, setFileNamePreview] = useState<string | null>(null);

  // UI Feedback & Active Tab
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copyCodeFeedback, setCopyCodeFeedback] = useState(false);
  const [copyLinkFeedback, setCopyLinkFeedback] = useState(false);
  const [copyInviteFeedback, setCopyInviteFeedback] = useState(false);
  const [activeTab, setActiveTab] = useState<'terms' | 'contents' | 'status'>('terms');

  // Synchronize state whenever lead prop changes
  useEffect(() => {
    const code = lead.contractAccessCode || getDeterministicAccessCode(lead.id);
    setAccessCode(code);
    setProjectCost(lead.contractCost !== undefined && lead.contractCost !== null ? String(lead.contractCost) : '');
    setDownpaymentPct(lead.contractDownpaymentPct !== undefined && lead.contractDownpaymentPct !== null ? String(lead.contractDownpaymentPct) : '');
    setCurrency(lead.contractCurrency || '');
    setCompanyName(lead.companyName || '');
    setClientAddress(lead.address || '');
    setEsignEnabled(lead.contractEsignEnabled !== false);
    setContractTitle(lead.contractTitle || 'Master Service Agreement');
    setScopeDescription(lead.contractScope || '');
    setCustomTerms(lead.contractCustomTerms || '');
    setPaymentTermsNotes(lead.paymentTermsNotes || '');
    setContractStatus((lead.contractStatus as any) || 'Draft');
    setAttachmentUrl(lead.contractAttachmentUrl || null);
    setAttachmentName(lead.contractAttachmentName || null);
  }, [
    lead.id, 
    lead.contractAccessCode, 
    lead.contractCost, 
    lead.contractDownpaymentPct, 
    lead.contractCurrency, 
    lead.companyName, 
    lead.address, 
    lead.contractEsignEnabled,
    lead.contractTitle,
    lead.contractScope,
    lead.contractCustomTerms,
    lead.paymentTermsNotes,
    lead.contractStatus, 
    lead.contractAttachmentUrl, 
    lead.contractAttachmentName
  ]);

  // Derived financial math (safely handling empty state)
  const numericCost = projectCost.trim() !== '' && !isNaN(Number(projectCost)) ? Number(projectCost) : null;
  const numericDownpaymentPct = downpaymentPct.trim() !== '' && !isNaN(Number(downpaymentPct)) ? Number(downpaymentPct) : null;
  
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : (currency === 'PHP' ? '₱' : (currency ? `${currency} ` : '₱'));
  const effectiveCurrencyCode = currency || 'PHP';

  const downpaymentAmount = numericCost !== null && numericDownpaymentPct !== null 
    ? numericCost * (numericDownpaymentPct / 100) 
    : 0;
  const balanceAmount = numericCost !== null 
    ? Math.max(0, numericCost - (numericDownpaymentPct !== null ? downpaymentAmount : 0)) 
    : 0;

  // Confidential Client URL (Requires 6-Digit PIN to unlock)
  const clientContractPath = `/contract/${lead.id}?type=${lead.type}`;
  const clientContractUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${clientContractPath}`
    : clientContractPath;

  // Admin Direct View URL (Bypasses PIN prompt for authorized administrator)
  const adminContractPath = `/contract/${lead.id}?type=${lead.type}&admin=true`;
  const contractPath = adminContractPath;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(accessCode);
    setCopyCodeFeedback(true);
    setTimeout(() => setCopyCodeFeedback(false), 2000);
  };

  const handleCopyClientLink = () => {
    navigator.clipboard.writeText(clientContractUrl);
    setCopyLinkFeedback(true);
    setTimeout(() => setCopyLinkFeedback(false), 2000);
  };

  const handleCopyInviteMessage = () => {
    const msg = `Hi ${lead.firstName}, please review and electronically sign our ${contractTitle} with Macrotek Digital Solutions here:\n\n${clientContractUrl}\n\nConfidential Access PIN: ${accessCode}\n(Please enter this 6-digit PIN to securely unlock and review your agreement)`;
    navigator.clipboard.writeText(msg);
    setCopyInviteFeedback(true);
    setTimeout(() => setCopyInviteFeedback(false), 2500);
  };

  const handleRegenerateCode = () => {
    startTransition(async () => {
      const res = await regenerateAccessCodeAction(lead.contractId || lead.id, lead.id);
      if (res.success && res.newCode) {
        setAccessCode(res.newCode);
        setFeedback({ type: 'success', message: `Generated new access code: ${res.newCode}` });
        onUpdateLead?.({ contractAccessCode: res.newCode });
        onRefresh();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to regenerate code' });
      }
      setTimeout(() => setFeedback(null), 3500);
    });
  };

  // Requirement 3: Ensure changes made in the dossier immediately take effect when contract is loaded or refreshed
  const handleSaveContractAndFinancials = () => {
    setFeedback(null);
    startTransition(async () => {
      const parsedCost = numericCost;
      const parsedDownpayment = numericDownpaymentPct;
      const parsedCurrency = currency.trim();
      const parsedTitle = contractTitle.trim() || 'Master Service Agreement';
      const parsedScope = scopeDescription.trim();
      const parsedCustomTerms = customTerms.trim();
      const parsedPaymentNotes = paymentTermsNotes.trim();

      const res = await updateContractFinancialsAction({
        contractId: lead.contractId || lead.id,
        leadId: lead.id,
        leadType: lead.type,
        projectCost: parsedCost,
        downpaymentPercentage: parsedDownpayment,
        currency: parsedCurrency,
        companyName: companyName.trim(),
        clientAddress: clientAddress.trim(),
        contractTitle: parsedTitle,
        scopeDescription: parsedScope,
        customTerms: parsedCustomTerms,
        paymentTermsNotes: parsedPaymentNotes,
        esignEnabled
      });

      if (res.success) {
        // Immediate local state update for zero-latency UI consistency
        onUpdateLead?.({
          contractCost: parsedCost,
          contractDownpaymentPct: parsedDownpayment,
          contractCurrency: parsedCurrency,
          companyName: companyName.trim(),
          address: clientAddress.trim(),
          contractTitle: parsedTitle,
          contractScope: parsedScope,
          contractCustomTerms: parsedCustomTerms,
          paymentTermsNotes: parsedPaymentNotes,
          contractEsignEnabled: esignEnabled
        });

        // Trigger parent and server component data revalidation
        onRefresh();

        setFeedback({ 
          type: 'success', 
          message: 'Contract terms and contents saved! Changes have taken effect and the live agreement format has auto-adjusted.' 
        });
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to update contract terms' });
      }
      setTimeout(() => setFeedback(null), 4000);
    });
  };

  const handleToggleEsign = (newVal: boolean) => {
    setEsignEnabled(newVal);
    setFeedback(null);
    startTransition(async () => {
      const res = await toggleContractEsignAction(lead.id, newVal);
      if (res.success) {
        onUpdateLead?.({ contractEsignEnabled: newVal });
        setFeedback({ 
          type: 'success', 
          message: newVal 
            ? 'Electronic Signature (e-Sign) ENABLED for this contract.' 
            : 'Electronic Signature DISABLED. Contract configured for Face-to-Face physical signing.' 
        });
        onRefresh();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to update e-sign setting' });
      }
      setTimeout(() => setFeedback(null), 3500);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 6 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'File is too large. Please upload an image or PDF under 6MB.' });
      return;
    }

    setFileNamePreview(file.name);
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    setAttachmentType(isPdf ? 'pdf' : 'image');

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAttachmentUrl(result);
      setAttachmentName(file.name);
      setContractStatus('Signed');
      setFeedback({ type: 'success', message: `Attached "${file.name}". Click "Save Status & Attachment" to apply.` });
    };
    reader.onerror = () => {
      setFeedback({ type: 'error', message: 'Failed to read attachment file.' });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveStatusAndAttachment = () => {
    setFeedback(null);
    startTransition(async () => {
      const res = await updateContractStatusAndAttachmentAction({
        contractId: lead.contractId || lead.id,
        leadId: lead.id,
        status: contractStatus,
        attachmentUrl: attachmentUrl || undefined,
        attachmentName: attachmentName || undefined,
        attachmentType,
        signingMethod: attachmentUrl ? 'manual_hardcopy' : (lead.contractSigningMethod || 'electronic'),
        signedByName: lead.fullName
      });

      if (res.success) {
        onUpdateLead?.({
          contractStatus: contractStatus,
          contractAttachmentUrl: attachmentUrl,
          contractAttachmentName: attachmentName,
          contractSigningMethod: attachmentUrl ? 'manual_hardcopy' : 'electronic'
        });
        setFeedback({ 
          type: 'success', 
          message: contractStatus === 'Signed' 
            ? 'Contract status marked as SIGNED with attachment!' 
            : `Contract status updated to ${contractStatus}` 
        });
        onRefresh();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to update contract status' });
      }
      setTimeout(() => setFeedback(null), 3500);
    });
  };

  const isSigned = contractStatus === 'Signed' || lead.contractStatus === 'Signed';

  // Content preset helpers
  const applyScopePreset = (type: string) => {
    if (type === 'custom_dev') {
      setScopeDescription('Full-stack web application engineering, scalable PostgreSQL database architecture, custom administrative dashboard with CRM pipeline control, automated n8n webhook triggers, and cloud staging deployment.');
    } else if (type === 'consulting') {
      setScopeDescription('Enterprise technology architecture audit, cloud infrastructure review, system optimization recommendations, security hardening roadmap, and executive advisory sessions.');
    } else if (type === 'retainer') {
      setScopeDescription('Monthly dedicated engineering retainer covering 40 hours of full-stack feature development, database performance tuning, bug mitigation, and 99.9% uptime monitoring.');
    }
  };

  const applyPaymentPreset = (type: string) => {
    if (type === 'milestone_50_50') {
      setPaymentTermsNotes('50% commencement downpayment required upon contract execution via Bank Transfer (BDO / BPI) or GCash; 50% handover balance due immediately upon production staging turnover and administrative credentials sign-off.');
    } else if (type === 'three_stages') {
      setPaymentTermsNotes('40% initialization downpayment upon agreement signing; 30% milestone payment upon sprint delivery of core features; 30% final balance upon final staging deployment.');
    }
  };

  return (
    <div className="bg-zinc-900 text-white rounded-3xl border border-zinc-800 p-5 space-y-5">
      
      {/* Header with Title & Direct Open Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Icons.FileCheck2 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Service Agreement &amp; Contract Form
              </h4>
              {isSigned ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] flex items-center gap-1">
                  <Icons.CheckCircle2 size={11} />
                  {lead.contractSigningMethod === 'manual_hardcopy' || attachmentUrl ? 'Signed (Hardcopy)' : 'Signed (e-Sign)'}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] flex items-center gap-1">
                  <Icons.Clock size={11} />
                  {contractStatus === 'Sent' ? 'Sent to Client' : 'Draft Prepared'}
                </span>
              )}
              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1 border ${
                esignEnabled 
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}>
                {esignEnabled ? <Icons.FileSignature size={10} /> : <Icons.Users size={10} />}
                {esignEnabled ? 'e-Sign Active' : 'Face-to-Face Only'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Customize contract title, scope clauses, pricing terms, e-sign permissions, and client access code.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={adminContractPath}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs bg-zinc-800 hover:bg-zinc-700 text-white cursor-pointer"
            title="Direct admin view (authenticated bypass)"
          >
            <Icons.ExternalLink size={13} />
            <span>Admin View</span>
          </a>
          <a
            href={clientContractPath}
            target="_blank"
            rel="noopener noreferrer"
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer ${
              isSigned
                ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
            title="Test client view with PIN gate"
          >
            <Icons.ShieldCheck size={13} />
            <span>Test Client PIN Gate</span>
          </a>
        </div>
      </div>

      {/* Access Code Generation Bar */}
      <div className="bg-zinc-950/80 p-3.5 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-400 flex items-center justify-center shrink-0">
            <Icons.KeyRound size={16} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Client Access Code (Confidential PIN)</span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-mono font-black text-emerald-400 tracking-wider">
                {accessCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-semibold rounded-md transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copyCodeFeedback ? (
                  <React.Fragment>
                    <Icons.Check size={11} className="text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <Icons.Copy size={11} />
                    <span>Copy PIN</span>
                  </React.Fragment>
                )}
              </button>
              <button
                type="button"
                onClick={handleCopyClientLink}
                className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-semibold rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                title="Copy client URL"
              >
                {copyLinkFeedback ? (
                  <React.Fragment>
                    <Icons.Check size={11} className="text-emerald-400" />
                    <span className="text-emerald-400">Link Copied!</span>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <Icons.Link size={11} />
                    <span>Copy Client Link</span>
                  </React.Fragment>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRegenerateCode}
            disabled={isPending}
            className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            title="Generate a new 6-digit access code"
          >
            <Icons.RefreshCw size={12} className={isPending ? 'animate-spin' : ''} />
            <span>Regenerate PIN</span>
          </button>
        </div>
      </div>

      {/* Shareable Invite Message Box */}
      <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5">
            <Icons.Send size={12} className="text-emerald-500" />
            Client Invitation &amp; Confidential PIN Message:
          </span>
          <button
            type="button"
            onClick={handleCopyInviteMessage}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            {copyInviteFeedback ? (
              <React.Fragment>
                <Icons.Check size={12} className="text-emerald-400" />
                <span>Message Copied!</span>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <Icons.Copy size={12} />
                <span>Copy Full Message</span>
              </React.Fragment>
            )}
          </button>
        </div>
        <p className="text-xs text-zinc-300 font-mono bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 select-all leading-relaxed break-all">
          Hi {lead.firstName}, please review and electronically sign our {contractTitle} with Macrotek Digital Solutions here: {clientContractUrl} | Confidential PIN: {accessCode}
        </p>
      </div>

      {/* Prominent Executed Agreement & Signature Stroke Card */}
      {isSigned && (
        <div className="p-4 sm:p-5 bg-emerald-950/40 rounded-2xl border-2 border-emerald-500/50 space-y-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-zinc-950 flex items-center justify-center shrink-0 shadow-md">
                <Icons.ShieldCheck size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-400 text-zinc-950">
                    {lead.contractSigningMethod === 'manual_hardcopy' || attachmentUrl ? 'Hardcopy Executed' : 'Digital e-Sign Verified'}
                  </span>
                  <span className="text-sm font-bold text-white">
                    Agreement Successfully Executed
                  </span>
                </div>
                <p className="text-xs text-zinc-300 mt-1">
                  Signed by <strong className="text-white">{lead.contractSignedBy || lead.fullName}</strong>
                  {lead.contractSignedByTitle ? ` (${lead.contractSignedByTitle})` : ''}
                  {lead.contractSignedAt ? ` on ${new Date(lead.contractSignedAt).toLocaleString()}` : ''}.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={contractPath}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <Icons.ExternalLink size={13} />
                <span>Open Full Agreement &amp; PDF</span>
              </a>
            </div>
          </div>

          {/* Electronic Signature Stroke Box */}
          {lead.contractSigningMethod !== 'manual_hardcopy' && !attachmentUrl && (
            <div className="p-3.5 bg-zinc-950/90 rounded-xl border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Icons.PenLine size={13} className="text-emerald-400" />
                  Client Signature on File:
                </span>
                <span className="font-mono text-[10px] text-emerald-400/90 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                  Audit Verified
                </span>
              </div>
              <div className="h-20 bg-white rounded-lg border border-zinc-200 flex items-center justify-center p-2 relative overflow-hidden">
                {lead.contractSignatureData ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={lead.contractSignatureData}
                    alt="Client Digital Signature"
                    className="max-h-16 w-auto object-contain mx-auto"
                  />
                ) : (
                  <span className="font-serif italic text-2xl text-emerald-950 font-bold">
                    {lead.contractSignedBy || lead.fullName}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Hardcopy Upload File Card */}
          {(attachmentUrl || fileNamePreview) && (
            <div className="p-3 bg-zinc-950/90 rounded-xl border border-indigo-500/40 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Icons.FileText size={18} className="text-indigo-400 shrink-0" />
                <span className="font-medium text-zinc-200 truncate">
                  {fileNamePreview || attachmentName || 'signed_contract_attachment.pdf'}
                </span>
              </div>
              {attachmentUrl && (
                <a
                  href={attachmentUrl}
                  download={attachmentName || 'signed_contract.pdf'}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors flex items-center gap-1"
                >
                  <Icons.Download size={13} />
                  <span>Download</span>
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3-Tier Tabs Switcher */}
      <div className="flex border-b border-zinc-800 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('terms')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'terms'
              ? 'border-emerald-500 text-emerald-400 bg-zinc-800/40 rounded-t-lg'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Icons.DollarSign size={13} />
          <span>Financials &amp; Pricing</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('contents')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'contents'
              ? 'border-emerald-500 text-emerald-400 bg-zinc-800/40 rounded-t-lg'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Icons.FileEdit size={13} />
          <span>Contract Contents &amp; Scope</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('status')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'status'
              ? 'border-emerald-500 text-emerald-400 bg-zinc-800/40 rounded-t-lg'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Icons.Paperclip size={13} />
          <span>Status &amp; Hardcopy Attachment</span>
        </button>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
          feedback.type === 'success'
            ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
            : 'bg-red-950/50 border-red-800 text-red-300'
        }`}>
          {feedback.type === 'success' ? <Icons.CheckCircle2 size={14} /> : <Icons.AlertCircle size={14} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* TAB 1: FINANCIAL TERMS CONFIGURATION */}
      {activeTab === 'terms' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Project Cost (Requirement 2: empty by default if not set in dossier) */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                Project Cost {currency ? `(${currencySymbol.trim()})` : ''}
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={projectCost}
                onChange={(e) => setProjectCost(e.target.value)}
                placeholder="Leave empty if pending..."
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 text-white rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-zinc-600"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                {numericCost !== null ? `Agreed fee: ${currencySymbol}${numericCost.toLocaleString()}` : 'Default is empty (pending agreement)'}
              </span>
            </div>

            {/* Downpayment Percentage (Requirement 2: empty by default if not set in dossier) */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                Downpayment %
              </label>
              <select
                value={downpaymentPct}
                onChange={(e) => setDownpaymentPct(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 text-white rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">None / Pending Agreement (Empty)</option>
                <option value="10">10% Upfront</option>
                <option value="20">20% Upfront</option>
                <option value="30">30% Upfront</option>
                <option value="40">40% Upfront</option>
                <option value="50">50% Upfront (Standard)</option>
                <option value="60">60% Upfront</option>
                <option value="70">70% Upfront</option>
                <option value="100">100% Full Payment</option>
              </select>
              <span className="text-[10px] text-zinc-500 mt-1 block">
                {numericDownpaymentPct !== null ? `${numericDownpaymentPct}% commencement fee` : 'Unassigned (leaves contract breakdown flexible)'}
              </span>
            </div>

            {/* Currency Selector (Requirement 2: empty by default if not set in dossier) */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                Currency
              </label>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => setCurrency(currency === 'PHP' ? '' : 'PHP')}
                  className={`py-2 px-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    currency === 'PHP'
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-zinc-950 border-zinc-700 text-zinc-400 hover:text-white'
                  }`}
                >
                  PHP (₱)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency(currency === 'USD' ? '' : 'USD')}
                  className={`py-2 px-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    currency === 'USD'
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-zinc-950 border-zinc-700 text-zinc-400 hover:text-white'
                  }`}
                >
                  USD ($)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('')}
                  className={`py-2 px-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    currency === ''
                      ? 'bg-zinc-800 border-zinc-600 text-zinc-200'
                      : 'bg-zinc-950 border-zinc-700 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Empty
                </button>
              </div>
              <span className="text-[10px] text-zinc-500 mt-1 block">
                {currency ? `Active currency: ${currency}` : 'Empty by default'}
              </span>
            </div>

          </div>

          {/* Computed Summary Preview (Dynamically auto-adjusts) */}
          <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-between text-xs">
            {numericCost !== null ? (
              <React.Fragment>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block font-bold">Commencement Downpayment</span>
                  <span className="text-emerald-400 font-bold font-mono text-sm">
                    {numericDownpaymentPct !== null 
                      ? `${currencySymbol}${downpaymentAmount.toLocaleString()} ${effectiveCurrencyCode} (${numericDownpaymentPct}%)` 
                      : 'Not assigned (Pending Schedule)'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 uppercase block font-bold">Handover Balance</span>
                  <span className="text-zinc-300 font-bold font-mono text-sm">
                    {numericDownpaymentPct !== null 
                      ? `${currencySymbol}${balanceAmount.toLocaleString()} ${effectiveCurrencyCode} (${100 - numericDownpaymentPct}%)`
                      : `${currencySymbol}${numericCost.toLocaleString()} ${effectiveCurrencyCode}`}
                  </span>
                </div>
              </React.Fragment>
            ) : (
              <div className="text-zinc-400 italic text-[11px] flex items-center gap-2">
                <Icons.Info size={13} className="text-amber-400" />
                <span>Financial terms are currently empty. The contract will display the &quot;Pending Final Agreement&quot; banner.</span>
              </div>
            )}
          </div>

          {/* Company & Client Address Overrides */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">Company / Organization</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Innovations Corp."
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">Physical Address</label>
              <input
                type="text"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="e.g. Legazpi City, Albay, Philippines"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 text-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* E-Signature vs Face-to-Face Physical Signing Permission Switch */}
          <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  esignEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {esignEnabled ? <Icons.FileSignature size={18} /> : <Icons.Users size={18} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white block">
                      Client Signing Method: {esignEnabled ? 'Electronic Signature (e-Sign)' : 'Face-to-Face Hardcopy Only'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      esignEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {esignEnabled ? 'Online Active' : 'In-Person Only'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                    {esignEnabled 
                      ? 'Client can access the contract with PIN and submit digital signatures online.' 
                      : 'E-sign is disabled. Client is guided to print/download the contract and sign with pen in-person.'}
                  </p>
                </div>
              </div>

              {/* Direct Toggle Pills */}
              <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => handleToggleEsign(true)}
                  disabled={isPending}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    esignEnabled 
                      ? 'bg-emerald-600 text-white shadow-md ring-1 ring-emerald-400' 
                      : 'bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Icons.Check size={13} />
                  <span>Enable e-Sign</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleEsign(false)}
                  disabled={isPending}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    !esignEnabled 
                      ? 'bg-amber-600 text-white shadow-md ring-1 ring-amber-400' 
                      : 'bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Icons.Users size={13} />
                  <span>Face-to-Face Only</span>
                </button>
              </div>
            </div>
          </div>

          {/* Master Save Button for Terms */}
          <button
            type="button"
            onClick={handleSaveContractAndFinancials}
            disabled={isPending}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {isPending ? (
              <React.Fragment>
                <Icons.Loader2 size={14} className="animate-spin" />
                <span>Applying Changes to Live Contract...</span>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <Icons.Save size={14} />
                <span>Apply Financial Terms to Contract</span>
              </React.Fragment>
            )}
          </button>
        </div>
      )}

      {/* TAB 2: CONTRACT CONTENTS & CLAUSES CUSTOMIZATION (Requirement 1) */}
      {activeTab === 'contents' && (
        <div className="space-y-4">
          
          {/* Contract Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-zinc-400">
                Contract Document Title
              </label>
              <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                <span>Quick:</span>
                <button
                  type="button"
                  onClick={() => setContractTitle('Master Service Agreement')}
                  className="hover:text-emerald-400 underline cursor-pointer"
                >
                  MSA
                </button>
                <span>&bull;</span>
                <button
                  type="button"
                  onClick={() => setContractTitle('Software Development Agreement')}
                  className="hover:text-emerald-400 underline cursor-pointer"
                >
                  Dev Agreement
                </button>
                <span>&bull;</span>
                <button
                  type="button"
                  onClick={() => setContractTitle('Technology Consulting & Retainer Agreement')}
                  className="hover:text-emerald-400 underline cursor-pointer"
                >
                  Retainer
                </button>
              </div>
            </div>
            <input
              type="text"
              value={contractTitle}
              onChange={(e) => setContractTitle(e.target.value)}
              placeholder="e.g. Master Service Agreement"
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 text-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-[10px] text-zinc-500 mt-0.5 block">
              Auto-formats letterhead, references, and legal clauses.
            </span>
          </div>

          {/* Section 1: Scope of Services / Deliverables */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-zinc-400">
                1. Scope of Digital Services &amp; Deliverables
              </label>
              <div className="flex items-center gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => applyScopePreset('custom_dev')}
                  className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded cursor-pointer transition-colors"
                >
                  + Web App Dev
                </button>
                <button
                  type="button"
                  onClick={() => applyScopePreset('consulting')}
                  className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded cursor-pointer transition-colors"
                >
                  + Cloud Audit
                </button>
                <button
                  type="button"
                  onClick={() => applyScopePreset('retainer')}
                  className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded cursor-pointer transition-colors"
                >
                  + Retainer
                </button>
              </div>
            </div>
            <textarea
              rows={4}
              value={scopeDescription}
              onChange={(e) => setScopeDescription(e.target.value)}
              placeholder="Specify bespoke engineering deliverables, milestones, API integrations, and architecture specs..."
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 text-white rounded-xl text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
            />
          </div>

          {/* Payment Terms Notes & Instructions */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-zinc-400">
                2. Billing Schedule Notes &amp; Payment Instructions
              </label>
              <div className="flex items-center gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => applyPaymentPreset('milestone_50_50')}
                  className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded cursor-pointer transition-colors"
                >
                  + 50/50 Standard
                </button>
                <button
                  type="button"
                  onClick={() => applyPaymentPreset('three_stages')}
                  className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded cursor-pointer transition-colors"
                >
                  + 40/30/30
                </button>
              </div>
            </div>
            <textarea
              rows={2}
              value={paymentTermsNotes}
              onChange={(e) => setPaymentTermsNotes(e.target.value)}
              placeholder="Specify bank accounts, GCash numbers, milestone triggers, or disbursement terms (optional)..."
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 text-white rounded-xl text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
            />
          </div>

          {/* Section 6: Custom Terms & Special Provisions */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
                <Icons.ShieldAlert size={12} className="text-emerald-400" />
                <span>6. Special Provisions &amp; Bespoke Agreement Terms (Optional)</span>
              </label>
              <span className="text-[10px] text-zinc-500">Auto-collapses in document if left blank</span>
            </div>
            <textarea
              rows={4}
              value={customTerms}
              onChange={(e) => setCustomTerms(e.target.value)}
              placeholder="Add client-specific covenants, bespoke SLA uptime targets, extended warranty clauses, or NDA conditions..."
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 text-white rounded-xl text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
            />
          </div>

          {/* Master Save Button for Contents */}
          <button
            type="button"
            onClick={handleSaveContractAndFinancials}
            disabled={isPending}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {isPending ? (
              <React.Fragment>
                <Icons.Loader2 size={14} className="animate-spin" />
                <span>Saving Contract Clauses &amp; Layout...</span>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <Icons.Save size={14} />
                <span>Save Contract Contents &amp; Auto-Adjust Layout</span>
              </React.Fragment>
            )}
          </button>
        </div>
      )}

      {/* TAB 3: STATUS & HARDCOPY ATTACHMENT */}
      {activeTab === 'status' && (
        <div className="space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Contract Status Dropdown */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                Contract Status
              </label>
              <select
                value={contractStatus}
                onChange={(e) => setContractStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 text-white rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Draft">Draft (Not Yet Sent)</option>
                <option value="Sent">Sent (Awaiting e-Sign)</option>
                <option value="Signed">Signed (Executed)</option>
              </select>
            </div>

            {/* Execution Method Indicator */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                Execution Method
              </label>
              <div className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-300 flex items-center gap-2">
                {lead.contractSigningMethod === 'manual_hardcopy' || attachmentUrl ? (
                  <React.Fragment>
                    <Icons.FileCheck2 size={14} className="text-indigo-400" />
                    <span>Hardcopy Document</span>
                  </React.Fragment>
                ) : isSigned ? (
                  <React.Fragment>
                    <Icons.CheckCircle2 size={14} className="text-emerald-400" />
                    <span>Electronic e-Signature</span>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <Icons.Clock size={14} className="text-amber-400" />
                    <span>Pending Execution</span>
                  </React.Fragment>
                )}
              </div>
            </div>

          </div>

          {/* Digital Signature Card when Electronically Signed */}
          {isSigned && lead.contractSigningMethod !== 'manual_hardcopy' && !attachmentUrl && (
            <div className="p-4 bg-emerald-950/40 rounded-2xl border border-emerald-500/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h5 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <Icons.ShieldCheck size={14} className="text-emerald-400" />
                    Legally Executed Digital Signature
                  </h5>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Signed by <strong className="text-white">{lead.contractSignedBy || lead.fullName}</strong>
                    {lead.contractSignedByTitle ? ` (${lead.contractSignedByTitle})` : ''}
                    {lead.contractSignedAt ? ` on ${new Date(lead.contractSignedAt).toLocaleString()}` : ''}.
                  </p>
                </div>
                <a
                  href={contractPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-xs"
                >
                  <Icons.ExternalLink size={12} />
                  <span>View &amp; Download Signed PDF</span>
                </a>
              </div>

              {/* Digital Signature Stroke Display */}
              <div className="p-3 bg-white rounded-xl border border-emerald-300/60 flex items-center justify-center min-h-16">
                {lead.contractSignatureData ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={lead.contractSignatureData}
                    alt="Client Digital Signature"
                    className="max-h-12 w-auto object-contain"
                  />
                ) : (
                  <span className="font-serif italic text-2xl text-emerald-950 font-bold">
                    {lead.contractSignedBy || lead.fullName}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Hardcopy Attachment Uploader */}
          <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Icons.Upload size={14} className="text-indigo-400" />
                  Attach Signed Hardcopy Contract (PDF or Image)
                </h5>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  If the client signed physically, upload the scanned PDF or photo here to archive in our database.
                </p>
              </div>
            </div>

            {/* Current Attached File Preview if Exists */}
            {(attachmentUrl || fileNamePreview) && (
              <div className="p-3 bg-zinc-900 rounded-xl border border-indigo-500/40 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Icons.FileText size={18} className="text-indigo-400 shrink-0" />
                  <span className="font-medium text-zinc-200 truncate">
                    {fileNamePreview || attachmentName || 'signed_contract_attachment.pdf'}
                  </span>
                </div>
                {attachmentUrl && (
                  <a
                    href={attachmentUrl}
                    download={attachmentName || 'signed_contract.pdf'}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold rounded-lg flex items-center gap-1 shrink-0"
                  >
                    <Icons.Download size={12} />
                    <span>Download</span>
                  </a>
                )}
              </div>
            )}

            {/* Upload File Input */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                Upload Scanned Document
              </label>
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                onChange={handleFileUpload}
                className="w-full text-xs text-zinc-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Accepted formats: PDF, PNG, JPG (Max 6MB)
              </span>
            </div>
          </div>

          {/* Save Status & Attachment Button */}
          <button
            type="button"
            onClick={handleSaveStatusAndAttachment}
            disabled={isPending}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {isPending ? (
              <React.Fragment>
                <Icons.Loader2 size={14} className="animate-spin" />
                <span>Saving Status &amp; Document...</span>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <Icons.Save size={14} />
                <span>Save Status &amp; Hardcopy Attachment</span>
              </React.Fragment>
            )}
          </button>
        </div>
      )}

    </div>
  );
}
