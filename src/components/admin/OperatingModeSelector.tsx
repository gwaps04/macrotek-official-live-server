"use client";

import React, { useState, useTransition } from 'react';
import * as Icons from 'lucide-react';
import { switchOperatingModeAction, PlatformOperatingMode } from '@/app/(admin)/dashboard/operatingMode.actions';

// FILE: src/components/admin/OperatingModeSelector.tsx

interface OperatingModeSelectorProps {
  initialMode: PlatformOperatingMode;
}

export function OperatingModeSelector({ initialMode }: OperatingModeSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<PlatformOperatingMode>(initialMode);
  const [persistedMode, setPersistedMode] = useState<PlatformOperatingMode>(initialMode);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSelectMode = (mode: PlatformOperatingMode) => {
    setSelectedMode(mode);
  };

  const handleInstantApply = () => {
    setFeedback(null);
    startTransition(async () => {
      const res = await switchOperatingModeAction(selectedMode);
      if (res.success) {
        setPersistedMode(selectedMode);
        setFeedback({
          type: 'success',
          message: res.message || `Switched to ${selectedMode === 'appointment' ? 'Appointment' : 'Enrollment'} Mode!`
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Failed to switch operating mode.'
        });
      }
      setTimeout(() => setFeedback(null), 4000);
    });
  };

  const isDirty = selectedMode !== persistedMode;

  return (
    <section className="bg-zinc-900 p-6 sm:p-8 rounded-2xl border border-zinc-800 shadow-xl relative overflow-hidden space-y-6">
      
      {/* Dynamic Ambient Gradient Top Line */}
      <div className={`absolute top-0 left-0 w-full h-1.5 transition-colors duration-500 ${
        selectedMode === 'appointment'
          ? 'bg-linear-to-r from-emerald-500 via-teal-400 to-emerald-600'
          : 'bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-600'
      }`} />

      {/* Hidden input to pass value when main settings form is submitted */}
      <input type="hidden" name="operatingMode" value={selectedMode} />
      {/* Backwards-compatible legacy inputs for any dependent actions */}
      <input type="hidden" name="enableAppointments" value={selectedMode === 'appointment' ? 'on' : 'off'} />
      <input type="hidden" name="enableEnrollments" value={selectedMode === 'enrollment' ? 'on' : 'off'} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            selectedMode === 'appointment'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-indigo-500/20 text-indigo-400'
          }`}>
            <Icons.Cpu size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Platform Operating Mode
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                persistedMode === 'appointment'
                  ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                  : 'bg-indigo-950/80 border border-indigo-500/40 text-indigo-300'
              }`}>
                Active: {persistedMode === 'appointment' ? 'Appointment Mode' : 'Enrollment Mode'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Select one exclusive operating engine for your platform. The active engine automatically dictates the primary Storefront CTA and Admin sidebar routing.
            </p>
          </div>
        </div>

        {/* Quick Instant Apply Button */}
        {isDirty && (
          <button
            type="button"
            onClick={handleInstantApply}
            disabled={isPending}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              selectedMode === 'appointment'
                ? 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700'
                : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700'
            }`}
          >
            {isPending ? (
              <React.Fragment>
                <Icons.Loader2 size={14} className="animate-spin" />
                <span>Applying Switch...</span>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <Icons.Zap size={14} />
                <span>Apply Switch Now</span>
              </React.Fragment>
            )}
          </button>
        )}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 animate-fadeIn border ${
          feedback.type === 'success'
            ? 'bg-emerald-950/70 border-emerald-700/80 text-emerald-200'
            : 'bg-red-950/70 border-red-700/80 text-red-200'
        }`}>
          {feedback.type === 'success' ? (
            <Icons.CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          ) : (
            <Icons.AlertCircle size={16} className="text-red-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Dual Exclusive Choice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* OPTION 1: APPOINTMENT ENGINE */}
        <div
          onClick={() => handleSelectMode('appointment')}
          className={`relative p-5 sm:p-6 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            selectedMode === 'appointment'
              ? 'bg-emerald-950/20 border-emerald-500 shadow-xl shadow-emerald-950/40 ring-1 ring-emerald-500/50'
              : 'bg-zinc-950/60 border-zinc-800 opacity-60 hover:opacity-90 hover:border-zinc-700'
          }`}
        >
          {selectedMode === 'appointment' && (
            <div className="absolute -top-3 right-4 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest px-3 py-0.5 rounded-full shadow-md flex items-center gap-1">
              <Icons.Check size={11} /> Selected Engine
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                  selectedMode === 'appointment' 
                    ? 'bg-emerald-500 text-zinc-950' 
                    : 'bg-zinc-800 text-zinc-400'
                }`}>
                  <Icons.CalendarClock size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm tracking-wide">
                    Appointment Engine
                  </h4>
                  <span className="text-[11px] text-emerald-400 font-medium">
                    1-on-1 Consultations &amp; Site Inspections
                  </span>
                </div>
              </div>

              {/* Custom Radio Circle */}
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                selectedMode === 'appointment' 
                  ? 'border-emerald-500 bg-emerald-500/20' 
                  : 'border-zinc-700 bg-zinc-900'
              }`}>
                {selectedMode === 'appointment' && (
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-xs" />
                )}
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed mb-4">
              Tailored for service agencies, client consultancies, medical practices, and professional appointments requiring discrete date and time-slot availability.
            </p>

            {/* Feature Checklist */}
            <div className="space-y-2 border-t border-zinc-800/80 pt-3 text-[11px] text-zinc-400 font-sans">
              <div className="flex items-center gap-2 text-zinc-300">
                <Icons.Check size={13} className="text-emerald-400 shrink-0" />
                <span>Storefront Primary CTA: <strong>Book Now</strong> (<code className="text-[10px] text-emerald-400">/book</code>)</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <Icons.Check size={13} className="text-emerald-400 shrink-0" />
                <span>Admin Navigation: <strong>Appointment Calendar</strong> active</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <Icons.Check size={13} className="text-emerald-400 shrink-0" />
                <span>Time-slot capacity and daily booking schedule limits</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
            <span className={selectedMode === 'appointment' ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
              {selectedMode === 'appointment' ? '● Mode Selected' : 'Click to select this mode'}
            </span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
              Engine 01
            </span>
          </div>
        </div>

        {/* OPTION 2: ENROLLMENT ENGINE */}
        <div
          onClick={() => handleSelectMode('enrollment')}
          className={`relative p-5 sm:p-6 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            selectedMode === 'enrollment'
              ? 'bg-indigo-950/20 border-indigo-500 shadow-xl shadow-indigo-950/40 ring-1 ring-indigo-500/50'
              : 'bg-zinc-950/60 border-zinc-800 opacity-60 hover:opacity-90 hover:border-zinc-700'
          }`}
        >
          {selectedMode === 'enrollment' && (
            <div className="absolute -top-3 right-4 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest px-3 py-0.5 rounded-full shadow-md flex items-center gap-1">
              <Icons.Check size={11} /> Selected Engine
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                  selectedMode === 'enrollment' 
                    ? 'bg-indigo-500 text-zinc-950' 
                    : 'bg-zinc-800 text-zinc-400'
                }`}>
                  <Icons.GraduationCap size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm tracking-wide">
                    Enrollment Engine
                  </h4>
                  <span className="text-[11px] text-indigo-400 font-medium">
                    Classes, Workshops &amp; Capacity Rosters
                  </span>
                </div>
              </div>

              {/* Custom Radio Circle */}
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                selectedMode === 'enrollment' 
                  ? 'border-indigo-500 bg-indigo-500/20' 
                  : 'border-zinc-700 bg-zinc-900'
              }`}>
                {selectedMode === 'enrollment' && (
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-xs" />
                )}
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed mb-4">
              Tailored for academies, training centers, fitness studios, cohort bootcamps, and multi-session classes with seat-capacity enrollment caps.
            </p>

            {/* Feature Checklist */}
            <div className="space-y-2 border-t border-zinc-800/80 pt-3 text-[11px] text-zinc-400 font-sans">
              <div className="flex items-center gap-2 text-zinc-300">
                <Icons.Check size={13} className="text-indigo-400 shrink-0" />
                <span>Storefront Primary CTA: <strong>View Classes</strong> (<code className="text-[10px] text-indigo-400">/classes</code>)</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <Icons.Check size={13} className="text-indigo-400 shrink-0" />
                <span>Admin Navigation: <strong>Curriculum &amp; Class Calendar</strong> active</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <Icons.Check size={13} className="text-indigo-400 shrink-0" />
                <span>Student attendee ticketing &amp; roster payment tracking</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px]">
            <span className={selectedMode === 'enrollment' ? 'text-indigo-400 font-bold' : 'text-zinc-500'}>
              {selectedMode === 'enrollment' ? '● Mode Selected' : 'Click to select this mode'}
            </span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
              Engine 02
            </span>
          </div>
        </div>

      </div>

      {/* Enforcement Notice */}
      <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
        <span className="flex items-center gap-1.5">
          <Icons.ShieldCheck size={14} className="text-zinc-500" />
          Single-mode exclusivity enforced: Switching mode automatically retires the other engine.
        </span>
        {isDirty && (
          <span className="text-amber-400 font-semibold text-[11px] animate-pulse">
            Unsaved Mode Change: Click &quot;Apply Switch Now&quot; or save form below
          </span>
        )}
      </div>

    </section>
  );
}

export default OperatingModeSelector;
