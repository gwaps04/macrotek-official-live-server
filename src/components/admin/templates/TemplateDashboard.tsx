// FILE: src/components/admin/templates/TemplateDashboard.tsx
"use client";

import React, { useState, useTransition } from 'react';
import * as Icons from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  toggleTemplateStatusAction, 
  deleteTemplateAction, 
  duplicateTemplateAction 
} from '@/app/(admin)/dashboard/templates/template.actions';

interface TemplateDashboardProps {
  initialTemplates: any[];
}

export default function TemplateDashboard({ initialTemplates }: TemplateDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [templates, setTemplates] = useState(initialTemplates);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const totalTemplates = templates.length;
  const activeCount = templates.filter(t => t.is_active).length;
  const totalUses = templates.reduce((sum, t) => sum + (t.usage_count || 0), 0);

  const handleToggle = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      const res = await toggleTemplateStatusAction(id, currentStatus);
      if (res.success) {
        setTemplates(prev => prev.map(t => t.id === id ? { ...t, is_active: res.is_active } : t));
      } else {
        showFeedback('error', res.error || 'Failed to toggle status');
      }
    });
  };

  const handleDuplicate = (id: string) => {
    startTransition(async () => {
      const res = await duplicateTemplateAction(id);
      if (res.success) {
        showFeedback('success', 'Template duplicated successfully.');
        router.refresh(); // Fetch the new array from the server
      } else {
        showFeedback('error', res.error || 'Failed to duplicate template');
      }
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (!window.confirm(`WARNING: Are you sure you want to delete the master template for "${title}"?\n\nThis cannot be undone.`)) {
      return;
    }

    startTransition(async () => {
      const res = await deleteTemplateAction(id);
      if (res.success) {
        setTemplates(prev => prev.filter(t => t.id !== id));
        showFeedback('success', 'Template permanently deleted.');
      } else {
        showFeedback('error', res.error || 'Failed to delete template');
      }
    });
  };

  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <React.Fragment>
      <div className="space-y-6 max-w-7xl pb-24">
        
        {/* Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-zinc-950 tracking-tight">
              Master Template Library
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Build, manage, and track legal contracts and intake forms for your Form Engine.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {feedback && (
              <span className={`text-xs font-bold animate-in fade-in ${feedback.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                {feedback.msg}
              </span>
            )}
            <Link
              href="/dashboard/templates/new"
              className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm"
            >
              <Icons.Plus size={16} /> Create New Template
            </Link>
          </div>
        </div>

        {/* Global Metrics Board */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-xs">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Total Templates</span>
            <span className="text-2xl font-black text-zinc-900">{totalTemplates}</span>
          </div>
          <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-xs">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Active / Live</span>
            <span className="text-2xl font-black text-emerald-600">{activeCount}</span>
          </div>
          <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-xs">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Total Network Uses</span>
            <span className="text-2xl font-black text-indigo-600">{totalUses}</span>
          </div>
        </div>

        {/* Template Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.length === 0 ? (
            <div className="col-span-full py-16 flex flex-col items-center justify-center bg-zinc-50 border border-zinc-200 border-dashed rounded-2xl">
              <Icons.FileStack size={32} className="text-zinc-300 mb-3" />
              <h3 className="text-sm font-bold text-zinc-700">No Templates Found</h3>
              <p className="text-xs text-zinc-500 mt-1">Create your first document template to start automating.</p>
            </div>
          ) : (
            templates.map(template => (
              <div key={template.id} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs flex flex-col transition-all hover:shadow-md">
                
                {/* Card Header */}
                <div className="p-5 border-b border-zinc-100 flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <span className="px-2.5 py-1 bg-zinc-100 text-zinc-600 text-[10px] font-black uppercase tracking-widest rounded-lg">
                      {template.type}
                    </span>
                    <button
                      onClick={() => handleToggle(template.id, template.is_active)}
                      disabled={isPending}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${template.is_active ? 'bg-emerald-500' : 'bg-zinc-300'}`}
                      title={template.is_active ? 'Disable Template' : 'Enable Template'}
                    >
                      <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${template.is_active ? 'translate-x-1.5' : '-translate-x-1.5'}`} />
                    </button>
                  </div>
                  
                  <h3 className="text-base font-bold text-zinc-950 leading-tight mb-2">
                    {template.title}
                  </h3>
                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                    {template.description || 'No description provided.'}
                  </p>
                </div>

                {/* Metrics Bar */}
                <div className="px-5 py-3 bg-zinc-50/50 flex items-center justify-between text-xs font-medium">
                  <span className="text-zinc-500 flex items-center gap-1.5">
                    <Icons.History size={14} className="text-zinc-400" />
                    {template.usage_count} Document(s) Generated
                  </span>
                </div>

                {/* Actions Footer */}
                <div className="p-3 bg-zinc-50 border-t border-zinc-200/80 flex items-center gap-2">
                  <Link 
                    href={`/dashboard/templates/${template.id}`}
                    className="flex-1 h-9 bg-white border border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300 text-zinc-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Icons.Settings2 size={14} /> Open Builder
                  </Link>
                  <button 
                    onClick={() => handleDuplicate(template.id)}
                    disabled={isPending}
                    className="w-10 h-9 flex items-center justify-center bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-600 rounded-xl transition-colors disabled:opacity-50"
                    title="Duplicate Template"
                  >
                    <Icons.Copy size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(template.id, template.title)}
                    disabled={isPending}
                    className="w-10 h-9 flex items-center justify-center bg-white border border-red-200 hover:bg-red-50 text-red-500 rounded-xl transition-colors disabled:opacity-50"
                    title="Delete Template"
                  >
                    <Icons.Trash2 size={14} />
                  </button>
                </div>

              </div>
            ))
          )}
        </div>
      </div>
    </React.Fragment>
  );
}