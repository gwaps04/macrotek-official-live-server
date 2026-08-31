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
  { label: 'Technical Mono (Code/Developer)', value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }
];

export default async function DashboardFooter() {
  
  const configResult = await sql`
    SELECT 
      footer_description, footer_dev_name, footer_dev_link,
      footer_bg_type, footer_bg_color, footer_bg_gradient_to, footer_text_color, footer_font_family
    FROM site_config 
    WHERE is_singleton = TRUE 
    LIMIT 1
  `;
  const db = configResult[0] || {};

  async function updateFooterAction(formData: FormData) {
    "use server";
    
    // Content Payloads
    const description = (formData.get('footerDescription') as string) || '';
    const devName = (formData.get('footerDevName') as string) || '';
    const devLink = (formData.get('footerDevLink') as string) || '';

    // Theming Payloads
    const footerBgType = (formData.get('footerBgType') as string) || 'solid';
    const footerBgColor = (formData.get('footerBgColor') as string) || '#09090b';
    const footerBgGradientTo = (formData.get('footerBgGradientTo') as string) || '#18181b';
    const footerTextColor = (formData.get('footerTextColor') as string) || '#ffffff';
    const footerFontFamily = (formData.get('footerFontFamily') as string) || FONT_OPTIONS[0].value;

    await sql`
      UPDATE site_config SET 
        footer_description = ${description},
        footer_dev_name = ${devName},
        footer_dev_link = ${devLink},
        footer_bg_type = ${footerBgType},
        footer_bg_color = ${footerBgColor},
        footer_bg_gradient_to = ${footerBgGradientTo},
        footer_text_color = ${footerTextColor},
        footer_font_family = ${footerFontFamily}
      WHERE is_singleton = TRUE
    `;

    revalidatePath('/', 'layout');
    redirect('/dashboard/footer');
  }

  async function resetThemingAction() {
    "use server";
    await sql`
      UPDATE site_config SET 
        footer_bg_type = 'solid', 
        footer_bg_color = '#09090b', 
        footer_bg_gradient_to = '#18181b',
        footer_text_color = '#ffffff', 
        footer_font_family = ${FONT_OPTIONS[0].value}
      WHERE is_singleton = TRUE
    `;
    revalidatePath('/', 'layout');
    redirect('/dashboard/footer');
  }

  return (
    <div className="max-w-4xl pb-24 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Footer Configuration</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage global footer content, agency credits, and visual presentation.</p>
      </div>

      <form action={updateFooterAction} className="space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
        
        {/* Footer Theming Block */}
        <section>
          <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-2 mb-6">
            Footer Section Theming
          </h3>
          <div className="p-6 bg-zinc-50 rounded-xl border border-zinc-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2 pb-4 border-b border-zinc-200">
                <label className="text-xs font-semibold text-zinc-700 block mb-3">Background Mode</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="footerBgType" value="solid" defaultChecked={db.footer_bg_type !== 'gradient'} className="text-emerald-600 focus:ring-emerald-600" />
                    <span className="text-sm font-medium text-zinc-800">Solid Color</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="footerBgType" value="gradient" defaultChecked={db.footer_bg_type === 'gradient'} className="text-emerald-600 focus:ring-emerald-600" />
                    <span className="text-sm font-medium text-zinc-800">Linear Gradient</span>
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700 block">Primary Background (Start)</label>
                <ColorPickerInput name="footerBgColor" defaultValue={db.footer_bg_color || '#09090b'} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700 block">Gradient End Color</label>
                <ColorPickerInput name="footerBgGradientTo" defaultValue={db.footer_bg_gradient_to || '#18181b'} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700 block">Primary Text Color</label>
                <ColorPickerInput name="footerTextColor" defaultValue={db.footer_text_color || '#ffffff'} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700">Typography Style</label>
                <select name="footerFontFamily" defaultValue={db.footer_font_family || FONT_OPTIONS[0].value} className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900">
                  {FONT_OPTIONS.map(font => (<option key={font.label} value={font.value}>{font.label}</option>))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Text Content & Credits */}
        <section>
          <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-2 mb-6">
            Text & Credits
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-zinc-700">Company Short Description</label>
              <textarea name="footerDescription" defaultValue={db.footer_description} rows={2} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900 resize-none" />
            </div>
            
            <div className="space-y-2 p-4 bg-zinc-50 border border-zinc-200 rounded-lg md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                 <h4 className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Developer Attribution</h4>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-zinc-500 uppercase">Agency Name</label>
                <input type="text" name="footerDevName" defaultValue={db.footer_dev_name} className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-zinc-500 uppercase">Agency URL</label>
                <input type="url" name="footerDevLink" defaultValue={db.footer_dev_link} className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900" />
              </div>
            </div>
          </div>
        </section>

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
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-8 rounded-md transition-colors text-sm shadow-sm w-full sm:w-auto">
            Deploy Footer Configuration
          </button>
        </div>
      </form>
    </div>
  );
}