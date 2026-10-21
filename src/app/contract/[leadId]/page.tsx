import { getContractRecord, getMaskedContract } from '@/lib/contractUtils';
import ContractPageView from '@/components/contract/ContractPageView';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth';

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

  const result = await getContractRecord(leadId, leadType);

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

  // WOZ ZERO-LEAK SECURITY: Enforce cryptographically verified admin session for admin bypass
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get('admin_session');
  const isAdminAuthenticated = Boolean(
    adminCookie?.value && verifySessionToken(adminCookie.value).valid
  );

  const expectedCode = result.contract.access_code?.trim().toLowerCase();
  const isAutoUnlocked = Boolean(
    (searchParams.admin === 'true' && isAdminAuthenticated) ||
    (providedCode && expectedCode && providedCode === expectedCode)
  );

  // WOZ ZERO-LEAK SECURITY: Mask all private terms and strip secret PIN if not unlocked
  const contractToRender = isAutoUnlocked ? result.contract : getMaskedContract(result.contract);

  return (
    <div className="w-full">
      <ContractPageView 
        initialContract={contractToRender} 
        initialUnlocked={isAutoUnlocked}
      />
    </div>
  );
}
