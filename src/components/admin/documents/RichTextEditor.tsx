// FILE: src/components/admin/documents/RichTextEditor.tsx
"use client";

import React, { useRef, useEffect } from 'react';
import * as Icons from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  // Safely format older plain-text documents that use \n instead of HTML
  const formatInitialValue = (val: string) => {
    if (!val) return '';
    if (!val.includes('<') && val.includes('\n')) {
      return val.replace(/\n/g, '<br>');
    }
    return val;
  };

  // Inject initial value exactly once on load to prevent cursor jumping
  useEffect(() => {
    if (editorRef.current && !hasInitialized.current) {
      editorRef.current.innerHTML = formatInitialValue(value);
      hasInitialized.current = true;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const executeCommand = (command: string) => {
    // Utilize native browser HTML editing commands
    document.execCommand(command, false, undefined);
    editorRef.current?.focus();
    handleInput();
  };

  return (
    <div className="w-full bg-white border border-zinc-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 transition-all print:hidden shadow-sm">
      
      {/* Editor Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-zinc-50 border-b border-zinc-200">
        <button
          onClick={(e) => { e.preventDefault(); executeCommand('bold'); }}
          className="p-1.5 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
          title="Bold"
        >
          <Icons.Bold size={16} />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); executeCommand('italic'); }}
          className="p-1.5 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
          title="Italic"
        >
          <Icons.Italic size={16} />
        </button>
        
        <div className="w-px h-4 bg-zinc-300 mx-1" />
        
        <button
          onClick={(e) => { e.preventDefault(); executeCommand('insertUnorderedList'); }}
          className="p-1.5 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
          title="Bullet List"
        >
          <Icons.List size={16} />
        </button>
      </div>

      {/* Editable Canvas */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        className="p-5 min-h-[300px] text-sm leading-relaxed text-zinc-800 focus:outline-none prose prose-sm max-w-none custom-scrollbar"
        data-placeholder={placeholder}
      />
    </div>
  );
}