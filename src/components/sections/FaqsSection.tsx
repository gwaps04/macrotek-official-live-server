import React from 'react';

export interface Faq {
  id: string;
  question: string;
  answer: string;
}

interface FaqsSectionProps {
  faqs: Faq[];
  sectionTitle?: string;
  sectionSubtitle?: string;
  bgType?: string;
  bgColor?: string;
}

export default function FaqsSection({
  faqs,
  sectionTitle,
  sectionSubtitle,
  bgType = 'solid',
  bgColor = '#ffffff'
}: FaqsSectionProps) {
  if (!faqs || faqs.length === 0) return null;

  return (
    <section 
      id="faqs"
      className="py-24 border-t border-zinc-200" 
      style={{ 
        backgroundColor: bgType === 'solid' ? bgColor : 'transparent'
      }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">
            {sectionTitle || 'Frequently Asked Questions'}
          </h2>
          {sectionSubtitle && (
            <p className="mt-4 text-lg text-zinc-600">
              {sectionSubtitle}
            </p>
          )}
        </div>
        
        <div className="space-y-4">
          {faqs.map((faq) => (
            <details key={faq.id} className="group bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between cursor-pointer p-6 font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset">
                <span className="pr-4">{faq.question}</span>
                <span className="flex-shrink-0 transition-transform duration-300 group-open:rotate-180 text-zinc-400 group-hover:text-emerald-600">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path></svg>
                </span>
              </summary>
              <div className="px-6 pb-6 text-zinc-600 text-sm leading-relaxed border-t border-zinc-50 pt-4">
                 <div className="prose prose-sm prose-zinc" dangerouslySetInnerHTML={{ __html: faq.answer }} />
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}