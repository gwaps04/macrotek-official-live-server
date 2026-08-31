import { sql } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import * as Icons from 'lucide-react';
import ColorPickerInput from '@/components/ui/ColorPickerInput';

const FONT_OPTIONS = [
  { label: 'Modern Sans (Default)', value: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
  { label: 'Geometric Sans (Clean & Sharp)', value: 'Futura, "Trebuchet MS", Arial, sans-serif' },
  { label: 'Humanist Sans (Warm & Readable)', value: 'Optima, Candara, Calibri, Arial, sans-serif' },
  { label: 'Elegant Serif (Luxury/Classic)', value: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' },
  { label: 'Technical Mono (Code/Developer)', value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }
];

export default async function DashboardGallery() {
  
  const [configResult, imagesResult] = await Promise.all([
    sql`SELECT show_gallery, gallery_title, gallery_subtitle, gallery_bg_type, gallery_bg_color, gallery_bg_gradient_to, gallery_text_color, gallery_font_family FROM site_config WHERE is_singleton = TRUE LIMIT 1`,
    sql`SELECT id, title, image_url, sort_order FROM gallery_images ORDER BY sort_order ASC, created_at DESC`
  ]);

  const currentConfig = configResult[0] || {};
  const isGalleryActive = currentConfig.show_gallery;

  // ACTION 1: Update Global Gallery Settings & Theming
  async function updateGalleryConfigAction(formData: FormData) {
    "use server";
    const showGallery = formData.get('showGallery') === 'on';
    const title = (formData.get('title') as string) || '';
    const subtitle = (formData.get('subtitle') as string) || '';

    const bgType = (formData.get('galleryBgType') as string) || 'solid';
    const bgColor = (formData.get('galleryBgColor') as string) || '#ffffff';
    const bgGradientTo = (formData.get('galleryBgGradientTo') as string) || '#f8fafc';
    const textColor = (formData.get('galleryTextColor') as string) || '#18181b';
    const fontFamily = (formData.get('galleryFontFamily') as string) || FONT_OPTIONS[0].value;

    await sql`
      UPDATE site_config SET 
        show_gallery = ${showGallery},
        gallery_title = ${title},
        gallery_subtitle = ${subtitle},
        gallery_bg_type = ${bgType},
        gallery_bg_color = ${bgColor},
        gallery_bg_gradient_to = ${bgGradientTo},
        gallery_text_color = ${textColor},
        gallery_font_family = ${fontFamily}
      WHERE is_singleton = TRUE
    `;
    revalidatePath('/', 'layout');
    redirect('/dashboard/gallery');
  }

  // ACTION 2: Revert Theming
  async function resetThemingAction() {
    "use server";
    await sql`
      UPDATE site_config SET 
        gallery_bg_type = 'solid', gallery_bg_color = '#ffffff', gallery_bg_gradient_to = '#f8fafc',
        gallery_text_color = '#18181b', gallery_font_family = ${FONT_OPTIONS[0].value}
      WHERE is_singleton = TRUE
    `;
    revalidatePath('/', 'layout');
    redirect('/dashboard/gallery');
  }

  // ACTION 3: Add Image
  async function addImageAction(formData: FormData) {
    "use server";
    const title = formData.get('title') as string;
    const sortOrder = parseInt(formData.get('sortOrder') as string) || 0;

    let finalImageUrl = null;
    const file = formData.get('imageFile') as File | null;
    const inputUrl = formData.get('imageUrl') as string;

    if (file && file.size > 0 && file.size <= 4 * 1024 * 1024) {
      const buffer = Buffer.from(await file.arrayBuffer());
      finalImageUrl = `data:${file.type};base64,${buffer.toString('base64')}`;
    } else if (inputUrl && inputUrl.trim() !== '') {
      finalImageUrl = inputUrl;
    }

    if (finalImageUrl) {
      await sql`
        INSERT INTO gallery_images (title, image_url, sort_order) 
        VALUES (${title}, ${finalImageUrl}, ${sortOrder})
      `;
    }
    
    revalidatePath('/', 'layout');
    redirect('/dashboard/gallery');
  }

  // ACTION 4: Delete Image
  async function deleteImageAction(formData: FormData) {
    "use server";
    const id = formData.get('imageId') as string;
    await sql`DELETE FROM gallery_images WHERE id = ${id}`;
    revalidatePath('/', 'layout');
    redirect('/dashboard/gallery');
  }

  return (
    <div className="max-w-5xl pb-24 space-y-12">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Image Gallery</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage global visibility, section headers, and your visual portfolio.</p>
      </div>

      {/* Global Configuration Form */}
      <form action={updateGalleryConfigAction} className={`space-y-8 p-8 rounded-2xl shadow-sm border transition-colors ${isGalleryActive ? 'bg-white border-zinc-200' : 'bg-zinc-50 border-rose-200'}`}>
        
        {/* Visibility Feature Flag */}
        <section className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800 shadow-inner">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Storefront Visibility</h3>
            <p className="text-xs text-zinc-400 mt-1">If disabled, the entire gallery section will be hidden from the public site.</p>
          </div>
          <label className="flex items-center space-x-3 cursor-pointer bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-md border border-zinc-600 transition-colors">
            <input type="checkbox" name="showGallery" defaultChecked={isGalleryActive} className="w-5 h-5 text-emerald-500 rounded focus:ring-emerald-500 bg-zinc-900 border-zinc-700 cursor-pointer" />
            <span className="font-bold text-white text-xs uppercase tracking-wider select-none">
              {isGalleryActive ? 'Gallery is LIVE' : 'Gallery is HIDDEN'}
            </span>
          </label>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-2 mb-6">Section Display & Content</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700">Small Kicker (Overline)</label>
              <input type="text" name="title" defaultValue={currentConfig.gallery_title} placeholder="e.g., Our Portfolio" className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700">Primary Headline</label>
              <input type="text" name="subtitle" defaultValue={currentConfig.gallery_subtitle} placeholder="e.g., Moments & Highlights" className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900" />
            </div>
          </div>
        </section>

        {/* Gallery Theming */}
        <section>
          <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-2 mb-6">Gallery Section Theming</h3>
          <div className="p-6 bg-zinc-50 rounded-xl border border-zinc-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2 pb-4 border-b border-zinc-200">
                <label className="text-xs font-semibold text-zinc-700 block mb-3">Background Mode</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="galleryBgType" value="solid" defaultChecked={currentConfig.gallery_bg_type !== 'gradient'} className="text-emerald-600 focus:ring-emerald-600" />
                    <span className="text-sm font-medium text-zinc-800">Solid Color</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="galleryBgType" value="gradient" defaultChecked={currentConfig.gallery_bg_type === 'gradient'} className="text-emerald-600 focus:ring-emerald-600" />
                    <span className="text-sm font-medium text-zinc-800">Linear Gradient</span>
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700 block">Primary Background</label>
                <ColorPickerInput name="galleryBgColor" defaultValue={currentConfig.gallery_bg_color || '#ffffff'} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700 block">Gradient End</label>
                <ColorPickerInput name="galleryBgGradientTo" defaultValue={currentConfig.gallery_bg_gradient_to || '#f8fafc'} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700 block">Section Text Color</label>
                <ColorPickerInput name="galleryTextColor" defaultValue={currentConfig.gallery_text_color || '#18181b'} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700">Typography Style</label>
                <select name="galleryFontFamily" defaultValue={currentConfig.gallery_font_family || FONT_OPTIONS[0].value} className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900">
                  {FONT_OPTIONS.map(font => (<option key={font.label} value={font.value}>{font.label}</option>))}
                </select>
              </div>
            </div>
          </div>
        </section>

        <div className="pt-4 border-t border-zinc-200 flex flex-col-reverse sm:flex-row justify-between items-center gap-6">
          <button type="submit" formAction={resetThemingAction} formNoValidate className="text-zinc-500 hover:text-rose-600 font-medium text-sm transition-colors flex items-center gap-2 px-4 py-2 rounded-md hover:bg-rose-50 w-full sm:w-auto justify-center">
            <Icons.RotateCcw size={16} /> Revert Global Theming
          </button>
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-8 rounded-md transition-colors text-sm shadow-sm w-full sm:w-auto">
            Save Gallery Configuration
          </button>
        </div>
      </form>

      {/* Add New Image Form */}
      <section className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
        <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-2 mb-6">
          Upload New Photo
        </h3>
        <form action={addImageAction} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700">Image Title / Caption</label>
              <input type="text" name="title" required placeholder="e.g., Annual Tech Summit 2026" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-emerald-600" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700">Sort Order (Optional)</label>
              <input type="number" name="sortOrder" defaultValue="0" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-emerald-600" />
            </div>
            
            <div className="space-y-2 p-4 bg-zinc-50 rounded-lg border border-zinc-200 md:col-span-2">
              <label className="text-xs font-semibold text-zinc-700 block mb-2">High-Resolution Media</label>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <span className="text-[10px] uppercase text-zinc-500 mb-1 block">Upload File (Max 4MB)</span>
                  <input type="file" name="imageFile" accept="image/*" className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-white" />
                </div>
                <div className="flex items-center justify-center text-xs text-zinc-400 font-bold uppercase">OR</div>
                <div className="flex-1">
                  <span className="text-[10px] uppercase text-zinc-500 mb-1 block">Paste Image URL</span>
                  <input type="url" name="imageUrl" placeholder="https://..." className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-md text-sm" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-2 flex justify-end">
            <button type="submit" className="bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-2 px-6 rounded-md transition-colors text-sm shadow-sm">
              Upload to Gallery
            </button>
          </div>
        </form>
      </section>

      {/* Existing Images Grid */}
      <section>
        <div className="flex items-center justify-between border-b border-zinc-200 pb-2 mb-6">
          <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest">
            Portfolio Inventory ({imagesResult.length})
          </h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {imagesResult.map((img) => (
            <div key={img.id} className="group relative aspect-square bg-zinc-100 rounded-xl overflow-hidden border border-zinc-200 shadow-sm">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url(${img.image_url})` }}
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Content Overlay */}
              <div className="absolute inset-0 flex flex-col justify-between p-4">
                <div className="flex justify-end">
                  <form action={deleteImageAction}>
                    <input type="hidden" name="imageId" value={img.id} />
                    <button type="submit" className="bg-white/10 hover:bg-rose-500 text-white backdrop-blur-sm p-2 rounded-md transition-colors shadow-sm opacity-0 group-hover:opacity-100" title="Delete Image">
                      <Icons.Trash2 size={14} />
                    </button>
                  </form>
                </div>
                <h4 className="text-white text-xs font-bold leading-tight line-clamp-2 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  {img.title}
                </h4>
              </div>
            </div>
          ))}
          {imagesResult.length === 0 && (
            <div className="col-span-full py-12 text-center bg-zinc-50 rounded-xl border border-dashed border-zinc-300">
              <p className="text-zinc-500 text-sm">No photos uploaded yet.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}