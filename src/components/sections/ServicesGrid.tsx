import * as Icons from 'lucide-react';
import Image from 'next/image';
import { CSSProperties } from 'react';

export interface Service {
  id: string;
  title: string;
  description: string;
  icon_identifier: string | null;
  image_url?: string | null;
  sort_order: number;
  // WOZ FIX: Theming Interface expansion
  card_bg?: string | null;
  card_text?: string | null;
  card_font?: string | null;
}

interface ServicesGridProps {
  services: Service[];
  sectionTitle?: string;
  sectionSubtitle?: string;
  sectionDescription?: string;
  bgType?: string;
  bgColor?: string;
  bgGradientTo?: string;
  textColor?: string;
  fontFamily?: string;
  cardBg?: string;
  cardText?: string;
  cardFont?: string;
}

export default function ServicesGrid({ 
  services, 
  sectionTitle = "Our Expertise", 
  sectionSubtitle = "High-Performance Solutions", 
  sectionDescription = "Engineered for scale. We provide the infrastructure and automation necessary to accelerate your growth.",
  bgType = 'solid',
  bgColor = '#ffffff',
  bgGradientTo = '#f8fafc',
  textColor = '#18181b',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  cardBg = '#ffffff',
  cardText = '#18181b',
  cardFont = 'ui-sans-serif, system-ui, sans-serif'
}: ServicesGridProps) {
  
  const resolveIcon = (iconName: string | null) => {
    if (!iconName) return Icons.Box;
    // @ts-ignore
    return Icons[iconName] || Icons.Box;
  };

  if (!services || services.length === 0) return null;

  const sectionStyles = {
    fontFamily: fontFamily,
    color: textColor,
    ...(bgType === 'gradient' 
      ? { backgroundImage: `linear-gradient(135deg, ${bgColor}, ${bgGradientTo})` }
      : { backgroundColor: bgColor })
  } as CSSProperties;

  return (
    <section id="services" className="w-full py-24 relative z-10 transition-colors duration-500" style={sectionStyles}>
      <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-semibold tracking-wide uppercase text-sm mb-3 opacity-80">
            {sectionTitle}
          </h2>
          <h3 className="font-display text-3xl md:text-4xl font-bold mb-4">
            {sectionSubtitle}
          </h3>
          <p className="opacity-70 text-base max-w-xl mx-auto">
            {sectionDescription}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => {
            const Icon = resolveIcon(service.icon_identifier);
            
            // WOZ LOGIC: Cascading Variable Engine.
            // If the specific service has a color defined, use it. Otherwise, inherit the global card settings.
            const cardInlineStyle = {
              '--card-bg': service.card_bg || cardBg,
              '--card-text': service.card_text || cardText,
              '--card-font': service.card_font || cardFont,
            } as CSSProperties;
            
            return (
              <div 
                key={service.id} 
                style={cardInlineStyle}
                className="group rounded-2xl border border-black/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out overflow-hidden flex flex-col bg-(--card-bg) text-(--card-text) font-(family-name:--card-font)"
              >
                {/* Conditional Media Layout */}
                {service.image_url ? (
                  <div className="relative w-full h-48 bg-black/5 border-b border-black/5">
                    <Image src={service.image_url} alt={service.title} fill className="object-cover" />
                    <div className="absolute -bottom-6 left-6 w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg border-2 border-(--card-bg)">
                      <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                    </div>
                  </div>
                ) : (
                  <div className="p-8 pb-0">
                    <div className="w-14 h-14 rounded-xl bg-black/5 flex items-center justify-center mb-6 group-hover:bg-black/10 transition-colors">
                      <Icon className="w-7 h-7 opacity-90" strokeWidth={1.5} />
                    </div>
                  </div>
                )}
                
                <div className={`p-8 ${service.image_url ? 'pt-10' : ''} flex-1`}>
                  <h4 className="text-xl font-bold font-display mb-3">
                    {service.title}
                  </h4>
                  <p className="opacity-80 leading-relaxed text-sm">
                    {service.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}