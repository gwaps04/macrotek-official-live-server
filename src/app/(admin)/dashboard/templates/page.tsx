// FILE: src/app/(admin)/dashboard/templates/page.tsx
import { getTemplatesListAction } from './template.actions';
import TemplateDashboard from '@/components/admin/templates/TemplateDashboard';
import * as Icons from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TemplatesPage() {
  const response = await getTemplatesListAction();

  if (!response.success) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-zinc-600">
        <Icons.AlertTriangle size={32} className="text-red-500 mb-4" />
        <h2 className="text-lg font-bold text-zinc-900 mb-2">Failed to load templates</h2>
        <p className="text-sm">{response.error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <TemplateDashboard initialTemplates={response.templates || []} />
    </div>
  );
}