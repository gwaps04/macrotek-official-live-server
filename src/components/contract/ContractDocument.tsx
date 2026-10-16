import React from 'react';
import Image from 'next/image';
import { ContractData } from '@/app/contract/contract.actions';

// FILE: src/components/contract/ContractDocument.tsx

interface ContractDocumentProps {
  contract: ContractData;
}

export default function ContractDocument({ contract }: ContractDocumentProps) {
  const formattedDate = contract.signed_at 
    ? new Date(contract.signed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="bg-white text-zinc-900 shadow-xl border border-zinc-200/90 rounded-2xl md:rounded-3xl p-6 sm:p-10 md:p-16 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none font-serif text-[13.5px] leading-relaxed">
      
      {/* Header */}
      <div className="text-center pb-8 border-b border-zinc-200 print:pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 font-sans uppercase">
          Standard Service Agreement
        </h1>
        <p className="text-sm font-semibold tracking-wide text-zinc-600 font-sans mt-1">
          Macrotek Digital Solutions
        </p>
      </div>

      {/* Metadata Table */}
      <div className="my-8 overflow-hidden border border-zinc-300 rounded-xl print:rounded-none">
        <table className="w-full text-left border-collapse text-xs font-sans">
          <tbody>
            <tr className="border-b border-zinc-300">
              <th className="w-1/3 py-2.5 px-4 bg-zinc-50 font-bold text-zinc-700 border-r border-zinc-300">
                Provider:
              </th>
              <td className="py-2.5 px-4 font-medium text-zinc-900">
                MACROTEK DIGITAL SOLUTIONS / Jason Millena (&quot;Provider&quot;)
              </td>
            </tr>
            <tr className="border-b border-zinc-300">
              <th className="py-2.5 px-4 bg-zinc-50 font-bold text-zinc-700 border-r border-zinc-300">
                Client:
              </th>
              <td className="py-2.5 px-4 font-medium text-zinc-900">
                {contract.client_name} {contract.company_name ? `/ ${contract.company_name}` : ''} (&quot;Client&quot;)
              </td>
            </tr>
            <tr className="border-b border-zinc-300">
              <th className="py-2.5 px-4 bg-zinc-50 font-bold text-zinc-700 border-r border-zinc-300">
                Address:
              </th>
              <td className="py-2.5 px-4 font-medium text-zinc-900">
                {contract.client_address || 'Legazpi City, Albay, Philippines'}
              </td>
            </tr>
            <tr className="border-b border-zinc-300">
              <th className="py-2.5 px-4 bg-zinc-50 font-bold text-zinc-700 border-r border-zinc-300">
                Date:
              </th>
              <td className="py-2.5 px-4 font-medium text-zinc-900">
                {formattedDate}
              </td>
            </tr>
            <tr>
              <th className="py-2.5 px-4 bg-zinc-50 font-bold text-zinc-700 border-r border-zinc-300">
                Project Cost:
              </th>
              <td className="py-2.5 px-4 font-bold text-zinc-950">
                ${Number(contract.project_cost).toLocaleString()} {contract.currency || 'USD'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Sections 1 to 10 */}
      <div className="space-y-6 text-zinc-800">
        
        {/* Section 1 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-950 font-sans border-b border-zinc-200 pb-1">
            1. Scope of Work
          </h2>
          <p>
            <strong>1.1 Project Definition:</strong> The Provider agrees to deliver the digital assets and services as specified in the attached Project Quotation/Proposal.
          </p>
          <p>
            <strong>1.2 Out-of-Scope Requests:</strong> Any features or modifications requested by the Client that are not explicitly listed in the Project Quotation shall be considered &quot;Out-of-Scope&quot; and may require a separate fee-based agreement or a Change Order.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-950 font-sans border-b border-zinc-200 pb-1">
            2. Financial Terms
          </h2>
          <p>
            <strong>2.1 Service Fees:</strong> The total project fee is <strong>${Number(contract.project_cost).toLocaleString()} {contract.currency || 'USD'}</strong>, as detailed in the Project Quotation.
          </p>
          <p>
            <strong>2.2 Payment Schedule:</strong>
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Commencement Deposit:</strong> A non-refundable downpayment of 50% (${(Number(contract.project_cost) * 0.5).toLocaleString()} {contract.currency || 'USD'}) is required upfront to secure the development slot.
            </li>
            <li>
              <strong>Final Project Balance:</strong> The remaining 50% balance (${(Number(contract.project_cost) * 0.5).toLocaleString()} {contract.currency || 'USD'}) is due immediately upon project completion, successful live deployment, and formal handover.
            </li>
          </ul>
          <p>
            <strong>2.3 Delayed Payments:</strong> Work may be suspended if payments are overdue by more than seven (7) calendar days.
          </p>
          <p>
            <strong>2.4 Third-Party Software &amp; Integrations:</strong> All third-party software subscriptions, paid plugins, APIs, premium tools, CRMs, or automation platforms that arise due to project needs or integrations shall be registered under the Client&apos;s own accounts and charged directly to the Client&apos;s financial details from Day 1.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-950 font-sans border-b border-zinc-200 pb-1">
            3. Delivery &amp; Acceptance (The Handover)
          </h2>
          <p>
            <strong>3.1 Live Deployment:</strong> The project is considered &quot;Delivered&quot; once the digital asset is live on the production server and accessible via the public domain.
          </p>
          <p>
            <strong>3.2 Final Acceptance:</strong> The Client shall have seven (7) business days to conduct a final review. If no written list of bugs (within the original scope) is provided within this period, the project is deemed &quot;Accepted.&quot;
          </p>
          <p>
            <strong>3.3 Credential Turnover &amp; Security:</strong> Upon receipt of the final balance, the Provider shall issue a comprehensive &quot;Turnover Packet&quot; containing all administrative login credentials, API keys, and access details.
          </p>
          <p>
            <strong>3.4 Security Responsibility:</strong> The Client is strictly responsible for updating all passwords immediately upon receipt. The Provider shall not be held liable for any security breaches or unauthorized access occurring after the successful handover of these credentials.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-950 font-sans border-b border-zinc-200 pb-1">
            4. Client Responsibilities
          </h2>
          <p>
            <strong>4.1 Content Provision:</strong> The Client is responsible for providing all text, high-resolution logos, and specific images required for the project.
          </p>
          <p>
            <strong>4.2 Approval Timelines:</strong> To maintain delivery speed, the Client agrees to provide feedback or approvals within 5 business days of a request. Delays in Client feedback will result in a day-for-day extension of the final delivery date.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-950 font-sans border-b border-zinc-200 pb-1">
            5. Intellectual Property (IP)
          </h2>
          <p>
            <strong>5.1 Final Product:</strong> Upon full payment of all outstanding balances, the Client shall own the customer-facing content and the specific instance of the website.
          </p>
          <p>
            <strong>5.2 Proprietary Code:</strong> The Provider Macrotek retains exclusive ownership of all underlying proprietary code, custom frameworks, and specialized modules. The Client is granted a non-exclusive license to use these elements for the operation of the site.
          </p>
          <p>
            <strong>5.3 General Portfolio Rights:</strong> The Provider retains the right to display the project and results in its corporate portfolio and promotional media.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-950 font-sans border-b border-zinc-200 pb-1">
            6. Professional Standards &amp; Liability
          </h2>
          <p>
            <strong>6.1 Standard of Care:</strong> The Provider shall perform services with professional diligence in accordance with industry standards.
          </p>
          <p>
            <strong>6.2 Limitation of Liability:</strong> The Provider shall not be liable for indirect, incidental, or consequential losses resulting from external factors such as 3rd-party hosting outages or cybersecurity threats. Total liability for any direct error shall not exceed the total fees paid by the Client.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-950 font-sans border-b border-zinc-200 pb-1">
            7. Termination
          </h2>
          <p>
            <strong>7.1 Cancellation:</strong> Either party may terminate this agreement with 7 days&apos; written notice.
          </p>
          <p>
            <strong>7.2 Settlement:</strong> In the event of cancellation, the Client shall be invoiced for all labor and expenses incurred up to the date of termination. The Commencement Deposit remains non-refundable.
          </p>
        </section>

        {/* Section 8 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-950 font-sans border-b border-zinc-200 pb-1">
            8. Post-Launch Support &amp; Infrastructure
          </h2>
          <p>
            <strong>8.1 Warranty Period:</strong> The Provider includes thirty (30) days of technical stability support following the live launch to resolve any bugs or errors within the original scope.
          </p>
          <p>
            <strong>8.2 Domain &amp; Hosting Responsibility:</strong> Domain registration, renewal fees, and web hosting infrastructure costs shall be the direct and sole financial responsibility of the Client from Day 1, billed straight to the Client&apos;s payment details.
          </p>
          <p>
            <strong>8.3 Post-Completion Changes &amp; Maintenance:</strong> Any feature requests, design modifications, content updates, or scope expansions requested after project completion and final handover shall be subject to a separate per-request quote or Change Order before work commences.
          </p>
        </section>

        {/* Section 9 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-950 font-sans border-b border-zinc-200 pb-1">
            9. Portfolio &amp; Brand Advocacy
          </h2>
          <p>
            <strong>9.1 Promotional Media Access:</strong> The Client grants the Provider non-exclusive rights to document the development lifecycle of the project, including technical walkthroughs and screen recordings for marketing channels.
          </p>
          <p>
            <strong>9.2 Success Story Collaboration:</strong> Upon successful delivery, the Client agrees to collaborate with the Provider&apos;s marketing team to generate a &quot;Success Story&quot; or case study.
          </p>
          <p>
            <strong>9.3 Identity Usage:</strong> The Provider may utilize the Client&apos;s business name and logo solely to identify the Client as a project partner.
          </p>
          <p>
            <strong>9.4 Data Masking Guarantee:</strong> The Provider strictly agrees to mask, blur, or omit any sensitive Client information during the creation of promotional media.
          </p>
        </section>

        {/* Section 10 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-zinc-950 font-sans border-b border-zinc-200 pb-1">
            10. Data Privacy &amp; Confidentiality
          </h2>
          <p>
            <strong>10.1 Confidentiality Obligation:</strong> Both parties agree to maintain the strict confidentiality of all proprietary or sensitive information shared during the term of this partnership.
          </p>
          <p>
            <strong>10.2 Data Protection Standards:</strong> The Provider shall implement reasonable technical and organizational security measures to protect Client data stored within the development environment.
          </p>
          <p>
            <strong>10.3 Legal Compliance:</strong> All data processing performed by the Provider shall be conducted in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173) of the Philippines.
          </p>
          <p>
            <strong>10.4 Post-Termination Privacy:</strong> The obligation to protect confidential information and comply with data privacy standards shall survive the termination or expiration of this Agreement.
          </p>
        </section>

      </div>

      {/* Signature & Execution Block */}
      <div className="mt-12 pt-8 border-t-2 border-zinc-300 font-sans">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 mb-6 text-center">
          Execution &amp; Signatures
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Provider Signature */}
          <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
              For Provider:
            </span>
            <div className="h-16 flex items-end border-b border-zinc-300 pb-2">
              <span className="font-serif italic text-2xl text-zinc-800 font-medium">
                Jason Millena
              </span>
            </div>
            <div className="text-xs text-zinc-700 space-y-0.5">
              <p className="font-bold">Jason Millena / Lead Architect</p>
              <p>Macrotek Digital Solutions</p>
              <p className="text-[11px] text-zinc-500">Date: {formattedDate}</p>
            </div>
          </div>

          {/* Client Signature */}
          <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
              For Client:
            </span>

            {contract.status === 'Signed' && contract.signature_data ? (
              <div className="space-y-3">
                <div className="h-16 flex items-center justify-center border-b border-emerald-400 bg-white rounded-lg p-1">
                  {contract.signature_type === 'typed' ? (
                    <span className="font-serif italic text-2xl text-emerald-900 font-semibold">
                      {contract.signed_by_name}
                    </span>
                  ) : (
                    <Image
                      src={contract.signature_data}
                      alt="Client e-Signature"
                      width={300}
                      height={60}
                      className="max-h-14 w-auto object-contain"
                      unoptimized
                    />
                  )}
                </div>
                <div className="text-xs text-zinc-700 space-y-0.5">
                  <p className="font-bold text-emerald-800">
                    Digitally Executed: {contract.signed_by_name || contract.client_name}
                  </p>
                  <p>{contract.signed_by_title || 'Authorized Representative'}</p>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    Timestamp: {new Date(contract.signed_at || '').toUTCString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-16 flex items-end border-b-2 border-dashed border-zinc-300 pb-2">
                <span className="text-xs text-zinc-400 italic">
                  Awaiting electronic signature below...
                </span>
              </div>
            )}

            <div className="text-xs text-zinc-700">
              <p className="font-semibold">{contract.client_name}</p>
              {contract.company_name && <p className="text-zinc-500">{contract.company_name}</p>}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
