import { sql } from '@/lib/db';
import HeroSplit from '@/components/sections/HeroSplit';
import AboutUs from '@/components/sections/AboutUs';
import ServicesGrid, { Service } from '@/components/sections/ServicesGrid';
import ProductCatalog, { Product } from '@/components/sections/ProductCatalog';
import ImageGallery, { GalleryImage } from '@/components/sections/ImageGallery';
import TestimonialsGrid, { Testimonial } from '@/components/sections/TestimonialsGrid';
import AnnouncementsSection, { Announcement } from '@/components/sections/AnnouncementsSection';
import FaqsSection, { Faq } from '@/components/sections/FaqsSection';
import ContactSection from '@/components/sections/ContactSection';

export const dynamic = 'force-dynamic';

export default async function StorefrontHome() {
  
  const [
    configResult, servicesResult, productsResult, galleryResult, 
    testimonialsResult, announcementsResult, faqsResult
  ] = await Promise.all([
    sql`SELECT * FROM site_config WHERE is_singleton = TRUE LIMIT 1`,
    sql`SELECT id, title, description, icon_identifier, image_url, sort_order, card_bg, card_text, card_font FROM services ORDER BY sort_order ASC, created_at DESC`,
    
    // WOZ FIX: Injected p.sort_order ASC into the ORDER BY clause
    sql`SELECT p.id, p.title, p.subtitle, p.description, p.icon_identifier, p.image_url, p.srp, p.discount_percentage, (p.srp - (p.srp * (p.discount_percentage / 100))) AS final_price, c.name as category_name, p.card_bg, p.card_text, p.card_font FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY c.name ASC, p.sort_order ASC, p.created_at DESC`,
    
    sql`SELECT id, title, image_url FROM gallery_images ORDER BY sort_order ASC, created_at DESC`,
    sql`SELECT id, client_name, comments, rating, image_url FROM testimonials ORDER BY sort_order ASC, created_at DESC`,
    sql`SELECT id, title, content, image_url, created_at FROM announcements WHERE is_active = TRUE ORDER BY sort_order ASC, created_at DESC`,
    sql`SELECT id, question, answer FROM faqs WHERE is_active = TRUE ORDER BY sort_order ASC, created_at DESC`
  ]);
  
  const config = configResult[0] || {};
  const services = servicesResult as Service[];
  const products = productsResult as Product[];
  const images = galleryResult as GalleryImage[];
  const testimonials = testimonialsResult as Testimonial[];
  const announcements = announcementsResult as Announcement[];
  const faqs = faqsResult as Faq[];

  return (
    <div className="flex flex-col w-full">
      <HeroSplit title={config.hero_title} subtitle={config.hero_subtitle} imageUrl={config.hero_image_url} bgColor={config.hero_bg_color} textColor={config.hero_text_color} fontFamily={config.hero_font_family} ctaFontFamily={config.cta_font_family} primaryCtaBg={config.primary_cta_bg} primaryCtaText={config.primary_cta_text} secondaryCtaBg={config.secondary_cta_bg} secondaryCtaBorder={config.secondary_cta_border} secondaryCtaText={config.secondary_cta_text} />
      
      <AboutUs text={config.about_text} imageUrl={config.about_image_url} history={{ text: config.about_history, show: config.show_history }} vision={{ text: config.about_vision, show: config.show_vision }} mission={{ text: config.about_mission, show: config.show_mission }} bgType={config.about_bg_type} bgColor={config.about_bg_color} bgGradientTo={config.about_bg_gradient_to} textColor={config.about_text_color} fontFamily={config.about_font_family} />
      
      <ServicesGrid services={services} sectionTitle={config.services_title} sectionSubtitle={config.services_subtitle} sectionDescription={config.services_description} bgType={config.services_bg_type} bgColor={config.services_bg_color} bgGradientTo={config.services_bg_gradient_to} textColor={config.services_text_color} fontFamily={config.services_font_family} cardBg={config.services_card_bg} cardText={config.services_card_text} cardFont={config.services_card_font_family} />
      
      <ProductCatalog 
        products={products} 
        sectionTitle={config.products_title} 
        sectionSubtitle={config.products_subtitle} 
        sectionDescription={config.products_description} 
        bgType={config.products_bg_type} 
        bgColor={config.products_bg_color} 
        bgGradientTo={config.products_bg_gradient_to} 
        textColor={config.products_text_color} 
        fontFamily={config.products_font_family} 
        cardBg={config.products_card_bg} 
        cardText={config.products_card_text} 
        cardFont={config.products_card_font_family} 
        enableAppointments={config.enable_appointments}
        enableEnrollments={config.enable_enrollments}
      />
      
      {config.show_gallery && (
        <ImageGallery images={images} sectionTitle={config.gallery_title} sectionSubtitle={config.gallery_subtitle} bgType={config.gallery_bg_type} bgColor={config.gallery_bg_color} bgGradientTo={config.gallery_bg_gradient_to} textColor={config.gallery_text_color} fontFamily={config.gallery_font_family} />
      )}

      {config.show_testimonials && (
        <TestimonialsGrid 
          items={testimonials} 
          sectionTitle={config.testimonials_title} sectionSubtitle={config.testimonials_subtitle}
          bgType={config.testimonials_bg_type} bgColor={config.testimonials_bg_color} bgGradientTo={config.testimonials_bg_gradient_to} 
          textColor={config.testimonials_text_color} fontFamily={config.testimonials_font_family}
          cardBg={config.testimonials_card_bg} cardText={config.testimonials_card_text}
        />
      )}

      {config.show_announcements && (
        <AnnouncementsSection 
          announcements={announcements} 
          sectionTitle={config.announcements_title} 
          sectionSubtitle={config.announcements_subtitle}
          bgType={config.announcements_bg_type} 
          bgColor={config.announcements_bg_color}
        />
      )}

      {config.show_faqs && (
        <FaqsSection 
          faqs={faqs} 
          sectionTitle={config.faqs_title} 
          sectionSubtitle={config.faqs_subtitle}
          bgType={config.faqs_bg_type} 
          bgColor={config.faqs_bg_color}
        />
      )}

      <ContactSection businessName={config.contact_business_name || config.tenant_name} phone={config.contact_number} altPhone={config.contact_alternate} email={config.contact_email} address={config.contact_address} hours={config.business_hours} bgColor={config.contact_bg_color} textColor={config.contact_text_color} fontFamily={config.contact_font_family} hoursBg={config.contact_hours_bg} hoursText={config.contact_hours_text} hoursFont={config.contact_hours_font_family} />
      
    </div>
  );
}