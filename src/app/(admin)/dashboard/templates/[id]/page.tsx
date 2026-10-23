// FILE: src/app/(admin)/dashboard/templates/[id]/page.tsx
import { getTemplateByIdAction } from '../template.actions';
import TemplateEditorClient from '@/components/admin/templates/TemplateEditorClient';
import * as Icons from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

// WOZ FIX: Next.js 15+ requires dynamic params to be treated as a Promise
export default async function TemplateEditorPage({ params }: { params: Promise<{ id: string }> }) {
  // 1. Await the parameters securely
  const resolvedParams = await params;
  const id = resolvedParams?.id;

  let initialData = null;

  // 2. Safely check if we are editing an existing template
  if (id && id !== 'new') {
    const response = await getTemplateByIdAction(id);
    
    if (!response.success || !response.template) {
      return (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-zinc-100 text-zinc-600">
          <Icons.FileQuestion size={48} className="text-zinc-300 mb-4" />
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Template Not Found</h2>
          <p className="text-sm mb-6">The template you are looking for has been deleted or does not exist.</p>
          <Link href="/dashboard/templates" className="px-6 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-bold shadow-sm transition-colors hover:bg-zinc-800">
            Return to Dashboard
          </Link>
        </div>
      );
    }
    initialData = response.template;
  }

  return (
    <div className="w-full h-full flex flex-col">
      <TemplateEditorClient templateId={id || 'new'} initialData={initialData} />
    </div>
  );
}