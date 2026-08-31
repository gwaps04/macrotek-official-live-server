import { sql } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import RichTextEditor from '@/components/ui/RichTextEditor';
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

export default async function DashboardAbout() {
  
  const configResult = await sql`
    SELECT * 
    FROM site_config 
    WHERE is_singleton = TRUE 
    LIMIT 1
  `;
  const db = configResult[0] || {};
  const hasAboutMedia = !!db.about_image_url;

  // ACTION 1: Standard Deployment
  async function updateAboutAction(formData: FormData) {
    "use server";
    
    const aboutText = (formData.get('aboutText') as string) || '';
    const aboutHistory = (formData.get('aboutHistory') as string) || '';
    const aboutVision = (formData.get('aboutVision') as string) || '';
    const aboutMission = (formData.get('aboutMission') as string) || '';

    const showHistory = formData.get('showHistory') === 'on';
    const showVision = formData.get('showVision') === 'on';
    const showMission = formData.get('showMission') === 'on';

    // Extract Theming Payloads
    const aboutBgType = (formData.get('aboutBgType') as string) || 'solid';
    const aboutBgColor = (formData.get('aboutBgColor') as string) || '#ffffff';
    const aboutBgGradientTo = (formData.get('aboutBgGradientTo') as string) || '#f8fafc';
    const aboutTextColor = (formData.get('aboutTextColor') as string) || '#18181b';
    const aboutFontFamily = (formData.get('aboutFontFamily') as string) || FONT_OPTIONS[0].value;

    const existingMedia = await sql`SELECT about_image_url FROM site_config WHERE is_singleton = TRUE LIMIT 1`;
    const fallbackMedia = existingMedia[0]?.about_image_url || '';

    let finalMediaUrl = fallbackMedia;
    const file = formData.get('aboutFile') as File | null;
    const inputUrl = formData.get('aboutImageUrl') as string;

    if (file && file.size > 0 && file.size <= 2.5 * 1024 * 1024) {
      const buffer = Buffer.from(await file.arrayBuffer());
      finalMediaUrl = `data:${file.type};base64,${buffer.toString('base64')}`;
    } else if (inputUrl && inputUrl.trim() !== '') {
      finalMediaUrl = inputUrl;
    }

    await sql`
      UPDATE site_config SET 
        about_text = ${aboutText},
        about_image_url = ${finalMediaUrl},
        about_history = ${aboutHistory},
        show_history = ${showHistory},
        about_vision = ${aboutVision},
        show_vision = ${showVision},
        about_mission = ${aboutMission},
        show_mission = ${showMission},
        about_bg_type = ${aboutBgType},
        about_bg_color = ${aboutBgColor},
        about_bg_gradient_to = ${aboutBgGradientTo},
        about_text_color = ${aboutTextColor},
        about_font_family = ${aboutFontFamily}
      WHERE is_singleton = TRUE
    `;

    revalidatePath('/', 'layout');
    redirect('/dashboard/about');
  }

  // WOZ LOGIC: ACTION 2 - The Factory Reset (Targeting only About Us Theming)
  async function resetThemingAction() {
    "use server";
    
    await sql`
      UPDATE site_config SET 
        about_bg_type = 'solid',
        about_bg_color = '#ffffff',
        about_bg_gradient_to = '#f8fafc',
        about_text_color = '#18181b',
        about_font_family = ${FONT_OPTIONS[0].value}
      WHERE is_singleton = TRUE
    `;

    revalidatePath('/', 'layout');
    redirect('/dashboard/about');
  }

  return (
    <div className="max-w-4xl pb-24">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">About & Story</h1>
        <p className="text-zinc-500 text-sm mt-1">Configure company background, media, feature flags, and visual identity.</p>
      </div>

      <form action={updateAboutAction} className="space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
        
        {/* WOZ UX: About Us Theming Section */}
        <section className="space-y-6">
          <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-2">
            Section Theming
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-zinc-50 rounded-xl border border-zinc-200">
            
            <div className="space-y-2 md:col-span-2 pb-4 border-b border-zinc-200">
              <label className="text-xs font-semibold text-zinc-700 block mb-3">Background Mode</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="aboutBgType" value="solid" defaultChecked={db.about_bg_type !== 'gradient'} className="text-emerald-600 focus:ring-emerald-600" />
                  <span className="text-sm font-medium text-zinc-800">Solid Color</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="aboutBgType" value="gradient" defaultChecked={db.about_bg_type === 'gradient'} className="text-emerald-600 focus:ring-emerald-600" />
                  <span className="text-sm font-medium text-zinc-800">Linear Gradient</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700 block">Primary Background (Start)</label>
              <ColorPickerInput name="aboutBgColor" defaultValue={db.about_bg_color || '#ffffff'} />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700 block">Gradient End Color <span className="font-normal text-zinc-400">(If Gradient enabled)</span></label>
              <ColorPickerInput name="aboutBgGradientTo" defaultValue={db.about_bg_gradient_to || '#f8fafc'} />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700 block">Primary Text Color</label>
              <ColorPickerInput name="aboutTextColor" defaultValue={db.about_text_color || '#18181b'} />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700">Typography Style</label>
              <select name="aboutFontFamily" defaultValue={db.about_font_family || FONT_OPTIONS[0].value} className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900">
                {FONT_OPTIONS.map(font => (<option key={font.label} value={font.value}>{font.label}</option>))}
              </select>
            </div>
          </div>
        </section>

        {/* Main About Section */}
        <section className="space-y-6 pt-2">
          <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-2">
            Primary Introduction
          </h3>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-700 block">About Us Content</label>
            <RichTextEditor name="aboutText" defaultValue={db.about_text} />
          </div>

          <div className="space-y-2 p-4 bg-zinc-50 rounded-lg border border-zinc-200">
            <label className="text-xs font-semibold text-zinc-700 block mb-2">
              Split-View Media (Optional)
              {hasAboutMedia && <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Active</span>}
            </label>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input type="file" name="aboutFile" accept="image/*" className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-white" />
              </div>
              <div className="flex-1">
                <input type="url" name="aboutImageUrl" placeholder="Or paste URL..." className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-md text-sm" />
              </div>
            </div>
          </div>
        </section>

        {/* Feature Flags for Extra Statements */}
        <section className="space-y-6 pt-6 border-t border-zinc-100">
          <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-2">
            Additional Statements
          </h3>
          <p className="text-xs text-zinc-500">Check the boxes to enable these sections on the public storefront.</p>

          <div className="grid grid-cols-1 gap-8">
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" name="showHistory" defaultChecked={db.show_history} className="w-5 h-5 text-emerald-600 rounded border-zinc-300 focus:ring-emerald-600" />
                <span className="font-semibold text-zinc-900">Enable Company History</span>
              </label>
              <RichTextEditor name="aboutHistory" defaultValue={db.about_history} />
            </div>

            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" name="showVision" defaultChecked={db.show_vision} className="w-5 h-5 text-emerald-600 rounded border-zinc-300 focus:ring-emerald-600" />
                <span className="font-semibold text-zinc-900">Enable Vision Statement</span>
              </label>
              <RichTextEditor name="aboutVision" defaultValue={db.about_vision} />
            </div>

            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input type="checkbox" name="showMission" defaultChecked={db.show_mission} className="w-5 h-5 text-emerald-600 rounded border-zinc-300 focus:ring-emerald-600" />
                <span className="font-semibold text-zinc-900">Enable Mission Statement</span>
              </label>
              <RichTextEditor name="aboutMission" defaultValue={db.about_mission} />
            </div>
          </div>
        </section>

        {/* WOZ FIX: Multi-Action Footer Engine applied to About Us */}
        <div className="pt-8 mt-8 border-t border-zinc-200 flex flex-col-reverse sm:flex-row justify-between items-center gap-6">
          <button 
            type="submit" 
            formAction={resetThemingAction}
            formNoValidate
            className="text-zinc-500 hover:text-rose-600 font-medium text-sm transition-colors flex items-center gap-2 px-4 py-2 rounded-md hover:bg-rose-50 w-full sm:w-auto justify-center"
          >
            <Icons.RotateCcw size={16} />
            Revert Theming to Defaults
          </button>
          
          <button 
            type="submit" 
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-8 rounded-md transition-colors text-sm shadow-sm w-full sm:w-auto"
          >
            Deploy Story to Storefront
          </button>
        </div>
      </form>
    </div>
  );
}