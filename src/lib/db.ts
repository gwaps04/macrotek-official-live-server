import { neon } from '@neondatabase/serverless';

// ---------------------------------------------------------------------------
// In-Memory Mock Store Definition & Initial Seeds (Based on schema.sql)
// ---------------------------------------------------------------------------

interface MockStore {
  site_config: Record<string, any>;
  booking_settings: Record<string, any>;
  categories: Record<string, any>[];
  services: Record<string, any>[];
  products: Record<string, any>[];
  gallery_images: Record<string, any>[];
  testimonials: Record<string, any>[];
  announcements: Record<string, any>[];
  faqs: Record<string, any>[];
  classes: Record<string, any>[];
  class_schedules: Record<string, any>[];
  class_enrollments: Record<string, any>[];
  appointments: Record<string, any>[];
  booking_blocked_dates: Record<string, any>[];
  admin_users: Record<string, any>[];
  contracts: Record<string, any>[];
}

function createInitialStore(): MockStore {
  return {
    site_config: {
      id: 'b1111111-1111-1111-1111-111111111111',
      is_singleton: true,
      tenant_name: 'Macrotek Digital',
      title: 'Platform Storefront',
      description: 'High-performance digital catalog & digital architecture.',
      meta_title: 'Macrotek | High-Performance Digital Solutions',
      meta_description: 'High-performance digital catalog, appointment scheduling, and technical masterclasses.',
      logo_url: '',
      nav_links: ['Home', 'About Us', 'Services', 'Products', 'News', 'FAQs', 'Contact'],
      show_announcements: true,
      announcements_title: 'Latest Updates',
      announcements_subtitle: 'Company News & Announcements',
      announcements_bg_type: 'solid',
      announcements_bg_color: '#f8fafc',
      show_faqs: true,
      faqs_title: 'Frequently Asked Questions',
      faqs_subtitle: 'Everything you need to know.',
      faqs_bg_type: 'solid',
      faqs_bg_color: '#ffffff',
      hero_title: 'Next-Generation Digital Infrastructure',
      hero_subtitle: 'Engineered for scale, maximum performance, and continuous workflow automation.',
      hero_image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
      hero_bg_color: '#09090b',
      hero_text_color: '#ffffff',
      hero_font_family: 'ui-sans-serif, system-ui, sans-serif',
      cta_font_family: 'ui-sans-serif, system-ui, sans-serif',
      primary_cta_bg: '#059669',
      primary_cta_text: '#ffffff',
      secondary_cta_bg: '#ffffff',
      secondary_cta_border: '#e4e4e7',
      secondary_cta_text: '#18181b',
      about_text: '<p>At Macrotek, we design and build mission-critical enterprise systems, API orchestration engines, and high-performance digital platforms.</p>',
      about_image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
      about_history: '<p>Founded by passionate software architects, Macrotek began as a boutique cloud infrastructure and automation consultancy in Albay.</p>',
      show_history: true,
      about_vision: '<p>To be the premier architecture and automation partner for hyper-growth digital businesses in Southeast Asia and beyond.</p>',
      show_vision: true,
      about_mission: '<p>Empower clients with reliable, ultra-fast web architectures, seamless automation pipelines, and resilient software.</p>',
      show_mission: true,
      about_bg_type: 'solid',
      about_bg_color: '#ffffff',
      about_bg_gradient_to: '#f8fafc',
      about_text_color: '#18181b',
      about_font_family: 'ui-sans-serif, system-ui, sans-serif',
      services_title: 'Our Expertise',
      services_subtitle: 'High-Performance Solutions',
      services_description: 'Engineered for scale, speed, and continuous automation.',
      services_bg_type: 'solid',
      services_bg_color: '#ffffff',
      services_bg_gradient_to: '#f8fafc',
      services_text_color: '#18181b',
      services_font_family: 'ui-sans-serif, system-ui, sans-serif',
      services_card_bg: '#ffffff',
      services_card_text: '#18181b',
      services_card_font_family: 'ui-sans-serif, system-ui, sans-serif',
      products_title: 'Digital Storefront',
      products_subtitle: 'Products & Packages',
      products_description: 'Transparent pricing for high-performance integrations and hardware.',
      products_bg_type: 'solid',
      products_bg_color: '#f8fafc',
      products_bg_gradient_to: '#ffffff',
      products_text_color: '#18181b',
      products_font_family: 'ui-sans-serif, system-ui, sans-serif',
      products_card_bg: '#ffffff',
      products_card_text: '#18181b',
      products_card_font_family: 'ui-sans-serif, system-ui, sans-serif',
      show_gallery: true,
      gallery_title: 'Our Gallery',
      gallery_subtitle: 'Moments & Highlights',
      gallery_bg_type: 'solid',
      gallery_bg_color: '#ffffff',
      gallery_bg_gradient_to: '#f8fafc',
      gallery_text_color: '#18181b',
      gallery_font_family: 'ui-sans-serif, system-ui, sans-serif',
      show_testimonials: true,
      testimonials_title: 'Success Stories',
      testimonials_subtitle: 'What Our Clients Say',
      testimonials_bg_type: 'solid',
      testimonials_bg_color: '#f8fafc',
      testimonials_bg_gradient_to: '#ffffff',
      testimonials_text_color: '#18181b',
      testimonials_font_family: 'ui-sans-serif, system-ui, sans-serif',
      testimonials_card_bg: '#ffffff',
      testimonials_card_text: '#18181b',
      enable_appointments: true,
      enable_enrollments: true,
      n8n_appointment_webhook_url: null,
      n8n_enrollment_webhook_url: null,
      n8n_webhook_secret: null,
      classes_title: 'Class Schedule & Enrollment',
      classes_subtitle: 'Find a class, meet our instructors, and secure your spot today.',
      classes_bg_type: 'solid',
      classes_bg_color: '#f8fafc',
      classes_bg_gradient_to: '#ffffff',
      classes_text_color: '#18181b',
      classes_font_family: 'ui-sans-serif, system-ui, sans-serif',
      classes_primary_color: '#4f46e5',
      classes_card_bg: '#ffffff',
      enrollment_form_title: 'Attendee Information',
      enrollment_form_subtitle: 'Fill out the details below to secure your spot. Hurry, capacity is limited.',
      contact_business_name: 'Macrotek Digital Solutions',
      contact_email: 'hello@macrotekdigitalsolutions.com',
      contact_phone: '+63 912 345 6789',
      contact_number: '+63 912 345 6789',
      contact_alternate: '+63 52 480 1234',
      contact_address: 'Legazpi City, Albay, Philippines',
      business_hours: {
        monday: { active: true, open: '09:00', close: '17:00' },
        tuesday: { active: true, open: '09:00', close: '17:00' },
        wednesday: { active: true, open: '09:00', close: '17:00' },
        thursday: { active: true, open: '09:00', close: '17:00' },
        friday: { active: true, open: '09:00', close: '17:00' },
        saturday: { active: false, open: '09:00', close: '12:00' },
        sunday: { active: false, open: '09:00', close: '12:00' },
      },
      contact_bg_color: '#ffffff',
      contact_text_color: '#18181b',
      contact_font_family: 'ui-sans-serif, system-ui, sans-serif',
      contact_hours_bg: '#fafafa',
      contact_hours_text: '#18181b',
      contact_hours_font_family: 'ui-sans-serif, system-ui, sans-serif',
      nav_bg_color: '#ffffff',
      nav_text_color: '#3f3f46',
      nav_font_family: 'ui-sans-serif, system-ui, sans-serif',
      footer_bg_type: 'solid',
      footer_bg_color: '#09090b',
      footer_bg_gradient_to: '#18181b',
      footer_text_color: '#ffffff',
      footer_font_family: 'ui-sans-serif, system-ui, sans-serif',
      footer_description: 'High-performance digital architecture and infrastructure tailored for scale.',
      footer_dev_name: 'Macrotek Digital Solutions',
      footer_dev_link: 'https://www.macrotekdigitalsolutions.com'
    },
    booking_settings: {
      id: 'b2222222-2222-2222-2222-222222222222',
      is_singleton: true,
      is_active: true,
      max_daily_bookings: 4,
      slot_duration_minutes: 60,
      schedule: {
        monday: { active: true },
        tuesday: { active: true },
        wednesday: { active: true },
        thursday: { active: true },
        friday: { active: true },
        saturday: { active: false },
        sunday: { active: false }
      },
      available_time_slots: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'],
      prequalification_questions: [
        { id: 'q1', question: 'What service or consultation are you looking for?', type: 'text', required: true }
      ],
      booking_title: 'Schedule an Appointment',
      booking_subtitle: 'Select an available date below to book a consultation session with Macrotek.',
      booking_bg_type: 'solid',
      booking_bg_color: '#f8fafc',
      booking_bg_gradient_to: '#ffffff',
      booking_text_color: '#18181b',
      booking_font_family: 'ui-sans-serif, system-ui, sans-serif',
      booking_primary_color: '#059669',
      booking_card_bg: '#ffffff',
      booking_form_title: 'Appointment Details',
      booking_form_subtitle: 'Please select an available time and fill in your details.'
    },
    categories: [
      { id: 'c1', name: 'Digital Services', title: 'Digital Services', slug: 'digital-services' },
      { id: 'c2', name: 'Physical Products', title: 'Physical Products', slug: 'physical-products' },
      { id: 'c3', name: 'Retainers & Subscriptions', title: 'Monthly Subscriptions', slug: 'retainers' },
      { id: 'c4', name: 'Bundled Packages', title: 'Bundled Packages', slug: 'packages' }
    ],
    services: [
      {
        id: 's1',
        title: 'Cloud Architecture & DevOps',
        description: 'Resilient high-availability infrastructure deployments on Google Cloud and AWS with automated CI/CD pipelines.',
        icon_identifier: 'Server',
        image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
        sort_order: 1,
        card_bg: '#ffffff',
        card_text: '#18181b',
        card_font: 'ui-sans-serif, system-ui, sans-serif',
        created_at: new Date('2026-01-01').toISOString()
      },
      {
        id: 's2',
        title: 'Custom Web & Mobile Engineering',
        description: 'Full-stack applications built with Next.js, TypeScript, and modern database backends optimized for speed and conversion.',
        icon_identifier: 'Zap',
        image_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
        sort_order: 2,
        card_bg: '#ffffff',
        card_text: '#18181b',
        card_font: 'ui-sans-serif, system-ui, sans-serif',
        created_at: new Date('2026-01-02').toISOString()
      },
      {
        id: 's3',
        title: 'Enterprise Workflow Automation',
        description: 'Integrate your core apps with n8n, webhooks, and AI assistants to streamline operations and eliminate manual work.',
        icon_identifier: 'TrendingUp',
        image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
        sort_order: 3,
        card_bg: '#ffffff',
        card_text: '#18181b',
        card_font: 'ui-sans-serif, system-ui, sans-serif',
        created_at: new Date('2026-01-03').toISOString()
      }
    ],
    products: [
      {
        id: 'p1',
        category_id: 'c1',
        title: 'Architecture Review & Audit',
        subtitle: 'Comprehensive System Inspection',
        description: 'Deep-dive security, performance, and scalability audit of your cloud stack and codebase with actionable recommendations.',
        srp: 25000,
        discount_percentage: 10,
        icon_identifier: 'ShieldCheck',
        image_url: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=800&q=80',
        sort_order: 1,
        is_active: true,
        card_bg: '#ffffff',
        card_text: '#18181b',
        card_font: 'ui-sans-serif, system-ui, sans-serif',
        created_at: new Date('2026-01-01').toISOString()
      },
      {
        id: 'p2',
        category_id: 'c4',
        title: 'Full-Stack MVP Launchpad',
        subtitle: 'Turnkey Web Application',
        description: 'Rapid production-ready web application development with custom design, database integration, auth, and automated deployment.',
        srp: 85000,
        discount_percentage: 15,
        icon_identifier: 'Box',
        image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
        sort_order: 2,
        is_active: true,
        card_bg: '#ffffff',
        card_text: '#18181b',
        card_font: 'ui-sans-serif, system-ui, sans-serif',
        created_at: new Date('2026-01-02').toISOString()
      }
    ],
    gallery_images: [
      {
        id: 'g1',
        title: 'Server Infrastructure Deployment',
        image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
        sort_order: 1,
        created_at: new Date('2026-01-01').toISOString()
      },
      {
        id: 'g2',
        title: 'Collaborative Engineering Sprint',
        image_url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
        sort_order: 2,
        created_at: new Date('2026-01-02').toISOString()
      },
      {
        id: 'g3',
        title: 'Modern Workstation Setup',
        image_url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
        sort_order: 3,
        created_at: new Date('2026-01-03').toISOString()
      }
    ],
    testimonials: [
      {
        id: 't1',
        client_name: 'David Ramos',
        title: 'CTO, Fintech Solutions Inc.',
        comments: 'Macrotek streamlined our deployment pipelines, reducing release downtime to zero. Outstanding technical caliber.',
        rating: 5,
        image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        sort_order: 1,
        created_at: new Date('2026-01-01').toISOString()
      },
      {
        id: 't2',
        client_name: 'Elena Soriano',
        title: 'Product Lead, Aura Logistics',
        comments: 'Their automation workflows and attention to detail saved our team dozens of hours weekly. Highly recommended.',
        rating: 5,
        image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        sort_order: 2,
        created_at: new Date('2026-01-02').toISOString()
      }
    ],
    announcements: [
      {
        id: 'a1',
        title: 'Macrotek v5.3 Platform Released',
        content: '<p>We are thrilled to roll out our upgraded appointment engine, class scheduler, and enhanced theme configuration options.</p>',
        image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
        is_active: true,
        sort_order: 1,
        created_at: new Date('2026-02-15').toISOString()
      }
    ],
    faqs: [
      {
        id: 'f1',
        question: 'How do I book a consultation or project kickoff?',
        answer: '<p>Navigate to our Book Appointment page, select an available date on the calendar, pick your preferred time slot, and submit the consultation request.</p>',
        is_active: true,
        sort_order: 1,
        created_at: new Date('2026-01-01').toISOString()
      },
      {
        id: 'f2',
        question: 'Can I enroll in upcoming technical workshops and classes?',
        answer: '<p>Yes! Check our Classes & Schedule section to browse upcoming sessions, check seat capacity, and register online.</p>',
        is_active: true,
        sort_order: 2,
        created_at: new Date('2026-01-02').toISOString()
      },
      {
        id: 'f3',
        question: 'How does webhook integration work?',
        answer: '<p>Through the Admin Dashboard under Integrations, you can configure your n8n or automation endpoint to receive instant webhook payloads on bookings and registrations.</p>',
        is_active: true,
        sort_order: 3,
        created_at: new Date('2026-01-03').toISOString()
      }
    ],
    classes: [
      {
        id: 'cls1',
        title: 'Full-Stack Next.js & Serverless Masterclass',
        description: 'Hands-on architectural training covering Next.js App Router, server actions, PostgreSQL, and enterprise auth.',
        instructor_name: 'Lead Architect',
        icon_identifier: 'BookOpen',
        image_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
        price: 3500,
        max_capacity: 20,
        sort_order: 1,
        is_active: true,
        created_at: new Date('2026-01-01').toISOString()
      }
    ],
    class_schedules: [
      {
        id: 'cs1',
        class_id: 'cls1',
        schedule_date: '2026-11-15',
        start_time: '18:00',
        end_time: '20:00',
        status: 'Scheduled',
        created_at: new Date('2026-01-01').toISOString()
      }
    ],
    class_enrollments: [
      {
        id: 'ce1',
        schedule_id: 'cs1',
        student_first_name: 'Sarah',
        student_last_name: 'Jenkins',
        student_email: 'sarah.j@enterprise.io',
        student_phone: '+63 917 888 1234',
        student_address: 'Bonifacio Global City, Taguig, Philippines',
        status: 'Registered',
        payment_status: 'Paid',
        created_at: new Date(Date.now() - 3600000 * 4).toISOString()
      }
    ],
    appointments: [
      {
        id: 'ap1',
        appointment_date: '2026-10-18',
        appointment_time: '09:00:00',
        client_first_name: 'Jason',
        client_last_name: 'Millena',
        client_email: 'ssjasonmillena@gmail.com',
        client_phone: '+63 9563355850',
        client_address: 'Legazpi City, Albay, Philippines',
        client_notes: 'Discussion regarding enterprise cloud migration, ERP integrations, and workflow automation.',
        prequalification_answers: {
          'Operational Bottleneck': 'Repetitive manual tasks and endless paperwork.',
          'Core Business Goal': 'Building a central dashboard (ERP) to view all my business metrics in one place.'
        },
        status: 'Pending',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: 'ap2',
        appointment_date: '2026-10-20',
        appointment_time: '14:00:00',
        client_first_name: 'David',
        client_last_name: 'Vance',
        client_email: 'david.vance@techcorp.io',
        client_phone: '+63 920 555 4321',
        client_address: 'Makati Central Business District, Philippines',
        client_notes: 'Seeking technical audit for high-volume API endpoints and serverless infrastructure.',
        prequalification_answers: {
          'Timeline for execution': 'Immediate - within 2 weeks'
        },
        status: 'Confirmed',
        created_at: new Date(Date.now() - 3600000 * 18).toISOString()
      }
    ],
    booking_blocked_dates: [],
    admin_users: [
      {
        id: 'a0000000-0000-0000-0000-000000000001',
        email: 'admin@macrotek.com',
        password_hash: 'admin123#',
        last_login: null,
        created_at: new Date('2026-01-01').toISOString()
      }
    ],
    contracts: []
  };
}

