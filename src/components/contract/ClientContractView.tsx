// FILE: src/components/contract/ClientContractView.tsx
"use client";

import React, { useState, useTransition } from 'react';
import * as Icons from 'lucide-react';
import { signDocumentAction } from '@/app/contract/contract.actions';
import SignaturePad from './SignaturePad';

interface ClientContractViewProps {
  document: any;
}

export default function ClientContractView({ document }: ClientContractViewProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const rawJson = document.document_json || {};
  const docJson = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;

  const fields = docJson.fields || [];
  const bodyText = docJson.body || '';
  const clientMeta = docJson.clientMeta || null;

  const requireSignature = document.require_signature;
  
  // WOZ UPGRADE: Treat both digital and hardcopy as officially "Locked/Completed"
  const isCompleted = document.status === 'Completed' || document.status === 'Completed - Hardcopy';

  const handleSignDocument = (signatureBase64: string | null) => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await signDocumentAction(document.access_code, signatureBase64);
      if (!res.success) {
        setErrorMsg(res.error || "Failed to submit document. Please try again.");
      }
    });
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <React.Fragment>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { margin: 0mm; size: auto; }
          nav, aside, footer, [class*="sidebar"], [class*="drawer"], [class*="mobile-menu"], [id*="sidebar"] {
            display: none !important;
          }
          body { 
            background: white !important; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
        }
      `}} />

      <div className="min-h-screen bg-zinc-100 py-8 px-4 sm:py-12 font-sans text-zinc-900 flex flex-col items-center print:bg-white print:py-12 print:px-12">
        
        <div className="max-w-3xl w-full flex items-center justify-between mb-6 px-2 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <Icons.Hexagon size={20} className="text-white fill-white/20" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-widest uppercase text-zinc-900">Macrotek Digital</h1>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Secure Client Portal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {isCompleted && (
              <button 
                onClick={handleDownloadPDF}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
              >
                <Icons.Download size={14} /> Download PDF
              </button>
            )}

            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
              isCompleted ? 'bg-emerald-100 text-emerald-700' :
              document.status === 'Draft' ? 'bg-amber-100 text-amber-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {isCompleted ? <Icons.CheckCircle2 size={14} /> : <Icons.Clock size={14} />}
              {document.status === 'Draft' ? 'Pending Review' : document.status}
            </div>
          </div>
        </div>

        <main className="max-w-3xl w-full bg-white rounded-3xl shadow-xl border border-zinc-200 overflow-hidden relative print:shadow-none print:border-none print:rounded-none print:w-full print:max-w-none">
          
          <div className={`h-2 w-full absolute top-0 left-0 print:hidden ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'}`} />

          <div className="p-8 sm:p-12 print:p-0">
            
            <div className="hidden print:flex items-center gap-4 border-b-2 border-zinc-900 pb-6 mb-8">
              <img 
                src="/logo.png" 
                alt="Macrotek Digital Logo" 
                className="h-14 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.querySelector('.logo-fallback')?.classList.remove('hidden');
                }}
              />
              <Icons.Hexagon size={36} className="text-zinc-900 hidden logo-fallback" />
              
              <div className="flex flex-col justify-center">
                <h1 className="text-2xl font-black tracking-widest uppercase text-zinc-900 leading-none">Macrotek Digital</h1>
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Official Document Record</p>
              </div>
            </div>

            <div className="border-b border-zinc-200 pb-8 mb-8">
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-950 mb-2">
                {document.title}
              </h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs text-zinc-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <Icons.Calendar size={14} />
                  Issued on {new Date(document.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <span className="hidden sm:inline print:inline">&bull;</span>
                <span className="flex items-center gap-1.5">
                  <Icons.Hash size={14} />
                  Ref: {document.id.split('-')[0].toUpperCase()}
                </span>
              </div>
            </div>

            {clientMeta && (
              <div className="mb-10 bg-zinc-50 p-6 rounded-2xl border border-zinc-200/80 print:bg-transparent print:border-zinc-300 print:rounded-none print:p-0 print:mb-8">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-4 border-b border-zinc-200 pb-2 print:border-zinc-300 print:text-zinc-800">
                  Document Prepared For
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-zinc-400 print:text-zinc-500">Client / Organization</p>
                    <p className="text-sm font-bold text-zinc-900 uppercase">{clientMeta.fullName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-zinc-400 print:text-zinc-500">Email Address</p>
                    <p className="text-sm font-medium text-zinc-800 uppercase">{clientMeta.email}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-zinc-400 print:text-zinc-500">Contact Number</p>
                    <p className="text-sm font-medium text-zinc-800 uppercase">{clientMeta.phone}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-zinc-400 print:text-zinc-500">Registered Address</p>
                    <p className="text-sm font-medium text-zinc-800 uppercase">{clientMeta.address}</p>
                  </div>
                </div>
              </div>
            )}

            {fields.length > 0 && (
              <div className="mb-10 bg-zinc-50 p-6 rounded-2xl border border-zinc-200/80 print:bg-transparent print:border-zinc-300 print:rounded-none print:p-0 print:mb-8">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-4 border-b border-zinc-200 pb-2 print:border-zinc-300 print:text-zinc-800">
                  Project Particulars
                </h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  {fields.map((field: any, idx: number) => (
                    <div key={idx} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                      <dt className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1 print:text-zinc-500">
                        {field.label}
                      </dt>
                      <dd className={`text-sm font-medium text-zinc-900 ${field.type === 'textarea' ? 'whitespace-pre-wrap bg-white p-3 rounded-lg border border-zinc-200 print:border-none print:p-0 print:bg-transparent' : ''}`}>
                        {field.type === 'currency' ? `₱${Number(field.value || 0).toLocaleString()}` : (field.value || 'N/A')}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <div 
              className="prose prose-sm sm:prose-base max-w-none text-zinc-800 leading-relaxed whitespace-pre-wrap mb-12"
              dangerouslySetInnerHTML={{ __html: bodyText }}
            />

            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium flex items-center gap-2 print:hidden">
                <Icons.AlertTriangle size={18} />
                {errorMsg}
              </div>
            )}

            <div className="mt-12 pt-8 border-t-2 border-dashed border-zinc-200 print:border-solid print:break-inside-avoid">
              {isCompleted ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 print:bg-transparent print:border-none print:p-0">
                  <div>
                    <div className="flex items-center gap-2 mb-2 print:hidden">
                      <Icons.ShieldCheck size={20} className="text-emerald-600" />
                      <h4 className="text-sm font-bold text-emerald-900">Document Executed &amp; Secured</h4>
                    </div>
                    
                    <h4 className="hidden print:block text-sm font-bold text-zinc-900 mb-2 uppercase tracking-widest">
                      {document.status === 'Completed - Hardcopy' ? 'Physical Execution Record' : 'Digital Execution Record'}
                    </h4>
                    
                    <p className="text-xs text-emerald-700 font-medium print:text-zinc-600">
                      Officially completed on {new Date(document.updated_at).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-emerald-600/70 mt-1 uppercase tracking-widest font-mono print:text-zinc-500">
                      VERIFICATION ID: {document.id.split('-')[0]}
                    </p>
                    {document.signature_data && (
                      <p className="text-[10px] text-emerald-600/70 mt-1 uppercase tracking-widest font-mono print:text-zinc-500">
                        IP ADDRESS: {document.signed_ip || 'Recorded securely'}
                      </p>
                    )}
                  </div>

                  {document.signature_data ? (
                    <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm shrink-0 print:border-none print:shadow-none print:p-0">
                      <img 
                        src={document.signature_data} 
                        alt="Client Signature" 
                        className="h-16 object-contain pointer-events-none"
                      />
                      <div className="w-full h-px bg-zinc-200 mt-2 print:bg-zinc-800" />
                      <p className="text-[9px] text-center text-zinc-400 mt-1 uppercase tracking-widest print:text-left print:text-zinc-500">
                        Client Signature
                      </p>
                    </div>
                  ) : document.status === 'Completed - Hardcopy' ? (
                    <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm shrink-0 print:border-none print:shadow-none print:p-0">
                      <div className="w-48 h-px bg-zinc-300 mt-12 print:bg-zinc-800" />
                      <p className="text-[9px] text-zinc-400 mt-2 uppercase tracking-widest font-bold">
                        Signed on physical copy
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 sm:p-8 print:hidden">
                  <SignaturePad 
                    onSign={handleSignDocument}
                    isSubmitting={isPending}
                    requireSignature={requireSignature}
                  />
                </div>
              )}
            </div>
            
          </div>
        </main>

        <p className="text-xs text-zinc-400 mt-8 font-medium print:hidden">
          Securely generated by Macrotek Digital Solutions &bull; {new Date().getFullYear()}
        </p>
      </div>
    </React.Fragment>
  );
}