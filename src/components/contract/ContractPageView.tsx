"use client";

import React, { useState, useTransition } from 'react';
import * as Icons from 'lucide-react';
import { ContractData, signContractAction } from '@/app/contract/contract.actions';
import ContractDocument from './ContractDocument';
import SignaturePad from './SignaturePad';

// FILE: src/components/contract/ContractPageView.tsx

interface ContractPageViewProps {
  initialContract: ContractData;
}

export default function ContractPageView({ initialContract }: ContractPageViewProps) {
  const [contract, setContract] = useState<ContractData>(initialContract);
  const [signatureData, setSignatureData] = useState<string>('');
  const [signatureType, setSignatureType] = useState<'drawn' | 'typed'>('drawn');
  const [signerName, setSignerName] = useState<string>(initialContract.client_name || '');
  const [signerTitle, setSignerTitle] = useState<string>('Authorized Signatory');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isSigned = contract.status === 'Signed';

  const handlePrintDownload = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
    }
  };

  const handleSubmitSignature = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!signerName.trim()) {
      setErrorMsg('Please enter your full legal name.');
      return;
    }

    if (!signatureData) {
      setErrorMsg('Please draw or type your signature before submitting.');
      return;
    }

    if (!agreedToTerms) {
      setErrorMsg('Please accept the electronic signature declaration.');
      return;
    }

    startTransition(async () => {
      const res = await signContractAction({
        leadId: contract.lead_id,
        signatureData,
        signatureType,
        signedByName: signerName.trim(),
        signedByTitle: signerTitle.trim()
      });

      if (res.success) {
        setContract({
          ...contract,
          status: 'Signed',
          signature_data: signatureData,
          signature_type: signatureType,
          signed_at: new Date().toISOString(),
          signed_by_name: signerName.trim(),
          signed_by_title: signerTitle.trim()
        });
      } else {
        setErrorMsg(res.error || 'Failed to submit electronic signature. Please try again.');
      }
    });
  };

  return (
    <div className="min-h-screen bg-zinc-100/90 text-zinc-900 pb-20 print:bg-white print:p-0">
      
      {/* Top Navigation & Action Bar (Hidden during print) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200 px-4 sm:px-8 py-3.5 print:hidden shadow-xs">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-xs">
              <Icons.FileCheck size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-zinc-950">
                  Standard Service Agreement
                </span>
                {isSigned ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    <Icons.CheckCircle2 size={11} /> Digitally Signed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 animate-pulse">
                    <Icons.Clock size={11} /> Awaiting Signature
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500">
                Prepared for {contract.client_name} {contract.company_name ? `(${contract.company_name})` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors shadow-2xs"
            >
              {copyFeedback ? (
                <React.Fragment>
                  <Icons.Check size={13} className="text-emerald-600" />
                  <span className="text-emerald-700">Link Copied!</span>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <Icons.Share2 size={13} className="text-zinc-500" />
                  <span>Share Link</span>
                </React.Fragment>
              )}
            </button>

            <button
              onClick={handlePrintDownload}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-colors shadow-xs"
            >
              <Icons.Download size={13} />
              <span>Download / Print PDF</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 print:p-0 print:m-0 print:max-w-none">
        
        {/* Success Banner if Signed */}
        {isSigned && (
          <div className="mb-6 p-4 sm:p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900 print:hidden shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Icons.ShieldCheck size={20} />
              </div>
              <div>
                <p className="font-bold text-sm text-emerald-950">
                  Agreement Executed &amp; Legally Binding
                </p>
                <p className="text-emerald-700 mt-0.5">
                  Signed by {contract.signed_by_name} ({contract.signed_by_title}) on {contract.signed_at ? new Date(contract.signed_at).toLocaleString() : 'Record'}.
                </p>
              </div>
            </div>
            <button
              onClick={handlePrintDownload}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shrink-0 transition-colors"
            >
              Print / Save PDF
            </button>
          </div>
        )}

        {/* The Formal Legal Contract Document */}
        <ContractDocument contract={contract} />

        {/* E-Signature Execution Panel (Only shown if unsigned) */}
        {!isSigned && (
          <div className="mt-8 bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-xl print:hidden space-y-6">
            
            <div className="border-b border-zinc-200 pb-4">
              <div className="flex items-center gap-2 text-zinc-900">
                <Icons.PenLine size={20} className="text-emerald-600" />
                <h2 className="text-lg font-bold">Complete Your Electronic Signature</h2>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Please review the terms above, provide your full legal name, and sign in the designated box below.
              </p>
            </div>

            <form onSubmit={handleSubmitSignature} className="space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Signee Full Legal Name *
                  </label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="e.g. Jason Millena"
                    required
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Signee Title / Company Role
                  </label>
                  <input
                    type="text"
                    value={signerTitle}
                    onChange={(e) => setSignerTitle(e.target.value)}
                    placeholder="e.g. Founder, CEO, or Authorized Signatory"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Signature Pad */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Electronic Signature *
                </label>
                <SignaturePad
                  onSaveSignature={(data, type) => {
                    setSignatureData(data);
                    setSignatureType(type);
                  }}
                  disabled={isPending}
                />
              </div>

              {/* Legal Confirmation Checkbox */}
              <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-700 select-none">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    I confirm that I have read and agree to the <strong>Standard Service Agreement</strong> with Macrotek Digital Solutions, and agree that this electronic signature carries the full legal weight of a handwritten signature.
                  </span>
                </label>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-medium flex items-center gap-2">
                  <Icons.AlertCircle size={15} className="shrink-0 text-red-600" />
                  {errorMsg}
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <React.Fragment>
                    <Icons.Loader2 size={16} className="animate-spin" />
                    <span>Executing Electronic Signature...</span>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <Icons.CheckCircle2 size={16} />
                    <span>Sign &amp; Execute Agreement</span>
                  </React.Fragment>
                )}
              </button>

            </form>

          </div>
        )}

      </main>

    </div>
  );
}
