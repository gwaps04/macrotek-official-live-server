import { sql } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import ColorPickerInput from '@/components/ui/ColorPickerInput';

const FONT_OPTIONS = [
  { label: 'Modern Sans (Default)', value: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
  { label: 'Geometric Sans (Clean & Sharp)', value: 'Futura, "Trebuchet MS", Arial, sans-serif' },
  { label: 'Humanist Sans (Warm & Readable)', value: 'Optima, Candara, Calibri, Arial, sans-serif' },
  { label: 'Elegant Serif (Luxury/Classic)', value: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' },
  { label: 'Old Style Serif (Editorial/Academic)', value: 'Garamond, Baskerville, "Baskerville Old Face", "Hoefler Text", "Times New Roman", serif' },
  { label: 'Slab Serif (Bold & Industrial)', value: 'Rockwell, "Courier Bold", Courier, Georgia, serif' },
  { label: 'Technical Mono (Code/Developer)', value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }
];

const AVAILABLE_ICONS = [
  { id: 'Zap', name: 'Lightning (Automation)' },
  { id: 'Server', name: 'Server (Hosting)' },
  { id: 'PenTool', name: 'Pen (Design)' },
  { id: 'Shield', name: 'Shield (Security)' },
  { id: 'Globe', name: 'Globe (Web)' },
  { id: 'Star', name: 'Star (Premium)' },
  { id: 'TrendingUp', name: 'Chart (Growth)' },
  { id: 'Users', name: 'Users (Consulting)' },
  { id: 'Sun', name: 'Sun (Solar/Energy)' }
];

export default async function DashboardServices(props: { searchParams: Promise<{ edit?: string }> }) {
  
  const searchParams = await props.searchParams;
  const editId = searchParams.edit;

  const [configResult, servicesResult] = await Promise.all([
    sql`SELECT * FROM site_config WHERE is_singleton = TRUE LIMIT 1`,
    sql`SELECT id, title, description, icon_identifier, image_url, sort_order, card_bg, card_text, card_font FROM services ORDER BY sort_order ASC, created_at DESC`
  ]);
  
  const currentConfig = configResult[0] || {};
  
  const serviceToEdit = editId ? servicesResult.find(s => s.id === editId) : null;
  const isEditing = !!serviceToEdit;
  const hasCustomTheme = !!serviceToEdit?.card_bg;

  // ACTION 1: Global Section Headers & Theming
  async function updateConfigAction(formData: FormData) {
    "use server";
    const title = (formData.get('title') as string) || '';
    const subtitle = (formData.get('subtitle') as string) || '';
    const description = (formData.get('description') as string) || '';

    const bgType = (formData.get('servicesBgType') as string) || 'solid';
    const bgColor = (formData.get('servicesBgColor') as string) || '#ffffff';
    const bgGradientTo = (formData.get('servicesBgGradientTo') as string) || '#f8fafc';
    const textColor = (formData.get('servicesTextColor') as string) || '#18181b';
    const fontFamily = (formData.get('servicesFontFamily') as string) || FONT_OPTIONS[0].value;
    
    const cardBg = (formData.get('servicesCardBg') as string) || '#ffffff';
    const cardText = (formData.get('servicesCardText') as string) || '#18181b';
    const cardFont = (formData.get('servicesCardFontFamily') as string) || FONT_OPTIONS[0].value;

    await sql`
      UPDATE site_config SET 
        services_title = ${title}, services_subtitle = ${subtitle}, services_description = ${description},
        services_bg_type = ${bgType}, services_bg_color = ${bgColor}, services_bg_gradient_to = ${bgGradientTo},
        services_text_color = ${textColor}, services_font_family = ${fontFamily},
        services_card_bg = ${cardBg}, services_card_text = ${cardText}, services_card_font_family = ${cardFont}
      WHERE is_singleton = TRUE
    `;
    revalidatePath('/', 'layout');
    redirect('/dashboard/services');
  }

  // WOZ FIX: Restored the Global Revert Action
  async function resetThemingAction() {
    "use server";
    await sql`
      UPDATE site_config SET 
        services_bg_type = 'solid',
        services_bg_color = '#ffffff',
        services_bg_gradient_to = '#f8fafc',
        services_text_color = '#18181b',
        services_font_family = ${FONT_OPTIONS[0].value},
        services_card_bg = '#ffffff',
        services_card_text = '#18181b',
        services_card_font_family = ${FONT_OPTIONS[0].value}
      WHERE is_singleton = TRUE
    `;
    revalidatePath('/', 'layout');
    redirect('/dashboard/services');
  }

  // ACTION 2: Unified Save (Insert OR Update) for a Single Service
  async function saveServiceAction(formData: FormData) {
    "use server";
    
    const targetId = formData.get('serviceId') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const iconId = formData.get('iconId') as string;
    
    // Extract Granular Theming Payloads only if the override box is checked
    const useCustomTheme = formData.get('useCustomTheme') === 'on';
    const individualCardBg = useCustomTheme ? (formData.get('individualCardBg') as string) : null;
    const individualCardText = useCustomTheme ? (formData.get('individualCardText') as string) : null;
    const individualCardFont = useCustomTheme ? (formData.get('individualCardFont') as string) : null;

    let finalImageUrl = null;
    
    if (targetId) {
      const existing = await sql`SELECT image_url FROM services WHERE id = ${targetId}`;
      finalImageUrl = existing[0]?.image_url || null;
    }

    const file = formData.get('imageFile') as File | null;
    const inputUrl = formData.get('imageUrl') as string;

    if (file && file.size > 0 && file.size <= 2.5 * 1024 * 1024) {
      const buffer = Buffer.from(await file.arrayBuffer());
      finalImageUrl = `data:${file.type};base64,${buffer.toString('base64')}`;
    } else if (inputUrl && inputUrl.trim() !== '') {
      finalImageUrl = inputUrl;
    }

    if (targetId) {
      await sql`
        UPDATE services SET 
          title = ${title}, description = ${description}, icon_identifier = ${iconId}, image_url = ${finalImageUrl},
          card_bg = ${individualCardBg}, card_text = ${individualCardText}, card_font = ${individualCardFont}
        WHERE id = ${targetId}
      `;
    } else {
      await sql`
        INSERT INTO services (title, description, icon_identifier, image_url, card_bg, card_text, card_font) 
        VALUES (${title}, ${description}, ${iconId}, ${finalImageUrl}, ${individualCardBg}, ${individualCardText}, ${individualCardFont})
      `;
    }
    
    revalidatePath('/', 'layout');
    redirect('/dashboard/services');
  }

  // ACTION 3: Delete Service
  async function deleteServiceAction(formData: FormData) {
    "use server";
    const id = formData.get('serviceId') as string;
    await sql`DELETE FROM services WHERE id = ${id}`;
    revalidatePath('/', 'layout');
    redirect('/dashboard/services');
  }

  return (
    <div className="max-w-5xl pb-24 space-y-12">
      
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Services Catalog</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage the services section, catalog items, and visual presentation.</p>
      </div>

      {/* Global Configuration Form */}
      {!isEditing && (
        <form action={updateConfigAction} className="space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
          
          <section>
            <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-2 mb-6">
              Global Services Section Theming
            </h3>
            
            <div className="mb-6 p-6 bg-zinc-50 rounded-xl border border-zinc-200">
              <h4 className="text-xs font-bold uppercase text-zinc-500 mb-4 tracking-wider border-b border-zinc-200 pb-2">Background & Typography</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2 pb-4 border-b border-zinc-200">
                  <label className="text-xs font-semibold text-zinc-700 block mb-3">Background Mode</label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="servicesBgType" value="solid" defaultChecked={currentConfig.services_bg_type !== 'gradient'} className="text-emerald-600 focus:ring-emerald-600" />
                      <span className="text-sm font-medium text-zinc-800">Solid Color</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="servicesBgType" value="gradient" defaultChecked={currentConfig.services_bg_type === 'gradient'} className="text-emerald-600 focus:ring-emerald-600" />
                      <span className="text-sm font-medium text-zinc-800">Linear Gradient</span>
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700 block">Primary Background (Start)</label>
                  <ColorPickerInput name="servicesBgColor" defaultValue={currentConfig.services_bg_color || '#ffffff'} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700 block">Gradient End Color</label>
                  <ColorPickerInput name="servicesBgGradientTo" defaultValue={currentConfig.services_bg_gradient_to || '#f8fafc'} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700 block">Section Text Color</label>
                  <ColorPickerInput name="servicesTextColor" defaultValue={currentConfig.services_text_color || '#18181b'} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700">Typography Style</label>
                  <select name="servicesFontFamily" defaultValue={currentConfig.services_font_family || FONT_OPTIONS[0].value} className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900">
                    {FONT_OPTIONS.map(font => (<option key={font.label} value={font.value}>{font.label}</option>))}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 bg-zinc-50 rounded-xl border border-zinc-200">
               <h4 className="text-xs font-bold uppercase text-zinc-500 mb-4 tracking-wider border-b border-zinc-200 pb-2">Global Default Card Styling</h4>
               <p className="text-[10px] text-zinc-500 mb-4">This applies to all cards unless explicitly overridden.</p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700 block">Card Background Color</label>
                  <ColorPickerInput name="servicesCardBg" defaultValue={currentConfig.services_card_bg || '#ffffff'} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700 block">Card Text Color</label>
                  <ColorPickerInput name="servicesCardText" defaultValue={currentConfig.services_card_text || '#18181b'} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold text-zinc-700">Card Typography Style</label>
                  <select name="servicesCardFontFamily" defaultValue={currentConfig.services_card_font_family || FONT_OPTIONS[0].value} className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900">
                    {FONT_OPTIONS.map(font => (<option key={font.label} value={font.value}>{font.label}</option>))}
                  </select>
                </div>
               </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-2 mb-6">Section Header Content</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700">Small Kicker (Overline)</label>
                <input type="text" name="title" defaultValue={currentConfig.services_title} placeholder="e.g., Our Expertise" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700">Primary Headline</label>
                <input type="text" name="subtitle" defaultValue={currentConfig.services_subtitle} placeholder="e.g., High-Performance Solutions" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-zinc-700">Section Description</label>
                <textarea name="description" defaultValue={currentConfig.services_description} rows={2} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900 resize-none" />
              </div>
            </div>
          </section>

          {/* WOZ FIX: Restored the Multi-Action Global Save & Revert Bar */}
          <div className="pt-8 mt-8 border-t border-zinc-200 flex flex-col-reverse sm:flex-row justify-between items-center gap-6">
            <button 
              type="submit" 
              formAction={resetThemingAction}
              formNoValidate
              className="text-zinc-500 hover:text-rose-600 font-medium text-sm transition-colors flex items-center gap-2 px-4 py-2 rounded-md hover:bg-rose-50 w-full sm:w-auto justify-center"
            >
              <Icons.RotateCcw size={16} />
              Revert Global Theming
            </button>
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-8 rounded-md transition-colors text-sm shadow-sm w-full sm:w-auto">
              Save Global Configuration
            </button>
          </div>
        </form>
      )}

      {/* Unified Add / Edit Service Form */}
      <section id="service-editor" className={`bg-white p-8 rounded-2xl shadow-sm border ${isEditing ? 'border-emerald-500 ring-4 ring-emerald-50' : 'border-zinc-200'}`}>
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2 mb-6">
          <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest">
            {isEditing ? '✏️ Edit Existing Service' : 'Add New Service Item'}
          </h3>
          {isEditing && (
            <Link href="/dashboard/services" className="text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors uppercase tracking-wider">
              Cancel Edit
            </Link>
          )}
        </div>
        
        <form action={saveServiceAction} className="space-y-6">
          {isEditing && <input type="hidden" name="serviceId" value={serviceToEdit.id} />}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700">Service Title</label>
              <input type="text" name="title" required defaultValue={serviceToEdit?.title} placeholder="e.g., Solar Installation"
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-emerald-600" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700">Icon Selection</label>
              <select name="iconId" required defaultValue={serviceToEdit?.icon_identifier || 'Zap'} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-emerald-600">
                {AVAILABLE_ICONS.map(icon => (<option key={icon.id} value={icon.id}>{icon.name}</option>))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-zinc-700">Service Description</label>
              <textarea name="description" required defaultValue={serviceToEdit?.description} rows={2} placeholder="Briefly describe the value provided..."
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-emerald-600 resize-none" />
            </div>
            
            <div className="space-y-2 p-4 bg-zinc-50 rounded-lg border border-zinc-200 md:col-span-2">
              <label className="text-xs font-semibold text-zinc-700 block mb-2">
                Card Thumbnail Media {serviceToEdit?.image_url && <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Active Image Saved</span>}
              </label>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <span className="text-[10px] uppercase text-zinc-500 mb-1 block">Upload New File (Max 2MB)</span>
                  <input type="file" name="imageFile" accept="image/*" className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-white" />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] uppercase text-zinc-500 mb-1 block">Or Paste New Image URL</span>
                  <input type="url" name="imageUrl" placeholder="https://..." className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-md text-sm" />
                </div>
              </div>
            </div>

            {/* WOZ FIX: UX State Guard for Override Theming */}
            {/* The "group" class on the parent listens for the checkbox state inside it. */}
            <div className="group md:col-span-2 p-6 bg-zinc-900 rounded-xl border border-zinc-800 mt-4 shadow-inner">
              
              <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-4">
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">Custom Card Styling Override</h4>
                  <p className="text-xs text-zinc-400 mt-1">Activate the switch to style this specific card differently.</p>
                </div>
                
                <label className="flex items-center space-x-2 cursor-pointer bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-md border border-zinc-600 transition-colors">
                  {/* Notice the "peer" class. It broadcasts its state to the group. */}
                  <input type="checkbox" name="useCustomTheme" defaultChecked={hasCustomTheme} className="peer w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500 bg-zinc-900 border-zinc-700 cursor-pointer" />
                  <span className="font-bold text-white text-xs uppercase tracking-wider select-none">Enable Custom Theme</span>
                </label>
              </div>

              {/* WOZ CSS MAGIC: This div is grayed out and unclickable UNLESS the checkbox above is ticked. */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-30 grayscale pointer-events-none group-has-[:checked]:opacity-100 group-has-[:checked]:grayscale-0 group-has-[:checked]:pointer-events-auto transition-all duration-300">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 block">Custom Background</label>
                  <ColorPickerInput name="individualCardBg" defaultValue={serviceToEdit?.card_bg || '#18181b'} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 block">Custom Text Color</label>
                  <ColorPickerInput name="individualCardText" defaultValue={serviceToEdit?.card_text || '#ffffff'} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold text-zinc-400">Custom Typography</label>
                  <select name="individualCardFont" defaultValue={serviceToEdit?.card_font || FONT_OPTIONS[0].value} className="w-full px-4 py-2 bg-zinc-950 border border-zinc-700 text-white rounded-md text-sm focus:ring-2 focus:ring-emerald-500">
                    {FONT_OPTIONS.map(font => (<option key={font.label} value={font.value}>{font.label}</option>))}
                  </select>
                </div>
              </div>
            </div>

          </div>
          <div className="pt-2 flex justify-end gap-4">
            {isEditing && (
              <Link href="/dashboard/services" className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold py-2 px-6 rounded-md transition-colors text-sm">
                Cancel
              </Link>
            )}
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-6 rounded-md transition-colors text-sm shadow-sm">
              {isEditing ? 'Save Updates to Service' : 'Publish New Service'}
            </button>
          </div>
        </form>
      </section>

      {/* Existing Services List */}
      <section>
        <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest border-b border-zinc-200 pb-2 mb-6">
          Active Services ({servicesResult.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicesResult.map((service) => (
            <div key={service.id} className={`bg-white border rounded-xl p-6 shadow-sm flex flex-col relative overflow-hidden transition-colors ${editId === service.id ? 'border-emerald-500 ring-2 ring-emerald-50' : 'border-zinc-200'}`}>
              
              {service.image_url && <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500" />}
              {service.card_bg && <div className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: service.card_bg }} title="Custom Theme Applied" />}

              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center">
                    <span className="text-zinc-500 text-xs font-bold">{service.icon_identifier}</span>
                  </div>
                  <h4 className="font-bold text-zinc-900 text-base leading-tight pr-4">{service.title}</h4>
                </div>
                
                <div className="flex items-center gap-1">
                  <Link href={`/dashboard/services?edit=${service.id}#service-editor`} className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-md transition-colors" title="Edit Service">
                    <Icons.Edit3 size={16} />
                  </Link>
                  <form action={deleteServiceAction}>
                    <input type="hidden" name="serviceId" value={service.id} />
                    <button type="submit" className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-md transition-colors" title="Delete Service">
                      <Icons.Trash2 size={16} />
                    </button>
                  </form>
                </div>
              </div>
              <p className="text-sm text-zinc-600 line-clamp-2">{service.description}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}