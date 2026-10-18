import Image from "next/image";
import { CSSProperties } from "react";

// WOZ ARCHITECTURE: Type-Safe CSS Custom Property Interface
// This teaches TypeScript to accept standard CSS AND our custom '--variable' strings.
export interface CustomCSS extends CSSProperties {
  [key: `--${string}`]: string | number | undefined;
}

interface AboutProps {
  text: string;
  imageUrl?: string;
  history?: { text: string; show: boolean };
  vision?: { text: string; show: boolean };
  mission?: { text: string; show: boolean };
  
  bgType?: string;
  bgColor?: string;
  bgGradientTo?: string;
  textColor?: string;
  fontFamily?: string;
}

export default function AboutUs({ 
  text, 
  imageUrl, 
  history, 
  vision, 
  mission,
  bgType = 'solid',
  bgColor = '#ffffff',
  bgGradientTo = '#f8fafc',
  textColor = '#18181b',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif'
}: AboutProps) {
  
  if (!text || text.trim() === '') return null;

  const activeBlocks = [history?.show, vision?.show, mission?.show].filter(Boolean).length;
  const gridCols = activeBlocks === 3 ? 'lg:grid-cols-3' : activeBlocks === 2 ? 'lg:grid-cols-2' : 'grid-cols-1';

  // WOZ FIX: Assigned the CustomCSS interface to satisfy the TypeScript compiler
  const dynamicStyles: CustomCSS = {
    fontFamily: fontFamily,
    color: textColor,
    ...(bgType === 'gradient' 
      ? { backgroundImage: `linear-gradient(135deg, ${bgColor}, ${bgGradientTo})` }
      : { backgroundColor: bgColor }),

    '--tw-prose-body': textColor,
    '--tw-prose-headings': textColor,
    '--tw-prose-bold': textColor,
    '--tw-prose-links': textColor,
    '--tw-prose-lists': textColor,
    '--tw-prose-quotes': textColor,
  };

  return (
    <section id="about-us" className="w-full py-24 relative z-10 transition-colors duration-500" style={dynamicStyles}>
      <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className={`grid grid-cols-1 ${imageUrl ? 'lg:grid-cols-2 gap-12 lg:gap-16' : ''} items-center mb-24`}>
          <div className="space-y-6">
            <h2 className="font-semibold tracking-wide uppercase text-sm opacity-80">
              Our Story
            </h2>
            <h3 className="font-display text-3xl md:text-4xl font-bold">
              Who We Are
            </h3>
            
            <div 
              className="prose prose-zinc max-w-none leading-relaxed transition-colors"
              dangerouslySetInnerHTML={{ __html: text }}
            />
          </div>

          {imageUrl && (
            <div className="relative w-full aspect-square lg:aspect-4/3 rounded-2xl overflow-hidden shadow-2xl bg-black/5 border border-black/10">
              <Image src={imageUrl} alt="About Us" fill className="object-cover object-center" />
            </div>
          )}
        </div>

        {activeBlocks > 0 && (
          <div className={`grid grid-cols-1 md:grid-cols-2 ${gridCols} gap-8 pt-12 border-t border-black/10`}>
            
            {history?.show && (
              <div className="p-8 rounded-2xl border border-black/10 bg-black/5 shadow-sm">
                <h4 className="text-xl font-bold font-display mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-black/10 rounded-lg flex items-center justify-center text-sm">🕰️</span>
                  Our History
                </h4>
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: history.text }} />
              </div>
            )}

            {vision?.show && (
              <div className="p-8 rounded-2xl border border-black/10 bg-black/5 shadow-sm">
                <h4 className="text-xl font-bold font-display mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-black/10 rounded-lg flex items-center justify-center text-sm">🔭</span>
                  Our Vision
                </h4>
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: vision.text }} />
              </div>
            )}

            {mission?.show && (
              <div className="p-8 rounded-2xl border border-black/10 bg-black/5 shadow-sm">
                <h4 className="text-xl font-bold font-display mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-black/10 rounded-lg flex items-center justify-center text-sm">🎯</span>
                  Our Mission
                </h4>
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: mission.text }} />
              </div>
            )}

          </div>
        )}

      </div>
    </section>
  );
}