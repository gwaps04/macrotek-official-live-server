import React from 'react';
import Image from 'next/image';
import { ContractData } from '@/app/contract/contract.actions';
import * as Icons from 'lucide-react';

// FILE: src/components/contract/ContractDocument.tsx

interface ContractDocumentProps {
  contract: ContractData;
}

export default function ContractDocument({ contract }: ContractDocumentProps) {
  const rawDate = contract.signed_at || contract.created_at;
  const formattedDate = rawDate 
    ? new Date(rawDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Pending Execution';

  // Financial calculations with strict empty-fallback handling
  const rawCost = contract.project_cost;
  const hasProjectCost = rawCost !== null && 
    rawCost !== undefined && 
    !isNaN(Number(rawCost)) && 
    Number(rawCost) > 0;

  const totalCost = hasProjectCost ? Number(rawCost) : 0;
  
  const rawDownpayment = contract.downpayment_percentage;
  const hasDownpaymentPct = rawDownpayment !== null && 
    rawDownpayment !== undefined && 
    !isNaN(Number(rawDownpayment)) && 
    Number(rawDownpayment) > 0;

  const downpaymentPct = hasDownpaymentPct ? Number(contract.downpayment_percentage) : 0;
  const downpaymentAmount = hasProjectCost && hasDownpaymentPct ? (totalCost * (downpaymentPct / 100)) : 0;
  const balancePct = hasDownpaymentPct ? Math.max(0, 100 - downpaymentPct) : 0;
  const balanceAmount = hasProjectCost ? (hasDownpaymentPct ? Math.max(0, totalCost - downpaymentAmount) : totalCost) : 0;

  // Currency resolution
  const currencyCode = contract.currency && contract.currency.trim() !== '' ? contract.currency.toUpperCase() : 'PHP';
  const currencySymbol = currencyCode === 'USD' ? '$' : currencyCode === 'EUR' ? '€' : currencyCode === 'GBP' ? '£' : '₱';

  const contractTitle = contract.contract_title && contract.contract_title.trim() !== ''
    ? contract.contract_title.trim()
    : 'Master Service Agreement';

  const refNumber = `MDS-AGR-${(contract.id || contract.lead_id || '0000').slice(0, 8).toUpperCase()}`;

  // Custom terms check for dynamic layout auto-adjustment
  const hasCustomTerms = Boolean(contract.custom_terms && contract.custom_terms.trim().length > 0);
  const hasPaymentNotes = Boolean(contract.payment_terms_notes && contract.payment_terms_notes.trim().length > 0);

  return (
    <div className="bg-white text-zinc-900 shadow-2xl border border-zinc-200/90 rounded-2xl md:rounded-3xl p-6 sm:p-10 md:p-14 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none font-serif text-[13px] leading-relaxed">
      
      {/* Document Letterhead */}
      <div className="border-b-2 border-zinc-900 pb-6 print:pb-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 font-sans">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
              <span className="text-xs font-black tracking-widest uppercase text-zinc-500">
                Macrotek Digital Solutions
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 mt-1 uppercase tracking-tight">
              {contractTitle}
            </h1>
            <p className="text-xs text-zinc-600 font-medium mt-0.5">
              Enterprise Software Architecture &bull; Automation Pipelines &bull; Digital Infrastructure
            </p>
          </div>

          <div className="text-left sm:text-right text-xs text-zinc-500 space-y-0.5 sm:self-center">
            <p className="font-mono font-bold text-zinc-900 text-xs">REF: {refNumber}</p>
            <p>Effective Date: <span className="font-medium text-zinc-800">{formattedDate}</span></p>
            <p className="font-mono text-[11px] text-zinc-400">Security Gate: Protected Access</p>
          </div>
        </div>
      </div>

      {/* Parties Summary Box */}
      <div className="mb-8 border border-zinc-300 rounded-2xl overflow-hidden print:rounded-none font-sans text-xs">
        <div className="bg-zinc-100/80 px-4 py-2 border-b border-zinc-300 font-bold text-zinc-800 uppercase tracking-wider text-[11px]">
          Parties to This Agreement
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-300">
          
          {/* Service Provider */}
          <div className="p-4 bg-zinc-50/50 space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Service Provider</span>
            <p className="font-bold text-zinc-950 text-sm">MACROTEK DIGITAL SOLUTIONS</p>
            <p className="text-zinc-600">Represented by: <strong className="text-zinc-800">Jason Millena</strong> (Lead Architect)</p>
            <p className="text-zinc-600">Address: Legazpi City, Albay, Philippines</p>
            <p className="text-zinc-600">Email: admin@macrotek.com / contact@macrotek.com</p>
          </div>

          {/* Client */}
          <div className="p-4 space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Authorized Client</span>
            <p className="font-bold text-zinc-950 text-sm">
              {contract.client_name} {contract.company_name ? `(${contract.company_name})` : ''}
            </p>
            <p className="text-zinc-600">Email: <span className="text-zinc-800 font-medium">{contract.client_email}</span></p>
            <p className="text-zinc-600">Phone: <span className="text-zinc-800 font-medium">{contract.client_phone || 'On file'}</span></p>
            <p className="text-zinc-600">Address: <span className="text-zinc-800">{contract.client_address || 'Legazpi City / Metro Manila, Philippines'}</span></p>
          </div>

        </div>
      </div>

      {/* Financial Schedule Highlight Table - AUTO ADJUSTS */}
      {hasProjectCost ? (
        <div className="mb-8 p-5 bg-zinc-50 border-2 border-zinc-200 rounded-2xl print:rounded-none font-sans">
          <div className="flex items-center justify-between mb-3 border-b border-zinc-200 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
              <Icons.CreditCard size={15} className="text-emerald-600" />
              Financial Investment &amp; Payment Schedule
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 bg-zinc-200/80 rounded text-zinc-800">
              Currency: {currencyCode} ({currencySymbol})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
            
            <div className="p-3 bg-white rounded-xl border border-zinc-200 shadow-2xs">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Total Project Cost</span>
              <p className="text-lg font-black text-zinc-950 mt-0.5">
                {currencySymbol}{totalCost.toLocaleString()} <span className="text-xs font-normal text-zinc-500">{currencyCode}</span>
              </p>
              <span className="text-[10px] text-zinc-400">Total agreed fee</span>
            </div>

            {hasDownpaymentPct ? (
              <React.Fragment>
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Commencement Downpayment ({downpaymentPct}%)
                  </span>
                  <p className="text-lg font-black text-emerald-950 mt-0.5">
                    {currencySymbol}{downpaymentAmount.toLocaleString()} <span className="text-xs font-normal text-emerald-700">{currencyCode}</span>
                  </p>
                  <span className="text-[10px] text-emerald-700 font-semibold">Due upon contract signing</span>
                </div>

                <div className="p-3 bg-zinc-100/70 rounded-xl border border-zinc-300 shadow-2xs">
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider block">
                    Handover Balance ({balancePct}%)
                  </span>
                  <p className="text-lg font-black text-zinc-900 mt-0.5">
                    {currencySymbol}{balanceAmount.toLocaleString()} <span className="text-xs font-normal text-zinc-500">{currencyCode}</span>
                  </p>
                  <span className="text-[10px] text-zinc-500">Due upon final deployment</span>
                </div>
              </React.Fragment>
            ) : (
              <div className="p-3 bg-zinc-100/70 rounded-xl border border-zinc-300 shadow-2xs col-span-2">
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider block">
                  Disbursement Schedule
                </span>
                <p className="text-sm font-semibold text-zinc-800 mt-1">
                  100% Full Fee / Customized milestone billing upon mutual approval
                </p>
                <span className="text-[10px] text-zinc-500">Payable as scheduled by authorized representative</span>
              </div>
            )}

          </div>

          {hasPaymentNotes && (
            <div className="mt-3 pt-3 border-t border-zinc-200/80 flex items-start gap-2 text-xs text-zinc-700">
              <Icons.Banknote size={14} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-zinc-900">Billing &amp; Payment Instructions: </strong>
                <span>{contract.payment_terms_notes}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-8 p-4 bg-amber-50/80 border border-amber-200 rounded-2xl print:rounded-none font-sans flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Icons.Info size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Financial Terms &amp; Pricing Schedule: Pending Mutual Determination
            </h4>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
              The project cost, initial downpayment percentage, and currency are currently pending determination or will be incorporated into an execution addendum prior to sign-off.
            </p>
            {hasPaymentNotes && (
              <p className="text-xs text-amber-900 font-medium mt-1">
                <strong>Preliminary Notes:</strong> {contract.payment_terms_notes}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Contract Body Clauses - AUTO FORMATTED */}
      <div className="space-y-6 text-zinc-800">
        
        {/* Section 1 */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-zinc-950 font-sans uppercase tracking-wide border-b border-zinc-200 pb-1 flex items-center justify-between">
            <span>1. Scope of Digital Services &amp; Deliverables</span>
          </h2>
          <p>
            <strong>1.1 Professional Engagement:</strong> The Service Provider (&quot;Macrotek Digital Solutions&quot;) agrees to design, architect, configure, and deploy the digital systems, web applications, integrations, and automation workflows mutually agreed upon with the Client (&quot;{contract.client_name}&quot;) pursuant to this {contractTitle}.
          </p>
          <p>
            <strong>1.2 Scope Specification:</strong> {contract.scope_description && contract.scope_description.trim().length > 0 
              ? contract.scope_description 
              : 'Scope includes custom architecture development, multi-platform database synchronization, webhook triggers (including n8n / ClickUp / Google Workspace), and automated lead management.'}
          </p>
          <p>
            <strong>1.3 Change Orders:</strong> Any features, design revisions, or integrations requested by the Client outside the documented scope shall be handled through a formal written Change Order with mutually agreed-upon pricing before work on that item begins.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-zinc-950 font-sans uppercase tracking-wide border-b border-zinc-200 pb-1">
            2. Payment Milestones &amp; Billing Terms
          </h2>
          {hasProjectCost ? (
            <React.Fragment>
              <p>
                <strong>2.1 Total Agreed Investment:</strong> The Client agrees to compensate the Provider the total sum of <strong>{currencySymbol}{totalCost.toLocaleString()} {currencyCode}</strong>.
              </p>
              <p>
                <strong>2.2 Milestone Breakdown:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1 font-sans text-xs">
                {hasDownpaymentPct ? (
                  <React.Fragment>
                    <li>
                      <strong>Initial Downpayment ({downpaymentPct}%):</strong> Amounting to <strong>{currencySymbol}{downpaymentAmount.toLocaleString()} {currencyCode}</strong>, payable upon execution of this Agreement to reserve the engineering timeline and initialize environment setup.
                    </li>
                    <li>
                      <strong>Final Balance ({balancePct}%):</strong> Amounting to <strong>{currencySymbol}{balanceAmount.toLocaleString()} {currencyCode}</strong>, payable immediately upon completion, deployment to production staging, and turnover of master administrative access.
                    </li>
                  </React.Fragment>
                ) : (
                  <li>
                    <strong>Full Engagement Fee:</strong> Amounting to <strong>{currencySymbol}{totalCost.toLocaleString()} {currencyCode}</strong>, payable as mutually agreed upon in the project milestone schedule.
                  </li>
                )}
              </ul>
              {hasPaymentNotes && (
                <p>
                  <strong>2.3 Disbursement Instructions:</strong> {contract.payment_terms_notes}
                </p>
              )}
            </React.Fragment>
          ) : (
            <p>
              <strong>2.1 Fee Determination:</strong> Commercial fees, milestone percentages, and currency for the services outlined herein shall be confirmed in writing by both parties prior to final deployment.
            </p>
          )}
          <p>
            <strong>{hasProjectCost && hasPaymentNotes ? '2.4' : '2.3'} Third-Party Software &amp; APIs:</strong> The Client shall be directly responsible for all recurring subscriptions to external cloud services, domain registrars, hosting, or third-party APIs incurred for the project.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-zinc-950 font-sans uppercase tracking-wide border-b border-zinc-200 pb-1">
            3. Delivery, Review &amp; Master Handover
          </h2>
          <p>
            <strong>3.1 Acceptance Period:</strong> Upon notification by the Provider that the deliverable is live on staging or production, the Client shall have seven (7) business days to review all features and report any reproducible functional discrepancies.
          </p>
          <p>
            <strong>3.2 Administrative Turnover:</strong> Upon receipt of the final balance, the Provider shall issue the &quot;Turnover Packet&quot; containing all master administrative credentials, repository links, and API access keys.
          </p>
          <p>
            <strong>3.3 Security Ownership:</strong> The Client is solely responsible for changing passwords and safeguarding credentials immediately after turnover. The Provider shall not be liable for unauthorized access occurring subsequent to handover.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-zinc-950 font-sans uppercase tracking-wide border-b border-zinc-200 pb-1">
            4. Intellectual Property &amp; Licensing
          </h2>
          <p>
            <strong>4.1 Client Content:</strong> All bespoke branding, logos, trademarks, and text supplied by the Client remain the exclusive intellectual property of the Client.
          </p>
          <p>
            <strong>4.2 Final Deliverables:</strong> Upon payment of the final balance in full, the Client is granted full ownership rights of the customer-facing digital asset.
          </p>
          <p>
            <strong>4.3 Proprietary Architecture:</strong> Macrotek retains ownership of its proprietary pre-existing utility modules, build pipelines, and design system foundations, granting the Client a perpetual, non-exclusive license to use them in the operation of the delivered system.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-zinc-950 font-sans uppercase tracking-wide border-b border-zinc-200 pb-1">
            5. Data Privacy &amp; Confidentiality (Republic Act No. 10173)
          </h2>
          <p>
            <strong>5.1 Strict Confidentiality:</strong> Both parties agree to maintain the strict confidentiality of all proprietary, technical, and commercial information disclosed during this engagement.
          </p>
          <p>
            <strong>5.2 Compliance with Philippine Law:</strong> All collection, storage, and processing of customer and corporate data performed in connection with this project shall strictly comply with the Data Privacy Act of 2012 (RA 10173) of the Philippines.
          </p>
          <p>
            <strong>5.3 Warranty:</strong> The Provider provides a thirty (30) day stability warranty following launch to address any latent bugs within the agreed scope at zero additional cost.
          </p>
        </section>

        {/* Section 6 - SPECIAL PROVISIONS & BESPOKE COVENANTS (AUTO ADJUSTS) */}
        {hasCustomTerms && (
          <section className="space-y-2 p-4 bg-zinc-50 border border-zinc-200 rounded-xl print:rounded-none">
            <h2 className="text-sm font-bold text-zinc-950 font-sans uppercase tracking-wide border-b border-zinc-300 pb-1 flex items-center gap-1.5">
              <Icons.ShieldAlert size={14} className="text-emerald-700" />
              <span>6. Special Provisions &amp; Bespoke Agreement Terms</span>
            </h2>
            <div className="font-sans text-xs text-zinc-800 leading-relaxed whitespace-pre-wrap">
              {contract.custom_terms}
            </div>
          </section>
        )}

      </div>

      {/* Execution & Signature Section */}
      <div className="mt-12 pt-8 border-t-2 border-zinc-900 font-sans">
        <div className="text-center mb-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900">
            Signatures &amp; Legal Execution
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            By executing below, both parties confirm they have read, understood, and agreed to the terms outlined above.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Provider Signature Card */}
          <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              For Service Provider:
            </span>
            <div className="h-16 flex items-end border-b border-zinc-300 pb-2">
              <span className="font-serif italic text-2xl text-zinc-800 font-semibold tracking-wide">
                Jason Millena
              </span>
            </div>
            <div className="text-xs text-zinc-700 space-y-0.5">
              <p className="font-bold text-zinc-950">Jason Millena / Lead Solutions Architect</p>
              <p className="text-zinc-600">Macrotek Digital Solutions</p>
              <p className="text-[11px] text-zinc-500 font-mono">Date: {formattedDate}</p>
            </div>
          </div>

          {/* Client Signature Card */}
          <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              For Authorized Client:
            </span>

            {/* Check if Signed */}
            {contract.status === 'Signed' ? (
              <div className="space-y-3">
                <div className="h-16 flex items-center justify-center border-b border-emerald-500 bg-white rounded-lg p-1 overflow-hidden">
                  {contract.signing_method === 'manual_hardcopy' ? (
                    <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                      <Icons.FileCheck2 size={18} />
                      <span>Hardcopy Executed (Uploaded on File)</span>
                    </div>
                  ) : contract.signature_type === 'typed' ? (
                    <span className="font-serif italic text-2xl text-emerald-900 font-bold">
                      {contract.signed_by_name || contract.client_name}
                    </span>
                  ) : contract.signature_data ? (
                    <Image
                      src={contract.signature_data}
                      alt="Client e-Signature"
                      width={300}
                      height={60}
                      className="max-h-14 w-auto object-contain"
                      unoptimized
                    />
                  ) : (
                    <span className="font-serif italic text-xl text-emerald-900 font-semibold">
                      {contract.signed_by_name || contract.client_name}
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-700 space-y-0.5">
                  <p className="font-bold text-emerald-800 flex items-center gap-1">
                    <Icons.CheckCircle2 size={13} />
                    Digitally Executed: {contract.signed_by_name || contract.client_name}
                  </p>
                  <p className="text-zinc-600">{contract.signed_by_title || 'Authorized Representative'}</p>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    Timestamp: {contract.signed_at ? new Date(contract.signed_at).toUTCString() : 'Recorded in Database'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-16 flex items-end border-b-2 border-dashed border-zinc-300 pb-2">
                <span className="text-xs text-zinc-400 italic">
                  Awaiting electronic signature verification below...
                </span>
              </div>
            )}

            <div className="text-xs text-zinc-700">
              <p className="font-semibold text-zinc-900">{contract.client_name}</p>
              {contract.company_name && <p className="text-zinc-500">{contract.company_name}</p>}
            </div>
          </div>

        </div>
      </div>

      {/* Footer Audit Notice */}
      <div className="mt-8 pt-4 border-t border-zinc-200 text-center font-sans text-[10px] text-zinc-400 print:mt-4">
        Document ID: {contract.id || contract.lead_id} &bull; Macrotek Digital Solutions &bull; Authorized E-Signature Document
      </div>

    </div>
  );
}
