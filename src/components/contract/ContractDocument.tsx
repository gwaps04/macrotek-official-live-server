import React from 'react';
import { ContractData } from '@/app/contract/contract.actions';
import * as Icons from 'lucide-react';

// FILE: src/components/contract/ContractDocument.tsx

interface ContractDocumentProps {
  contract: ContractData;
  liveSignature?: string | null;
}

export default function ContractDocument({ contract, liveSignature }: ContractDocumentProps) {
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
    <div 
      id="contract-document"
      className="bg-white text-zinc-900 shadow-2xl border border-zinc-200/90 rounded-2xl md:rounded-3xl p-6 sm:p-10 md:p-12 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none font-serif text-[13px] leading-relaxed print:text-[11px] print:leading-snug print:bg-white"
    >
      
      {/* Document Letterhead */}
      <div className="border-b-2 border-zinc-900 pb-5 mb-5 print:pb-3 print:mb-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 font-sans">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
              <span className="text-xs print:text-[10px] font-black tracking-widest uppercase text-zinc-500">
                Macrotek Digital Solutions
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl print:text-xl font-extrabold text-zinc-950 mt-1 uppercase tracking-tight">
              {contractTitle}
            </h1>
            <p className="text-xs print:text-[10px] text-zinc-600 font-medium mt-0.5">
              Enterprise Software Architecture &bull; Automation Pipelines &bull; Digital Infrastructure
            </p>
          </div>

          <div className="text-left sm:text-right print:text-right text-xs print:text-[10px] text-zinc-500 space-y-0.5 sm:self-center print:self-center">
            <p className="font-mono font-bold text-zinc-900 text-xs print:text-[10px]">REF: {refNumber}</p>
            <p>Effective Date: <span className="font-medium text-zinc-800">{formattedDate}</span></p>
            <p className="font-mono text-[11px] print:text-[9.5px] text-zinc-400">Security Gate: Protected Access</p>
          </div>
        </div>
      </div>

      {/* Parties Summary Box */}
      <div className="contract-parties-card mb-6 print:mb-3 border border-zinc-300 rounded-xl overflow-hidden print:rounded-none font-sans text-xs print:text-[10.5px]">
        <div className="bg-zinc-100/80 px-4 py-2 print:px-3 print:py-1 border-b border-zinc-300 font-bold text-zinc-800 uppercase tracking-wider text-[11px] print:text-[9.5px]">
          Parties to This Agreement
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 divide-y md:divide-y-0 md:divide-x print:divide-y-0 print:divide-x divide-zinc-300">
          
          {/* Service Provider */}
          <div className="p-3.5 print:p-2 bg-zinc-50/50 space-y-1 print:space-y-0.5">
            <span className="text-[10px] print:text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Service Provider</span>
            <p className="font-bold text-zinc-950 text-sm print:text-xs">MACROTEK DIGITAL SOLUTIONS</p>
            <p className="text-zinc-600">Represented by: <strong className="text-zinc-800">Jason Millena</strong> (Lead Architect)</p>
            <p className="text-zinc-600">Address: Legazpi City, Albay, Philippines</p>
            <p className="text-zinc-600">Email: admin@macrotek.com / contact@macrotek.com</p>
          </div>

          {/* Client */}
          <div className="p-3.5 print:p-2 space-y-1 print:space-y-0.5">
            <span className="text-[10px] print:text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Authorized Client</span>
            <p className="font-bold text-zinc-950 text-sm print:text-xs">
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
        <div className="contract-financial-card mb-6 print:mb-3 p-4 print:p-2.5 bg-zinc-50 border-2 border-zinc-200 rounded-xl print:rounded-none font-sans">
          <div className="flex items-center justify-between mb-3 print:mb-2 border-b border-zinc-200 pb-2 print:pb-1">
            <h3 className="text-xs print:text-[11px] font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
              <Icons.CreditCard size={15} className="text-emerald-600" />
              Financial Investment &amp; Payment Schedule
            </h3>
            <span className="text-xs print:text-[10px] font-semibold px-2 py-0.5 bg-zinc-200/80 rounded text-zinc-800">
              Currency: {currencyCode} ({currencySymbol})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-3 print:gap-2 text-center sm:text-left print:text-left">
            
            <div className="p-3 print:p-2 bg-white rounded-xl print:rounded-lg border border-zinc-200 shadow-2xs print:shadow-none">
              <span className="text-[10px] print:text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Total Project Cost</span>
              <p className="text-lg print:text-sm font-black text-zinc-950 mt-0.5">
                {currencySymbol}{totalCost.toLocaleString()} <span className="text-xs print:text-[10px] font-normal text-zinc-500">{currencyCode}</span>
              </p>
              <span className="text-[10px] print:text-[8.5px] text-zinc-400">Total agreed fee</span>
            </div>

            {hasDownpaymentPct ? (
              <React.Fragment>
                <div className="p-3 print:p-2 bg-emerald-50/70 rounded-xl print:rounded-lg border border-emerald-200 shadow-2xs print:shadow-none">
                  <span className="text-[10px] print:text-[9px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Commencement Downpayment ({downpaymentPct}%)
                  </span>
                  <p className="text-lg print:text-sm font-black text-emerald-950 mt-0.5">
                    {currencySymbol}{downpaymentAmount.toLocaleString()} <span className="text-xs font-normal text-emerald-700">{currencyCode}</span>
                  </p>
                  <span className="text-[10px] text-emerald-700 font-semibold">Due upon contract signing</span>
                </div>

                <div className="p-3 print:p-2 bg-zinc-100/70 rounded-xl print:rounded-lg border border-zinc-300 shadow-2xs print:shadow-none">
                  <span className="text-[10px] print:text-[9px] font-bold text-zinc-600 uppercase tracking-wider block">
                    Handover Balance ({balancePct}%)
                  </span>
                  <p className="text-lg print:text-sm font-black text-zinc-900 mt-0.5">
                    {currencySymbol}{balanceAmount.toLocaleString()} <span className="text-xs print:text-[10px] font-normal text-zinc-500">{currencyCode}</span>
                  </p>
                  <span className="text-[10px] print:text-[8.5px] text-zinc-500">Due upon final deployment</span>
                </div>
              </React.Fragment>
            ) : (
              <div className="p-3 print:p-2 bg-zinc-100/70 rounded-xl print:rounded-lg border border-zinc-300 shadow-2xs print:shadow-none col-span-2">
                <span className="text-[10px] print:text-[9px] font-bold text-zinc-600 uppercase tracking-wider block">
                  Disbursement Schedule
                </span>
                <p className="text-sm print:text-xs font-semibold text-zinc-800 mt-1">
                  100% Full Fee / Customized milestone billing upon mutual approval
                </p>
                <span className="text-[10px] print:text-[8.5px] text-zinc-500">Payable as scheduled by authorized representative</span>
              </div>
            )}

          </div>

          {hasPaymentNotes && (
            <div className="mt-3 pt-3 print:mt-2 print:pt-2 border-t border-zinc-200/80 flex items-start gap-2 text-xs print:text-[10px] text-zinc-700">
              <Icons.Banknote size={14} className="text-emerald-600 shrink-0 mt-0.5 print:w-3 print:h-3" />
              <div>
                <strong className="text-zinc-900">Billing &amp; Payment Instructions: </strong>
                <span>{contract.payment_terms_notes}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="contract-financial-card mb-6 print:mb-3 p-3.5 print:p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl print:rounded-none font-sans flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 print:hidden">
            <Icons.Info size={16} />
          </div>
          <div>
            <h4 className="text-xs print:text-[10.5px] font-bold text-amber-900 uppercase tracking-wider">
              Financial Terms &amp; Pricing Schedule: Pending Mutual Determination
            </h4>
            <p className="text-xs print:text-[10px] text-amber-800 mt-0.5 leading-relaxed print:leading-snug">
              The project cost, initial downpayment percentage, and currency are currently pending determination or will be incorporated into an execution addendum prior to sign-off.
            </p>
            {hasPaymentNotes && (
              <p className="text-xs print:text-[10px] text-amber-900 font-medium mt-1">
                <strong>Preliminary Notes:</strong> {contract.payment_terms_notes}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Contract Body Clauses - AUTO FORMATTED */}
      <div className="space-y-5 print:space-y-2.5 text-zinc-800">
        
        {/* Section 1 */}
        <section className="contract-section space-y-1.5 print:space-y-1">
          <h2 className="text-xs print:text-[11px] font-bold text-zinc-950 font-sans uppercase tracking-wide border-b border-zinc-200 pb-1 print:pb-0.5 flex items-center justify-between">
            <span>1. Scope of Digital Services &amp; Deliverables</span>
          </h2>
          <p className="text-[12.5px] print:text-[10.5px] leading-relaxed print:leading-snug">
            <strong>1.1 Professional Engagement:</strong> The Service Provider (&quot;Macrotek Digital Solutions&quot;) agrees to design, architect, configure, and deploy the digital systems, web applications, integrations, and automation workflows mutually agreed upon with the Client (&quot;{contract.client_name}&quot;) pursuant to this {contractTitle}.
          </p>
          <p className="text-[12.5px] print:text-[10.5px] leading-relaxed print:leading-snug">
            <strong>1.2 Scope Specification:</strong> {contract.scope_description && contract.scope_description.trim().length > 0 
              ? contract.scope_description 
              : 'Scope includes custom architecture development, multi-platform database synchronization, webhook triggers (including n8n / ClickUp / Google Workspace), and automated lead management.'}
          </p>
          <p className="text-[12.5px] print:text-[10.5px] leading-relaxed print:leading-snug">
            <strong>1.3 Change Orders:</strong> Any features, design revisions, or integrations requested by the Client outside the documented scope shall be handled through a formal written Change Order with mutually agreed-upon pricing before work on that item begins.
          </p>
        </section>

        {/* Section 2 */}
        <section className="contract-section space-y-1.5 print:space-y-1">
          <h2 className="text-xs print:text-[11px] font-bold text-zinc-950 font-sans uppercase tracking-wide border-b border-zinc-200 pb-1 print:pb-0.5">
            2. Payment Milestones &amp; Billing Terms
          </h2>
          {hasProjectCost ? (
            <React.Fragment>
              <p className="text-[12.5px] print:text-[10.5px] leading-relaxed print:leading-snug">
                <strong>2.1 Total Agreed Investment:</strong> The Client agrees to compensate the Provider the total sum of <strong>{currencySymbol}{totalCost.toLocaleString()} {currencyCode}</strong>.
              </p>
              <p className="text-[12.5px] print:text-[10.5px] leading-relaxed print:leading-snug">
                <strong>2.2 Milestone Breakdown:</strong>
              </p>
              <ul className="list-disc pl-5 print:pl-4 space-y-1 print:space-y-0.5 font-sans text-xs print:text-[10px]">
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
                <p className="text-[12.5px] print:text-[10.5px] leading-relaxed print:leading-snug">
                  <strong>2.3 Disbursement Instructions:</strong> {contract.payment_terms_notes}
                </p>
              )}
            </React.Fragment>
          ) : (
            <p className="text-[12.5px] print:text-[10.5px] leading-relaxed print:leading-snug">
              <strong>2.1 Fee Determination:</strong> Commercial fees, milestone percentages, and currency for the services outlined herein shall be confirmed in writing by both parties prior to final deployment.
            </p>
          )}
          <p className="text-[12.5px] print:text-[10.5px] leading-relaxed print:leading-snug">
            <strong>{!hasProjectCost ? '2.2' : (hasPaymentNotes ? '2.4' : '2.3')} Third-Party Software &amp; APIs:</strong> The Client shall be directly responsible for all recurring subscriptions to external cloud services, domain registrars, hosting, or third-party APIs incurred for the project.
          </p>
        </section>

        {/* Section 3 */}
        <section className="contract-section space-y-1.5 print:space-y-1">
          <h2 className="text-xs print:text-[11px] font-bold text-zinc-950 font-sans uppercase tracking-wide border-b border-zinc-200 pb-1 print:pb-0.5">
            3. Delivery, Review &amp; Master Handover
          </h2>
          <p className="text-[12.5px] print:text-[10.5px] leading-relaxed print:leading-snug">
            <strong>3.1 Acceptance Period:</strong> Upon notification by the Provider that the deliverable is live on staging or production, the Client shall have seven (7) business days to review all features and report any reproducible functional discrepancies.
          </p>
          <p className="text-[12.5px] print:text-[10.5px] leading-relaxed print:leading-snug">
            <strong>3.2 Administrative Turnover:</strong> Upon receipt of the final balance, the Provider shall issue the &quot;Turnover Packet&quot; containing all master administrative credentials, repository links, and API access keys.
          </p>
          <p className="text-[12.5px] print:text-[10.5px] leading-relaxed print:leading-snug">
            <strong>3.3 Security Ownership:</strong> The Client is solely responsible for changing passwords and safeguarding credentials immediately after turnover. The Provider shall not be liable for unauthorized access occurring subsequent to handover.
          </p>
        </section>

        {/* Section 4 */}
        <section className="contract-section space-y-1.5 print:space-y-1">
          <h2 className="text-xs print:text-[11px] font-bold text-zinc-950 font-sans uppercase tracking-wide border-b border-zinc-200 pb-1 print:pb-0.5">
            4. Intellectual Property &amp; Licensing
          </h2>
          <p className="text-[12.5px] print:text-[10.5px] leading-relaxed print:leading-snug">
            <strong>4.1 Client Content:</strong> All bespoke branding, logos, trademarks, and text supplied by the Client remain the exclusive intellectual property of the Client.
          </p>
          <p className="text-[12.5px] print:text-[10.5px] leading-relaxed print:leading-snug">
            <strong>4.2 Final Deliverables:</strong> Upon payment of the final balance in full, the Client is granted full ownership rights of the customer-facing digital asset.
          </p>
          <p className="text-[12.5px] print:text-[10.5px] leading-relaxed print:leading-snug">
            <strong>4.3 Proprietary Architecture:</strong> Macrotek retains ownership of its proprietary pre-existing utility modules, build pipelines, and design system foundations, granting the Client a perpetual, non-exclusive license to use them in the operation of the delivered system.
          </p>
        </section>

        {/* Section 5 */}
        <section className="contract-section space-y-1.5 print:space-y-1">
          <h2 className="text-xs print:text-[11px] font-bold text-zinc-950 font-sans uppercase tracking-wide border-b border-zinc-200 pb-1 print:pb-0.5">
            5. Data Privacy &amp; Confidentiality (Republic Act No. 10173)
          </h2>
          <p className="text-[12.5px] print:text-[10.5px] leading-relaxed print:leading-snug">
            <strong>5.1 Strict Confidentiality:</strong> Both parties agree to maintain the strict confidentiality of all proprietary, technical, and commercial information disclosed during this engagement.
          </p>
          <p className="text-[12.5px] print:text-[10.5px] leading-relaxed print:leading-snug">
            <strong>5.2 Compliance with Philippine Law:</strong> All collection, storage, and processing of customer and corporate data performed in connection with this project shall strictly comply with the Data Privacy Act of 2012 (RA 10173) of the Philippines.
          </p>
          <p className="text-[12.5px] print:text-[10.5px] leading-relaxed print:leading-snug">
            <strong>5.3 Warranty:</strong> The Provider provides a thirty (30) day stability warranty following launch to address any latent bugs within the agreed scope at zero additional cost.
          </p>
        </section>

        {/* Section 6 - SPECIAL PROVISIONS & BESPOKE COVENANTS (AUTO ADJUSTS) */}
        {hasCustomTerms && (
          <section className="contract-section space-y-1.5 print:space-y-1 p-3.5 print:p-2 bg-zinc-50 border border-zinc-200 rounded-xl print:rounded-none">
            <h2 className="text-xs print:text-[11px] font-bold text-zinc-950 font-sans uppercase tracking-wide border-b border-zinc-300 pb-1 print:pb-0.5 flex items-center gap-1.5">
              <Icons.ShieldAlert size={14} className="text-emerald-700" />
              <span>6. Special Provisions &amp; Bespoke Agreement Terms</span>
            </h2>
            <div className="font-sans text-xs print:text-[10px] text-zinc-800 leading-relaxed print:leading-snug whitespace-pre-wrap">
              {contract.custom_terms}
            </div>
          </section>
        )}

      </div>

      {/* Execution & Signature Section */}
      <div className="contract-signature-card mt-8 print:mt-4 pt-6 print:pt-3 border-t-2 border-zinc-900 font-sans">
        <div className="text-center mb-5 print:mb-2">
          <h3 className="text-xs print:text-[11px] font-bold uppercase tracking-widest text-zinc-900">
            Signatures &amp; Legal Execution
          </h3>
          <p className="text-xs print:text-[9.5px] text-zinc-500 mt-0.5">
            By executing below, both parties confirm they have read, understood, and agreed to the terms outlined above.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-6 print:gap-3">
          
          {/* Provider Signature Card */}
          <div className="p-4 print:p-2.5 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2 print:space-y-1">
            <span className="text-[10px] print:text-[9px] font-bold uppercase tracking-wider text-zinc-400 block">
              For Service Provider:
            </span>
            <div className="h-14 print:h-11 flex items-end border-b border-zinc-300 pb-1.5 print:pb-1">
              <span className="font-serif italic text-2xl print:text-lg text-zinc-800 font-semibold tracking-wide">
                Jason Millena
              </span>
            </div>
            <div className="text-xs print:text-[10px] text-zinc-700 space-y-0.5 print:space-y-0">
              <p className="font-bold text-zinc-950">Jason Millena / Lead Solutions Architect</p>
              <p className="text-zinc-600">Macrotek Digital Solutions</p>
              <p className="text-[11px] print:text-[9px] text-zinc-500 font-mono">Date: {formattedDate}</p>
            </div>
          </div>

          {/* Client Signature Card */}
          <div className="p-4 print:p-2.5 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2 print:space-y-1" id="client-signature-display">
            <span className="text-[10px] print:text-[9px] font-bold uppercase tracking-wider text-zinc-400 block">
              For Authorized Client:
            </span>

            {/* Check if Signed */}
            {contract.status === 'Signed' ? (
              <div className="space-y-2 print:space-y-1">
                <div className="h-16 print:h-12 flex items-center justify-center border-b-2 border-emerald-600 bg-white/80 rounded-t-lg p-1 overflow-hidden relative">
                  {contract.signing_method === 'manual_hardcopy' ? (
                    <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs print:text-[10px]">
                      <Icons.FileCheck2 size={16} />
                      <span>Hardcopy Executed (Uploaded on File)</span>
                    </div>
                  ) : contract.signature_data ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={contract.signature_data}
                      alt="Client Digital Signature"
                      className="max-h-14 print:max-h-10 w-auto object-contain mx-auto"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <span className="font-serif italic text-2xl print:text-lg text-emerald-950 font-bold tracking-wide">
                      {contract.signed_by_name || contract.client_name}
                    </span>
                  )}
                </div>

                {/* Signee Name & Legal Details Directly Underneath Signature */}
                <div className="text-xs print:text-[10px] text-zinc-700 space-y-1 print:space-y-0.5 pt-0.5">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-zinc-950 text-sm print:text-xs">
                      {contract.signed_by_name || contract.client_name}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      <Icons.CheckCircle2 size={11} /> Digitally Signed
                    </span>
                  </div>
                  <p className="text-zinc-600 font-medium">
                    {contract.signed_by_title || 'Authorized Representative'}
                  </p>
                  {contract.company_name && (
                    <p className="text-zinc-500">{contract.company_name}</p>
                  )}
                  <p className="text-[10px] print:text-[8.5px] text-zinc-500 font-mono">
                    Executed: {contract.signed_at ? new Date(contract.signed_at).toLocaleString() : formattedDate}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 print:space-y-1">
                <div className="h-16 print:h-12 flex items-center justify-center border-b-2 border-dashed border-zinc-300 pb-1.5 print:pb-1 bg-white/50 rounded-t-lg">
                  {liveSignature ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={liveSignature}
                      alt="Pending Client Signature Preview"
                      className="max-h-14 print:max-h-10 w-auto object-contain mx-auto"
                    />
                  ) : (
                    <span className="text-xs print:text-[9.5px] text-zinc-400 italic">
                      Awaiting electronic signature verification below...
                    </span>
                  )}
                </div>

                <div className="text-xs print:text-[10px] text-zinc-700 space-y-0.5 pt-0.5">
                  <p className="font-bold text-zinc-900 text-sm print:text-xs">
                    {contract.client_name}
                  </p>
                  <p className="text-zinc-500">
                    {contract.company_name || 'Authorized Client'}
                  </p>
                  <p className="text-[10px] text-amber-600 font-medium">
                    Status: Pending Digital Signature Execution
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Footer Audit Notice */}
      <div className="mt-6 print:mt-3 pt-3 print:pt-2 border-t border-zinc-200 text-center font-sans text-[10px] print:text-[9px] text-zinc-400">
        Document ID: {contract.id || contract.lead_id} &bull; Macrotek Digital Solutions &bull; Authorized E-Signature Document
      </div>

    </div>
  );
}
