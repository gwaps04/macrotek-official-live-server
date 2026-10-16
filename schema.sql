-- =====================================================================================
-- THE MACROTEK CLEAN SLATE PROTOCOL (v5.3 - FAQS, ANNOUNCEMENTS & SEEDS ADDED)
-- Warning: Executing this will permanently wipe all client data and reset the template.
-- =====================================================================================

-- =====================================================================================
-- 0. SYSTEM PREREQUISITES
-- =====================================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================================================
-- 1. NUKE THE EXISTING ARCHITECTURE
-- =====================================================================================
DROP TABLE IF EXISTS class_enrollments CASCADE;
DROP TABLE IF EXISTS class_schedules CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS booking_blocked_dates CASCADE;
DROP TABLE IF EXISTS booking_settings CASCADE;
DROP TABLE IF EXISTS gallery_images CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS testimonials CASCADE;
-- WOZ FIX: Added missing drops for new content engines
DROP TABLE IF EXISTS faqs CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS site_config CASCADE;

-- =====================================================================================
-- 2. REBUILD CORE AUTH & TRANSACTIONS
-- =====================================================================================
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  client_first_name TEXT NOT NULL,
  client_last_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_address TEXT,
  client_notes TEXT,
  status TEXT DEFAULT 'Pending',
  prequalification_answers JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  -- Prevents two people booking the exact same slot at the DB level
  UNIQUE(appointment_date, appointment_time) 
);

CREATE TABLE booking_blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocked_date DATE NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE booking_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_singleton BOOLEAN DEFAULT true UNIQUE,
  is_active BOOLEAN DEFAULT true,
  max_daily_bookings INTEGER DEFAULT 4,
  slot_duration_minutes INTEGER DEFAULT 60,
  schedule JSONB DEFAULT '{"monday": {"active": true}, "tuesday": {"active": true}, "wednesday": {"active": true}, "thursday": {"active": true}, "friday": {"active": true}, "saturday": {"active": false}, "sunday": {"active": false}}'::jsonb,
  available_time_slots JSONB DEFAULT '["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"]'::jsonb,
  prequalification_questions JSONB DEFAULT '[]'::jsonb,
  booking_title TEXT DEFAULT 'Schedule an Appointment',
  booking_subtitle TEXT DEFAULT 'Select an available date below to book a session.',
  booking_bg_type TEXT DEFAULT 'solid',
  booking_bg_color TEXT DEFAULT '#f8fafc',
  booking_bg_gradient_to TEXT DEFAULT '#ffffff',
  booking_text_color TEXT DEFAULT '#18181b',
  booking_font_family TEXT DEFAULT 'ui-sans-serif, system-ui, sans-serif',
  booking_primary_color TEXT DEFAULT '#059669',
  booking_card_bg TEXT DEFAULT '#ffffff',
  booking_form_title TEXT DEFAULT 'Appointment Details',
  booking_form_subtitle TEXT DEFAULT 'Please select a time and provide your details below.'
);

-- =====================================================================================
-- 3. REBUILD E-COMMERCE & ENROLLMENT ENGINES
-- =====================================================================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  title VARCHAR,
  slug VARCHAR NOT NULL UNIQUE
);

CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  instructor_name TEXT,
  icon_identifier TEXT DEFAULT 'Users',
  image_url TEXT,
  price NUMERIC DEFAULT 0.00,
  max_capacity INTEGER DEFAULT 20,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE class_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'Scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE class_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES class_schedules(id) ON DELETE CASCADE,
  student_first_name TEXT NOT NULL,
  student_last_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  student_phone TEXT NOT NULL,
  student_address TEXT,
  status TEXT DEFAULT 'Registered',
  payment_status TEXT DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================================
