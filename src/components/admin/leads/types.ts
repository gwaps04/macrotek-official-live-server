// FILE: src/components/admin/leads/types.ts

export type LeadType = 'appointment' | 'enrollment';

export interface UnifiedLead {
  id: string;
  type: LeadType;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  date: string;
  time: string;
  title: string;
  instructor?: string;
  price?: number;
  notes?: string;
  prequalificationAnswers?: Record<string, any>;
  status: string;
  paymentStatus?: 'Paid' | 'Pending';
  createdAt: string;

  // Contract integration attributes
  contractId?: string;
  contractStatus?: 'Draft' | 'Sent' | 'Signed' | 'None';
  contractAccessCode?: string;
  contractTitle?: string;
  contractScope?: string;
  contractCustomTerms?: string;
  paymentTermsNotes?: string;
  contractCost?: number | null;
  contractCurrency?: string;
  contractDownpaymentPct?: number | null;
  contractSignedAt?: string | null;
  contractSignedBy?: string | null;
  contractSignedByTitle?: string | null;
  contractSignatureData?: string | null;
  contractSignatureType?: 'drawn' | 'typed';
  contractAttachmentUrl?: string | null;
  contractAttachmentName?: string | null;
  contractSigningMethod?: 'electronic' | 'manual_hardcopy';
  contractEsignEnabled?: boolean;
  companyName?: string;
}

export type FilterType = 'all' | 'appointment' | 'enrollment';
export type StatusFilter = 'all' | 'Pending' | 'Confirmed' | 'Registered' | 'Completed' | 'Cancelled';
export type ContractFilter = 'all' | 'Signed' | 'Draft' | 'Sent' | 'Unsent';
export type DatePreset = 'all' | 'today' | 'yesterday' | 'last7' | 'last30' | 'upcoming' | 'custom';
export type DateTarget = 'scheduled' | 'created';
