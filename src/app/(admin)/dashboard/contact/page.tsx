import { sql } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import * as Icons from 'lucide-react';
import ColorPickerInput from '@/components/ui/ColorPickerInput';

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const FONT_OPTIONS = [
  { label: 'Modern Sans (Default)', value: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
  { label: 'Geometric Sans (Clean & Sharp)', value: 'Futura, "Trebuchet MS", Arial, sans-serif' },
  { label: 'Humanist Sans (Warm & Readable)', value: 'Optima, Candara, Calibri, Arial, sans-serif' },
  { label: 'Elegant Serif (Luxury/Classic)', value: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' },
  { label: 'Technical Mono (Code/Developer)', value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }
];

export default async function DashboardContact() {
  
  const configResult = await sql`SELECT * FROM site_config WHERE is_singleton = TRUE LIMIT 1`;
  const db = configResult[0] || {};
  const hours = db.business_hours || {};

  // ACTION 1: Standard Deployment
  async function updateContactAction(formData: FormData) {
    "use server";
    
    const businessName = formData.get('businessName') as string;
    const phone = formData.get('phone') as string;
    const altPhone = formData.get('altPhone') as string;
    const email = formData.get('email') as string;
    const address = formData.get('address') as string;

    // Extract Theming Payloads
    const contactBgColor = (formData.get('contactBgColor') as string) || '#ffffff';
    const contactTextColor = (formData.get('contactTextColor') as string) || '#18181b';
    const contactFontFamily = (formData.get('contactFontFamily') as string) || FONT_OPTIONS[0].value;
    const contactHoursBg = (formData.get('contactHoursBg') as string) || '#fafafa';
    const contactHoursText = (formData.get('contactHoursText') as string) || '#18181b';
    const contactHoursFontFamily = (formData.get('contactHoursFontFamily') as string) || FONT_OPTIONS[0].value;

    const businessHoursPayload: Record<string, any> = {};
    DAYS_OF_WEEK.forEach(day => {
      businessHoursPayload[day] = {
        active: formData.get(`${day}_active`) === 'on',
        open: formData.get(`${day}_open`) as string || "09:00",
        close: formData.get(`${day}_close`) as string || "17:00"
      };
    });

    await sql`
      UPDATE site_config SET 
        contact_business_name = ${businessName},
        contact_number = ${phone},
        contact_alternate = ${altPhone},
        contact_email = ${email},
        contact_address = ${address},
        business_hours = ${businessHoursPayload}::jsonb,
        contact_bg_color = ${contactBgColor},
        contact_text_color = ${contactTextColor},
        contact_font_family = ${contactFontFamily},
        contact_hours_bg = ${contactHoursBg},
        contact_hours_text = ${contactHoursText},
        contact_hours_font_family = ${contactHoursFontFamily}
      WHERE is_singleton = TRUE
    `;

    revalidatePath('/', 'layout');
    redirect('/dashboard/contact');
  }

  // WOZ LOGIC: ACTION 2 - The Factory Reset (Targeting only Contact Theming)
  async function resetThemingAction() {
    "use server";
    await sql`
      UPDATE site_config SET 
        contact_bg_color = '#ffffff',
        contact_text_color = '#18181b',
        contact_font_family = ${FONT_OPTIONS[0].value},
        contact_hours_bg = '#fafafa',
        contact_hours_text = '#18181b',
        contact_hours_font_family = ${FONT_OPTIONS[0].value}
      WHERE is_singleton = TRUE
    `;
    revalidatePath('/', 'layout');
    redirect('/dashboard/contact');
  }

  return (
    <div className="max-w-4xl pb-24 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Contact & Location</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage communication channels, operating hours, and visual presentation.</p>
      </div>

      <form action={updateContactAction} className="space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
        
        {/* WOZ UX: Contact Theming Section */}
        <section>
          <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-2 mb-6">
            Contact Section Theming
          </h3>
          
          <div className="mb-6 p-6 bg-zinc-50 rounded-xl border border-zinc-200">
            <h4 className="text-xs font-bold uppercase text-zinc-500 mb-4 tracking-wider border-b border-zinc-200 pb-2">Main Section Background</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700 block">Background Color</label>
                <ColorPickerInput name="contactBgColor" defaultValue={db.contact_bg_color || '#ffffff'} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700 block">Primary Text Color</label>
                <ColorPickerInput name="contactTextColor" defaultValue={db.contact_text_color || '#18181b'} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-zinc-700">Typography Style</label>
                <select name="contactFontFamily" defaultValue={db.contact_font_family || FONT_OPTIONS[0].value} className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900">
                  {FONT_OPTIONS.map(font => (<option key={font.label} value={font.value}>{font.label}</option>))}
                </select>
              </div>
            </div>
          </div>

          <div className="p-6 bg-zinc-50 rounded-xl border border-zinc-200">
            <h4 className="text-xs font-bold uppercase text-zinc-500 mb-4 tracking-wider border-b border-zinc-200 pb-2">Operating Hours Card</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700 block">Card Background Color</label>
                <ColorPickerInput name="contactHoursBg" defaultValue={db.contact_hours_bg || '#fafafa'} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700 block">Card Text Color</label>
                <ColorPickerInput name="contactHoursText" defaultValue={db.contact_hours_text || '#18181b'} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-zinc-700">Card Typography Style</label>
                <select name="contactHoursFontFamily" defaultValue={db.contact_hours_font_family || FONT_OPTIONS[0].value} className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900">
                  {FONT_OPTIONS.map(font => (<option key={font.label} value={font.value}>{font.label}</option>))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Core Contact Details */}
        <section>
          <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-2 mb-6">
            Communication Channels
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-zinc-700">Official Business Name</label>
              <input type="text" name="businessName" defaultValue={db.contact_business_name} required className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700">Primary Contact Number</label>
              <input type="text" name="phone" defaultValue={db.contact_number} placeholder="+63 900 000 0000" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700">Alternate Contact (Optional)</label>
              <input type="text" name="altPhone" defaultValue={db.contact_alternate} placeholder="Landline or secondary mobile" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-zinc-700">Support / Inquiry Email</label>
              <input type="email" name="email" defaultValue={db.contact_email} placeholder="hello@company.com" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-zinc-700 block">Complete Business Address</label>
              <span className="text-[10px] text-zinc-500 mb-2 block">If provided, an interactive map will automatically render on the storefront.</span>
              <textarea name="address" defaultValue={db.contact_address} rows={2} placeholder="e.g., Legazpi City, Albay, Philippines" className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-md text-sm focus:ring-2 focus:ring-zinc-900 resize-none" />
            </div>
          </div>
        </section>

        {/* Operating Hours Scheduler */}
        <section>
          <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-2 mb-6">
            Operating Schedule
          </h3>
          <div className="space-y-4">
            {DAYS_OF_WEEK.map((day) => {
              const dayData = hours[day] || { active: false, open: "09:00", close: "17:00" };
              return (
                <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <div className="w-32 flex items-center space-x-3">
                    <input type="checkbox" name={`${day}_active`} defaultChecked={dayData.active} className="w-4 h-4 text-emerald-600 rounded border-zinc-300 focus:ring-emerald-600" />
                    <span className="font-semibold text-zinc-900 capitalize text-sm">{day}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <input type="time" name={`${day}_open`} defaultValue={dayData.open} className="px-3 py-1.5 bg-white border border-zinc-200 rounded-md text-sm text-zinc-700 w-full sm:w-auto focus:ring-2 focus:ring-emerald-600" />
                    <span className="text-zinc-400 text-xs font-bold uppercase">TO</span>
                    <input type="time" name={`${day}_close`} defaultValue={dayData.close} className="px-3 py-1.5 bg-white border border-zinc-200 rounded-md text-sm text-zinc-700 w-full sm:w-auto focus:ring-2 focus:ring-emerald-600" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* WOZ FIX: Multi-Action Footer Engine */}
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
            Deploy Contact Details
          </button>
        </div>
      </form>
    </div>
  );
}