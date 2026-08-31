import { sql } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import RichTextEditor from '@/components/ui/RichTextEditor';
import ColorPickerInput from '@/components/ui/ColorPickerInput';

export default async function DashboardFaqs(props: { searchParams: Promise<{ edit?: string }> }) {
  const searchParams = await props.searchParams;
  const editId = searchParams.edit;

  const [configResult, faqs] = await Promise.all([
    sql`SELECT * FROM site_config WHERE is_singleton = TRUE LIMIT 1`,
    sql`SELECT * FROM faqs ORDER BY sort_order ASC, created_at DESC`
  ]);

  const currentConfig = configResult[0] || {};
  const itemToEdit = editId ? faqs.find(f => f.id === editId) : null;
  const isEditing = !!itemToEdit;

  // ACTION 1: Global Settings
  async function updateHeaderAction(formData: FormData) {
    "use server";
    const showFaqs = formData.get('showFaqs') === 'on';
    const title = (formData.get('title') as string) || '';
    const subtitle = (formData.get('subtitle') as string) || '';
    const bgType = (formData.get('bgType') as string) || 'solid';
    const bgColor = (formData.get('bgColor') as string) || '#ffffff';

    await sql`
      UPDATE site_config SET 
        show_faqs = ${showFaqs},
        faqs_title = ${title},
        faqs_subtitle = ${subtitle},
        faqs_bg_type = ${bgType},
        faqs_bg_color = ${bgColor}
      WHERE is_singleton = TRUE
    `;
    revalidatePath('/', 'layout');
    redirect('/dashboard/faqs');
  }

  // ACTION 2: Save Individual FAQ
  async function saveFaqAction(formData: FormData) {
    "use server";
    const targetId = formData.get('targetId') as string;
    const question = formData.get('question') as string;
    const answer = formData.get('answer') as string;
    const sortOrder = parseInt((formData.get('sortOrder') as string) || "0");
    const isActive = formData.get('isActive') === 'on';

    if (targetId) {
      await sql`
        UPDATE faqs SET 
          question = ${question}, answer = ${answer}, sort_order = ${sortOrder}, is_active = ${isActive}
        WHERE id = ${targetId}
      `;
    } else {
      await sql`
        INSERT INTO faqs (question, answer, sort_order, is_active) 
        VALUES (${question}, ${answer}, ${sortOrder}, ${isActive})
      `;
    }
    revalidatePath('/', 'layout');
    redirect('/dashboard/faqs');
  }

  // ACTION 3: Delete FAQ
  async function deleteFaqAction(formData: FormData) {
    "use server";
    const id = formData.get('deleteId') as string;
    await sql`DELETE FROM faqs WHERE id = ${id}`;
    revalidatePath('/', 'layout');
    redirect('/dashboard/faqs');
  }

  return (
    <div className="max-w-5xl pb-24 space-y-12">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Frequently Asked Questions</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage common client inquiries to automate customer support.</p>
      </div>

      {/* Global Configuration */}
      {!isEditing && (
        <form action={updateHeaderAction} className="space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
          <section>
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2 mb-6">
              <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest">Section Settings</h3>
              <label className="flex items-center space-x-2 cursor-pointer bg-zinc-50 hover:bg-zinc-100 px-3 py-1.5 rounded-md border border-zinc-200 transition-colors">
                <input type="checkbox" name="showFaqs" defaultChecked={currentConfig.show_faqs} className="peer w-4 h-4 text-emerald-600 rounded focus:ring-emerald-600 border-zinc-300" />
                <span className="font-bold text-zinc-700 text-xs uppercase tracking-wider select-none">Show on Website</span>
              </label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700">Section Title</label>
                <input type="text" name="title" defaultValue={currentConfig.faqs_title} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700">Section Subtitle</label>
                <input type="text" name="subtitle" defaultValue={currentConfig.faqs_subtitle} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700 block">Background Color</label>
                <ColorPickerInput name="bgColor" defaultValue={currentConfig.faqs_bg_color || '#ffffff'} />
              </div>
            </div>
          </section>
          <div className="pt-6 border-t border-zinc-200 flex justify-end">
            <button type="submit" className="bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-2 px-8 rounded-md transition-colors text-sm shadow-sm">Save Global Settings</button>
          </div>
        </form>
      )}

      {/* Editor Form */}
      <section id="faq-editor" className={`bg-white p-8 rounded-2xl shadow-sm border ${isEditing ? 'border-emerald-500 ring-4 ring-emerald-50' : 'border-zinc-200'}`}>
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2 mb-6">
          <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest">
            {isEditing ? '✏️ Edit Knowledge Base Entry' : 'Add Knowledge Base Entry'}
          </h3>
          {isEditing && (
            <Link href="/dashboard/faqs" className="text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors uppercase tracking-wider">Cancel Edit</Link>
          )}
        </div>

        <form action={saveFaqAction} className="space-y-6">
          {isEditing && <input type="hidden" name="targetId" value={itemToEdit.id} />}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between bg-zinc-50 p-4 rounded-xl border border-zinc-200 md:col-span-2">
              <div>
                <h4 className="text-sm font-bold text-zinc-900 tracking-wide">Publish Status</h4>
              </div>
              <label className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-1.5 rounded-md border border-zinc-300 shadow-sm transition-colors">
                <input type="checkbox" name="isActive" defaultChecked={isEditing ? itemToEdit.is_active : true} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-600 border-zinc-300" />
                <span className="font-bold text-zinc-700 text-xs uppercase tracking-wider select-none">Active</span>
              </label>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-zinc-700">The Question</label>
              <input type="text" name="question" required defaultValue={itemToEdit?.question} placeholder="e.g., How long does integration take?" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-emerald-600" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-zinc-700">The Answer</label>
              <RichTextEditor name="answer" defaultValue={itemToEdit?.answer} placeholder="Provide a detailed answer..." />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700">Sort Order (Hierarchy)</label>
              <input type="number" name="sortOrder" defaultValue={itemToEdit?.sort_order || 0} className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-emerald-600" />
              <p className="text-[10px] text-zinc-500 mt-1">Lower numbers appear first.</p>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-4">
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-6 rounded-md transition-colors text-sm shadow-sm">
              {isEditing ? 'Save Updates' : 'Add to Knowledge Base'}
            </button>
          </div>
        </form>
      </section>

      {/* Grid */}
      <section>
        <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest border-b border-zinc-200 pb-2 mb-6">Database ({faqs.length})</h3>
        <div className="overflow-hidden bg-white rounded-xl border border-zinc-200 shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase font-semibold text-zinc-500">
              <tr>
                <th className="px-6 py-4 w-16">Sort</th>
                <th className="px-6 py-4 w-24">Status</th>
                <th className="px-6 py-4">Question</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {faqs.map((item) => (
                <tr key={item.id} className={`transition-colors ${editId === item.id ? 'bg-emerald-50' : 'hover:bg-zinc-50'}`}>
                  <td className="px-6 py-4 font-mono text-zinc-500">{item.sort_order}</td>
                  <td className="px-6 py-4">
                    {item.is_active 
                      ? <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-emerald-200">Live</span>
                      : <span className="inline-flex items-center gap-1 text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-zinc-200">Draft</span>
                    }
                  </td>
                  <td className="px-6 py-4 font-medium text-zinc-900 truncate max-w-[300px]">{item.question}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/dashboard/faqs?edit=${item.id}#faq-editor`} className="text-blue-500 font-semibold text-xs px-2 py-1 hover:bg-blue-50 rounded">Edit</Link>
                      <form action={deleteFaqAction}>
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