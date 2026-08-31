"use client";

import { useState, CSSProperties } from 'react';
import * as Icons from 'lucide-react';
import Image from 'next/image';

export interface CustomCSS extends CSSProperties {
  [key: `--${string}`]: string | number | undefined;
}

export interface Testimonial {
  id: string;
  client_name: string;
  comments: string;
  rating: number;
  image_url?: string | null;
}

interface TestimonialsProps {
  items: Testimonial[];
  sectionTitle?: string;
  sectionSubtitle?: string;
  
  bgType?: string;
  bgColor?: string;
  bgGradientTo?: string;
  textColor?: string;
  fontFamily?: string;
  cardBg?: string;
  cardText?: string;
}

export default function TestimonialsGrid({ 
  items,
  sectionTitle = "Success Stories",
  sectionSubtitle = "What Our Clients Say",
  bgType = 'solid',
  bgColor = '#f8fafc',
  bgGradientTo = '#ffffff',
  textColor = '#18181b',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  cardBg = '#ffffff',
  cardText = '#18181b'
}: TestimonialsProps) {
  
  // WOZ LOGIC: Client Pagination (Starts at 8 = 2 rows of 4 on Desktop)
  const [visibleCount, setVisibleCount] = useState(8);

  if (!items || items.length === 0) return null;

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = items.length > visibleCount;

  const sectionStyles: CustomCSS = {
    fontFamily: fontFamily,
    color: textColor,
    ...(bgType === 'gradient' 
      ? { backgroundImage: `linear-gradient(135deg, ${bgColor}, ${bgGradientTo})` }
      : { backgroundColor: bgColor }),
      
    '--card-bg': cardBg,
    '--card-text': cardText,
  };

  return (
    <section id="testimonials" className="w-full py-24 relative z-10 transition-colors duration-500" style={sectionStyles}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-semibold tracking-wide uppercase text-sm mb-3 opacity-80">
            {sectionTitle}
          </h2>
          <h3 className="font-display text-3xl md:text-4xl font-bold">
            {sectionSubtitle}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {visibleItems.map((item) => (
            <div 
              key={item.id} 
              className="rounded-2xl p-8 shadow-sm border border-current/5 flex flex-col justify-between transition-colors bg-[var(--card-bg)] text-[var(--card-text)]"
            >
              <div className="flex text-amber-400 mb-6">
                {[...Array(item.rating)].map((_, i) => (
                  <Icons.Star key={i} size={16} fill="currentColor" strokeWidth={1} />
                ))}
              </div>
              
              <p className="text-sm leading-relaxed opacity-80 italic flex-1 mb-8">
                "{item.comments}"
              </p>
              
              <div className="flex items-center gap-4 pt-4 border-t border-current/10">
                {item.image_url ? (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border border-current/10 flex-shrink-0">
                    <Image src={item.image_url} alt={item.client_name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-current/5 flex items-center justify-center border border-current/10 flex-shrink-0">
                    <Icons.User size={20} className="opacity-50" />
                  </div>
                )}
                <h4 className="font-bold text-sm tracking-wide opacity-90">
                  {item.client_name}
                </h4>
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <div className="mt-12 flex justify-center">
            <button 
              onClick={() => setVisibleCount(prev => prev + 8)}
              className="px-8 py-3 rounded-full border-2 border-current/20 font-bold text-sm tracking-wider uppercase hover:bg-current/5 transition-colors"
            >
              Load More Stories
            </button>
          </div>
        )}

      </div>
    </section>
  );
}