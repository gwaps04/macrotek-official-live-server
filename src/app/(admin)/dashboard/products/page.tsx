import { sql } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import RichTextEditor from '@/components/ui/RichTextEditor';
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
  { id: 'Box', name: 'Box (Product)' },
  { id: 'Package', name: 'Package (Service)' },
  { id: 'Layers', name: 'Layers (Tier)' },
  { id: 'ShieldCheck', name: 'Shield (Warranty)' },
  { id: 'Zap', name: 'Lightning (Fast)' },
  { id: 'Star', name: 'Star (Premium)' }
];

export default async function DashboardProducts(props: { searchParams: Promise<{ edit?: string }> }) {
  
  const searchParams = await props.searchParams;
  const editId = searchParams.edit;

  const [configResult, categories, products] = await Promise.all([
    sql`SELECT * FROM site_config WHERE is_singleton = TRUE LIMIT 1`,
    sql`SELECT id, name FROM categories ORDER BY name ASC`,
    // WOZ FIX: Added p.sort_order to the query and updated the ORDER BY hierarchy
    sql`
      SELECT 
        p.id, p.category_id, p.title, p.subtitle, p.description, p.icon_identifier, 
        p.srp, p.discount_percentage, p.image_url, p.card_bg, p.card_text, p.card_font, p.sort_order,
        c.name as category_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.sort_order ASC, p.created_at DESC
    `
  ]);

  const currentConfig = configResult[0] || {};
  
  const productToEdit = editId ? products.find(p => p.id === editId) : null;
  const isEditing = !!productToEdit;
  const hasCustomTheme = !!productToEdit?.card_bg;

  async function updateHeaderAction(formData: FormData) {
    "use server";
    const title = (formData.get('title') as string) || '';
    const subtitle = (formData.get('subtitle') as string) || '';
    const description = (formData.get('description') as string) || '';

    const bgType = (formData.get('productsBgType') as string) || 'solid';
    const bgColor = (formData.get('productsBgColor') as string) || '#f8fafc';
    const bgGradientTo = (formData.get('productsBgGradientTo') as string) || '#ffffff';
    const textColor = (formData.get('productsTextColor') as string) || '#18181b';
    const fontFamily = (formData.get('productsFontFamily') as string) || FONT_OPTIONS[0].value;
    
    const cardBg = (formData.get('productsCardBg') as string) || '#ffffff';
    const cardText = (formData.get('productsCardText') as string) || '#18181b';
    const cardFont = (formData.get('productsCardFontFamily') as string) || FONT_OPTIONS[0].value;

    await sql`
      UPDATE site_config SET 
        products_title = ${title}, products_subtitle = ${subtitle}, products_description = ${description},
        products_bg_type = ${bgType}, products_bg_color = ${bgColor}, products_bg_gradient_to = ${bgGradientTo},
        products_text_color = ${textColor}, products_font_family = ${fontFamily},
        products_card_bg = ${cardBg}, products_card_text = ${cardText}, products_card_font_family = ${cardFont}
      WHERE is_singleton = TRUE
    `;
    revalidatePath('/', 'layout');
    redirect('/dashboard/products');
  }

  async function resetThemingAction() {
    "use server";
    await sql`
      UPDATE site_config SET 
        products_bg_type = 'solid', products_bg_color = '#f8fafc', products_bg_gradient_to = '#ffffff',
        products_text_color = '#18181b', products_font_family = ${FONT_OPTIONS[0].value},
        products_card_bg = '#ffffff', products_card_text = '#18181b', products_card_font_family = ${FONT_OPTIONS[0].value}
      WHERE is_singleton = TRUE
    `;
    revalidatePath('/', 'layout');
    redirect('/dashboard/products');
  }

  async function saveProductAction(formData: FormData) {
    "use server";
    const targetId = formData.get('productId') as string;
    const categoryId = formData.get('categoryId') as string;
    const title = formData.get('title') as string;
    const subtitle = formData.get('subtitle') as string;
    const description = formData.get('description') as string; 
    const iconId = formData.get('iconId') as string;
    const srpString = (formData.get('srp') as string) || "0";
    const discountString = (formData.get('discount') as string) || "0";
    
    // WOZ FIX: Parse the sort order explicitly into an Integer
    const sortOrder = parseInt((formData.get('sortOrder') as string) || "0", 10);

    const useCustomTheme = formData.get('useCustomTheme') === 'on';
    const individualCardBg = useCustomTheme ? (formData.get('individualCardBg') as string) : null;
    const individualCardText = useCustomTheme ? (formData.get('individualCardText') as string) : null;
    const individualCardFont = useCustomTheme ? (formData.get('individualCardFont') as string) : null;

    let finalImageUrl = null;
    
    if (targetId) {
      const existing = await sql`SELECT image_url FROM products WHERE id = ${targetId}`;
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
      // WOZ FIX: Injected sort_order into the UPDATE statement
      await sql`
        UPDATE products SET 
          category_id = ${categoryId}, title = ${title}, subtitle = ${subtitle}, description = ${description}, 
          icon_identifier = ${iconId}, srp = ${srpString}, discount_percentage = ${discountString}, image_url = ${finalImageUrl},
          card_bg = ${individualCardBg}, card_text = ${individualCardText}, card_font = ${individualCardFont}, sort_order = ${sortOrder}
        WHERE id = ${targetId}
      `;
    } else {
      // WOZ FIX: Injected sort_order into the INSERT statement
      await sql`
        INSERT INTO products (category_id, title, subtitle, description, icon_identifier, srp, discount_percentage, image_url, card_bg, card_text, card_font, sort_order) 
        VALUES (${categoryId}, ${title}, ${subtitle}, ${description}, ${iconId}, ${srpString}, ${discountString}, ${finalImageUrl}, ${individualCardBg}, ${individualCardText}, ${individualCardFont}, ${sortOrder})
      `;
    }
    
    revalidatePath('/', 'layout');
    redirect('/dashboard/products');
  }

  async function deleteProductAction(formData: FormData) {
    "use server";
    const id = formData.get('deleteId') as string;
    await sql`DELETE FROM products WHERE id = ${id}`;
    revalidatePath('/', 'layout');
    redirect('/dashboard/products');
  }

  return (
    <div className="max-w-5xl pb-24 space-y-12">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Product & Package Catalog</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage headers, inventory, financial logic, and visual presentation.</p>
      </div>

      {!isEditing && (
        <form action={updateHeaderAction} className="space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
          
          <section>
            <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-2 mb-6">Global Catalog Theming</h3>
            
            <div className="mb-6 p-6 bg-zinc-50 rounded-xl border border-zinc-200">
              <h4 className="text-xs font-bold uppercase text-zinc-500 mb-4 tracking-wider border-b border-zinc-200 pb-2">Background & Typography</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2 pb-4 border-b border-zinc-200">
                  <label className="text-xs font-semibold text-zinc-700 block mb-3">Background Mode</label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="productsBgType" value="solid" defaultChecked={currentConfig.products_bg_type !== 'gradient'} className="text-emerald-600 focus:ring-emerald-600" />
                      <span className="text-sm font-medium text-zinc-800">Solid Color</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="productsBgType" value="gradient" defaultChecked={currentConfig.products_bg_type === 'gradient'} className="text-emerald-600 focus:ring-emerald-600" />
                      <span className="text-sm font-medium text-zinc-800">Linear Gradient</span>
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700 block">Primary Background (Start)</label>
                  <ColorPickerInput name="productsBgColor" defaultValue={currentConfig.products_bg_color || '#f8fafc'} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700 block">Gradient End Color</label>
                  <ColorPickerInput name="productsBgGradientTo" defaultValue={currentConfig.products_bg_gradient_to || '#ffffff'} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700 block">Section Text Color</label>
                  <ColorPickerInput name="productsTextColor" defaultValue={currentConfig.products_text_color || '#18181b'} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700">Typography Style</label>
                  <select name="productsFontFamily" defaultValue={currentConfig.products_font_family || FONT_OPTIONS[0].value} className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900">
                    {FONT_OPTIONS.map(font => (<option key={font.label} value={font.value}>{font.label}</option>))}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 bg-zinc-50 rounded-xl border border-zinc-200">
               <h4 className="text-xs font-bold uppercase text-zinc-500 mb-4 tracking-wider border-b border-zinc-200 pb-2">Global Default Card Styling</h4>
               <p className="text-[10px] text-zinc-500 mb-4">This applies to all products unless explicitly overridden.</p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700 block">Card Background Color</label>
                  <ColorPickerInput name="productsCardBg" defaultValue={currentConfig.products_card_bg || '#ffffff'} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700 block">Card Text Color</label>
                  <ColorPickerInput name="productsCardText" defaultValue={currentConfig.products_card_text || '#18181b'} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold text-zinc-700">Card Typography Style</label>
                  <select name="productsCardFontFamily" defaultValue={currentConfig.products_card_font_family || FONT_OPTIONS[0].value} className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900">
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
                <input type="text" name="title" defaultValue={currentConfig.products_title} placeholder="e.g., Digital Storefront" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700">Primary Headline</label>
                <input type="text" name="subtitle" defaultValue={currentConfig.products_subtitle} placeholder="e.g., Products & Packages" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-zinc-700">Section Description</label>
                <textarea name="description" defaultValue={currentConfig.products_description} rows={2} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900 resize-none" />
              </div>
            </div>
          </section>

          <div className="pt-8 mt-8 border-t border-zinc-200 flex flex-col-reverse sm:flex-row justify-between items-center gap-6">
            <button type="submit" formAction={resetThemingAction} formNoValidate className="text-zinc-500 hover:text-rose-600 font-medium text-sm transition-colors flex items-center gap-2 px-4 py-2 rounded-md hover:bg-rose-50 w-full sm:w-auto justify-center">
              <Icons.RotateCcw size={16} /> Revert Global Theming
            </button>
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-8 rounded-md transition-colors text-sm shadow-sm w-full sm:w-auto">
              Save Global Configuration
            </button>
          </div>
        </form>
      )}

      {/* Unified Add / Edit Product Form */}
      <section id="product-editor" className={`bg-white p-8 rounded-2xl shadow-sm border ${isEditing ? 'border-emerald-500 ring-4 ring-emerald-50' : 'border-zinc-200'}`}>
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2 mb-6">
          <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest">
            {isEditing ? '✏️ Edit Existing Item' : 'Add New Item'}
          </h3>
          {isEditing && (
            <Link href="/dashboard/products" className="text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors uppercase tracking-wider">
              Cancel Edit
            </Link>
          )}
        </div>

        <form action={saveProductAction} className="space-y-6">
          {isEditing && <input type="hidden" name="productId" value={productToEdit.id} />}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700">Classification</label>
              <select name="categoryId" required defaultValue={productToEdit?.category_id || (categories[0]?.id)} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-emerald-600">
                {categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700">Icon Marker</label>
              <select name="iconId" required defaultValue={productToEdit?.icon_identifier || 'Box'} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-emerald-600">
                {AVAILABLE_ICONS.map(icon => (<option key={icon.id} value={icon.id}>{icon.name}</option>))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700">Item Title</label>
              <input type="text" name="title" required defaultValue={productToEdit?.title} placeholder="e.g., Advanced SEO Package" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-emerald-600" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700">Subtitle (Short Pitch)</label>
              <input type="text" name="subtitle" defaultValue={productToEdit?.subtitle} placeholder="e.g., Best for scaling businesses" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-emerald-600" />
            </div>

            {/* WOZ FIX: Injected the Sort Order Input */}
            <div className="space-y-2 md:col-span-2 bg-zinc-50 p-4 rounded-lg border border-zinc-200">
              <label className="text-xs font-semibold text-zinc-700">Sort Order (Hierarchy)</label>
              <div className="flex items-center gap-4">
                <input type="number" name="sortOrder" defaultValue={productToEdit?.sort_order || 0} className="w-32 px-4 py-2 bg-white border border-zinc-300 rounded-md text-sm focus:ring-2 focus:ring-emerald-600" />
                <p className="text-[10px] text-zinc-500">Items are grouped by Classification first. Within a classification, items with <strong>lower numbers</strong> appear first (e.g., 0, 1, 2).</p>
              </div>
            </div>

            {/* FINANCIAL ZONE */}
            <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-6 p-6 bg-zinc-900 rounded-xl border border-zinc-800 text-white shadow-inner">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300">Suggested Retail Price (SRP)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-zinc-500">₱</span>
                  <input type="number" name="srp" required step="0.01" min="0" defaultValue={productToEdit?.srp || "0.00"} className="w-full pl-8 pr-4 py-2 bg-zinc-950 border border-zinc-700 rounded-md text-sm text-white focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300">Discount Percentage</label>
                <div className="relative">
                  <input type="number" name="discount" required step="0.1" min="0" max="100" defaultValue={productToEdit?.discount_percentage || "0"} className="w-full pl-4 pr-8 py-2 bg-zinc-950 border border-zinc-700 rounded-md text-sm text-white focus:ring-2 focus:ring-rose-500" />
                  <span className="absolute right-3 top-2 text-zinc-500">%</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-zinc-700">Full Description (Formatted)</label>
              <RichTextEditor name="description" defaultValue={productToEdit?.description} placeholder="Use the tools above to format your product description..." />
            </div>

            <div className="space-y-2 p-4 bg-zinc-50 rounded-lg border border-zinc-200 md:col-span-2">
              <label className="text-xs font-semibold text-zinc-700 block mb-2">
                Product Media {productToEdit?.image_url && <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Active Image Saved</span>}
              </label>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <span className="text-[10px] uppercase text-zinc-500 mb-1 block">Upload New File (Max 2MB)</span>
                  <input type="file" name="imageFile" accept="image/*" className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-white" />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] uppercase text-zinc-500 mb-1 block">Or Paste New Image URL</span>
                  <input type="url" name="imageUrl" placeholder="Paste URL..." className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-md text-sm" />
                </div>
              </div>
            </div>

            {/* Granular Theming Override Guard */}
            <div className="group md:col-span-2 p-6 bg-zinc-900 rounded-xl border border-zinc-800 mt-4 shadow-inner">
              <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-4">
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">Custom Card Styling Override</h4>
                  <p className="text-xs text-zinc-400 mt-1">Activate the switch to style this specific product differently.</p>
                </div>
                <label className="flex items-center space-x-2 cursor-pointer bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-md border border-zinc-600 transition-colors">
                  <input type="checkbox" name="useCustomTheme" defaultChecked={hasCustomTheme} className="peer w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500 bg-zinc-900 border-zinc-700 cursor-pointer" />
                  <span className="font-bold text-white text-xs uppercase tracking-wider select-none">Enable Custom Theme</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-30 grayscale pointer-events-none group-has-[:checked]:opacity-100 group-has-[:checked]:grayscale-0 group-has-[:checked]:pointer-events-auto transition-all duration-300">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 block">Custom Background</label>
                  <ColorPickerInput name="individualCardBg" defaultValue={productToEdit?.card_bg || '#18181b'} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 block">Custom Text Color</label>
                  <ColorPickerInput name="individualCardText" defaultValue={productToEdit?.card_text || '#ffffff'} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold text-zinc-400">Custom Typography</label>
                  <select name="individualCardFont" defaultValue={productToEdit?.card_font || FONT_OPTIONS[0].value} className="w-full px-4 py-2 bg-zinc-950 border border-zinc-700 text-white rounded-md text-sm focus:ring-2 focus:ring-emerald-500">
                    {FONT_OPTIONS.map(font => (<option key={font.label} value={font.value}>{font.label}</option>))}
                  </select>
                </div>
              </div>
            </div>

          </div>
          
          <div className="pt-2 flex justify-end gap-4">
            {isEditing && (
              <Link href="/dashboard/products" className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold py-2 px-6 rounded-md transition-colors text-sm">
                Cancel
              </Link>
            )}
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-6 rounded-md transition-colors text-sm shadow-sm">
              {isEditing ? 'Save Updates to Item' : 'Publish to Catalog'}
            </button>
          </div>
        </form>
      </section>

      {/* Existing Products Data Grid */}
      <section>
        <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest border-b border-zinc-200 pb-2 mb-6">
          Active Inventory ({products.length})
        </h3>
        <div className="overflow-x-auto bg-white rounded-xl border border-zinc-200 shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase font-semibold text-zinc-500">
              <tr>
                {/* WOZ FIX: Added the Sort Order column header */}
                <th className="px-6 py-4 w-16">Sort</th>
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">SRP</th>
                <th className="px-6 py-4">Theme</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {products.map((item) => (
                <tr key={item.id} className={`transition-colors ${editId === item.id ? 'bg-emerald-50' : 'hover:bg-zinc-50'}`}>
                  {/* WOZ FIX: Render the sort order badge */}
                  <td className="px-6 py-4 font-mono text-zinc-500">
                    <span className="bg-zinc-100 px-2 py-1 rounded text-xs font-bold border border-zinc-200">{item.sort_order}</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-zinc-900">{item.title}</td>
                  <td className="px-6 py-4 text-zinc-500">
                    <span className="bg-zinc-100 px-2 py-1 rounded-md text-xs border border-zinc-200">{item.category_name}</span>
                  </td>
                  <td className="px-6 py-4 font-mono text-zinc-600">₱{Number(item.srp).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    {item.card_bg ? (
                      <span className="inline-flex items-center gap-1.5 bg-zinc-100 px-2 py-1 rounded-md text-xs font-medium text-zinc-700 border border-zinc-200">
                        <span className="w-2 h-2 rounded-full border border-black/20" style={{ backgroundColor: item.card_bg }}></span>
                        Custom
                      </span>
                    ) : (
                      <span className="text-zinc-400 text-xs">Default</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/dashboard/products?edit=${item.id}#product-editor`} className="text-blue-500 hover:text-blue-700 font-semibold text-xs px-2 py-1 hover:bg-blue-50 rounded transition-colors">
                        Edit
                      </Link>
                      <form action={deleteProductAction}>
                        <input type="hidden" name="deleteId" value={item.id} />
                        <button type="submit" className="text-red-500 hover:text-red-700 font-semibold text-xs px-2 py-1 hover:bg-red-50 rounded transition-colors">Delete</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}