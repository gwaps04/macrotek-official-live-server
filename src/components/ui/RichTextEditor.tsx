"use client";

import { useRef, useEffect } from 'react';
import { Bold, Italic, Link as LinkIcon, List, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';

interface RichTextEditorProps {
  name: string;
  defaultValue?: string;
  placeholder?: string;
}

export default function RichTextEditor({ name, defaultValue = '', placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editorRef.current && defaultValue) {
      editorRef.current.innerHTML = defaultValue;
    }
  }, [defaultValue]);

  const formatText = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    syncToHiddenInput();
  };

  const insertLink = () => {
    const url = prompt('Enter link URL (e.g., https://...):');
    if (url) formatText('createLink', url);
  };

  const syncToHiddenInput = () => {
    if (hiddenInputRef.current && editorRef.current) {
      hiddenInputRef.current.value = editorRef.current.innerHTML;
    }
  };

  return (
    <div className="w-full border border-zinc-200 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-zinc-900 transition-shadow">
      
      {/* WOZ FIX: Expanded Toolbar with Alignment Controls */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-zinc-100 bg-zinc-50">
        <button type="button" onClick={() => formatText('bold')} className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors" title="Bold">
          <Bold size={16} strokeWidth={2.5} />
        </button>
        <button type="button" onClick={() => formatText('italic')} className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors" title="Italic">
          <Italic size={16} strokeWidth={2.5} />
        </button>
        <div className="w-px h-4 bg-zinc-300 mx-1" />
        <button type="button" onClick={() => formatText('insertUnorderedList')} className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors" title="Bullet List">
          <List size={16} strokeWidth={2.5} />
        </button>
        <button type="button" onClick={insertLink} className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors" title="Insert Link">
          <LinkIcon size={16} strokeWidth={2.5} />
        </button>
        <div className="w-px h-4 bg-zinc-300 mx-1" />
        <button type="button" onClick={() => formatText('justifyLeft')} className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors" title="Align Left">
          <AlignLeft size={16} strokeWidth={2.5} />
        </button>
        <button type="button" onClick={() => formatText('justifyCenter')} className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors" title="Align Center">
          <AlignCenter size={16} strokeWidth={2.5} />
        </button>
        <button type="button" onClick={() => formatText('justifyRight')} className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors" title="Align Right">
          <AlignRight size={16} strokeWidth={2.5} />
        </button>
        <button type="button" onClick={() => formatText('justifyFull')} className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded-md transition-colors" title="Justify">
          <AlignJustify size={16} strokeWidth={2.5} />
        </button>
      </div>

      <div 
        ref={editorRef}
        contentEditable
        onInput={syncToHiddenInput}
        onBlur={syncToHiddenInput}
        className="w-full min-h-[120px] max-h-[300px] overflow-y-auto p-4 text-sm text-zinc-800 focus:outline-none prose prose-sm prose-zinc max-w-none"
        data-placeholder={placeholder}
      />
      
      <input type="hidden" name={name} ref={hiddenInputRef} defaultValue={defaultValue} />
    </div>
  );
}