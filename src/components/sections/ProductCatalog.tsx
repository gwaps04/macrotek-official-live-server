import * as Icons from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { CSSProperties } from 'react';

export interface CustomCSS extends CSSProperties {
  [key: `--${string}`]: string | number | undefined;
}

export interface Product {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon_identifier: string;
  image_url?: string;
  srp: number;
  discount_percentage: number;
  final_price: number;
  category_name: string;
  card_bg?: string | null;
  card_text?: string | null;
  card_font?: string | null;
}

interface ProductCatalogProps {
  products: Product[];
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

  // WOZ FIX: Added routing engine context flags
  enableAppointments?: boolean;
  enableEnrollments?: boolean;
}

export default function ProductCatalog({ 
  products,
  sectionTitle = "Digital Storefront",
  sectionSubtitle = "Products & Packages",
  sectionDescription = "Transparent pricing for high-performance integrations and hardware.",
  bgType = 'solid',
  bgColor = '#f8fafc',
  bgGradientTo = '#ffffff',
  textColor = '#18181b',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  cardBg = '#ffffff',
  cardText = '#18181b',
  cardFont = 'ui-sans-serif, system-ui, sans-serif',
  enableAppointments = true,
  enableEnrollments = false
}: ProductCatalogProps) {
  
  const resolveIcon = (iconName: string) => {
    // @ts-ignore
    return Icons[iconName] || Icons.Box;
  };

  if (!products || products.length === 0) return null;

  const groupedProducts = products.reduce((acc, product) => {
    const cat = product.category_name || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const formatPHP = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  };

  const sectionStyles: CustomCSS = {
    fontFamily: fontFamily,
    color: textColor,
    ...(bgType === 'gradient' 
      ? { backgroundImage: `linear-gradient(135deg, ${bgColor}, ${bgGradientTo})` }
      : { backgroundColor: bgColor }),
  };

  // Single Active Operating Mode target route: strictly /classes (enrollment) or /book (appointment)
  const targetRoute = (enableEnrollments && !enableAppointments) ? "/classes" : "/book";

  return (
    <section id="products" className="w-full py-24 relative z-10 transition-colors duration-500" style={sectionStyles}>
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

        <div className="space-y-20">
          {Object.entries(groupedProducts).map(([category, items]) => (
            <div key={category}>
              
              <div className="flex items-center gap-4 mb-8">
                <h4 className="text-2xl font-bold font-display opacity-90">{category}</h4>
                <div className="h-px bg-current opacity-10 flex-1 mt-2"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {items.map((item) => {
                  const Icon = resolveIcon(item.icon_identifier);
                  const hasDiscount = Number(item.discount_percentage) > 0;
                  
                  const cardInlineStyle: CustomCSS = {
                    '--card-bg': item.card_bg || cardBg,
                    '--card-text': item.card_text || cardText,
                    '--card-font': item.card_font || cardFont,
                    '--tw-prose-body': 'var(--card-text)',
                    '--tw-prose-headings': 'var(--card-text)',
                    '--tw-prose-bold': 'var(--card-text)',
                    '--tw-prose-links': 'var(--card-text)',
                    '--tw-prose-lists': 'var(--card-text)',
                    '--tw-prose-quotes': 'var(--card-text)',
                  };
                  
                  return (
                    <div 
                      key={item.id} 
                      style={cardInlineStyle}
                      className="rounded-2xl border border-black/5 shadow-sm overflow-hidden flex flex-col hover:border-emerald-500 transition-colors bg-(--card-bg) text-(--card-text) font-(family-name:--card-font)"
                    >
                      <div className="relative w-full h-48 bg-black/5 flex items-center justify-center overflow-hidden shrink-0 border-b border-black/5">
                        {item.image_url ? (
                          <Image src={item.image_url} alt={item.title} fill className="object-cover opacity-90" />
                        ) : (
                          <Icon className="w-16 h-16 opacity-30" strokeWidth={1} />
                        )}
                        {hasDiscount && (
                          <div className="absolute top-4 right-4 bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                            SAVE {Number(item.discount_percentage)}%
                          </div>
                        )}
                      </div>

                      <div className="p-6 flex-1 flex flex-col">
                        <div className="mb-4">
                          <h5 className="text-xl font-bold font-display leading-tight mb-1">{item.title}</h5>
                          <p className="text-sm opacity-70 font-semibold">{item.subtitle}</p>
                        </div>
                        
                        <div 
                          className="
                            prose max-w-none flex-1 text-sm opacity-80 mb-6
                            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ul]:space-y-1 
                            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_ol]:space-y-1 
                            [&_p]:mb-4 last:[&_p]:mb-0
                            [&_b]:font-bold [&_strong]:font-bold 
                            [&_i]:italic [&_em]:italic 
                          " 
                          dangerouslySetInnerHTML={{ __html: item.description }} 
                        />
                        
                        <div className="pt-4 border-t border-current/10 flex items-end justify-between mt-auto">
                          <div>
                            <span className="block text-[10px] uppercase tracking-wider opacity-60 font-bold mb-1">Total Price</span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold font-mono">
                                {formatPHP(item.final_price)}
                              </span>
                              {hasDiscount && (
                                <span className="text-sm font-mono opacity-60 line-through">
                                  {formatPHP(item.srp)}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* WOZ FIX: Converted button to Link for dynamic routing */}
                          <Link 
                            href={`${targetRoute}?package=${encodeURIComponent(item.title)}`}
                            className="bg-black/90 hover:bg-emerald-600 text-white w-10 h-10 rounded-lg flex items-center justify-center transition-colors shadow-sm border border-white/10"
                            aria-label={`Select ${item.title}`}
                          >
                            <Icons.ArrowRight size={18} />
                          </Link>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}