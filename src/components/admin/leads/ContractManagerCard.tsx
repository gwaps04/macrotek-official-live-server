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
}

export default function ContractManagerCard({ lead, onRefresh }: ContractManagerCardProps) {
  const [isPending, startTransition] = useTransition();

  // Financial State
  const [projectCost, setProjectCost] = useState<number>(lead.contractCost || 50000);
  const [downpaymentPct, setDownpaymentPct] = useState<number>(lead.contractDownpaymentPct ?? 50);
  const [currency, setCurrency] = useState<'PHP' | 'USD'>((lead.contractCurrency as any) || 'PHP');
  const [companyName, setCompanyName] = useState<string>(lead.companyName || '');
  const [clientAddress, setClientAddress] = useState<string>(lead.address || '');
  const [esignEnabled, setEsignEnabled] = useState<boolean>(lead.contractEsignEnabled !== false);

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

  // UI Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copyCodeFeedback, setCopyCodeFeedback] = useState(false);
  const [copyInviteFeedback, setCopyInviteFeedback] = useState(false);
  const [activeTab, setActiveTab] = useState<'terms' | 'status'>('terms');

  // Synchronize state whenever lead prop changes
  useEffect(() => {
    const code = lead.contractAccessCode || getDeterministicAccessCode(lead.id);
    setAccessCode(code);
    setProjectCost(lead.contractCost || 50000);
    setDownpaymentPct(lead.contractDownpaymentPct ?? 50);
    setCurrency((lead.contractCurrency as any) || 'PHP');
    setCompanyName(lead.companyName || '');
    setClientAddress(lead.address || '');
    setEsignEnabled(lead.contractEsignEnabled !== false);
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
    lead.contractStatus, 
    lead.contractAttachmentUrl, 
    lead.contractAttachmentName
  ]);

  // Derived financial math
  const currencySymbol = currency === 'PHP' ? '₱' : '$';
  const downpaymentAmount = projectCost * (downpaymentPct / 100);
  const balanceAmount = Math.max(0, projectCost - downpaymentAmount);

  // Contract URL
  const contractPath = `/contract/${lead.id}?type=${lead.type}`;
  const contractUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${contractPath}`
    : contractPath;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(accessCode);
    setCopyCodeFeedback(true);
    setTimeout(() => setCopyCodeFeedback(false), 2000);
  };

  const handleCopyInviteMessage = () => {
    const msg = `Hi ${lead.firstName}, please review and electronically sign our Master Service Agreement with Macrotek Digital Solutions here:\n\n${contractUrl}\n\nYour Access Code: ${accessCode}`;
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
        onRefresh();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to regenerate code' });
      }
      setTimeout(() => setFeedback(null), 3500);
    });
  };

  const handleSaveFinancials = () => {
    setFeedback(null);
    startTransition(async () => {
      const res = await updateContractFinancialsAction({
        contractId: lead.contractId || lead.id,
        leadId: lead.id,
        projectCost: Number(projectCost) || 0,
        downpaymentPercentage: Number(downpaymentPct) || 50,
        currency,
        companyName,
        clientAddress,
        esignEnabled
      });

      if (res.success) {
        setFeedback({ type: 'success', message: 'Contract terms and signing permissions saved successfully!' });
        onRefresh();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to update contract terms' });
      }
      setTimeout(() => setFeedback(null), 3500);
    });
  };

  const handleToggleEsign = (newVal: boolean) => {
    setEsignEnabled(newVal);
    setFeedback(null);
    startTransition(async () => {
      const res = await toggleContractEsignAction(lead.id, newVal);
      if (res.success) {
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

    // Check size limit: max 6MB
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

  return (
    <div className="bg-zinc-900 text-white rounded-3xl border border-zinc-800 p-5 space-y-5">
      
      {/* Header with Title & Direct Open Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Icons.FileCheck2 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
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
              Configure project cost, downpayment percentage, company name, e-sign permissions, and access code.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={contractPath}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Icons.ExternalLink size={13} />
            <span>Open &amp; Print PDF</span>
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
            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Client Access Code</span>
            <div className="flex items-center gap-2">
              <span className="text-base font-mono font-black text-emerald-400 tracking-wider">
                {accessCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-semibold rounded-md transition-colors flex items-center gap-1"
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
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRegenerateCode}
            disabled={isPending}
            className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Generate a new 6-digit access code"
          >
            <Icons.RefreshCw size={12} className={isPending ? 'animate-spin' : ''} />
            <span>Regenerate Code</span>
          </button>
        </div>
      </div>

      {/* Shareable Invite Message Box */}
      <div className="bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5">
            <Icons.Send size={12} className="text-emerald-500" />
            Client Invitation &amp; Access Code Message:
          </span>
          <button
            type="button"
            onClick={handleCopyInviteMessage}
            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
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
          Hi {lead.firstName}, please review and electronically sign our Master Service Agreement with Macrotek Digital Solutions here: {contractUrl} | Access Code: {accessCode}
        </p>
      </div>

      {/* Tabs Switcher: Financials vs. Status & Hardcopy */}
      <div className="flex border-b border-zinc-800">
        <button
          type="button"
          onClick={() => setActiveTab('terms')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'terms'
              ? 'border-emerald-500 text-emerald-400 bg-zinc-800/40 rounded-t-lg'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Icons.DollarSign size={13} />
          <span>Project Cost &amp; Downpayment</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('status')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'status'
              ? 'border-emerald-500 text-emerald-400 bg-zinc-800/40 rounded-t-lg'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Icons.Paperclip size={13} />
          <span>Status &amp; Hardcopy Attachment</span>
        </button>
      </div>

      {/* TAB 1: FINANCIAL TERMS CONFIGURATION */}
      {activeTab === 'terms' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Project Cost */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                Project Cost ({currencySymbol})
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={projectCost}
                  onChange={(e) => setProjectCost(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 text-white rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Downpayment Percentage */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                Downpayment %
              </label>
              <select
                value={downpaymentPct}
                onChange={(e) => setDownpaymentPct(Number(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 text-white rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value={10}>10% Upfront</option>
                <option value={20}>20% Upfront</option>
                <option value={30}>30% Upfront</option>
                <option value={40}>40% Upfront</option>
                <option value={50}>50% Upfront (Standard)</option>
                <option value={60}>60% Upfront</option>
                <option value={70}>70% Upfront</option>
                <option value={100}>100% Full Payment</option>
              </select>
            </div>

            {/* Currency Selector (Php or $) */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                Currency
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrency('PHP')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                    currency === 'PHP'
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-zinc-950 border-zinc-700 text-zinc-400 hover:text-white'
                  }`}
                >
                  PHP (₱)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                    currency === 'USD'
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-zinc-950 border-zinc-700 text-zinc-400 hover:text-white'
                  }`}
                >
                  USD ($)
                </button>
              </div>
            </div>

          </div>

          {/* Computed Summary Preview */}
          <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase block font-bold">Commencement Downpayment</span>
              <span className="text-emerald-400 font-bold font-mono text-sm">
                {currencySymbol}{downpaymentAmount.toLocaleString()} {currency} ({downpaymentPct}%)
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-500 uppercase block font-bold">Handover Balance</span>
              <span className="text-zinc-300 font-bold font-mono text-sm">
                {currencySymbol}{balanceAmount.toLocaleString()} {currency} ({100 - downpaymentPct}%)
              </span>
            </div>
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

          <button
            type="button"
            onClick={handleSaveFinancials}
            disabled={isPending}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {isPending ? (
              <React.Fragment>
                <Icons.Loader2 size={14} className="animate-spin" />
                <span>Saving Contract Terms...</span>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <Icons.Save size={14} />
                <span>Save Financial Terms to Contract</span>
              </React.Fragment>
            )}
          </button>
        </div>
      )}

      {/* TAB 2: STATUS & HARDCOPY ATTACHMENT */}
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
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold shrink-0 flex items-center gap-1 transition-colors"
                  >
                    <Icons.Download size={11} />
                    <span>View / Download</span>
                  </a>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <label className="cursor-pointer px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-2 border border-zinc-700">
                <Icons.UploadCloud size={14} />
                <span>Choose PDF or Image</span>
                <input
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {fileNamePreview && (
                <span className="text-[11px] text-emerald-400 font-medium">
                  File loaded &amp; ready to save.
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveStatusAndAttachment}
            disabled={isPending}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {isPending ? (
              <React.Fragment>
                <Icons.Loader2 size={14} className="animate-spin" />
                <span>Updating Status &amp; Attachment...</span>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <Icons.CheckCircle2 size={14} />
                <span>Save Status &amp; Attachment</span>
              </React.Fragment>
            )}
          </button>

        </div>
      )}

      {/* Feedback Alert */}
      {feedback && (
        <div className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
          feedback.type === 'success' 
            ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300' 
            : 'bg-red-950/80 border border-red-800 text-red-300'
        }`}>
          {feedback.type === 'success' ? (
            <Icons.CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
          ) : (
            <Icons.AlertCircle size={15} className="text-red-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

    </div>
  );
}
