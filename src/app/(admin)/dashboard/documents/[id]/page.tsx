// FILE: src/app/(admin)/dashboard/documents/[id]/page.tsx
import React from 'react';
import { sql } from '@/lib/db';
import { notFound } from 'next/navigation';
import DocumentEditorClient from '@/components/admin/documents/DocumentEditorClient';

export const dynamic = 'force-dynamic';

export default async function DocumentEditorPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const docId = params.id;

  // 1. Fetch the instantiated document snapshot
  const rows = await sql`
    SELECT * FROM lead_documents 
    WHERE id::text = ${docId}
  `;
  
  const document = rows[0];
  
  if (!document) {
    notFound();
  }

  // 2. Pass it to our full-screen Client Editor
  return (
    <React.Fragment>
      <DocumentEditorClient initialDocument={document} />
    </React.Fragment>
  );
}