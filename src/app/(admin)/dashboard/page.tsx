import { sql } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import ColorPickerInput from '@/components/ui/ColorPickerInput';
import * as Icons from 'lucide-react';

const FONT_OPTIONS = [
  { label: 'Modern Sans (Default)', value: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
  { label: 'Geometric Sans (Clean & Sharp)', value: 'Futura, "Trebuchet MS", Arial, sans-serif' },
  { label: 'Humanist Sans (Warm & Readable)', value: 'Optima, Candara, Calibri, Arial, sans-serif' },
  { label: 'Elegant Serif (Luxury/Classic)', value: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' },
  { label: 'Old Style Serif (Editorial/Academic)', value: 'Garamond, Baskerville, "Baskerville Old Face", "Hoefler Text", "Times New Roman", serif' },
  { label: 'Slab Serif (Bold & Industrial)', value: 'Rockwell, "Courier Bold", Courier, Georgia, serif' },
  { label: 'Technical Mono (Code/Developer)', value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }
];

export default async function DashboardSettings() {
  
  const configResult = await sql`SELECT * FROM site_config WHERE is_singleton = TRUE LIMIT 1`;
  const currentConfig = configResult[0] || {};
  const hasLogo = !!currentConfig.logo_url;
  const hasHeroMedia = !!currentConfig.hero_image_url;

  async function updateConfigAction(formData: FormData) {
    "use server";
    
    // WOZ LOGIC: Extracting the Engine Switches
    const enableAppointments = formData.get('enableAppointments') === 'on';
    const enableEnrollments = formData.get('enableEnrollments') === 'on';

    const tenantName = (formData.get('tenantName') as string) || 'Default Brand';
    const heroTitle = (formData.get('heroTitle') as string) || '';
    let heroSubtitle = (formData.get('heroSubtitle') as string) || '';
    if (heroSubtitle.length > 160) heroSubtitle = heroSubtitle.substring(0, 160);

    const navBgColor = (formData.get('navBgColor') as string) || '#ffffff';
    const navTextColor = (formData.get('navTextColor') as string) || '#3f3f46';
    const navFontFamily = (formData.get('navFontFamily') as string) || FONT_OPTIONS[0].value;

    const heroBgColor = (formData.get('heroBgColor') as string) || '#f8fafc';
    const heroTextColor = (formData.get('heroTextColor') as string) || '#18181b';
    const heroFontFamily = (formData.get('heroFontFamily') as string) || FONT_OPTIONS[0].value;
    const ctaFontFamily = (formData.get('ctaFontFamily') as string) || FONT_OPTIONS[0].value;
    const primaryCtaBg = (formData.get('primaryCtaBg') as string) || '#059669';
    const primaryCtaText = (formData.get('primaryCtaText') as string) || '#ffffff';
    const secondaryCtaBg = (formData.get('secondaryCtaBg') as string) || '#ffffff';
    const secondaryCtaBorder = (formData.get('secondaryCtaBorder') as string) || '#e4e4e7';
    const secondaryCtaText = (formData.get('secondaryCtaText') as string) || '#18181b';

    const existingDb = await sql`SELECT logo_url, hero_image_url FROM site_config WHERE is_singleton = TRUE LIMIT 1`;
    const fallbackLogo = existingDb[0]?.logo_url || '';
    const fallbackHero = existingDb[0]?.hero_image_url || '';

    async function processMedia(fileKey: string, urlKey: string, currentUrl: string): Promise<string> {
      const file = formData.get(fileKey) as File | null;
      const inputUrl = formData.get(urlKey) as string;
      if (file && file.size > 0) {
        if (file.size > 2.5 * 1024 * 1024) return currentUrl; 
        const buffer = Buffer.from(await file.arrayBuffer());
        return `data:${file.type};base64,${buffer.toString('base64')}`;
      }
      if (inputUrl && inputUrl.trim() !== '') return inputUrl;
      return currentUrl; 
    }

    const finalLogoUrl = await processMedia('logoFile', 'logoUrl', fallbackLogo);
    const finalHeroImageUrl = await processMedia('heroFile', 'heroImageUrl', fallbackHero);

    await sql`
      UPDATE site_config SET 
        enable_appointments = ${enableAppointments},
        enable_enrollments = ${enableEnrollments},
        tenant_name = ${tenantName},
        logo_url = ${finalLogoUrl},
        hero_title = ${heroTitle},
        hero_subtitle = ${heroSubtitle},
        hero_image_url = ${finalHeroImageUrl},
        nav_bg_color = ${navBgColor},
        nav_text_color = ${navTextColor},
        nav_font_family = ${navFontFamily},
        hero_bg_color = ${heroBgColor},
        hero_text_color = ${heroTextColor},
        hero_font_family = ${heroFontFamily},
        cta_font_family = ${ctaFontFamily},
        primary_cta_bg = ${primaryCtaBg},
        primary_cta_text = ${primaryCtaText},
        secondary_cta_bg = ${secondaryCtaBg},
        secondary_cta_border = ${secondaryCtaBorder},
        secondary_cta_text = ${secondaryCtaText}
      WHERE is_singleton = TRUE
    `;

    // Revalidate the entire application layout and storefront page so switches take immediate effect
    revalidatePath('/', 'layout');
    redirect('/dashboard');
  }

  async function resetThemingAction() {
    "use server";
    await sql`
      UPDATE site_config SET 
        nav_bg_color = '#ffffff', nav_text_color = '#3f3f46', nav_font_family = ${FONT_OPTIONS[0].value},
        hero_bg_color = '#f8fafc', hero_text_color = '#18181b', hero_font_family = ${FONT_OPTIONS[0].value},
        cta_font_family = ${FONT_OPTIONS[0].value}, primary_cta_bg = '#059669', primary_cta_text = '#ffffff',
        secondary_cta_bg = '#ffffff', secondary_cta_border = '#e4e4e7', secondary_cta_text = '#18181b'
      WHERE is_singleton = TRUE
    `;
    revalidatePath('/', 'layout');
    redirect('/dashboard');
  }

  return (
    <div className="max-w-4xl pb-24">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Site Configuration</h1>
        <p className="text-zinc-500 text-sm mt-1">Modify global parameters, operating modes, and storefront identity.</p>
      </div>

      <form action={updateConfigAction} className="space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
        
        {/* ==================================================== */}
        {/* WOZ LOGIC: THE MASTER SWITCHBOARD IS HERE AT THE TOP */}
        {/* ==================================================== */}
        <section className="bg-zinc-900 p-8 rounded-xl border border-zinc-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-indigo-500"></div>
          <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
            <Icons.Cpu className="text-emerald-500 w-6 h-6" />
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-widest">Platform Operating Mode</h3>
              <p className="text-xs text-zinc-400 mt-1">Toggle which engine controls the primary navigation CTA and Sidebar routing.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className={`flex flex-col p-6 rounded-xl border-2 cursor-pointer transition-all ${currentConfig.enable_appointments ? 'bg-zinc-800 border-emerald-500' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-600'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                  <Icons.CalendarClock size={18} className="text-emerald-500" />
                  Appointment Engine
                </span>
                <input type="checkbox" name="enableAppointments" defaultChecked={currentConfig.enable_appointments} className="w-5 h-5 text-emerald-500 rounded focus:ring-emerald-500 bg-zinc-900 border-zinc-700 cursor-pointer" />
              </div>
              <span className="text-xs text-zinc-400 leading-relaxed">Activates 1-on-1 consultations, site inspections, and specific time-slot capacity blocks.</span>
            </label>

            <label className={`flex flex-col p-6 rounded-xl border-2 cursor-pointer transition-all ${currentConfig.enable_enrollments ? 'bg-zinc-800 border-indigo-500' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-600'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                  <Icons.Users size={18} className="text-indigo-500" />
                  Enrollment Engine
                </span>
                <input type="checkbox" name="enableEnrollments" defaultChecked={currentConfig.enable_enrollments} className="w-5 h-5 text-indigo-500 rounded focus:ring-indigo-500 bg-zinc-900 border-zinc-700 cursor-pointer" />
              </div>
              <span className="text-xs text-zinc-400 leading-relaxed">Activates group classes, gym rosters, review centers, and event capacity structures.</span>
            </label>
          </div>
        </section>

        {/* Global Brand Settings */}
        <section>
          <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-2 mb-6">Global Identity</h3>
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700">Tenant / Brand Name</label>
              <input type="text" name="tenantName" defaultValue={currentConfig.tenant_name} required className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900" />
            </div>
            
            <div className="space-y-2 p-4 bg-zinc-50 rounded-lg border border-zinc-200">
              <label className="text-xs font-semibold text-zinc-700 block mb-2">Navbar Logo Media {hasLogo && <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Active</span>}</label>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <span className="text-[10px] uppercase text-zinc-500 mb-1 block">Upload File (Max 2MB)</span>
                  <input type="file" name="logoFile" accept="image/*" className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-white" />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] uppercase text-zinc-500 mb-1 block">Paste URL (Image only)</span>
                  <input type="url" name="logoUrl" placeholder="https://..." className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-md text-sm" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Global Layout Shell Theming */}
        <section>
          <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-2 mb-6">Global Navigation Theming</h3>
          <div className="mb-6 p-6 bg-zinc-50 rounded-xl border border-zinc-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700 block">Navbar Background Color</label>
                <ColorPickerInput name="navBgColor" defaultValue={currentConfig.nav_bg_color || '#ffffff'} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700 block">Navbar Text Color</label>
                <ColorPickerInput name="navTextColor" defaultValue={currentConfig.nav_text_color || '#3f3f46'} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-zinc-700">Typography Style</label>
                <select name="navFontFamily" defaultValue={currentConfig.nav_font_family || FONT_OPTIONS[0].value} className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900">
                  {FONT_OPTIONS.map(font => (<option key={font.label} value={font.value}>{font.label}</option>))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Hero Section Content & Theming */}
        <section>
          <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-2 mb-6">Hero Section Data & Theming</h3>
          
          <div className="space-y-6 mb-8">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700">Primary Headline (H1)</label>
              <input type="text" name="heroTitle" defaultValue={currentConfig.hero_title} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm" />
            </div>
            <div className="space-y-2 relative">
              <label className="text-xs font-semibold text-zinc-700 flex justify-between"><span>Sub-headline Description</span><span className="text-zinc-400 font-normal">Max 160 chars</span></label>
              <textarea name="heroSubtitle" defaultValue={currentConfig.hero_subtitle} rows={3} maxLength={160} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm resize-none" />
            </div>
            <div className="space-y-2 p-4 bg-zinc-50 rounded-lg border border-zinc-200">
              <label className="text-xs font-semibold text-zinc-700 block mb-2">Hero Showcase Media {hasHeroMedia && <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Active</span>}</label>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1"><input type="file" name="heroFile" accept="image/*" className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-white" /></div>
                <div className="flex-1"><input type="url" name="heroImageUrl" placeholder="Paste URL (.mp4 supported)" className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-md text-sm" /></div>
              </div>
            </div>
          </div>

          <div className="mb-6 p-6 bg-zinc-50 rounded-xl border border-zinc-200">
            <h4 className="text-xs font-bold uppercase text-zinc-500 mb-4 tracking-wider border-b border-zinc-200 pb-2">Hero Section Container</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700 block">Background Surface Color</label>
                <ColorPickerInput name="heroBgColor" defaultValue={currentConfig.hero_bg_color || '#f8fafc'} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700 block">Primary Text Color</label>
                <ColorPickerInput name="heroTextColor" defaultValue={currentConfig.hero_text_color || '#18181b'} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-zinc-700">Hero Typography Style</label>
                <select name="heroFontFamily" defaultValue={currentConfig.hero_font_family || FONT_OPTIONS[0].value} className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900">
                  {FONT_OPTIONS.map(font => (<option key={font.label} value={font.value}>{font.label}</option>))}
                </select>
              </div>
            </div>
          </div>

          <div className="p-6 bg-zinc-50 rounded-xl border border-zinc-200 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <h4 className="text-xs font-bold uppercase text-zinc-500 tracking-wider">CTA Buttons</h4>
              <select name="ctaFontFamily" defaultValue={currentConfig.cta_font_family || FONT_OPTIONS[0].value} className="px-3 py-1 bg-white border border-zinc-200 rounded-md text-xs font-medium focus:ring-2 focus:ring-zinc-900">
                {FONT_OPTIONS.map(font => (<option key={font.label} value={font.value}>{font.label}</option>))}
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-block">Primary Button (Left)</div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700 block">Background Color</label>
                  <ColorPickerInput name="primaryCtaBg" defaultValue={currentConfig.primary_cta_bg || '#059669'} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700 block">Text Color</label>
                  <ColorPickerInput name="primaryCtaText" defaultValue={currentConfig.primary_cta_text || '#ffffff'} />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-zinc-200 px-2 py-1 rounded inline-block">Secondary Button (Right)</div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700 block">Background Color</label>
                  <ColorPickerInput name="secondaryCtaBg" defaultValue={currentConfig.secondary_cta_bg || '#ffffff'} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700 block">Border Color</label>
                  <ColorPickerInput name="secondaryCtaBorder" defaultValue={currentConfig.secondary_cta_border || '#e4e4e7'} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700 block">Text Color</label>
                  <ColorPickerInput name="secondaryCtaText" defaultValue={currentConfig.secondary_cta_text || '#18181b'} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="pt-8 mt-8 border-t border-zinc-200 flex flex-col-reverse sm:flex-row justify-between items-center gap-6">
          <button type="submit" formAction={resetThemingAction} formNoValidate className="text-zinc-500 hover:text-rose-600 font-medium text-sm transition-colors flex items-center gap-2 px-4 py-2 rounded-md hover:bg-rose-50 w-full sm:w-auto justify-center">
            <Icons.RotateCcw size={16} /> Revert All Theming
          </button>
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-8 rounded-md transition-colors text-sm shadow-sm w-full sm:w-auto">
            Deploy Configuration
          </button>
        </div>
      </form>
    </div>
  );
}