import { sql } from '@/lib/db';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Metadata } from 'next';

// WOZ FIX: Upgraded standard metadata to Enterprise Open Graph Metadata
export const metadata: Metadata = {
  title: 'Platform Storefront',
  description: 'High-performance digital architecture and infrastructure tailored for scale.',
  openGraph: {
    title: 'Platform Storefront',
    description: 'High-performance digital architecture and infrastructure tailored for scale.',
    url: 'https://your-vercel-domain.vercel.app', // Update this to your real Vercel URL!
    siteName: 'Our Company',
    images: [
      {
        url: 'https://your-vercel-domain.vercel.app/og-image.jpg', // Upload a 1200x630 image to your public folder!
        width: 1200,
        height: 630,
        alt: 'Platform Storefront Preview Image',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Platform Storefront',
    description: 'High-performance digital architecture and infrastructure tailored for scale.',
  },
};

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const configResult = await sql`
    SELECT 
      tenant_name, 
      logo_url, 
      nav_links,
      contact_email,
      contact_number,
      contact_business_name,
      nav_bg_color,
      nav_text_color,
      nav_font_family,
      
      -- WOZ FIX: Extract the Engine Routing Flags
      enable_appointments,
      enable_enrollments,
      
      -- Footer Configurations
      footer_bg_type,
      footer_bg_color,
      footer_bg_gradient_to,
      footer_text_color,
      footer_font_family,
      footer_description,
      footer_dev_name,
      footer_dev_link
      
    FROM site_config 
    WHERE is_singleton = TRUE 
    LIMIT 1
  `;
  
  const config = configResult[0] || {};
  const navLinks = config.nav_links || ["Home", "About Us", "Services", "Products", "Contact"];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* WOZ FIX: Pass the flags to the Navbar */}
      <Navbar 
        tenantName={config.tenant_name || 'Our Company'} 
        logoUrl={config.logo_url} 
        links={navLinks}
        navBgColor={config.nav_bg_color}
        navTextColor={config.nav_text_color}
        navFontFamily={config.nav_font_family}
        enableAppointments={config.enable_appointments}
        enableEnrollments={config.enable_enrollments}
      />
      
      <main className="grow w-full mt-16">
        {children}
      </main>
      
      <Footer 
        tenantName={config.tenant_name || 'Our Company'} 
        businessName={config.contact_business_name}
        email={config.contact_email} 
        phone={config.contact_number}
        description={config.footer_description}
        devName={config.footer_dev_name}
        devLink={config.footer_dev_link}
        bgType={config.footer_bg_type} bgColor={config.footer_bg_color} bgGradientTo={config.footer_bg_gradient_to} textColor={config.footer_text_color} fontFamily={config.footer_font_family}
      />
    </div>
  );
}