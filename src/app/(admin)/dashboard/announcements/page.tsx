import { sql } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import RichTextEditor from '@/components/ui/RichTextEditor';
import ColorPickerInput from '@/components/ui/ColorPickerInput';

export default async function DashboardAnnouncements(props: { searchParams: Promise<{ edit?: string }> }) {
  const searchParams = await props.searchParams;
  const editId = searchParams.edit;

  const [configResult, announcements] = await Promise.all([
    sql`SELECT * FROM site_config WHERE is_singleton = TRUE LIMIT 1`,
    sql`SELECT * FROM announcements ORDER BY created_at DESC`
  ]);

  const currentConfig = configResult[0] || {};
  const itemToEdit = editId ? announcements.find(a => a.id === editId) : null;
  const isEditing = !!itemToEdit;

  // ACTION 1: Global Settings (Visibility & Theming)
  async function updateHeaderAction(formData: FormData) {
    "use server";
    const showAnnouncements = formData.get('showAnnouncements') === 'on';
    const title = (formData.get('title') as string) || '';
    const subtitle = (formData.get('subtitle') as string) || '';
    const bgType = (formData.get('bgType') as string) || 'solid';
    const bgColor = (formData.get('bgColor') as string) || '#f8fafc';

    await sql`
      UPDATE site_config SET 
        show_announcements = ${showAnnouncements},
        announcements_title = ${title},
        announcements_subtitle = ${subtitle},
        announcements_bg_type = ${bgType},
        announcements_bg_color = ${bgColor}
      WHERE is_singleton = TRUE
    `;
    revalidatePath('/', 'layout');
    redirect('/dashboard/announcements');
  }

  // ACTION 2: Save Individual Announcement
  async function saveAnnouncementAction(formData: FormData) {
    "use server";
    const targetId = formData.get('targetId') as string;
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const isActive = formData.get('isActive') === 'on';

    let finalImageUrl = null;
    if (targetId) {
      const existing = await sql`SELECT image_url FROM announcements WHERE id = ${targetId}`;
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
        UPDATE announcements SET 
          title = ${title}, content = ${content}, image_url = ${finalImageUrl}, is_active = ${isActive}
        WHERE id = ${targetId}
      `;
    } else {
      await sql`
        INSERT INTO announcements (title, content, image_url, is_active) 
        VALUES (${title}, ${content}, ${finalImageUrl}, ${isActive})
      `;
    }
    revalidatePath('/', 'layout');
    redirect('/dashboard/announcements');
  }

  // ACTION 3: Delete Announcement
  async function deleteAnnouncementAction(formData: FormData) {
    "use server";
    const id = formData.get('deleteId') as string;
    await sql`DELETE FROM announcements WHERE id = ${id}`;
    revalidatePath('/', 'layout');
    redirect('/dashboard/announcements');
  }

  return (
    <div className="max-w-5xl pb-24 space-y-12">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">News & Announcements</h1>
        <p className="text-zinc-500 text-sm mt-1">Broadcast company updates, press releases, and alerts to your audience.</p>
      </div>

      {/* Global Configuration */}
      {!isEditing && (
        <form action={updateHeaderAction} className="space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
          <section>
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2 mb-6">
              <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest">Section Settings</h3>
              <label className="flex items-center space-x-2 cursor-pointer bg-zinc-50 hover:bg-zinc-100 px-3 py-1.5 rounded-md border border-zinc-200 transition-colors">
                <input type="checkbox" name="showAnnouncements" defaultChecked={currentConfig.show_announcements} className="peer w-4 h-4 text-emerald-600 rounded focus:ring-emerald-600 border-zinc-300" />
                <span className="font-bold text-zinc-700 text-xs uppercase tracking-wider select-none">Show on Website</span>
              </label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700">Section Title</label>
                <input type="text" name="title" defaultValue={currentConfig.announcements_title} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700">Section Subtitle</label>
                <input type="text" name="subtitle" defaultValue={currentConfig.announcements_subtitle} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700 block">Background Color</label>
                <ColorPickerInput name="bgColor" defaultValue={currentConfig.announcements_bg_color || '#f8fafc'} />
              </div>
            </div>
          </section>
          <div className="pt-6 border-t border-zinc-200 flex justify-end">
            <button type="submit" className="bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-2 px-8 rounded-md transition-colors text-sm shadow-sm">Save Global Settings</button>
          </div>
        </form>
      )}

      {/* Editor Form */}
      <section id="announcement-editor" className={`bg-white p-8 rounded-2xl shadow-sm border ${isEditing ? 'border-emerald-500 ring-4 ring-emerald-50' : 'border-zinc-200'}`}>
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2 mb-6">
          <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest">
            {isEditing ? '✏️ Edit Announcement' : 'Post New Announcement'}
          </h3>
          {isEditing && (
            <Link href="/dashboard/announcements" className="text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors uppercase tracking-wider">Cancel Edit</Link>
          )}
        </div>

        <form action={saveAnnouncementAction} className="space-y-6">
          {isEditing && <input type="hidden" name="targetId" value={itemToEdit.id} />}
          
          <div className="grid grid-cols-1 gap-6">
            <div className="flex items-center justify-between bg-zinc-50 p-4 rounded-xl border border-zinc-200">
              <div>
                <h4 className="text-sm font-bold text-zinc-900 tracking-wide">Publish Status</h4>
                <p className="text-xs text-zinc-500 mt-1">If disabled, this post is saved as a draft and hidden from the public.</p>
              </div>
              <label className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-1.5 rounded-md border border-zinc-300 shadow-sm transition-colors">
                <input type="checkbox" name="isActive" defaultChecked={isEditing ? itemToEdit.is_active : true} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-600 border-zinc-300" />
                <span className="font-bold text-zinc-700 text-xs uppercase tracking-wider select-none">Active</span>
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700">Headline</label>
              <input type="text" name="title" required defaultValue={itemToEdit?.title} placeholder="e.g., Q3 Platform Updates Released" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-emerald-600" />
            </div>

            <div className="space-y-2 p-4 bg-zinc-50 rounded-lg border border-zinc-200">
              <label className="text-xs font-semibold text-zinc-700 block mb-2">Featured Image {itemToEdit?.image_url && <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Active</span>}</label>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <span className="text-[10px] uppercase text-zinc-500 mb-1 block">Upload File (Max 2MB)</span>
                  <input type="file" name="imageFile" accept="image/*" className="w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-white" />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] uppercase text-zinc-500 mb-1 block">Or Paste URL</span>
                  <input type="url" name="imageUrl" placeholder="Paste URL..." className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-md text-sm" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700">Full Content</label>
              <RichTextEditor name="content" defaultValue={itemToEdit?.content} placeholder="Write your announcement here..." />
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-4">
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-6 rounded-md transition-colors text-sm shadow-sm">
              {isEditing ? 'Save Updates' : 'Publish Announcement'}
            </button>
          </div>
        </form>
      </section>

      {/* Grid */}
      <section>
        <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest border-b border-zinc-200 pb-2 mb-6">Published Feed ({announcements.length})</h3>
        <div className="overflow-hidden bg-white rounded-xl border border-zinc-200 shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase font-semibold text-zinc-500">
              <tr>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Headline</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {announcements.map((item) => (
                <tr key={item.id} className={`transition-colors ${editId === item.id ? 'bg-emerald-50' : 'hover:bg-zinc-50'}`}>
                  <td className="px-6 py-4">
                    {item.is_active 
                      ? <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md text-xs font-bold border border-emerald-200"><Icons.CheckCircle size={14}/> Live</span>
                      : <span className="inline-flex items-center gap-1.5 text-zinc-600 bg-zinc-100 px-2 py-1 rounded-md text-xs font-bold border border-zinc-200"><Icons.EyeOff size={14}/> Draft</span>
                    }
                  </td>
                  <td className="px-6 py-4 font-medium text-zinc-900 truncate max-w-[200px]">{item.title}</td>
                  <td className="px-6 py-4 font-mono text-xs text-zinc-500">{new Date(item.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/dashboard/announcements?edit=${item.id}#announcement-editor`} className="text-blue-500 font-semibold text-xs px-2 py-1 hover:bg-blue-50 rounded">Edit</Link>
                      <form action={deleteAnnouncementAction}>
                        <input type="hidden" name="deleteId" value={item.id} />
                        <button type="submit" className="text-red-500 font-semibold text-xs px-2 py-1 hover:bg-red-50 rounded">Delete</button>
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