-- 4. REBUILD CONTENT MANAGEMENT ENGINES
-- =====================================================================================
-- WOZ FIX: Added Announcements & FAQs tables
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  title VARCHAR NOT NULL,
  subtitle VARCHAR,
  description TEXT,
  srp NUMERIC NOT NULL DEFAULT 0.0000,
  discount_percentage NUMERIC NOT NULL DEFAULT 0.00,
  image_url TEXT,
  icon_identifier VARCHAR,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  card_bg TEXT,
  card_text TEXT,
  card_font TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  icon_identifier VARCHAR,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  card_bg TEXT,
  card_text TEXT,
  card_font TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  title VARCHAR,
  comments TEXT NOT NULL,
  rating INTEGER DEFAULT 5,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================================
-- 5. REBUILD GLOBAL CONFIGURATION (THE MASTER SINGLETON)
-- =====================================================================================
CREATE TABLE site_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_singleton BOOLEAN DEFAULT true UNIQUE,
  tenant_name VARCHAR NOT NULL DEFAULT 'Default Brand',
  
  -- Universal Metadata Columns
  title VARCHAR DEFAULT 'Platform Storefront',
  description TEXT DEFAULT 'High-performance digital catalog.',
  meta_title VARCHAR,
  meta_description TEXT,
  
  logo_url TEXT,
  
  -- WOZ FIX: Updated default array to include "News" and "FAQs"
  nav_links JSONB DEFAULT '["Home", "About Us", "Services", "Products", "News", "FAQs", "Contact"]'::jsonb,
  
  -- WOZ FIX: Added CMS Module Toggles & Headers
  show_announcements BOOLEAN DEFAULT true,
  announcements_title TEXT DEFAULT 'Latest Updates',
  announcements_subtitle TEXT DEFAULT 'Company News & Announcements',
  announcements_bg_type TEXT DEFAULT 'solid',
  announcements_bg_color TEXT DEFAULT '#f8fafc',
  
  show_faqs BOOLEAN DEFAULT true,
  faqs_title TEXT DEFAULT 'Frequently Asked Questions',
  faqs_subtitle TEXT DEFAULT 'Everything you need to know.',
  faqs_bg_type TEXT DEFAULT 'solid',
  faqs_bg_color TEXT DEFAULT '#ffffff',
  
  -- Hero Config
  hero_title VARCHAR NOT NULL DEFAULT 'Welcome to our Platform',
  hero_subtitle TEXT,
  hero_image_url TEXT,
  hero_bg_color TEXT DEFAULT '#f8fafc',
  hero_text_color TEXT DEFAULT '#18181b',
  hero_font_family TEXT DEFAULT 'ui-sans-serif, system-ui, sans-serif',
  
  -- CTA Config
  cta_font_family TEXT DEFAULT 'ui-sans-serif, system-ui, sans-serif',
  primary_cta_bg TEXT DEFAULT '#059669',
  primary_cta_text TEXT DEFAULT '#ffffff',
  secondary_cta_bg TEXT DEFAULT '#ffffff',
  secondary_cta_border TEXT DEFAULT '#e4e4e7',
  secondary_cta_text TEXT DEFAULT '#18181b',
  
  -- About Config
  about_text TEXT,
  about_image_url TEXT,
  about_history TEXT,
  show_history BOOLEAN DEFAULT false,
  about_vision TEXT,
  show_vision BOOLEAN DEFAULT false,
  about_mission TEXT,
  show_mission BOOLEAN DEFAULT false,
  about_bg_type TEXT DEFAULT 'solid',
  about_bg_color TEXT DEFAULT '#ffffff',
  about_bg_gradient_to TEXT DEFAULT '#f8fafc',
  about_text_color TEXT DEFAULT '#18181b',
  about_font_family TEXT DEFAULT 'ui-sans-serif, system-ui, sans-serif',
  
  -- Services Config
  services_title TEXT DEFAULT 'Our Expertise',
  services_subtitle TEXT DEFAULT 'High-Performance Solutions',
  services_description TEXT DEFAULT 'Engineered for scale.',
  services_bg_type TEXT DEFAULT 'solid',
  services_bg_color TEXT DEFAULT '#ffffff',
  services_bg_gradient_to TEXT DEFAULT '#f8fafc',
  services_text_color TEXT DEFAULT '#18181b',
  services_font_family TEXT DEFAULT 'ui-sans-serif, system-ui, sans-serif',
  services_card_bg TEXT DEFAULT '#ffffff',
  services_card_text TEXT DEFAULT '#18181b',
  services_card_font_family TEXT DEFAULT 'ui-sans-serif, system-ui, sans-serif',
  
  -- Products Config
  products_title TEXT DEFAULT 'Digital Storefront',
  products_subtitle TEXT DEFAULT 'Products & Packages',
  products_description TEXT DEFAULT 'Transparent pricing for high-performance integrations and hardware.',
  products_bg_type TEXT DEFAULT 'solid',
  products_bg_color TEXT DEFAULT '#f8fafc',
  products_bg_gradient_to TEXT DEFAULT '#ffffff',
  products_text_color TEXT DEFAULT '#18181b',
  products_font_family TEXT DEFAULT 'ui-sans-serif, system-ui, sans-serif',
  products_card_bg TEXT DEFAULT '#ffffff',
  products_card_text TEXT DEFAULT '#18181b',
  products_card_font_family TEXT DEFAULT 'ui-sans-serif, system-ui, sans-serif',
  
  -- Gallery Config
  show_gallery BOOLEAN DEFAULT true,
  gallery_title TEXT DEFAULT 'Our Gallery',
  gallery_subtitle TEXT DEFAULT 'Moments & Highlights',
  gallery_bg_type TEXT DEFAULT 'solid',
  gallery_bg_color TEXT DEFAULT '#ffffff',
  gallery_bg_gradient_to TEXT DEFAULT '#f8fafc',
  gallery_text_color TEXT DEFAULT '#18181b',
  gallery_font_family TEXT DEFAULT 'ui-sans-serif, system-ui, sans-serif',
  
  -- Testimonials Config
  show_testimonials BOOLEAN DEFAULT true,
  testimonials_title TEXT DEFAULT 'Success Stories',
  testimonials_subtitle TEXT DEFAULT 'What Our Clients Say',
  testimonials_bg_type TEXT DEFAULT 'solid',
  testimonials_bg_color TEXT DEFAULT '#f8fafc',
  testimonials_bg_gradient_to TEXT DEFAULT '#ffffff',
  testimonials_text_color TEXT DEFAULT '#18181b',
  testimonials_font_family TEXT DEFAULT 'ui-sans-serif, system-ui, sans-serif',
  testimonials_card_bg TEXT DEFAULT '#ffffff',
  testimonials_card_text TEXT DEFAULT '#18181b',
  
  -- Engine Toggles & Webhooks
  enable_appointments BOOLEAN DEFAULT true,
  enable_enrollments BOOLEAN DEFAULT false,
  n8n_appointment_webhook_url TEXT,
  n8n_enrollment_webhook_url TEXT,
  n8n_webhook_secret TEXT, 
  classes_title TEXT DEFAULT 'Class Schedule & Enrollment',
  classes_subtitle TEXT DEFAULT 'Find a class, meet our instructors, and secure your spot today.',
  classes_bg_type TEXT DEFAULT 'solid',
  classes_bg_color TEXT DEFAULT '#f8fafc',
  classes_bg_gradient_to TEXT DEFAULT '#ffffff',
  classes_text_color TEXT DEFAULT '#18181b',
  classes_font_family TEXT DEFAULT 'ui-sans-serif, system-ui, sans-serif',
  classes_primary_color TEXT DEFAULT '#4f46e5',
  classes_card_bg TEXT DEFAULT '#ffffff',
  enrollment_form_title TEXT DEFAULT 'Attendee Information',
  enrollment_form_subtitle TEXT DEFAULT 'Fill out the details below to secure your spot. Hurry, capacity is limited.',
  
  -- Contact & Footer Config
  contact_business_name TEXT DEFAULT 'Our Company',
  contact_email VARCHAR,
  contact_phone VARCHAR,
  contact_number TEXT,
  contact_alternate TEXT,
  contact_address TEXT,
  business_hours JSONB DEFAULT '{}'::jsonb,
  contact_bg_color TEXT DEFAULT '#ffffff',
  contact_text_color TEXT DEFAULT '#18181b',
  contact_font_family TEXT DEFAULT 'ui-sans-serif, system-ui, sans-serif',
  contact_hours_bg TEXT DEFAULT '#fafafa',
  contact_hours_text TEXT DEFAULT '#18181b',
  contact_hours_font_family TEXT DEFAULT 'ui-sans-serif, system-ui, sans-serif',
  nav_bg_color TEXT DEFAULT '#ffffff',
  nav_text_color TEXT DEFAULT '#3f3f46',
  nav_font_family TEXT DEFAULT 'ui-sans-serif, system-ui, sans-serif',
  footer_bg_type TEXT DEFAULT 'solid',
  footer_bg_color TEXT DEFAULT '#09090b',
  footer_bg_gradient_to TEXT DEFAULT '#18181b',
  footer_text_color TEXT DEFAULT '#ffffff',
  footer_font_family TEXT DEFAULT 'ui-sans-serif, system-ui, sans-serif',
  footer_description TEXT DEFAULT 'High-performance digital architecture and infrastructure tailored for scale.',
  footer_dev_name TEXT DEFAULT 'Macrotek Digital Solutions',
  footer_dev_link TEXT DEFAULT 'https://www.macrotekdigitalsolutions.com'
);

