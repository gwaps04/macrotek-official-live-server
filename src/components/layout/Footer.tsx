import Link from 'next/link';
import { CSSProperties } from 'react';

export interface CustomCSS extends CSSProperties {
  [key: `--${string}`]: string | number | undefined;
}

interface FooterProps {
  tenantName: string;
  businessName?: string;
  email?: string;
  phone?: string;
  description?: string;
  devName?: string;
  devLink?: string;
  bgType?: string;
  bgColor?: string;
  bgGradientTo?: string;
  textColor?: string;
  fontFamily?: string;
  
  // WOZ FIX: Allow Footer to mirror the Navbar links dynamically
  links?: string[];
}

export default function Footer({ 
  tenantName, 
  businessName, 
  email, 
  phone,
  description,
  devName,
  devLink,
  bgType = 'solid',
  bgColor = '#09090b',
  bgGradientTo = '#18181b',
  textColor = '#ffffff',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  links = ['Home', 'About Us', 'Services', 'Products', 'News', 'FAQs', 'Contact']
}: FooterProps) {
  
  const currentYear = new Date().getFullYear();
  const displayName = businessName || tenantName || 'Our Company';

  const footerStyles: CustomCSS = {
    fontFamily: fontFamily,
    color: textColor,
    ...(bgType === 'gradient' 
      ? { backgroundImage: `linear-gradient(135deg, ${bgColor}, ${bgGradientTo})` }
      : { backgroundColor: bgColor }),
  };

  return (
    <footer className="pt-20 pb-10 border-t border-current/10 transition-colors duration-500" style={footerStyles}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-8 mb-16">
          
          <div className="space-y-4 md:col-span-1">
            <h3 className="font-display font-bold text-2xl tracking-tight opacity-90">
              {displayName}
            </h3>
            <p className="opacity-70 text-sm leading-relaxed max-w-sm">
              {description || 'High-performance digital architecture and infrastructure tailored for scale.'}
            </p>
            {(email || phone) && (
              <div className="pt-4 space-y-2 opacity-80">
                {email && <p className="text-sm font-mono">{email}</p>}
                {phone && <p className="text-sm font-mono">{phone}</p>}
              </div>
            )}
          </div>

          <div className="md:col-span-1 md:pl-12">
            <h4 className="font-bold uppercase tracking-widest text-xs mb-6 opacity-90">Quick Links</h4>
            <ul className="space-y-4">
              {/* WOZ FIX: Map over the synchronized links array */}
              {links.map((link) => (
                <li key={link}>
                  <Link 
                    href={`/#${link.toLowerCase().replace(/\s+/g, '-')}`}
                    className="opacity-70 hover:opacity-100 transition-opacity text-sm font-medium"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-1">
            <h4 className="font-bold uppercase tracking-widest text-xs mb-6 opacity-90">Legal</h4>
            <ul className="space-y-4">
              <li><Link href="#" className="opacity-70 hover:opacity-100 transition-opacity text-sm">Privacy Policy</Link></li>
              <li><Link href="#" className="opacity-70 hover:opacity-100 transition-opacity text-sm">Terms of Service</Link></li>
              <li><Link href="#" className="opacity-70 hover:opacity-100 transition-opacity text-sm">Data Security</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-current/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs opacity-60">
          <p>© {currentYear} {displayName}. All rights reserved.</p>
          
          {(devName || devLink) && (
            <p className="flex items-center gap-1.5 font-medium">
              Developed by 
              {devLink ? (
                <a 
                  href={devLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:opacity-100 transition-opacity font-bold tracking-wide border-b border-current/30 hover:border-current"
                >
                  {devName || 'Agency'}
                </a>
              ) : (
                <span className="font-bold tracking-wide">{devName}</span>
              )}
            </p>
          )}
        </div>

      </div>
    </footer>
  );
}