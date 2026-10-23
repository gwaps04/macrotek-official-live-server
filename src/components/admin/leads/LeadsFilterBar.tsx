// FILE: src/components/admin/leads/LeadsFilterBar.tsx
"use client";

import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { FilterType, DatePreset, DateTarget } from './types';

interface LeadsFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  typeFilter: FilterType;
  onTypeFilterChange: (t: FilterType) => void;
  
  // WOZ UPGRADE: Updated Contract Filter interface
  contractFilter: 'all' | 'signed' | 'unsigned' | 'none';
  onContractFilterChange: (c: 'all' | 'signed' | 'unsigned' | 'none') => void;
  
  datePreset: DatePreset;
  onDatePresetChange: (p: DatePreset) => void;
  dateTarget: DateTarget;
  onDateTargetChange: (t: DateTarget) => void;
  customStartDate: string;
  onCustomStartDateChange: (d: string) => void;
  customEndDate: string;
  onCustomEndDateChange: (d: string) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  totalCount: number;
  filteredCount: number;
  appointmentCount: number;
  enrollmentCount: number;
}

export default function LeadsFilterBar({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  contractFilter,
  onContractFilterChange,
  datePreset,
  onDatePresetChange,
  dateTarget,
  onDateTargetChange,
  customStartDate,
  onCustomStartDateChange,
  customEndDate,
  onCustomEndDateChange,
  onResetFilters,
  hasActiveFilters,
  totalCount,
  filteredCount,
  appointmentCount,
  enrollmentCount,
}: LeadsFilterBarProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const DATE_PRESETS: { id: DatePreset; label: string }[] = [
    { id: 'all', label: 'All Dates' },
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'last7', label: 'Last 7 Days' },
    { id: 'last30', label: 'Last 30 Days' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'custom', label: 'Custom Range' },
  ];

  const CONTRACT_FILTERS: { id: 'all' | 'signed' | 'unsigned' | 'none'; label: string }[] = [
    { id: 'all', label: 'All Leads' },
    { id: 'signed', label: 'Signed' },
    { id: 'unsigned', label: 'Pending Signature' },
    { id: 'none', label: 'No Contract' }
  ];

  return (
    <div className="p-5 bg-white rounded-2xl border border-zinc-200 shadow-xs space-y-4">
      
      {/* Row 1: Search Bar & Source Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        
        {/* Client Search bar */}
        <div className="relative flex-1 max-w-lg">
          <Icons.Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search client by name, email, phone, address, topic..."
            className="w-full pl-10 pr-9 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-2xs"
          />
          {searchQuery && (
            <button 
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
              title="Clear search"
            >
              <Icons.X size={14} />
            </button>
          )}
        </div>

        {/* Source Filter Tabs */}
        <div className="flex items-center p-1 bg-zinc-100 rounded-xl self-start lg:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => onTypeFilterChange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${typeFilter === 'all' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'}`}
          >
            All Leads ({totalCount})
          </button>
          <button
            onClick={() => onTypeFilterChange('appointment')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${typeFilter === 'appointment' ? 'bg-white text-emerald-700 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'}`}
          >
            <Icons.CalendarCheck size={13} className="text-emerald-600" />
            Appointments ({appointmentCount})
          </button>
          <button
            onClick={() => onTypeFilterChange('enrollment')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${typeFilter === 'enrollment' ? 'bg-white text-indigo-700 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'}`}
          >
            <Icons.GraduationCap size={13} className="text-indigo-600" />
            Enrollments ({enrollmentCount})
          </button>
        </div>

      </div>

      {/* Row 2: Date Filter Engine & Contract Filters */}
      <div className="pt-3 border-t border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        
        {/* Date Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          <div className="flex items-center gap-1 text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">
            <Icons.Calendar size={13} className="text-zinc-400" />
            Date:
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {DATE_PRESETS.map((dp) => (
              <button
                key={dp.id}
                onClick={() => {
                  onDatePresetChange(dp.id);
                  if (dp.id === 'custom') setShowDatePicker(true);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  datePreset === dp.id 
                    ? 'bg-zinc-900 text-white font-bold shadow-2xs' 
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {dp.label}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg ml-1">
            <button
              onClick={() => onDateTargetChange('scheduled')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${dateTarget === 'scheduled' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'}`}
            >
              Event Date
            </button>
            <button
              onClick={() => onDateTargetChange('created')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${dateTarget === 'created' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'}`}
            >
              Captured
            </button>
          </div>

          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={`p-1 rounded-lg border text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors ${showDatePicker ? 'bg-zinc-100 border-zinc-300' : 'border-zinc-200'}`}
            title="Custom Date Pickers"
          >
            <Icons.SlidersHorizontal size={13} />
          </button>
        </div>

        {/* Contract Filter Pills (Replaces old Pipeline Status) */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-zinc-400 font-semibold uppercase text-[10px] tracking-wider mr-1 flex items-center gap-1">
            <Icons.FileSignature size={13} />
            Contract:
          </span>
          {CONTRACT_FILTERS.map((cf) => (
            <button
              key={cf.id}
              onClick={() => onContractFilterChange(cf.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                contractFilter === cf.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              {cf.label}
            </button>
          ))}
        </div>

      </div>

      {/* Row 3: Custom Date Range Pickers */}
      {(showDatePicker || datePreset === 'custom') && (
        <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 flex flex-wrap items-center gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-700">From Date:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => {
                onCustomStartDateChange(e.target.value);
                onDatePresetChange('custom');
              }}
              className="bg-white border border-zinc-200 rounded-lg px-2.5 py-1 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-700">To Date:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => {
                onCustomEndDateChange(e.target.value);
                onDatePresetChange('custom');
              }}
              className="bg-white border border-zinc-200 rounded-lg px-2.5 py-1 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {(customStartDate || customEndDate) && (
            <button
              onClick={() => {
                onCustomStartDateChange('');
                onCustomEndDateChange('');
                onDatePresetChange('all');
              }}
              className="text-xs text-red-600 hover:text-red-700 font-medium ml-auto"
            >
              Clear Range
            </button>
          )}
        </div>
      )}

      {/* Active Filter Summary Bar */}
      <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
        <div>
          <span>Showing </span>
          <strong className="text-zinc-900 font-bold">{filteredCount}</strong>
          <span> of {totalCount} total leads</span>
          {hasActiveFilters && (
            <span className="text-emerald-600 font-semibold ml-2">
              (Filtered)
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Icons.RotateCcw size={12} />
            Reset All Filters
          </button>
        )}
      </div>

    </div>
  );
}