-- =====================================================================================
-- 6. INJECT THE BASELINE SINGLETONS (TEMPLATE INITIALIZATION)
-- =====================================================================================

INSERT INTO site_config (is_singleton, tenant_name, contact_business_name, title, description) 
VALUES (true, 'Master Template', 'New Client Inc.', 'Platform Storefront', 'High-performance digital catalog.')
ON CONFLICT (is_singleton) DO NOTHING;

INSERT INTO booking_settings (is_singleton, is_active)
VALUES (true, true)
ON CONFLICT (is_singleton) DO NOTHING;

-- WOZ FIX: Initial Category Seed Data to prevent UI locks
INSERT INTO categories (name, title, slug) VALUES 
('Digital Services', 'Digital Services', 'digital-services'),
('Physical Products', 'Physical Products', 'physical-products'),
('Retainers & Subscriptions', 'Monthly Subscriptions', 'retainers'),
('Bundled Packages', 'Bundled Packages', 'packages')
ON CONFLICT (slug) DO NOTHING;

-- This natively encrypts the initial master password: 'admin123#'
INSERT INTO admin_users (email, password_hash)
VALUES ('admin@macrotek.com', crypt('admin123#', gen_salt('bf', 10)))
ON CONFLICT (email) DO NOTHING;

-- =====================================================================================
-- 7. SERVICE AGREEMENTS & E-SIGNATURE ENGINE
-- =====================================================================================
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id TEXT NOT NULL,
  lead_type TEXT NOT NULL DEFAULT 'appointment',
  client_name TEXT NOT NULL,
  company_name TEXT,
  client_address TEXT,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  project_cost NUMERIC DEFAULT 1500.00,
  downpayment_percentage NUMERIC DEFAULT 50.00,
  currency TEXT DEFAULT 'PHP',
  access_code TEXT,
  scope_description TEXT,
  status TEXT DEFAULT 'Draft',
  signature_data TEXT,
  signature_type TEXT DEFAULT 'drawn',
  signed_at TIMESTAMP WITH TIME ZONE,
  signed_by_name TEXT,
  signed_by_title TEXT,
  signed_ip TEXT,
  attachment_url TEXT,
  attachment_name TEXT,
  attachment_type TEXT,
  signing_method TEXT DEFAULT 'electronic',
  esign_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE contracts ADD COLUMN IF NOT EXISTS access_code TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS downpayment_percentage NUMERIC DEFAULT 50.00;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS attachment_name TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS attachment_type TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS signing_method TEXT DEFAULT 'electronic';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS esign_enabled BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_contracts_lead_id ON contracts(lead_id);
CREATE INDEX IF NOT EXISTS idx_contracts_access_code ON contracts(access_code);