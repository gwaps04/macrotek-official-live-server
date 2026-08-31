import Image from "next/image";
import Link from "next/link";
import { CSSProperties } from "react";

interface HeroProps {
  title: string;
  subtitle: string;
  imageUrl?: string;
  
  // Theming Props
  bgColor?: string;
  textColor?: string;
  fontFamily?: string;
  ctaFontFamily?: string;
  primaryCtaBg?: string;
  primaryCtaText?: string;
  secondaryCtaBg?: string;
  secondaryCtaBorder?: string;
  secondaryCtaText?: string;
}

export default function HeroSplit({ 
  title, 
  subtitle, 
  imageUrl,
  bgColor = '#f8fafc',
  textColor = '#18181b',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  ctaFontFamily = 'ui-sans-serif, system-ui, sans-serif',
  primaryCtaBg = '#059669',
  primaryCtaText = '#ffffff',
  secondaryCtaBg = '#ffffff',
  secondaryCtaBorder = '#e4e4e7',
  secondaryCtaText = '#18181b'
}: HeroProps) {
  
  const isVideo = imageUrl?.match(/\.(mp4|webm|ogg)$/i) !== null;

  // WOZ LOGIC: Injecting Custom CSS Variables for Tailwind to consume.
  // This allows us to use dynamic database colors WHILE keeping Tailwind's hover states.
  const dynamicStyles = {
    '--hero-bg': bgColor,
    '--hero-text': textColor,
    '--hero-font': fontFamily,
    '--cta-font': ctaFontFamily,
    '--primary-bg': primaryCtaBg,
    '--primary-text': primaryCtaText,
    '--secondary-bg': secondaryCtaBg,
    '--secondary-border': secondaryCtaBorder,
    '--secondary-text': secondaryCtaText,
  } as CSSProperties;

  return (
    <section 
      style={dynamicStyles} 
      className="relative w-full min-h-[80vh] flex items-center overflow-hidden bg-[var(--hero-bg)] font-[family-name:var(--hero-font)] transition-colors duration-500"
    >
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center py-16">
          
          {/* Left: Content Stack */}
          <div className="flex flex-col items-start space-y-6 z-10 text-[var(--hero-text)]">
            <h1 className="balance-text text-4xl sm:text-5xl lg:text-6xl font-bold font-display tracking-tight leading-tight">
              {title}
            </h1>
            <p className="max-w-[600px] leading-relaxed text-lg opacity-80">
              {subtitle}
            </p>
            
            {/* Dual-CTA Interaction Hierarchy */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-4 font-[family-name:var(--cta-font)]">
              <Link 
                href="#about-us" 
                className="inline-flex items-center justify-center px-8 py-4 text-sm font-semibold rounded-lg transition-all w-full sm:w-auto shadow-sm bg-[var(--primary-bg)] text-[var(--primary-text)] hover:opacity-90 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
              >
                Learn More
              </Link>
              <Link 
                href="#contact" 
                className="inline-flex items-center justify-center px-8 py-4 text-sm font-semibold rounded-lg transition-all w-full sm:w-auto shadow-sm border bg-[var(--secondary-bg)] text-[var(--secondary-text)] border-[var(--secondary-border)] hover:opacity-80 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
              >
                Contact Us
              </Link>
            </div>
          </div>

          {/* Right: Media Container with Aspect Guard */}
          <div className="relative w-full aspect-square lg:aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-white/5 border border-black/5 flex items-center justify-center p-4 backdrop-blur-sm">
            {imageUrl ? (
              isVideo ? (
                <video src={imageUrl} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover object-center rounded-2xl" />
              ) : (
                <Image src={imageUrl} alt="Hero Showcase" fill priority className="object-contain object-center p-4 sm:p-8" sizes="(max-width: 1024px) 100vw, 50vw" />
              )
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40 bg-black/5 border-2 border-dashed border-black/10 rounded-2xl m-4 text-[var(--hero-text)]">
                <svg className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span className="text-sm font-medium">Hero Media Pending</span>
                <span className="text-xs">Configure in Admin CMS</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}