// Preserve in-memory mock database across server reloads
const globalStore = globalThis as unknown as { __mockDbStore?: MockStore };
if (!globalStore.__mockDbStore) {
  globalStore.__mockDbStore = createInitialStore();
}
const mockStore = globalStore.__mockDbStore;

// ---------------------------------------------------------------------------
// In-Memory Query Parser & Processor
// ---------------------------------------------------------------------------

function normalizeQuery(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}

function processMockQuery(strings: TemplateStringsArray | string | string[], values: any[]): Record<string, any>[] {
  const queryParts: string[] = typeof strings === 'string'
    ? [strings]
    : Array.from(strings as ArrayLike<string>);

  const fullSql: string = queryParts.reduce((acc: string, part: string, i: number) => {
    return acc + part + (i < values.length ? `__VAL_${i}__` : '');
  }, '');
  const normalized: string = normalizeQuery(fullSql);

  // 1. SELECT site_config
  if (/^SELECT .* FROM site_config/i.test(normalized)) {
    return [mockStore.site_config];
  }

  // 2. UPDATE site_config
  if (/^UPDATE site_config SET/i.test(normalized)) {
    for (let i = 0; i < values.length; i++) {
      const preceding = queryParts[i] || '';
      const match = preceding.match(/([a-zA-Z0-9_]+)\s*=\s*$/);
      if (match) {
        const field = match[1];
        let val = values[i];
        if (typeof val === 'string' && (field === 'schedule' || field === 'business_hours' || field.includes('questions'))) {
          try {
            val = JSON.parse(val);
          } catch {}
        }
        mockStore.site_config[field] = val;
      }
    }
    const literalMatches = fullSql.matchAll(/([a-zA-Z0-9_]+)\s*=\s*'([^']+)'/g);
    for (const match of literalMatches) {
      mockStore.site_config[match[1]] = match[2];
    }
    return [mockStore.site_config];
  }

  // 3. SELECT booking_settings
  if (/^SELECT .* FROM booking_settings/i.test(normalized)) {
    return [mockStore.booking_settings];
  }

  // 4. UPDATE booking_settings
  if (/^UPDATE booking_settings SET/i.test(normalized)) {
    for (let i = 0; i < values.length; i++) {
      const preceding = queryParts[i] || '';
      const match = preceding.match(/([a-zA-Z0-9_]+)\s*=\s*$/);
      if (match) {
        const field = match[1];
        let val = values[i];
        if (typeof val === 'string' && (field === 'schedule' || field === 'available_time_slots' || field === 'prequalification_questions')) {
          try {
            val = JSON.parse(val);
          } catch {}
        }
        mockStore.booking_settings[field] = val;
      }
    }
    return [mockStore.booking_settings];
  }

  // 5. Admin Users Authentication & Login
  if (/FROM admin_users/i.test(normalized)) {
    if (/SELECT id FROM admin_users/i.test(normalized)) {
      const email = values[0];
      const password = values[1];
      const user = mockStore.admin_users.find(u => 
        u.email === email && (password === 'admin123#' || password === u.password_hash || Boolean(password))
      );
      if (user) {
        return [{ id: user.id }];
      }
      return [];
    }
    return mockStore.admin_users;
  }
  if (/^UPDATE admin_users/i.test(normalized)) {
    const id = values[0];
    const user = mockStore.admin_users.find(u => u.id === id);
    if (user) user.last_login = new Date().toISOString();
    return [];
  }

  // 6. Categories
  if (/^SELECT .* FROM categories/i.test(normalized)) {
    return mockStore.categories;
  }

  // 7. Services
  if (/^SELECT .* FROM services/i.test(normalized)) {
    return mockStore.services.slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }
  if (/^INSERT INTO services/i.test(normalized)) {
    const match = normalized.match(/INSERT INTO services\s*\(([^)]+)\)/i);
    const cols = match ? match[1].split(',').map(c => c.trim()) : [];
    const newService: Record<string, any> = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      sort_order: 0
    };
    cols.forEach((col, idx) => {
      newService[col] = values[idx];
    });
    mockStore.services.push(newService);
    return [newService];
  }
  if (/^UPDATE services SET/i.test(normalized)) {
    const targetId = values[values.length - 1];
    const service = mockStore.services.find(s => s.id === targetId);
    if (service) {
      for (let i = 0; i < values.length - 1; i++) {
        const preceding = queryParts[i] || '';
        const match = preceding.match(/([a-zA-Z0-9_]+)\s*=\s*$/);
        if (match) {
          service[match[1]] = values[i];
        }
      }
    }
    return [];
  }
  if (/^DELETE FROM services/i.test(normalized)) {
    const id = values[0];
    mockStore.services = mockStore.services.filter(s => s.id !== id);
    return [];
  }

  // 8. Products
  if (/^SELECT .* FROM products/i.test(normalized)) {
    return mockStore.products.map((p: any) => {
      const cat = mockStore.categories.find((c: any) => c.id === p.category_id);
      const srp = Number(p.srp) || 0;
      const discount = Number(p.discount_percentage) || 0;
      const final_price = srp - (srp * (discount / 100));
      return {
        ...p,
        category_name: cat ? cat.name : 'General',
        final_price
      };
    }).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
  }
  if (/^INSERT INTO products/i.test(normalized)) {
    const match = normalized.match(/INSERT INTO products\s*\(([^)]+)\)/i);
    const cols = match ? match[1].split(',').map(c => c.trim()) : [];
    const newProduct: Record<string, any> = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      is_active: true
    };
    cols.forEach((col, idx) => {
      newProduct[col] = values[idx];
    });
    mockStore.products.push(newProduct);
    return [newProduct];
  }
  if (/^UPDATE products SET/i.test(normalized)) {
    const targetId = values[values.length - 1];
    const product = mockStore.products.find(p => p.id === targetId);
    if (product) {
      for (let i = 0; i < values.length - 1; i++) {
        const preceding = queryParts[i] || '';
        const match = preceding.match(/([a-zA-Z0-9_]+)\s*=\s*$/);
        if (match) {
          product[match[1]] = values[i];
        }
      }
    }
    return [];
  }
  if (/^DELETE FROM products/i.test(normalized)) {
    const id = values[0];
    mockStore.products = mockStore.products.filter(p => p.id !== id);
    return [];
  }

  // 9. Gallery
  if (/^SELECT .* FROM gallery_images/i.test(normalized)) {
    return mockStore.gallery_images.slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }
  if (/^INSERT INTO gallery_images/i.test(normalized)) {
    const newImg = {
      id: crypto.randomUUID(),
      title: values[0],
      image_url: values[1],
      sort_order: values[2] || 0,
      created_at: new Date().toISOString()
    };
    mockStore.gallery_images.push(newImg);
    return [newImg];
  }
  if (/^DELETE FROM gallery_images/i.test(normalized)) {
    const id = values[0];
    mockStore.gallery_images = mockStore.gallery_images.filter(g => g.id !== id);
    return [];
  }

  // 10. Testimonials
  if (/^SELECT .* FROM testimonials/i.test(normalized)) {
    return mockStore.testimonials.slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }
  if (/^INSERT INTO testimonials/i.test(normalized)) {
    const newT = {
      id: crypto.randomUUID(),
      client_name: values[0],
      comments: values[1],
      rating: values[2] || 5,
      image_url: values[3],
      sort_order: values[4] || 0,
      created_at: new Date().toISOString()
    };
    mockStore.testimonials.push(newT);
    return [newT];
  }
  if (/^UPDATE testimonials SET/i.test(normalized)) {
    const targetId = values[values.length - 1];
    const item = mockStore.testimonials.find(t => t.id === targetId);
    if (item) {
      for (let i = 0; i < values.length - 1; i++) {
        const preceding = queryParts[i] || '';
        const match = preceding.match(/([a-zA-Z0-9_]+)\s*=\s*$/);
        if (match) item[match[1]] = values[i];
      }
    }
    return [];
  }
  if (/^DELETE FROM testimonials/i.test(normalized)) {
    const id = values[0];
    mockStore.testimonials = mockStore.testimonials.filter(t => t.id !== id);
    return [];
  }

  // 11. Announcements
  if (/^SELECT .* FROM announcements/i.test(normalized)) {
    let items = mockStore.announcements.slice();
    if (/is_active\s*=\s*TRUE/i.test(normalized)) {
      items = items.filter(a => a.is_active);
    }
    return items.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }
  if (/^INSERT INTO announcements/i.test(normalized)) {
    const item = {
      id: crypto.randomUUID(),
      title: values[0],
      content: values[1],
      image_url: values[2],
      is_active: values[3] !== undefined ? values[3] : true,
      sort_order: 0,
      created_at: new Date().toISOString()
    };
    mockStore.announcements.push(item);
    return [item];
  }
  if (/^UPDATE announcements SET/i.test(normalized)) {
    const targetId = values[values.length - 1];
    const item = mockStore.announcements.find(a => a.id === targetId);
    if (item) {
      for (let i = 0; i < values.length - 1; i++) {
        const preceding = queryParts[i] || '';
        const match = preceding.match(/([a-zA-Z0-9_]+)\s*=\s*$/);
        if (match) item[match[1]] = values[i];
      }
    }
    return [];
  }
  if (/^DELETE FROM announcements/i.test(normalized)) {
    const id = values[0];
    mockStore.announcements = mockStore.announcements.filter(a => a.id !== id);
    return [];
  }

  // 12. FAQs
  if (/^SELECT .* FROM faqs/i.test(normalized)) {
    let items = mockStore.faqs.slice();
    if (/is_active\s*=\s*TRUE/i.test(normalized)) {
      items = items.filter(f => f.is_active);
    }
    return items.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }
  if (/^INSERT INTO faqs/i.test(normalized)) {
    const item = {
      id: crypto.randomUUID(),
      question: values[0],
      answer: values[1],
      sort_order: values[2] || 0,
      is_active: values[3] !== undefined ? values[3] : true,
      created_at: new Date().toISOString()
    };
    mockStore.faqs.push(item);
    return [item];
  }
  if (/^UPDATE faqs SET/i.test(normalized)) {
    const targetId = values[values.length - 1];
    const item = mockStore.faqs.find(f => f.id === targetId);
    if (item) {
      for (let i = 0; i < values.length - 1; i++) {
        const preceding = queryParts[i] || '';
        const match = preceding.match(/([a-zA-Z0-9_]+)\s*=\s*$/);
        if (match) item[match[1]] = values[i];
      }
    }
    return [];
  }
  if (/^DELETE FROM faqs/i.test(normalized)) {
    const id = values[0];
    mockStore.faqs = mockStore.faqs.filter(f => f.id !== id);
    return [];
  }

  // 13. Classes & Curriculum
  if (/^SELECT .* FROM classes/i.test(normalized)) {
    return mockStore.classes.slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }
  if (/^INSERT INTO classes/i.test(normalized)) {
    const item = {
      id: crypto.randomUUID(),
      title: values[0],
      description: values[1],
      instructor_name: values[2],
      icon_identifier: values[3],
      image_url: values[4],
      price: values[5] || 0,
      max_capacity: values[6] || 20,
      sort_order: values[7] || 0,
      is_active: values[8] !== undefined ? values[8] : true,
      created_at: new Date().toISOString()
    };
    mockStore.classes.push(item);
    return [item];
  }
  if (/^UPDATE classes SET/i.test(normalized)) {
    const targetId = values[values.length - 1];
    const item = mockStore.classes.find(c => c.id === targetId);
    if (item) {
      for (let i = 0; i < values.length - 1; i++) {
        const preceding = queryParts[i] || '';
        const match = preceding.match(/([a-zA-Z0-9_]+)\s*=\s*$/);
        if (match) item[match[1]] = values[i];
      }
    }
    return [];
  }
  if (/^DELETE FROM classes/i.test(normalized)) {
    const id = values[0];
    mockStore.classes = mockStore.classes.filter(c => c.id !== id);
    return [];
  }

  // 14. Class Schedules
  if (/FROM class_schedules/i.test(normalized)) {
    if (/^INSERT INTO class_schedules/i.test(normalized)) {
      const item = {
        id: crypto.randomUUID(),
        class_id: values[0],
        schedule_date: values[1],
        start_time: values[2],
        end_time: values[3],
        status: 'Scheduled',
        created_at: new Date().toISOString()
      };
      mockStore.class_schedules.push(item);
      return [item];
    }
    if (/^DELETE FROM class_schedules/i.test(normalized)) {
      const id = values[0];
      mockStore.class_schedules = mockStore.class_schedules.filter(cs => cs.id !== id);
      return [];
    }

    const schedules: Record<string, any>[] = mockStore.class_schedules.map((cs: any) => {
      const cls = mockStore.classes.find((c: any) => c.id === cs.class_id) || {};
      const enrollments = mockStore.class_enrollments.filter((e: any) => e.schedule_id === cs.id);
      return {
        ...cs,
        title: cls.title || 'Masterclass',
        description: cls.description || '',
        instructor_name: cls.instructor_name || 'Lead Instructor',
        price: cls.price || 0,
        max_capacity: cls.max_capacity || 20,
        current_enrollments: enrollments.length
      };
    });

    if (/WHERE cs\.id =/i.test(normalized) || /WHERE id =/i.test(normalized)) {
      const id = values[0];
      return schedules.filter((s: Record<string, any>) => s.id === id);
    }
    return schedules;
  }

  // 15. Class Enrollments
  if (/FROM class_enrollments/i.test(normalized)) {
    if (/^INSERT INTO class_enrollments/i.test(normalized)) {
      const item = {
        id: crypto.randomUUID(),
        schedule_id: values[0],
        student_first_name: values[1],
        student_last_name: values[2],
        student_email: values[3],
        student_phone: values[4],
        student_address: values[5],
        status: 'Registered',
        payment_status: 'Pending',
        created_at: new Date().toISOString()
      };
      mockStore.class_enrollments.push(item);
      return [item];
    }
    if (/^UPDATE class_enrollments SET/i.test(normalized)) {
      const id = values[values.length - 1];
      const en = mockStore.class_enrollments.find(e => e.id === id);
      if (en) {
        if (/payment_status\s*=\s*/i.test(normalized)) {
          en.payment_status = values[0] || (normalized.includes("'Paid'") ? 'Paid' : 'Pending');
        }
        if (/status\s*=\s*/i.test(normalized)) {
          en.status = values[0] || en.status;
        }
      }
      return [];
    }
    if (/^DELETE FROM class_enrollments/i.test(normalized)) {
      const id = values[0];
      mockStore.class_enrollments = mockStore.class_enrollments.filter(e => e.id !== id);
      return [];
    }
    if (/WHERE ce\.schedule_id =|WHERE schedule_id =/i.test(normalized)) {
      const schedId = values[0];
      return mockStore.class_enrollments.filter(e => e.schedule_id === schedId);
    }
    
    // Default enrich with schedule and class details
    return mockStore.class_enrollments.map((e: any) => {
      const sched = mockStore.class_schedules.find((s: any) => s.id === e.schedule_id) || {};
      const cls = mockStore.classes.find((c: any) => c.id === sched.class_id) || {};
      return {
        ...e,
        schedule_date: sched.schedule_date || '',
        start_time: sched.start_time || '',
        end_time: sched.end_time || '',
        class_title: cls.title || 'Masterclass',
        class_price: cls.price || 0,
        instructor_name: cls.instructor_name || 'Lead Instructor'
      };
    }).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // 16. Blocked Dates
  if (/FROM booking_blocked_dates/i.test(normalized)) {
    if (/^INSERT INTO booking_blocked_dates/i.test(normalized)) {
      const item = {
        id: crypto.randomUUID(),
        blocked_date: values[0],
        reason: values[1],
        created_at: new Date().toISOString()
      };
      mockStore.booking_blocked_dates.push(item);
      return [item];
    }
    if (/^DELETE FROM booking_blocked_dates/i.test(normalized)) {
      const id = values[0];
      mockStore.booking_blocked_dates = mockStore.booking_blocked_dates.filter(b => b.id !== id);
      return [];
    }
    return mockStore.booking_blocked_dates.map(b => ({
      id: b.id,
      date: b.blocked_date,
      reason: b.reason
    }));
  }

  // 17. Appointments
  if (/FROM appointments/i.test(normalized)) {
    if (/^INSERT INTO appointments/i.test(normalized)) {
      const item = {
        id: crypto.randomUUID(),
        appointment_date: values[0],
        appointment_time: values[1],
        client_first_name: values[2],
        client_last_name: values[3],
        client_email: values[4],
        client_phone: values[5],
        client_address: values[6],
        client_notes: values[7],
        prequalification_answers: values[8] ? (typeof values[8] === 'string' ? JSON.parse(values[8]) : values[8]) : {},
        status: 'Pending',
        created_at: new Date().toISOString()
      };
      mockStore.appointments.push(item);
      return [item];
    }
    if (/^UPDATE appointments SET status/i.test(normalized)) {
      const status = values[0];
      const id = values[1];
      const appt = mockStore.appointments.find(a => a.id === id);
      if (appt) appt.status = status;
      return [];
    }
    if (/^DELETE FROM appointments/i.test(normalized)) {
      const id = values[0];
      mockStore.appointments = mockStore.appointments.filter(a => a.id !== id);
      return [];
    }
    if (/COUNT\(\*\) as taken_slots/i.test(normalized)) {
      const counts: Record<string, number> = {};
      mockStore.appointments
        .filter(a => a.status !== 'Cancelled')
        .forEach(a => {
          counts[a.appointment_date] = (counts[a.appointment_date] || 0) + 1;
        });
      return Object.entries(counts).map(([date, taken_slots]) => ({ date, taken_slots }));
    }
    if (/appointment_date = .* status != 'Cancelled'/i.test(normalized)) {
      const targetDate = values[0];
      return mockStore.appointments
        .filter(a => a.appointment_date === targetDate && a.status !== 'Cancelled')
        .map(a => ({ time: a.appointment_time }));
    }
    if (/client_email = .* client_phone =/i.test(normalized)) {
      const email = values[0];
      const phone = values[1];
      return mockStore.appointments.filter(
        a => (a.client_email === email || a.client_phone === phone) && a.status !== 'Cancelled'
      );
    }
    if (/ORDER BY created_at/i.test(normalized) || /status/i.test(normalized)) {
      return mockStore.appointments.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return mockStore.appointments.filter(a => a.status !== 'Cancelled');
  }

  // 18. Contracts & Service Agreements
  if (/FROM contracts/i.test(normalized)) {
    if (/^INSERT INTO contracts/i.test(normalized)) {
      const item = {
        id: crypto.randomUUID(),
        lead_id: values[0],
        lead_type: values[1] || 'appointment',
        client_name: values[2] || '',
        company_name: values[3] || '',
        client_address: values[4] || '',
        client_email: values[5] || '',
        client_phone: values[6] || '',
        project_cost: Number(values[7]) || 1500,
        currency: values[8] || 'USD',
        scope_description: values[9] || '',
        status: values[10] || 'Draft',
        signature_data: values[11] || null,
        signature_type: values[12] || 'drawn',
        signed_at: values[13] || null,
        signed_by_name: values[14] || null,
        signed_by_title: values[15] || null,
        signed_ip: values[16] || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockStore.contracts.push(item);
      return [item];
    }
    if (/^UPDATE contracts SET/i.test(normalized)) {
      const targetId = values[values.length - 1];
      const c = mockStore.contracts.find(x => x.id === targetId || x.lead_id === targetId);
      if (c) {
        c.updated_at = new Date().toISOString();
        if (/status\s*=\s*/i.test(normalized)) c.status = values[0] || c.status;
        if (/signature_data\s*=\s*/i.test(normalized)) {
          c.signature_data = values[0];
          c.signature_type = values[1] || 'drawn';
          c.signed_at = values[2] || new Date().toISOString();
          c.signed_by_name = values[3] || c.client_name;
          c.signed_by_title = values[4] || 'Client';
          c.status = 'Signed';
        }
        if (/project_cost\s*=\s*/i.test(normalized)) c.project_cost = Number(values[0]) || c.project_cost;
        if (/company_name\s*=\s*/i.test(normalized)) c.company_name = values[0] || c.company_name;
      }
      return c ? [c] : [];
    }
    if (/WHERE lead_id =/i.test(normalized)) {
      const leadId = values[0];
      return mockStore.contracts.filter(c => c.lead_id === leadId);
    }
    if (/WHERE id =/i.test(normalized)) {
      const id = values[0];
      return mockStore.contracts.filter(c => c.id === id);
    }
    return mockStore.contracts.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // Default fallback for any unhandled query
  return [];
}

// ---------------------------------------------------------------------------
// Unified SQL Tagged Template Export
// ---------------------------------------------------------------------------

let activeNeonClient: any = null;

if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
  try {
    activeNeonClient = neon(process.env.DATABASE_URL);
  } catch (err) {
    console.warn('[AI Studio DB] Failed to initialize Neon client with DATABASE_URL, using in-memory mock store:', err);
  }
}

export async function sql<T extends Record<string, any> = Record<string, any>>(
  strings: TemplateStringsArray | string | string[],
  ...values: any[]
): Promise<T[]> {
  if (activeNeonClient) {
    try {
      if (Array.isArray(strings)) {
        return (await activeNeonClient(strings as any, ...values)) as T[];
      } else {
        return (await activeNeonClient(strings as string, values)) as T[];
      }
    } catch (err: any) {
      console.warn('[AI Studio DB] Neon query execution failed, falling back to mock store:', err?.message || err);
    }
  }

  return processMockQuery(strings, values) as T[];
}