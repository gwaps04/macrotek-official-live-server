"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import { UnifiedLead, FilterType, StatusFilter, DatePreset, DateTarget } from './types';
import LeadsStatsHeader from './LeadsStatsHeader';
import LeadsFilterBar from './LeadsFilterBar';
import LeadsTable from './LeadsTable';
import LeadDetailModal from './LeadDetailModal';

// FILE: src/components/admin/leads/LeadsCommandCenter.tsx

interface LeadsCommandCenterProps {
  initialLeads: UnifiedLead[];
}

export default function LeadsCommandCenter({ initialLeads }: LeadsCommandCenterProps) {
  const router = useRouter();
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [contractFilter, setContractFilter] = useState<'all' | 'Signed' | 'Pending'>('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [dateTarget, setDateTarget] = useState<DateTarget>('scheduled');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // Active modal lead
  const [selectedLead, setSelectedLead] = useState<UnifiedLead | null>(null);

  // Filter and Search Pipeline
  const filteredLeads = useMemo(() => {
    // Current date helpers for preset comparison
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    const last7Date = new Date();
    last7Date.setDate(last7Date.getDate() - 7);
    const last7Str = last7Date.toISOString().split('T')[0];

    const last30Date = new Date();
    last30Date.setDate(last30Date.getDate() - 30);
    const last30Str = last30Date.toISOString().split('T')[0];

    return initialLeads.filter((lead) => {
      // 1. Source / Type filter
      if (typeFilter !== 'all' && lead.type !== typeFilter) {
        return false;
      }

      // 2. Status filter
      if (statusFilter !== 'all') {
        const leadStatus = (lead.status || '').toLowerCase();
        const targetStatus = statusFilter.toLowerCase();
        if (leadStatus !== targetStatus) return false;
      }

      // 2b. Contract filter
      if (contractFilter !== 'all') {
        if (contractFilter === 'Signed' && lead.contractStatus !== 'Signed') return false;
        if (contractFilter === 'Pending' && lead.contractStatus === 'Signed') return false;
      }

      // 3. Date filter
      if (datePreset !== 'all') {
        // Resolve target date in YYYY-MM-DD
        const leadDateStr = dateTarget === 'scheduled'
          ? (lead.date && /^\d{4}-\d{2}-\d{2}$/.test(lead.date) ? lead.date : (lead.createdAt ? lead.createdAt.split('T')[0] : ''))
          : (lead.createdAt ? lead.createdAt.split('T')[0] : '');

        if (leadDateStr) {
          if (datePreset === 'today' && leadDateStr !== todayStr) return false;
          if (datePreset === 'yesterday' && leadDateStr !== yesterdayStr) return false;
          if (datePreset === 'last7' && (leadDateStr < last7Str || leadDateStr > todayStr)) return false;
          if (datePreset === 'last30' && (leadDateStr < last30Str || leadDateStr > todayStr)) return false;
          if (datePreset === 'upcoming' && leadDateStr < todayStr) return false;
          if (datePreset === 'custom') {
            if (customStartDate && leadDateStr < customStartDate) return false;
            if (customEndDate && leadDateStr > customEndDate) return false;
          }
        }
      }

      // 4. Search query matching across all client fields
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = lead.fullName.toLowerCase().includes(q);
        const matchesFirst = lead.firstName.toLowerCase().includes(q);
        const matchesLast = lead.lastName.toLowerCase().includes(q);
        const matchesEmail = lead.email.toLowerCase().includes(q);
        const matchesPhone = lead.phone.toLowerCase().includes(q);
        const matchesTitle = lead.title.toLowerCase().includes(q);
        const matchesAddress = (lead.address || '').toLowerCase().includes(q);
        const matchesNotes = (lead.notes || '').toLowerCase().includes(q);
        const matchesCompany = (lead.companyName || '').toLowerCase().includes(q);
        const matchesCode = (lead.contractAccessCode || '').toLowerCase().includes(q);
        const matchesContractStatus = (lead.contractStatus || '').toLowerCase().includes(q);
        
        let matchesAnswers = false;
        if (lead.prequalificationAnswers) {
          const ansString = JSON.stringify(lead.prequalificationAnswers).toLowerCase();
          matchesAnswers = ansString.includes(q);
        }

        if (
          !matchesName && 
          !matchesFirst && 
          !matchesLast && 
          !matchesEmail && 
          !matchesPhone && 
          !matchesTitle && 
          !matchesAddress && 
          !matchesNotes && 
          !matchesCompany &&
          !matchesCode &&
          !matchesContractStatus &&
          !matchesAnswers
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    initialLeads, 
    typeFilter, 
    statusFilter, 
    contractFilter,
    datePreset, 
    dateTarget, 
    customStartDate, 
    customEndDate, 
    searchQuery
  ]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() !== '' || 
    typeFilter !== 'all' || 
    statusFilter !== 'all' || 
    contractFilter !== 'all' ||
    datePreset !== 'all' ||
    customStartDate ||
    customEndDate
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setStatusFilter('all');
    setContractFilter('all');
    setDatePreset('all');
    setDateTarget('scheduled');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  // Export to CSV function
  const handleExportCSV = () => {
    if (filteredLeads.length === 0) return;

    const headers = [
      'ID',
      'Lead Type',
      'Full Name',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Address',
      'Topic / Class',
      'Event Date',
      'Event Time',
      'Status',
      'Payment Status',
      'Contract Status',
      'Access Code',
      'Project Cost',
      'Currency',
      'Downpayment %',
      'Signing Method',
      'Captured Timestamp'
    ];

    const rows = filteredLeads.map(l => [
      `"${l.id}"`,
      `"${l.type}"`,
      `"${l.fullName.replace(/"/g, '""')}"`,
      `"${l.firstName.replace(/"/g, '""')}"`,
      `"${l.lastName.replace(/"/g, '""')}"`,
      `"${l.email}"`,
      `"${l.phone}"`,
      `"${(l.address || '').replace(/"/g, '""')}"`,
      `"${l.title.replace(/"/g, '""')}"`,
      `"${l.date}"`,
      `"${l.time}"`,
      `"${l.status}"`,
      `"${l.paymentStatus || 'N/A'}"`,
      `"${l.contractStatus || 'Draft'}"`,
      `"${l.contractAccessCode || ''}"`,
      `"${l.contractCost || 0}"`,
      `"${l.contractCurrency || 'PHP'}"`,
      `"${l.contractDownpaymentPct ?? 50}%"`,
      `"${l.contractSigningMethod || 'electronic'}"`,
      `"${l.createdAt}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leads-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl pb-24">
      
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-zinc-950 tracking-tight">
              Inbound Leads Command Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Live
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Real-time multi-channel feed with instant client search, date filters, and CRM dossier export.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => router.refresh()}
            className="p-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl transition-colors shadow-xs"
            title="Refresh Leads"
          >
            <Icons.RefreshCw size={16} />
          </button>
          
          <button
            onClick={handleExportCSV}
            disabled={filteredLeads.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-800 rounded-xl text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
          >
            <Icons.Download size={14} className="text-zinc-500" />
            Export CSV ({filteredLeads.length})
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <LeadsStatsHeader leads={initialLeads} />

      {/* High-Performance Filter & Client Search Toolbar */}
      <LeadsFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        contractFilter={contractFilter}
        onContractFilterChange={setContractFilter}
        datePreset={datePreset}
        onDatePresetChange={setDatePreset}
        dateTarget={dateTarget}
        onDateTargetChange={setDateTarget}
        customStartDate={customStartDate}
        onCustomStartDateChange={setCustomStartDate}
        customEndDate={customEndDate}
        onCustomEndDateChange={setCustomEndDate}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
        totalCount={initialLeads.length}
        filteredCount={filteredLeads.length}
        appointmentCount={initialLeads.filter(l => l.type === 'appointment').length}
        enrollmentCount={initialLeads.filter(l => l.type === 'enrollment').length}
      />

      {/* Main Data Table */}
      <LeadsTable 
        leads={filteredLeads}
        onSelectLead={(lead) => setSelectedLead(lead)}
      />

      {/* Comprehensive Lead Dossier Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onRefresh={() => router.refresh()}
        />
      )}

    </div>
  );
}
