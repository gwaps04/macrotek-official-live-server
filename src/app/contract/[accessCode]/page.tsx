// FILE: src/app/contract/[accessCode]/page.tsx
import React from 'react';
import { sql } from '@/lib/db';
import { notFound } from 'next/navigation';
import ClientContractView from '@/components/contract/ClientContractView';

export const dynamic = 'force-dynamic';

export default async function ClientContractPage(props: { params: Promise<{ accessCode: string }> }) {
  const params = await props.params;
  const accessCode = params.accessCode;

  // 1. Fetch the document using the secure 6-digit PIN
  const rows = await sql`
    SELECT * FROM lead_documents 
    WHERE access_code = ${accessCode}
    LIMIT 1
  `;
  
  const document = rows[0];
  
  // 2. If the PIN is invalid or the document was deleted, throw a 404
  if (!document) {
    notFound();
  }

  // 3. Render the secure client view
  return (
    <React.Fragment>
      <ClientContractView document={document} />
    </React.Fragment>
  );
}