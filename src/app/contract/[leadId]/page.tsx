import { getOrCreateContractAction } from '@/app/contract/contract.actions';
import ContractPageView from '@/components/contract/ContractPageView';
import Link from 'next/link';
import * as Icons from 'lucide-react';

// FILE: src/app/contract/[leadId]/page.tsx

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PublicContractPage(props: {
  params: Promise<{ leadId: string }>;
  searchParams: Promise<{ type?: string; code?: string; admin?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const leadId = params.leadId;
  const leadType = (searchParams.type === 'enrollment' ? 'enrollment' : 'appointment') as 'appointment' | 'enrollment';
  const providedCode = searchParams.code?.trim().toLowerCase();

  const result = await getOrCreateContractAction(leadId, leadType);

  if (!result.success || !result.contract) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl border border-zinc-200 p-8 shadow-xl">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icons.FileX size={28} />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Contract Not Found</h2>
          <p className="text-xs text-zinc-500 mb-6">
            The requested contract agreement link may be expired or invalid. Please contact Macrotek Digital Solutions for assistance.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors"
          >
            <Icons.ArrowLeft size={14} />
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const expectedCode = result.contract.access_code?.trim().toLowerCase();
  const isAutoUnlocked = Boolean(
    searchParams.admin === 'true' ||
    (providedCode && expectedCode && providedCode === expectedCode) ||
    result.contract.status === 'Signed'
  );

  return (
    <div className="w-full">
      <ContractPageView 
        initialContract={result.contract} 
        initialUnlocked={isAutoUnlocked}
      />
    </div>
  );
}
