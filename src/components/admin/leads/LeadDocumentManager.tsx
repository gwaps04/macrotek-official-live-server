// FILE: src/components/admin/leads/LeadDocumentManager.tsx
"use client";

import React, { useState, useEffect, useTransition } from 'react';
import * as Icons from 'lucide-react';
import Link from 'next/link';
import { 
  getFormTemplatesAction, 
  generateDocumentAction, 
  getLeadDocumentsAction 
} from '@/app/(admin)/dashboard/leads/document.actions';

interface LeadDocumentManagerProps {
  leadId: string;
  leadType: string;
  leadFullName: string;
}

export default function LeadDocumentManager({ leadId, leadType, leadFullName }: LeadDocumentManagerProps) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [tplRes, docRes] = await Promise.all([
        getFormTemplatesAction(),
        getLeadDocumentsAction(leadId)
      ]);
      
      // WOZ FIX: Added || [] to satisfy strict TypeScript null checking
      if (tplRes.success) setTemplates(tplRes.templates || []);
      if (docRes.success) setDocuments(docRes.documents || []);
      
      setIsLoading(false);
    }
    loadData();
  }, [leadId]);

  const handleGenerate = () => {
    if (!selectedTemplate) return;
    
    startTransition(async () => {
      const res = await generateDocumentAction(leadId, leadType, selectedTemplate);
      if (res.success && res.document) {
        // Prepend the newly created document to the list instantly
        setDocuments(prev => [res.document, ...prev]);
        setSelectedTemplate(''); // Reset dropdown
      } else {
        alert(`Failed to generate document: ${res.error}`);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="p-5 bg-zinc-50 border border-zinc-200/80 rounded-2xl flex items-center justify-center h-32 animate-pulse">
        <div className="flex flex-col items-center gap-2 text-zinc-400">
          <Icons.Loader2 size={24} className="animate-spin" />
          <span className="text-xs font-medium uppercase tracking-wider">Loading Engine...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 bg-zinc-50 border border-zinc-200/80 rounded-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
          <Icons.Files size={14} className="text-indigo-500" /> Form &amp; Contract Engine
        </h4>
        <span className="text-[10px] font-bold bg-zinc-200 text-zinc-600 px-2 py-0.5 rounded-full">
          {documents.length} Attached
        </span>
      </div>

      {/* INSTANTIATION CONTROLS */}
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
          disabled={isPending}
          className="flex-1 bg-white border border-zinc-200 text-sm text-zinc-800 rounded-xl px-3 h-11 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
        >
          <option value="" disabled>Select a Master Template...</option>
          {templates.map(t => (
            <option key={t.id} value={t.id}>{t.title} ({t.type})</option>
          ))}
        </select>
        <button
          onClick={handleGenerate}
          disabled={!selectedTemplate || isPending}
          className="px-5 h-11 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          {isPending ? <Icons.Loader2 size={16} className="animate-spin" /> : <Icons.FilePlus size={16} />}
          Load Template
        </button>
      </div>

      {/* ATTACHED DOCUMENTS LIST */}
      {documents.length > 0 && (
        <div className="mt-4 space-y-2">
          {documents.map(doc => (
            <div key={doc.id} className="p-3 bg-white border border-zinc-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm group">
              <div>
                <div className="flex items-center gap-2">
                  <h5 className="text-sm font-bold text-zinc-900">{doc.title}</h5>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                    doc.status === 'Draft' ? 'bg-amber-100 text-amber-800' :
                    doc.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {doc.status}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Created {new Date(doc.created_at).toLocaleDateString()} &bull; PIN: {doc.access_code}
                </p>
              </div>
              
              <Link
                href={`/dashboard/documents/${doc.id}`}
                target="_blank"
                className="px-4 py-2 bg-zinc-100 group-hover:bg-indigo-50 text-zinc-700 group-hover:text-indigo-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shrink-0"
              >
                <Icons.ExternalLink size={14} /> Open Editor
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}