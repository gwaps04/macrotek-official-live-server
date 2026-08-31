"use client";

import { useState } from 'react';
import * as Icons from 'lucide-react';

export type QuestionType = 'text' | 'textarea' | 'radio' | 'checkbox';

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  required: boolean;
  options: string[];
}

interface QuestionnaireBuilderProps {
  initialQuestions: Question[];
}

export default function QuestionnaireBuilder({ initialQuestions }: QuestionnaireBuilderProps) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions || []);

  const addQuestion = () => {
    if (questions.length >= 10) return;
    const newQ: Question = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'text',
      question: '',
      required: true,
      options: ['Option 1'],
    };
    setQuestions([...questions, newQ]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const addOption = (qId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) return { ...q, options: [...q.options, `Option ${q.options.length + 1}`] };
      return q;
    }));
  };

  const updateOption = (qId: string, index: number, value: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        const newOptions = [...q.options];
        newOptions[index] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const removeOption = (qId: string, index: number) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        const newOptions = q.options.filter((_, i) => i !== index);
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  return (
    <div className="space-y-4">
      <input type="hidden" name="prequalificationQuestions" value={JSON.stringify(questions)} />

      <div className="flex items-center justify-between">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 block">
            Prequalification Questionnaire
          </label>
          <p className="text-[10px] text-zinc-400 font-medium mt-1">Ask up to 10 questions before clients can book.</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest flex-shrink-0 ml-2 ${questions.length >= 10 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
          {questions.length} / 10
        </span>
      </div>

      <div className="space-y-4">
        {questions.map((q, index) => (
          <div key={q.id} className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm relative group">
            
            {/* WOZ FIX: Robust Flexbox Hierarchy */}
            <div className="flex gap-3">
              
              {/* Number Badge */}
              <div className="w-6 h-6 rounded bg-zinc-100 text-zinc-500 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                {index + 1}
              </div>
              
              {/* Content Wrapper with min-w-0 to prevent flex blowout */}
              <div className="flex-1 min-w-0 space-y-3">
                
                <div className="flex items-center justify-between gap-2">
                  <input 
                    type="text" 
                    value={q.question}
                    onChange={(e) => updateQuestion(q.id, 'question', e.target.value)}
                    placeholder="Enter your question here..."
                    className="w-full text-sm font-bold text-zinc-900 border-none p-0 focus:ring-0 placeholder:text-zinc-300 bg-transparent min-w-0"
                  />
                  <button 
                    type="button" 
                    onClick={() => removeQuestion(q.id)}
                    className="text-zinc-300 hover:text-rose-500 transition-colors p-1 flex-shrink-0"
                    title="Delete Question"
                  >
                    <Icons.Trash2 size={16} />
                  </button>
                </div>

                {/* Controls Area: flex-wrap + whitespace-nowrap guarantees safety */}
                <div className="flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-3">
                  <select 
                    value={q.type}
                    onChange={(e) => updateQuestion(q.id, 'type', e.target.value as QuestionType)}
                    className="flex-1 min-w-[150px] text-xs font-medium bg-zinc-50 border border-zinc-200 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="text">Short Text (Plain)</option>
                    <option value="textarea">Long Text (Paragraph)</option>
                    <option value="radio">Radio Buttons (Single Choice)</option>
                    <option value="checkbox">Checkboxes (Multiple Choice)</option>
                  </select>

                  <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 cursor-pointer whitespace-nowrap">
                    <input 
                      type="checkbox" 
                      checked={q.required}
                      onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                      className="w-3.5 h-3.5 text-emerald-600 rounded border-zinc-300 focus:ring-emerald-500 flex-shrink-0"
                    />
                    Required Field
                  </label>
                </div>

                {(q.type === 'radio' || q.type === 'checkbox') && (
                  <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100 space-y-2 mt-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Answer Options</p>
                    {q.options.map((opt, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2">
                        {q.type === 'radio' ? <Icons.Circle size={14} className="text-zinc-300 flex-shrink-0" /> : <Icons.Square size={14} className="text-zinc-300 flex-shrink-0" />}
                        <input 
                          type="text" 
                          value={opt}
                          onChange={(e) => updateOption(q.id, optIndex, e.target.value)}
                          className="flex-1 min-w-0 text-xs bg-white border border-zinc-200 rounded px-2 py-1 focus:ring-2 focus:ring-emerald-500"
                        />
                        {q.options.length > 1 && (
                          <button type="button" onClick={() => removeOption(q.id, optIndex)} className="text-zinc-400 hover:text-rose-500 transition-colors flex-shrink-0">
                            <Icons.X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button 
                      type="button" 
                      onClick={() => addOption(q.id)}
                      className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 hover:text-emerald-700 mt-2 flex items-center gap-1"
                    >
                      <Icons.Plus size={12} /> Add Option
                    </button>
                  </div>
                )}

              </div>
            </div>
          </div>
        ))}

        {questions.length === 0 && (
          <div className="text-center p-8 border border-dashed border-zinc-300 rounded-xl bg-zinc-50">
            <Icons.ClipboardList size={32} className="mx-auto text-zinc-300 mb-2" />
            <p className="text-xs text-zinc-500 font-medium">No prequalification questions configured.</p>
          </div>
        )}
      </div>

      {questions.length < 10 && (
        <button 
          type="button" 
          onClick={addQuestion}
          className="w-full py-3 border-2 border-dashed border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
        >
          <Icons.PlusCircle size={16} /> Add Question
        </button>
      )}
    </div>
  );
}