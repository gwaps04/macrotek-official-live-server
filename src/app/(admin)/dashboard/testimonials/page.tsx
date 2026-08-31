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
  { label: 'Elegant Serif (Luxury/Classic)', value: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' }
];

export default async function DashboardTestimonials(props: { searchParams: Promise<{ edit?: string }> }) {
  
  const searchParams = await props.searchParams;
  const editId = searchParams.edit;

  const [configResult, testimonialsResult] = await Promise.all([
    sql`SELECT * FROM site_config WHERE is_singleton = TRUE LIMIT 1`,
    sql`SELECT id, client_name, comments, rating, image_url, sort_order FROM testimonials ORDER BY sort_order ASC, created_at DESC`
  ]);

  const currentConfig = configResult[0] || {};
  const isSectionActive = currentConfig.show_testimonials;
  
  const itemToEdit = editId ? testimonialsResult.find(t => t.id === editId) : null;
  const isEditing = !!itemToEdit;

  // ACTION 1: Update Global Settings & Theming
  async function updateConfigAction(formData: FormData) {
    "use server";
    const showSection = formData.get('showTestimonials') === 'on';
    const title = (formData.get('title') as string) || '';
    const subtitle = (formData.get('subtitle') as string) || '';

    const bgType = (formData.get('testimonialsBgType') as string) || 'solid';
    const bgColor = (formData.get('testimonialsBgColor') as string) || '#f8fafc';
    const bgGradientTo = (formData.get('testimonialsBgGradientTo') as string) || '#ffffff';
    const textColor = (formData.get('testimonialsTextColor') as string) || '#18181b';
    const fontFamily = (formData.get('testimonialsFontFamily') as string) || FONT_OPTIONS[0].value;
    
    const cardBg = (formData.get('testimonialsCardBg') as string) || '#ffffff';
    const cardText = (formData.get('testimonialsCardText') as string) || '#18181b';

    await sql`
      UPDATE site_config SET 
        show_testimonials = ${showSection},
        testimonials_title = ${title}, testimonials_subtitle = ${subtitle},
        testimonials_bg_type = ${bgType}, testimonials_bg_color = ${bgColor}, testimonials_bg_gradient_to = ${bgGradientTo},
        testimonials_text_color = ${textColor}, testimonials_font_family = ${fontFamily},
        testimonials_card_bg = ${cardBg}, testimonials_card_text = ${cardText}
      WHERE is_singleton = TRUE
    `;
    revalidatePath('/', 'layout');
    redirect('/dashboard/testimonials');
  }

  // ACTION 2: Factory Reset
  async function resetThemingAction() {
    "use server";
    await sql`
      UPDATE site_config SET 
        testimonials_bg_type = 'solid', testimonials_bg_color = '#f8fafc', testimonials_bg_gradient_to = '#ffffff',
        testimonials_text_color = '#18181b', testimonials_font_family = ${FONT_OPTIONS[0].value},
        testimonials_card_bg = '#ffffff', testimonials_card_text = '#18181b'
      WHERE is_singleton = TRUE
    `;
    revalidatePath('/', 'layout');
    redirect('/dashboard/testimonials');
  }

  // ACTION 3: Unified Save (Insert/Update)
  async function saveItemAction(formData: FormData) {
    "use server";
    const targetId = formData.get('itemId') as string;
    const clientName = formData.get('clientName') as string;
    const comments = formData.get('comments') as string;
    const rating = parseInt(formData.get('rating') as string) || 5;
    const sortOrder = parseInt(formData.get('sortOrder') as string) || 0;

    let finalImageUrl = null;
    if (targetId) {
      const existing = await sql`SELECT image_url FROM testimonials WHERE id = ${targetId}`;
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
        UPDATE testimonials SET 
          client_name = ${clientName}, comments = ${comments}, rating = ${rating}, image_url = ${finalImageUrl}, sort_order = ${sortOrder}
        WHERE id = ${targetId}
      `;
    } else {
      await sql`
        INSERT INTO testimonials (client_name, comments, rating, image_url, sort_order) 
        VALUES (${clientName}, ${comments}, ${rating}, ${finalImageUrl}, ${sortOrder})
      `;
    }
    
    revalidatePath('/', 'layout');
    redirect('/dashboard/testimonials');
  }

  // ACTION 4: Delete
  async function deleteItemAction(formData: FormData) {
    "use server";
    const id = formData.get('deleteId') as string;
    await sql`DELETE FROM testimonials WHERE id = ${id}`;
    revalidatePath('/', 'layout');
    redirect('/dashboard/testimonials');
  }

  return (
    <div className="max-w-5xl pb-24 space-y-12">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Success Stories & Testimonials</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage global visibility, social proof content, and visual presentation.</p>
      </div>

      {/* Global Configuration Form */}
      {!isEditing && (
        <form action={updateConfigAction} className={`space-y-8 p-8 rounded-2xl shadow-sm border transition-colors ${isSectionActive ? 'bg-white border-zinc-200' : 'bg-zinc-50 border-rose-200'}`}>
          
          <section className="flex items-center justify-between p-4 bg-zinc-900 rounded-xl border border-zinc-800 shadow-inner">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Storefront Visibility</h3>
              <p className="text-xs text-zinc-400 mt-1">If disabled, the testimonials section will be hidden from the public site.</p>
            </div>
            <label className="flex items-center space-x-3 cursor-pointer bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-md border border-zinc-600 transition-colors">
              <input type="checkbox" name="showTestimonials" defaultChecked={isSectionActive} className="w-5 h-5 text-emerald-500 rounded focus:ring-emerald-500 bg-zinc-900 border-zinc-700 cursor-pointer" />
              <span className="font-bold text-white text-xs uppercase tracking-wider select-none">
                {isSectionActive ? 'Section is LIVE' : 'Section is HIDDEN'}
              </span>
            </label>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-2 mb-6">Global Theming</h3>
            
            <div className="mb-6 p-6 bg-zinc-50 rounded-xl border border-zinc-200">
              <h4 className="text-xs font-bold uppercase text-zinc-500 mb-4 tracking-wider border-b border-zinc-200 pb-2">Background & Typography</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2 pb-4 border-b border-zinc-200">
                  <label className="text-xs font-semibold text-zinc-700 block mb-3">Background Mode</label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="testimonialsBgType" value="solid" defaultChecked={currentConfig.testimonials_bg_type !== 'gradient'} className="text-emerald-600 focus:ring-emerald-600" />
                      <span className="text-sm font-medium text-zinc-800">Solid Color</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="testimonialsBgType" value="gradient" defaultChecked={currentConfig.testimonials_bg_type === 'gradient'} className="text-emerald-600 focus:ring-emerald-600" />
                      <span className="text-sm font-medium text-zinc-800">Linear Gradient</span>
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700 block">Primary Background</label>
                  <ColorPickerInput name="testimonialsBgColor" defaultValue={currentConfig.testimonials_bg_color || '#f8fafc'} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700 block">Gradient End</label>
                  <ColorPickerInput name="testimonialsBgGradientTo" defaultValue={currentConfig.testimonials_bg_gradient_to || '#ffffff'} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700 block">Section Text Color</label>
                  <ColorPickerInput name="testimonialsTextColor" defaultValue={currentConfig.testimonials_text_color || '#18181b'} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700">Typography Style</label>
                  <select name="testimonialsFontFamily" defaultValue={currentConfig.testimonials_font_family || FONT_OPTIONS[0].value} className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900">
                    {FONT_OPTIONS.map(font => (<option key={font.label} value={font.value}>{font.label}</option>))}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 bg-zinc-50 rounded-xl border border-zinc-200">
               <h4 className="text-xs font-bold uppercase text-zinc-500 mb-4 tracking-wider border-b border-zinc-200 pb-2">Default Card Styling</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700 block">Card Background Color</label>
                  <ColorPickerInput name="testimonialsCardBg" defaultValue={currentConfig.testimonials_card_bg || '#ffffff'} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700 block">Card Text Color</label>
                  <ColorPickerInput name="testimonialsCardText" defaultValue={currentConfig.testimonials_card_text || '#18181b'} />
                </div>
               </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-2 mb-6">Section Header Content</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700">Small Kicker (Overline)</label>
                <input type="text" name="title" defaultValue={currentConfig.testimonials_title} placeholder="e.g., Success Stories" className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700">Primary Headline</label>
                <input type="text" name="subtitle" defaultValue={currentConfig.testimonials_subtitle} placeholder="e.g., What Our Clients Say" className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900" />
              </div>
            </div>
          </section>

          <div className="pt-4 flex justify-between items-center gap-6">
            <button type="submit" formAction={resetThemingAction} formNoValidate className="text-zinc-500 hover:text-rose-600 font-medium text-sm transition-colors flex items-center gap-2 px-4 py-2 rounded-md hover:bg-rose-50">
              <Icons.RotateCcw size={16} /> Revert Theming
            </button>
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-8 rounded-md transition-colors text-sm shadow-sm">
              Save Configuration
            </button>
          </div>
        </form>
      )}

      {/* Unified Add / Edit Testimonial Form */}
      <section id="testimonial-editor" className={`bg-white p-8 rounded-2xl shadow-sm border ${isEditing ? 'border-emerald-500 ring-4 ring-emerald-50' : 'border-zinc-200'}`}>
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2 mb-6">
          <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest">
            {isEditing ? '✏️ Edit Existing Story' : 'Add New Success Story'}
          </h3>
          {isEditing && (
            <Link href="/dashboard/testimonials" className="text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors uppercase tracking-wider">
              Cancel Edit
            </Link>
          )}
        </div>
        
        <form action={saveItemAction} className="space-y-6">
          {isEditing && <input type="hidden" name="itemId" value={itemToEdit.id} />}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700">Client / Project Name</label>
              <input type="text" name="clientName" required defaultValue={itemToEdit?.client_name} placeholder="e.g., Sarah Jenkins"
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-emerald-600" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700">Star Rating</label>
              <select name="rating" required defaultValue={itemToEdit?.rating || 5} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm font-medium focus:ring-2 focus:ring-emerald-600">
                <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                <option value={3}>⭐⭐⭐ (3 Stars)</option>
                <option value={2}>⭐⭐ (2 Stars)</option>
                <option value={1}>⭐ (1 Star)</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-zinc-700">Client Comments / Verbatim</label>
              <textarea name="comments" required defaultValue={itemToEdit?.comments} rows={3} placeholder="The exact quote from the client..."
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-emerald-600 resize-none" />
            </div>
            
            <div className="space-y-2 p-4 bg-zinc-50 rounded-lg border border-zinc-200 md:col-span-2">
              <label className="text-xs font-semibold text-zinc-700 block mb-2">
                Client Photo or Logo (Optional) {itemToEdit?.image_url && <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Active Image Saved</span>}
              </label>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <span className="text-[10px] uppercase text-zinc-500 mb-1 block">Upload New File (Max 2MB)</span>
                  <input type="file" name="imageFile" accept="image/*" className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-white" />
                </div>
                <div className="flex items-center justify-center text-xs text-zinc-400 font-bold uppercase">OR</div>
                <div className="flex-1">
                  <span className="text-[10px] uppercase text-zinc-500 mb-1 block">Or Paste New Image URL</span>
                  <input type="url" name="imageUrl" placeholder="https://..." className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-md text-sm" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-2 flex justify-end gap-4">
            {isEditing && (
              <Link href="/dashboard/testimonials" className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold py-2 px-6 rounded-md transition-colors text-sm">
                Cancel
              </Link>
            )}
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-6 rounded-md transition-colors text-sm shadow-sm">
              {isEditing ? 'Save Updates to Story' : 'Publish Story'}
            </button>
          </div>
        </form>
      </section>

      {/* Existing Testimonials List */}
      <section>
        <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest border-b border-zinc-200 pb-2 mb-6">
          Active Stories ({testimonialsResult.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonialsResult.map((item) => (
            <div key={item.id} className={`bg-white border rounded-xl p-6 shadow-sm flex flex-col relative overflow-hidden transition-colors ${editId === item.id ? 'border-emerald-500 ring-2 ring-emerald-50' : 'border-zinc-200'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  {item.image_url ? (
                    <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url(${item.image_url})` }} />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">
                      <Icons.User size={20} />
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-zinc-900 text-sm leading-tight">{item.client_name}</h4>
                    <div className="flex text-amber-400 text-[10px] mt-0.5">
                      {[...Array(item.rating)].map((_, i) => <Icons.Star key={i} size={12} fill="currentColor" />)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Link href={`/dashboard/testimonials?edit=${item.id}#testimonial-editor`} className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-md transition-colors" title="Edit">
                    <Icons.Edit3 size={16} />
                  </Link>
                  <form action={deleteItemAction}>
                    <input type="hidden" name="deleteId" value={item.id} />
                    <button type="submit" className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-md transition-colors" title="Delete">
                      <Icons.Trash2 size={16} />
                    </button>
                  </form>
                </div>
              </div>
              <p className="text-sm text-zinc-600 line-clamp-3 italic">"{item.comments}"</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}