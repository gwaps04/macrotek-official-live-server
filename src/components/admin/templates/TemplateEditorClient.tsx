// FILE: src/components/admin/templates/TemplateEditorClient.tsx
"use client";

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import { saveTemplateAction } from '@/app/(admin)/dashboard/templates/template.actions';
import RichTextEditor from '@/components/admin/documents/RichTextEditor';

interface TemplateEditorProps {
  templateId: string;
  initialData?: any;
}

export default function TemplateEditorClient({ templateId, initialData }: TemplateEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  // Safely parse existing JSON or default to blank architecture
  const schemaJson = initialData?.schema_json 
    ? (typeof initialData.schema_json === 'string' ? JSON.parse(initialData.schema_json) : initialData.schema_json)
    : { fields: [], body: '', require_signature: true };

  // Core State
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [type, setType] = useState(initialData?.type || 'Agreement');
  const [fields, setFields] = useState<{ label: string; type: string; value: string }[]>(schemaJson.fields || []);
  const [body, setBody] = useState(schemaJson.body || '');
  const [requireSignature, setRequireSignature] = useState(schemaJson.require_signature ?? true);

  // Field Array Handlers
  const addField = () => {
    setFields([...fields, { label: 'New Variable', type: 'text', value: '' }]);
  };

  const updateField = (index: number, key: string, value: string) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: value };
    setFields(updated);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  // Compile and Save
  const handleSave = () => {
    if (!title.trim()) {
      alert("Template Title is required.");
      return;
    }

    startTransition(async () => {
      const payload = {
        title,
        description,
        type,
        schema_json: {
          fields,
          body,
          require_signature: requireSignature,
        }
      };

      const res = await saveTemplateAction(templateId, payload);
      
      if (res.success) {
        setFeedback("Template saved successfully!");
        setTimeout(() => {
          setFeedback(null);
          router.push('/dashboard/templates');
        }, 1500);
      } else {
        alert("Failed to save: " + res.error);
      }
    });
  };

  // Smart Tag Injector Helper
  const copySmartTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    alert(`Copied ${tag} to clipboard! Paste it into the editor below.`);
  };

  return (
    <React.Fragment>
      <div className="min-h-screen bg-zinc-100 flex flex-col font-sans text-zinc-900 pb-24">
        
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard/templates" 
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors"
            >
              <Icons.ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-zinc-950 flex items-center gap-2">
                <Icons.LayoutTemplate size={18} className="text-indigo-600" />
                {templateId === 'new' ? 'Build New Template' : 'Edit Master Template'}
              </h1>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Configure variables and boilerplate clauses.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {feedback && (
              <span className="text-xs font-bold text-emerald-600 animate-in fade-in mr-2">
                {feedback}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isPending}
              className="h-10 px-6 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isPending ? <Icons.Loader2 size={16} className="animate-spin" /> : <Icons.Save size={16} />}
              Save &amp; Compile
            </button>
          </div>
        </header>

        <main className="max-w-6xl w-full mx-auto mt-8 px-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: Metadata & Variables */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Metadata Card */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200">
              <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4 border-b border-zinc-100 pb-2">
                1. Template Identity
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1.5">Document Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Monthly Retainer Agreement"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1.5">Category Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="Agreement">Legal Agreement</option>
                    <option value="Intake Form">Intake Form</option>
                    <option value="Proposal">Proposal</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1.5">Internal Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="What is this template used for?"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 custom-scrollbar"
                  />
                </div>
                
                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={requireSignature}
                        onChange={(e) => setRequireSignature(e.target.checked)}
                        className="peer sr-only" 
                      />
                      <div className="w-5 h-5 rounded-md border-2 border-zinc-300 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all flex items-center justify-center">
                        <Icons.Check size={14} className="text-white opacity-0 peer-checked:opacity-100" />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zinc-900">Require E-Signature</span>
                      <span className="text-[10px] text-zinc-500">Appends signature block to bottom of document.</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Variable Engine Card */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200">
              <div className="flex items-center justify-between mb-4 border-b border-zinc-100 pb-2">
                <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">
                  2. Custom Variables
                </h2>
                <button
                  onClick={addField}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                >
                  <Icons.Plus size={14} /> Add Field
                </button>
              </div>

              {fields.length === 0 ? (
                <p className="text-xs text-zinc-500 italic text-center py-4 bg-zinc-50 rounded-xl border border-zinc-100">
                  No custom variables required yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, idx) => (
                    <div key={idx} className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 relative group">
                      <button 
                        onClick={() => removeField(idx)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-zinc-200 text-zinc-400 hover:text-red-500 hover:border-red-200 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                        title="Remove Variable"
                      >
                        <Icons.X size={12} />
                      </button>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Field Label</label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateField(idx, 'label', e.target.value)}
                            placeholder="e.g. Project Cost"
                            className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Input Type</label>
                          <select
                            value={field.type}
                            onChange={(e) => updateField(idx, 'type', e.target.value)}
                            className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="text">Short Text</option>
                            <option value="textarea">Long Paragraph</option>
                            <option value="currency">Currency (₱)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: Boilerplate Editor */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            <div className="bg-indigo-950 rounded-3xl p-6 shadow-sm border border-indigo-900 text-white">
              <h2 className="text-xs font-black uppercase tracking-widest text-indigo-300 mb-3 flex items-center gap-2">
                <Icons.Wand2 size={16} /> Smart Tag Glossary
              </h2>
              <p className="text-xs text-indigo-200 mb-4 max-w-xl leading-relaxed">
                Click any tag below to copy it, then paste it into your document text. When a contract is generated, the system will automatically inject the specific client's data into these slots.
              </p>
              
              <div className="flex flex-wrap gap-2">
                {['{{client_name}}', '{{client_email}}', '{{client_phone}}', '{{client_address}}', '{{event_date}}', '{{event_time}}'].map(tag => (
                  <button 
                    key={tag}
                    onClick={() => copySmartTag(tag)}
                    className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-500/30 rounded-lg text-[11px] font-mono font-bold text-indigo-100 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-200 flex-1 flex flex-col">
              <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-4 border-b border-zinc-100 pb-2">
                3. Master Boilerplate Text
              </h2>
              <p className="text-xs text-zinc-500 mb-4">
                Write your legal terms below. The Client Profile block (Name, Address, etc.) and your Custom Variables will automatically be printed at the top of the final document.
              </p>
              
              <div className="flex-1 min-h-[500px]">
                <RichTextEditor 
                  value={body} 
                  onChange={setBody} 
                  placeholder="Paste your standard terms and conditions here..."
                />
              </div>
            </div>

          </div>
        </main>
      </div>
    </React.Fragment>
  );
}