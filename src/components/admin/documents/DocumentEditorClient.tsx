// FILE: src/components/admin/documents/DocumentEditorClient.tsx
"use client";

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import { updateLeadDocumentAction } from '@/app/(admin)/dashboard/documents/document-editor.actions';
import RichTextEditor from './RichTextEditor';

interface DocumentEditorClientProps {
  initialDocument: any;
}

export default function DocumentEditorClient({ initialDocument }: DocumentEditorClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const rawJson = initialDocument.document_json || {};
  const parsedJson = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;

  const [documentJson, setDocumentJson] = useState(parsedJson);
  const [status, setStatus] = useState(initialDocument.status);

  const bodyText = documentJson.body || '';
  const fields = documentJson.fields || [];
  const clientMeta = documentJson.clientMeta || null;

  const handleBodyChange = (newBody: string) => {
    setDocumentJson((prev: any) => ({ ...prev, body: newBody }));
  };

  const handleFieldChange = (index: number, newValue: string) => {
    const updatedFields = [...fields];
    updatedFields[index].value = newValue;
    setDocumentJson((prev: any) => ({ ...prev, fields: updatedFields }));
  };

  const handleSave = (newStatus?: string) => {
    const finalStatus = newStatus || status;
    setStatus(finalStatus);

    startTransition(async () => {
      const res = await updateLeadDocumentAction(initialDocument.id, documentJson, finalStatus);
      if (res.success) {
        setCopyFeedback('Document saved successfully!');
        setTimeout(() => setCopyFeedback(null), 3000);
        router.refresh();
      } else {
        alert('Failed to save document: ' + res.error);
      }
    });
  };

  const clientFacingUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/contract/${initialDocument.access_code}`
    : `/contract/${initialDocument.access_code}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(clientFacingUrl);
    setCopyFeedback('Client link copied!');
    setTimeout(() => setCopyFeedback(null), 3000);
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

      <div className="min-h-screen bg-zinc-100 flex flex-col font-sans text-zinc-900 pb-20 print:bg-white print:p-12">
        
        {/* Top Navbar (Hidden in PDF) */}
        <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between shadow-sm print:hidden">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard/leads" 
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors"
            >
              <Icons.ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-zinc-950 flex items-center gap-2">
                <Icons.FileEdit size={18} className="text-indigo-600" />
                {initialDocument.title}
              </h1>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Ref: {initialDocument.id.split('-')[0]} &bull; Lead ID: {initialDocument.lead_id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {copyFeedback && (
              <span className="text-xs font-bold text-emerald-600 animate-in fade-in mr-2">
                {copyFeedback}
              </span>
            )}
            
            <button
              onClick={handleDownloadPDF}
              className="h-10 px-4 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Icons.Printer size={16} /> Print / PDF
            </button>

            {/* WOZ UPGRADE: Added 'Completed - Hardcopy' Option */}
            <select 
              value={status}
              onChange={(e) => handleSave(e.target.value)}
              disabled={isPending}
              className={`h-10 px-3 text-xs font-bold rounded-xl border-2 cursor-pointer focus:outline-none transition-colors ${
                status === 'Draft' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                status === 'Sent' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              <option value="Draft">Status: Draft</option>
              <option value="Sent">Status: Ready / Sent</option>
              <option value="Completed">Status: Completed (E-Signed)</option>
              <option value="Completed - Hardcopy">Status: Completed (Hardcopy)</option>
            </select>

            <button
              onClick={() => handleSave()}
              disabled={isPending}
              className="h-10 px-6 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isPending ? <Icons.Loader2 size={16} className="animate-spin" /> : <Icons.Save size={16} />}
              Save Changes
            </button>
          </div>
        </header>

        {/* Editor Canvas */}
        <main className="max-w-4xl w-full mx-auto mt-8 px-4 grid grid-cols-1 gap-6 print:m-0 print:p-0 print:block print:max-w-none">
          
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

          {clientMeta && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200 print:shadow-none print:border-zinc-300 print:rounded-none print:mb-8 print:p-0">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-4 border-b border-zinc-100 pb-2 print:border-zinc-300 print:text-zinc-800">
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

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 print:shadow-none print:border-zinc-300 print:rounded-none print:p-0 print:mb-8">
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-6 border-b border-zinc-100 pb-4 print:text-zinc-900 print:border-zinc-300">
              1. Document Variables
            </h2>
            
            <div className="space-y-5">
              {fields.map((field: any, index: number) => (
                <div key={index} className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-700 print:text-zinc-500 print:uppercase print:tracking-wider print:text-[10px]">{field.label}</label>
                  
                  <div className="print:hidden">
                    {field.type === 'textarea' ? (
                      <textarea
                        value={field.value}
                        onChange={(e) => handleFieldChange(index, e.target.value)}
                        rows={4}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 custom-scrollbar"
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                      />
                    ) : field.type === 'currency' ? (
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">₱</span>
                        <input
                          type="number"
                          value={field.value}
                          onChange={(e) => handleFieldChange(index, e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="0.00"
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => handleFieldChange(index, e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                      />
                    )}
                  </div>
                  
                  <div className="hidden print:block text-sm font-medium text-zinc-900 whitespace-pre-wrap">
                    {field.type === 'currency' 
                      ? `₱${Number(field.value || 0).toLocaleString()}` 
                      : (field.value || 'N/A')}
                  </div>
                </div>
              ))}

              {fields.length === 0 && (
                <p className="text-xs text-zinc-500 italic">No variables required for this template.</p>
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 print:shadow-none print:border-none print:p-0">
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-6 border-b border-zinc-100 pb-4 print:hidden">
              2. Master Text (Client-Specific Tweaks)
            </h2>
            
            <div className="flex flex-col gap-2">
              <p className="text-xs text-zinc-500 font-medium mb-3 print:hidden">
                The client's name has already been injected. You can format the text below to add custom legal clauses.
              </p>
              
              <RichTextEditor 
                value={bodyText} 
                onChange={(val) => handleBodyChange(val)} 
                placeholder="Enter document terms here..."
              />

              <div 
                className="hidden print:block prose prose-sm max-w-none text-zinc-900 leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: bodyText }}
              />
            </div>
          </div>

          <div className="hidden print:block mt-16 pt-8 break-inside-avoid">
            {initialDocument.signature_data ? (
              <div className="border-t-2 border-zinc-200 pt-8">
                <h4 className="text-sm font-bold text-zinc-900 mb-2 uppercase tracking-widest">Digital Execution Record</h4>
                <p className="text-xs text-zinc-600 mb-4">
                  Officially signed online via secure portal on {new Date(initialDocument.updated_at).toLocaleString()}
                </p>
                <img 
                  src={initialDocument.signature_data} 
                  alt="Client Signature" 
                  className="h-16 object-contain pointer-events-none"
                />
                <div className="w-64 h-px bg-zinc-800 mt-2" />
                <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">Client E-Signature</p>
              </div>
            ) : (
              <div className="pt-8">
                <h4 className="text-sm font-bold text-zinc-900 mb-8 uppercase tracking-widest border-b-2 border-zinc-900 pb-2 inline-block">
                  Authorization & Acceptance
                </h4>
                <div className="flex justify-between items-end gap-12 mt-12">
                  <div className="flex-1 max-w-[320px]">
                    <div className="w-full h-px bg-zinc-800 mb-2" />
                    <p className="text-xs font-black text-zinc-900 uppercase tracking-widest leading-tight">
                      {(clientMeta?.fullName || 'CLIENT').toUpperCase()} SIGNATURE
                    </p>
                    <p className="text-[10px] font-bold text-zinc-500 mt-1 uppercase tracking-wider">
                      Please sign within the line above
                    </p>
                  </div>
                  <div className="w-48">
                    <div className="w-full h-px bg-zinc-800 mb-2" />
                    <p className="text-xs font-black text-zinc-900 uppercase tracking-widest">DATE SIGNED</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-indigo-900 p-8 rounded-3xl shadow-lg border border-indigo-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 print:hidden mt-8">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2 mb-1">
                <Icons.Send size={20} className="text-indigo-400" />
                Ready to Dispatch
              </h2>
              <p className="text-xs text-indigo-200 max-w-sm leading-relaxed">
                Once you have filled out the variables and saved the document, copy this secure link and send it to the client.
              </p>
            </div>

            <div className="bg-indigo-950 p-4 rounded-2xl border border-indigo-800 flex flex-col gap-3 shrink-0 sm:w-[320px]">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-indigo-300 uppercase tracking-widest text-[10px]">Access PIN</span>
                <span className="bg-indigo-500/20 text-indigo-200 px-2 py-0.5 rounded text-[11px] font-mono tracking-widest">
                  {initialDocument.access_code}
                </span>
              </div>
              
              <button
                onClick={handleCopyLink}
                className="w-full h-11 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Icons.Copy size={16} />
                Copy Secure Client Link
              </button>
            </div>
          </div>

        </main>
      </div>
    </React.Fragment>
  );
}