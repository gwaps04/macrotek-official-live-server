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
}

export type FilterType = 'all' | 'appointment' | 'enrollment';
export type StatusFilter = 'all' | 'Pending' | 'Confirmed' | 'Registered' | 'Completed' | 'Cancelled';
