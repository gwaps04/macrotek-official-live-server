"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import { UnifiedLead, FilterType, StatusFilter } from './types';
import LeadsStatsHeader from './LeadsStatsHeader';
import LeadsTable from './LeadsTable';
import LeadDetailModal from './LeadDetailModal';

// FILE: src/components/admin/leads/LeadsCommandCenter.tsx

interface LeadsCommandCenterProps {
  initialLeads: UnifiedLead[];
}

export default function LeadsCommandCenter({ initialLeads }: LeadsCommandCenterProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedLead, setSelectedLead] = useState<UnifiedLead | null>(null);

  // Filter and Search Pipeline
  const filteredLeads = useMemo(() => {
    return initialLeads.filter((lead) => {
      // Type filter
      if (typeFilter !== 'all' && lead.type !== typeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const leadStatus = (lead.status || '').toLowerCase();
        const targetStatus = statusFilter.toLowerCase();
        if (leadStatus !== targetStatus) return false;
      }

      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesName = lead.fullName.toLowerCase().includes(q);
        const matchesEmail = lead.email.toLowerCase().includes(q);
        const matchesPhone = lead.phone.toLowerCase().includes(q);
        const matchesTitle = lead.title.toLowerCase().includes(q);
        const matchesAddress = (lead.address || '').toLowerCase().includes(q);
        const matchesNotes = (lead.notes || '').toLowerCase().includes(q);

        if (!matchesName && !matchesEmail && !matchesPhone && !matchesTitle && !matchesAddress && !matchesNotes) {
          return false;
        }
      }

      return true;
    });
  }, [initialLeads, typeFilter, statusFilter, searchQuery]);

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
      'Date',
      'Time',
      'Status',
      'Payment Status',
      'Created At'
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

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="space-y-8 max-w-7xl pb-24">
      
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
            Centralized stream of all customer consultation appointments and class enrollments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            className="p-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl transition-colors shadow-xs"
            title="Refresh Leads"
          >
            <Icons.RefreshCw size={16} />
          </button>
          
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-800 rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <Icons.Download size={14} className="text-zinc-500" />
            Export CSV ({filteredLeads.length})
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <LeadsStatsHeader leads={initialLeads} />

      {/* Search & Filter Toolbar */}
      <div className="p-4 bg-white rounded-2xl border border-zinc-200 shadow-xs space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Icons.Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, phone, or topic..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <Icons.X size={14} />
              </button>
            )}
          </div>

          {/* Source Tabs */}
          <div className="flex items-center p-1 bg-zinc-100 rounded-xl self-start md:self-auto">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${typeFilter === 'all' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'}`}
            >
              All Sources ({initialLeads.length})
            </button>
            <button
              onClick={() => setTypeFilter('appointment')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${typeFilter === 'appointment' ? 'bg-white text-emerald-700 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'}`}
            >
              Appointments ({initialLeads.filter(l => l.type === 'appointment').length})
            </button>
            <button
              onClick={() => setTypeFilter('enrollment')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${typeFilter === 'enrollment' ? 'bg-white text-indigo-700 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'}`}
            >
              Enrollments ({initialLeads.filter(l => l.type === 'enrollment').length})
            </button>
          </div>

        </div>

        {/* Status Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100 text-xs">
          <span className="text-zinc-400 font-semibold uppercase text-[10px] tracking-wider mr-1">
            Status:
          </span>
          {(['all', 'Pending', 'Confirmed', 'Registered', 'Completed', 'Cancelled'] as StatusFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${statusFilter === status ? 'bg-zinc-900 text-white font-bold' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
            >
              {status === 'all' ? 'All Statuses' : status}
            </button>
          ))}
        </div>

      </div>

      {/* Main Table */}
      <LeadsTable 
        leads={filteredLeads}
        onSelectLead={(lead) => setSelectedLead(lead)}
      />

      {/* Lead Dossier Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onRefresh={handleRefresh}
        />
      )}

    </div>
  );
}
