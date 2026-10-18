"use client";

import React, { useState, useEffect, useTransition } from 'react';
import * as Icons from 'lucide-react';
import { ContractData, signContractAction, verifyContractAccessCodeAction } from '@/app/contract/contract.actions';
import ContractDocument from './ContractDocument';
import SignaturePad from './SignaturePad';

// FILE: src/components/contract/ContractPageView.tsx

interface ContractPageViewProps {
  initialContract: ContractData;
}

export default function ContractPageView({ initialContract }: ContractPageViewProps) {
  const [contract, setContract] = useState<ContractData>(initialContract);

  // Synchronize contract state immediately when initialContract updates (e.g. after refresh)
  useEffect(() => {
    setContract(initialContract);
  }, [initialContract]);
  
  // Access Code Gate State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [accessCodeError, setAccessCodeError] = useState<string | null>(null);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  // E-Sign Form State
  const [signatureData, setSignatureData] = useState<string>('');
  const [signatureType, setSignatureType] = useState<'drawn' | 'typed'>('drawn');
  const [signerName, setSignerName] = useState<string>(initialContract.client_name || '');
  const [signerTitle, setSignerTitle] = useState<string>('Authorized Signatory');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // PDF Download & Generation State
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfDownloadFeedback, setPdfDownloadFeedback] = useState(false);

  const isSigned = contract.status === 'Signed';

  // Check if access code is saved in sessionStorage or matches URL query
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storageKey = `contract_unlocked_${contract.id}`;
      const savedCode = sessionStorage.getItem(storageKey);
      
      const searchParams = new URLSearchParams(window.location.search);
      const urlCode = searchParams.get('code');

      if (urlCode && contract.access_code && urlCode.trim().toLowerCase() === contract.access_code.trim().toLowerCase()) {
        setIsUnlocked(true);
        sessionStorage.setItem(storageKey, urlCode.trim());
      } else if (savedCode && contract.access_code && savedCode.trim().toLowerCase() === contract.access_code.trim().toLowerCase()) {
        setIsUnlocked(true);
      }
    }
  }, [contract.id, contract.access_code]);

  const handleUnlockWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccessCodeError(null);

    const entered = accessCodeInput.trim().replace(/[-\s]/g, '');
    if (!entered) {
      setAccessCodeError('Please enter your 6-digit Access Code.');
      return;
    }

    setIsVerifyingCode(true);

    try {
      // 1. Direct validation against initialContract props (instant & resilient)
      const currentPropCode = (contract.access_code || '').trim().replace(/[-\s]/g, '');
      if (currentPropCode && entered.toLowerCase() === currentPropCode.toLowerCase()) {
        setIsUnlocked(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`contract_unlocked_${contract.id}`, entered);
        }
        return;
      }

      // 2. Server-side validation (in case admin regenerated PIN)
      const res = await verifyContractAccessCodeAction(contract.lead_id || contract.id, entered);
      if (res.valid) {
        setIsUnlocked(true);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`contract_unlocked_${contract.id}`, entered);
        }
      } else {
        setAccessCodeError('Invalid Access Code. Please check the code provided by Macrotek.');
      }
    } catch {
      setAccessCodeError('Failed to verify access code. Please try again.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Helper to dynamically load html2pdf from node_modules or CDN
  const getPdfGenerator = async (): Promise<any> => {
    if (typeof window === 'undefined') return null;

    // 1. Check window global
    if ((window as any).html2pdf) {
      return (window as any).html2pdf;
    }

    // 2. Try dynamic import from node_modules if present
    try {
      const html2pdfModule = await import('html2pdf.js');
      const gen = html2pdfModule.default || html2pdfModule;
      if (gen) return gen;
    } catch {
      // If not present in local node_modules, fall through to CDN script injection
    }

    // 3. Dynamic script injection from CDN
    return new Promise((resolve, reject) => {
      const existing = document.getElementById('html2pdf-script') as HTMLScriptElement;
      if (existing) {
        if ((window as any).html2pdf) {
          resolve((window as any).html2pdf);
        } else {
          existing.addEventListener('load', () => resolve((window as any).html2pdf));
          existing.addEventListener('error', () => reject(new Error('Failed to load html2pdf')));
        }
        return;
      }

      const script = document.createElement('script');
      script.id = 'html2pdf-script';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.async = true;
      script.onload = () => {
        if ((window as any).html2pdf) {
          resolve((window as any).html2pdf);
        } else {
          reject(new Error('html2pdf failed to initialize on window'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load html2pdf script'));
      document.head.appendChild(script);
    });
  };

  // Direct Client-Side PDF Generation & Instant File Download
  const handleDownloadPdf = async () => {
    if (typeof window === 'undefined') return;
    const element = document.getElementById('contract-document');
    if (!element) {
      handleNativePrint();
      return;
    }

    setIsGeneratingPdf(true);
    try {
      const html2pdf = await getPdfGenerator();
      if (!html2pdf) {
        throw new Error('PDF generator unavailable');
      }

      const safeClient = (contract.client_name || 'Client').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeTitle = (contract.contract_title || 'Master_Service_Agreement').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${safeTitle}_${safeClient}.pdf`;

      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: filename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
          logging: false 
        },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().set(opt).from(element).save();
      setPdfDownloadFeedback(true);
      setTimeout(() => setPdfDownloadFeedback(false), 3000);
    } catch (err) {
      console.warn('Direct PDF download fallback to window.print():', err);
      handleNativePrint();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // High-fidelity native vector print & browser Save as PDF
  const handleNativePrint = () => {
    if (typeof window !== 'undefined') {
      const originalTitle = document.title;
      const safeClient = (contract.client_name || 'Client').trim();
      const safeTitle = (contract.contract_title || 'Master Service Agreement').trim();
      document.title = `${safeTitle} - ${safeClient}`;
      window.print();
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    }
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
        signedByTitle: signerTitle.trim(),
        accessCode: contract.access_code
      });

      if (res.success) {
        setContract({
          ...contract,
          status: 'Signed',
          signing_method: 'electronic',
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

  // -------------------------------------------------------------
  // ACCESS CODE GATE SCREEN (When Document is Locked)
  // -------------------------------------------------------------
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-white">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col items-center text-center">
            
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700/80 text-emerald-400 flex items-center justify-center mb-5 shadow-inner">
              <Icons.ShieldCheck size={32} />
            </div>

            <span className="text-[10px] font-black tracking-widest uppercase text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1 rounded-full mb-2">
              Confidential Agreement
            </span>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Protected Document Access
            </h1>

            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              This Master Service Agreement for <strong className="text-zinc-200">{contract.client_name}</strong> is access-code protected. Enter your 6-digit access code to unlock and e-sign.
            </p>

            <form onSubmit={handleUnlockWithCode} className="w-full mt-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 text-left">
                  Enter 6-Digit Access Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={accessCodeInput}
                    onChange={(e) => {
                      setAccessCodeInput(e.target.value.toUpperCase());
                      setAccessCodeError(null);
                    }}
                    placeholder="Enter 6-digit PIN"
                    maxLength={10}
                    autoFocus
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 focus:border-emerald-500 rounded-xl text-center text-xl font-mono font-bold tracking-widest text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all placeholder:text-zinc-600 uppercase"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-500">
                    <Icons.KeyRound size={16} />
                  </div>
                </div>
              </div>

              {accessCodeError && (
                <div className="p-3 bg-red-950/50 border border-red-800 text-red-300 rounded-xl text-xs flex items-center gap-2 text-left animate-shake">
                  <Icons.AlertCircle size={15} className="shrink-0 text-red-400" />
                  <span>{accessCodeError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifyingCode || !accessCodeInput.trim()}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isVerifyingCode ? (
                  <React.Fragment>
                    <Icons.Loader2 size={16} className="animate-spin" />
                    <span>Verifying Code...</span>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <Icons.LockOpen size={16} />
                    <span>Unlock Contract Document</span>
                  </React.Fragment>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-zinc-800 text-center w-full">
              <p className="text-[11px] text-zinc-500">
                Macrotek Digital Solutions &bull; Authorized E-Signature System
              </p>
              <p className="text-[10px] text-zinc-600 mt-0.5">
                Don&apos;t have your access code? Contact your representative at admin@macrotek.com
              </p>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // UNLOCKED CONTRACT VIEW & E-SIGNATURE INTERFACE
  // -------------------------------------------------------------
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
                  {contract.contract_title || 'Master Service Agreement'}
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors shadow-2xs cursor-pointer"
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
              onClick={handleNativePrint}
              title="Print document or Save as PDF via browser"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors shadow-2xs cursor-pointer"
            >
              <Icons.Printer size={13} className="text-zinc-500" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-60 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              {isGeneratingPdf ? (
                <React.Fragment>
                  <Icons.Loader2 size={13} className="animate-spin text-emerald-400" />
                  <span>Generating PDF...</span>
                </React.Fragment>
              ) : pdfDownloadFeedback ? (
                <React.Fragment>
                  <Icons.Check size={13} className="text-emerald-400" />
                  <span className="text-emerald-300">PDF Downloaded!</span>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <Icons.Download size={13} />
                  <span>Download PDF</span>
                </React.Fragment>
              )}
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
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleNativePrint}
                className="px-3 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Icons.Printer size={13} />
                <span>Print</span>
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl shrink-0 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {isGeneratingPdf ? (
                  <React.Fragment>
                    <Icons.Loader2 size={13} className="animate-spin" />
                    <span>Generating...</span>
                  </React.Fragment>
                ) : pdfDownloadFeedback ? (
                  <React.Fragment>
                    <Icons.Check size={13} />
                    <span>Downloaded!</span>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <Icons.Download size={13} />
                    <span>Download PDF</span>
                  </React.Fragment>
                )}
              </button>
            </div>
          </div>
        )}

        {/* The Read-Only Formal Legal Contract Document */}
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
                Please review the terms and financial schedule above, provide your legal name and role, and sign below. (Note: Contract clauses are read-only and cannot be altered by signees).
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
                    Signee Title / Role in Organization
                  </label>
                  <input
                    type="text"
                    value={signerTitle}
                    onChange={(e) => setSignerTitle(e.target.value)}
                    placeholder="e.g. Managing Director, Founder, or Authorized Client"
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
                    I confirm that I have reviewed the <strong>Master Service Agreement</strong> with Macrotek Digital Solutions, accept all milestone fees and terms, and agree that this electronic signature carries full legal enforceability.
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
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isPending ? (
                  <React.Fragment>
                    <Icons.Loader2 size={16} className="animate-spin" />
                    <span>Executing Electronic Signature...</span>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <Icons.CheckCircle2 size={16} />
                    <span>Sign &amp; Execute Service Agreement</span>
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
