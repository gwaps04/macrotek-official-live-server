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

const AVAILABLE_ICONS = [
  { id: 'Users', name: 'Group (Standard)' },
  { id: 'UserCheck', name: 'Certified (Review)' },
  { id: 'Dumbbell', name: 'Dumbbell (Gym/Fitness)' },
  { id: 'Swords', name: 'Swords (Martial Arts)' },
  { id: 'BookOpen', name: 'Book (Education)' },
  { id: 'Activity', name: 'Activity (High Energy)' },
  { id: 'Star', name: 'Star (Premium Tier)' }
];

export default async function DashboardClasses(props: { searchParams: Promise<{ edit?: string }> }) {
  
  const searchParams = await props.searchParams;
  const editId = searchParams.edit;

  const [configResult, classesResult] = await Promise.all([
    sql`SELECT * FROM site_config WHERE is_singleton = TRUE LIMIT 1`,
    sql`SELECT id, title, description, instructor_name, icon_identifier, image_url, price, max_capacity, sort_order, is_active FROM classes ORDER BY sort_order ASC, created_at DESC`
  ]);

  const config = configResult[0] || {};
  const isEngineActive = config.enable_enrollments ?? false;
  
  const classToEdit = editId ? classesResult.find(c => c.id === editId) : null;
  const isEditing = !!classToEdit;

  async function updateConfigAction(formData: FormData) {
    "use server";
    const title = (formData.get('classesTitle') as string) || 'Class Schedule';
    const subtitle = (formData.get('classesSubtitle') as string) || 'Secure your spot today.';
    
    // WOZ FIX: Extracting the new Custom Form Nomenclature
    const formTitle = (formData.get('enrollmentFormTitle') as string) || 'Attendee Information';
    const formSubtitle = (formData.get('enrollmentFormSubtitle') as string) || 'Fill out the details below to secure your spot.';

    const bgType = (formData.get('classesBgType') as string) || 'solid';
    const bgColor = (formData.get('classesBgColor') as string) || '#f8fafc';
    const bgGradientTo = (formData.get('classesBgGradientTo') as string) || '#ffffff';
    const textColor = (formData.get('classesTextColor') as string) || '#18181b';
    const fontFamily = (formData.get('classesFontFamily') as string) || FONT_OPTIONS[0].value;
    const primaryColor = (formData.get('classesPrimaryColor') as string) || '#4f46e5';
    const cardBg = (formData.get('classesCardBg') as string) || '#ffffff';

    await sql`
      UPDATE site_config SET 
        classes_title = ${title}, classes_subtitle = ${subtitle},
        enrollment_form_title = ${formTitle}, enrollment_form_subtitle = ${formSubtitle},
        classes_bg_type = ${bgType}, classes_bg_color = ${bgColor}, classes_bg_gradient_to = ${bgGradientTo},
        classes_text_color = ${textColor}, classes_font_family = ${fontFamily},
        classes_primary_color = ${primaryColor}, classes_card_bg = ${cardBg}
      WHERE is_singleton = TRUE
    `;
    revalidatePath('/', 'layout');
    revalidatePath('/classes', 'page');
    revalidatePath('/classes/enroll/[scheduleId]', 'page');
    redirect('/dashboard/classes');
  }

  async function resetThemingAction() {
    "use server";
    await sql`
      UPDATE site_config SET 
        classes_bg_type = 'solid', classes_bg_color = '#f8fafc', classes_bg_gradient_to = '#ffffff',
        classes_text_color = '#18181b', classes_font_family = ${FONT_OPTIONS[0].value},
        classes_primary_color = '#4f46e5', classes_card_bg = '#ffffff',
        enrollment_form_title = 'Attendee Information', enrollment_form_subtitle = 'Fill out the details below to secure your spot.'
      WHERE is_singleton = TRUE
    `;
    revalidatePath('/classes', 'page');
    redirect('/dashboard/classes');
  }

  async function saveClassAction(formData: FormData) {
    "use server";
    const targetId = formData.get('classId') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const instructor = formData.get('instructor') as string;
    const iconId = formData.get('iconId') as string;
    const priceString = (formData.get('price') as string) || "0";
    const capacity = parseInt(formData.get('capacity') as string) || 20;
    const sortOrder = parseInt(formData.get('sortOrder') as string) || 0;
    const isActive = formData.get('isActive') === 'on';

    let finalImageUrl = null;
    if (targetId) {
      const existing = await sql`SELECT image_url FROM classes WHERE id = ${targetId}`;
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
        UPDATE classes SET 
          title = ${title}, description = ${description}, instructor_name = ${instructor},
          icon_identifier = ${iconId}, image_url = ${finalImageUrl}, price = ${priceString}, 
          max_capacity = ${capacity}, sort_order = ${sortOrder}, is_active = ${isActive}
        WHERE id = ${targetId}
      `;
    } else {
      await sql`
        INSERT INTO classes (title, description, instructor_name, icon_identifier, image_url, price, max_capacity, sort_order, is_active) 
        VALUES (${title}, ${description}, ${instructor}, ${iconId}, ${finalImageUrl}, ${priceString}, ${capacity}, ${sortOrder}, ${isActive})
      `;
    }
    
    revalidatePath('/classes', 'page');
    redirect('/dashboard/classes');
  }

  async function deleteClassAction(formData: FormData) {
    "use server";
    const id = formData.get('deleteId') as string;
    await sql`DELETE FROM classes WHERE id = ${id}`;
    revalidatePath('/classes', 'page');
    redirect('/dashboard/classes');
  }

  if (!isEngineActive) {
    return (
      <div className="max-w-5xl pb-24 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 bg-zinc-200 rounded-full flex items-center justify-center mb-4 text-zinc-500">
          <Icons.Users size={32} />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Enrollment Engine Disabled</h2>
        <p className="text-zinc-500 max-w-md mb-8">
          The Class & Enrollment Engine is currently turned off in your Platform Operating Mode. 
        </p>
        <Link href="/dashboard" className="px-6 py-3 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 transition-colors">
          Go to Settings to Enable
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl pb-24 space-y-12">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Class & Roster Engine</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage your curriculum, instructors, capacities, and public styling.</p>
      </div>

      {!isEditing && (
        <form action={updateConfigAction} className="space-y-8 p-8 rounded-2xl shadow-sm border bg-white border-zinc-200">
          
          <section>
            <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-2 mb-6">Storefront Content</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700">Primary Headline</label>
                <input type="text" name="classesTitle" defaultValue={config.classes_title} placeholder="e.g., Class Schedule" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-600" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700">Sub-Headline</label>
                <input type="text" name="classesSubtitle" defaultValue={config.classes_subtitle} placeholder="e.g., Secure your spot today." className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-600" />
              </div>
              {/* WOZ FIX: New CMS Fields for Dynamic Nomenclature */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-indigo-600">Checkout Form Title (e.g. Student / Member)</label>
                <input type="text" name="enrollmentFormTitle" defaultValue={config.enrollment_form_title || 'Attendee Information'} placeholder="e.g., Member Details" className="w-full px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-600" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-indigo-600">Checkout Form Description</label>
                <input type="text" name="enrollmentFormSubtitle" defaultValue={config.enrollment_form_subtitle || 'Fill out the details below to secure your spot.'} placeholder="Instructions for the user..." className="w-full px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-600" />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-2 mb-6">Classes Page Theming</h3>
            <div className="p-6 bg-zinc-50 rounded-xl border border-zinc-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2 pb-4 border-b border-zinc-200">
                  <label className="text-xs font-semibold text-zinc-700 block mb-3">Background Mode</label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="classesBgType" value="solid" defaultChecked={config.classes_bg_type !== 'gradient'} className="text-indigo-600 focus:ring-indigo-600" />
                      <span className="text-sm font-medium text-zinc-800">Solid Color</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="classesBgType" value="gradient" defaultChecked={config.classes_bg_type === 'gradient'} className="text-indigo-600 focus:ring-indigo-600" />
                      <span className="text-sm font-medium text-zinc-800">Linear Gradient</span>
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700 block">Primary Background</label>
                  <ColorPickerInput name="classesBgColor" defaultValue={config.classes_bg_color || '#f8fafc'} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700 block">Gradient End</label>
                  <ColorPickerInput name="classesBgGradientTo" defaultValue={config.classes_bg_gradient_to || '#ffffff'} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700 block">Section Text Color</label>
                  <ColorPickerInput name="classesTextColor" defaultValue={config.classes_text_color || '#18181b'} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700">Typography Style</label>
                  <select name="classesFontFamily" defaultValue={config.classes_font_family || FONT_OPTIONS[0].value} className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-600">
                    {FONT_OPTIONS.map(font => (<option key={font.label} value={font.value}>{font.label}</option>))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-indigo-600 block">Primary Accent Color</label>
                  <ColorPickerInput name="classesPrimaryColor" defaultValue={config.classes_primary_color || '#4f46e5'} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700 block">Card Background</label>
                  <ColorPickerInput name="classesCardBg" defaultValue={config.classes_card_bg || '#ffffff'} />
                </div>
              </div>
            </div>
          </section>

          <div className="pt-4 flex justify-between items-center gap-6">
            <button type="submit" formAction={resetThemingAction} formNoValidate className="text-zinc-500 hover:text-rose-600 font-medium text-sm transition-colors flex items-center gap-2 px-4 py-2 rounded-md hover:bg-rose-50">
              <Icons.RotateCcw size={16} /> Revert Theming
            </button>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-md transition-colors text-sm shadow-sm">
              Save Configuration
            </button>
          </div>
        </form>
      )}

      {/* Unified Add / Edit Class Form */}
      <section id="class-editor" className={`bg-white p-8 rounded-2xl shadow-sm border ${isEditing ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-zinc-200'}`}>
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2 mb-6">
          <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest">
            {isEditing ? '✏️ Edit Existing Class' : 'Create New Class / Event'}
          </h3>
          {isEditing && (
            <Link href="/dashboard/classes" className="text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors uppercase tracking-wider">
              Cancel Edit
            </Link>
          )}
        </div>
        
        <form action={saveClassAction} className="space-y-6">
          {isEditing && <input type="hidden" name="classId" value={classToEdit.id} />}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="flex items-center space-x-2 cursor-pointer border border-zinc-200 p-4 rounded-lg bg-zinc-50">
                <input type="checkbox" name="isActive" defaultChecked={isEditing ? classToEdit.is_active : true} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                <span className="font-bold text-zinc-900 text-sm">Class is Active & Visible</span>
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700">Class / Event Title</label>
              <input type="text" name="title" required defaultValue={classToEdit?.title} placeholder="e.g., Advanced BJJ / IELTS Review"
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-600" />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700">Instructor / Facilitator Name</label>
              <input type="text" name="instructor" required defaultValue={classToEdit?.instructor_name} placeholder="e.g., Professor John Doe"
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-600" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-zinc-700">Class Description</label>
              <textarea name="description" required defaultValue={classToEdit?.description} rows={2} placeholder="What will students learn in this class?"
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-600 resize-none" />
            </div>

            <div className="col-span-1 md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-6 p-6 bg-zinc-900 rounded-xl border border-zinc-800 text-white shadow-inner">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300">Enrollment Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-zinc-500">₱</span>
                  <input type="number" name="price" required step="0.01" min="0" defaultValue={classToEdit?.price || "0.00"} 
                    className="w-full pl-8 pr-4 py-2 bg-zinc-950 border border-zinc-700 rounded-md text-sm text-white focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300">Max Capacity</label>
                <div className="relative">
                  <input type="number" name="capacity" required min="1" defaultValue={classToEdit?.max_capacity || 20} 
                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-700 rounded-md text-sm text-white focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="space-y-2 md:col-span-1 col-span-2">
                <label className="text-xs font-semibold text-zinc-300">Display Icon</label>
                <select name="iconId" required defaultValue={classToEdit?.icon_identifier || 'Users'} className="w-full px-4 py-2 bg-zinc-950 border border-zinc-700 text-white rounded-md text-sm focus:ring-2 focus:ring-indigo-500">
                  {AVAILABLE_ICONS.map(icon => (<option key={icon.id} value={icon.id}>{icon.name}</option>))}
                </select>
              </div>
            </div>

            <div className="space-y-2 p-4 bg-zinc-50 rounded-lg border border-zinc-200 md:col-span-2">
              <label className="text-xs font-semibold text-zinc-700 block mb-2">
                Class Cover Image {classToEdit?.image_url && <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Active Image</span>}
              </label>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input type="file" name="imageFile" accept="image/*" className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-white" />
                </div>
                <div className="flex items-center justify-center text-xs text-zinc-400 font-bold uppercase">OR</div>
                <div className="flex-1">
                  <input type="url" name="imageUrl" placeholder="Paste URL..." className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-md text-sm" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-2 flex justify-end gap-4">
            {isEditing && (
              <Link href="/dashboard/classes" className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold py-2 px-6 rounded-md transition-colors text-sm">
                Cancel
              </Link>
            )}
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-md transition-colors text-sm shadow-sm">
              {isEditing ? 'Save Updates' : 'Create Class'}
            </button>
          </div>
        </form>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest border-b border-zinc-200 pb-2 mb-6">
          Active Curriculum ({classesResult.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {classesResult.map((item) => (
            <div key={item.id} className={`bg-white border rounded-xl p-6 shadow-sm flex flex-col relative overflow-hidden transition-colors ${editId === item.id ? 'border-indigo-500 ring-2 ring-indigo-50' : 'border-zinc-200'} ${!item.is_active ? 'opacity-60 grayscale' : ''}`}>
              
              {!item.is_active && <div className="absolute top-2 right-2 bg-zinc-800 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Hidden</div>}

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-zinc-900 text-lg leading-tight mb-1">{item.title}</h4>
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Instructed by: {item.instructor_name}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Link href={`/dashboard/classes?edit=${item.id}#class-editor`} className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-md transition-colors">
                    <Icons.Edit3 size={16} />
                  </Link>
                  <form action={deleteClassAction}>
                    <input type="hidden" name="deleteId" value={item.id} />
                    <button type="submit" className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-md transition-colors">
                      <Icons.Trash2 size={16} />
                    </button>
                  </form>
                </div>
              </div>

              <p className="text-sm text-zinc-600 line-clamp-2 mb-4">{item.description}</p>
              
              <div className="flex items-center gap-4 pt-4 border-t border-zinc-100 mt-auto">
                <div className="font-mono text-zinc-900 font-bold">₱{Number(item.price).toFixed(2)}</div>
                <div className="flex items-center gap-1 text-xs text-zinc-500 font-medium"><Icons.Users size={14} /> Max {item.max_capacity}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}