// FILE: src/app/(admin)/dashboard/integrations/page.tsx
import { sql } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import * as Icons from 'lucide-react';
import { dispatchWebhook } from '@/lib/webhookDispatcher';

export default async function DashboardIntegrations(props: {
  searchParams: Promise<{ success?: string; test?: string }>;
}) {
  const searchParams = await props.searchParams;
  const successType = searchParams.success;
  const testStatus = searchParams.test;

  // 1. Fetch existing site config for n8n
  const configResult = await sql`
    SELECT 
      n8n_appointment_webhook_url,
      n8n_enrollment_webhook_url,
      n8n_webhook_secret,
      tenant_name,
      contact_business_name
    FROM site_config 
    WHERE is_singleton = TRUE 
    LIMIT 1
  `;
  const config = configResult[0] || {};

  // 2. Auto-initialize and fetch Macrobiz configuration
  await sql`
    CREATE TABLE IF NOT EXISTS platform_integrations (
      id SERIAL PRIMARY KEY,
      provider VARCHAR(50) UNIQUE NOT NULL,
      is_active BOOLEAN DEFAULT false,
      credentials JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  const macrobizResult = await sql`SELECT * FROM platform_integrations WHERE provider = 'macrobiz' LIMIT 1`;
  const macrobizConfig = macrobizResult[0] || { is_active: false, credentials: {} };
  const mbzCreds = macrobizConfig.credentials || {};

  // --- SERVER ACTIONS ---

  async function saveIntegrationsAction(formData: FormData) {
    'use server';
    const apptUrl = (formData.get('apptUrl') as string)?.trim() || null;
    const enrollUrl = (formData.get('enrollUrl') as string)?.trim() || null;
    const secret = (formData.get('secret') as string)?.trim() || null;

    await sql`
      UPDATE site_config SET
        n8n_appointment_webhook_url = ${apptUrl},
        n8n_enrollment_webhook_url = ${enrollUrl},
        n8n_webhook_secret = ${secret}
      WHERE is_singleton = TRUE
    `;

    revalidatePath('/dashboard/integrations');
    redirect('/dashboard/integrations?success=webhooks');
  }

  async function saveMacrobizAction(formData: FormData) {
    'use server';
    const isActive = formData.get('macrobizActive') === 'on';
    const businessId = (formData.get('businessId') as string)?.trim() || '';
    const apiKey = (formData.get('apiKey') as string)?.trim() || '';

    const credentials = JSON.stringify({ businessId, apiKey });

    await sql`
      INSERT INTO platform_integrations (provider, is_active, credentials, updated_at)
      VALUES ('macrobiz', ${isActive}, ${credentials}::jsonb, NOW())
      ON CONFLICT (provider) 
      DO UPDATE SET 
        is_active = EXCLUDED.is_active,
        credentials = EXCLUDED.credentials,
        updated_at = NOW();
    `;

    revalidatePath('/dashboard/integrations');
    redirect('/dashboard/integrations?success=macrobiz');
  }

  async function sendTestAppointmentAction() {
    'use server';
    const res = await dispatchWebhook('appointment.created', {
      first_name: 'Test',
      last_name: 'Prospect',
      email: 'test.client@example.com',
      phone: '+63 912 345 6789',
      address: '123 Enterprise Blvd, Suite 400',
      date: '2026-08-28',
      time: '09:00 AM',
      notes: 'This is an automated test ping triggered from the Admin Command Center.',
    });

    redirect(`/dashboard/integrations?test=${res.success ? 'appt_success' : 'appt_failed'}`);
  }

  async function sendTestEnrollmentAction() {
    'use server';
    const res = await dispatchWebhook('enrollment.created', {
      first_name: 'Test',
      last_name: 'Student',
      email: 'student@example.com',
      phone: '+63 998 765 4321',
      address: '789 Academy Way',
      date: '2026-08-30',
      time: '06:00 PM',
      title: 'Advanced Masterclass Review',
      instructor: 'Lead Instructor',
      price: 1500,
    });

    redirect(`/dashboard/integrations?test=${res.success ? 'enroll_success' : 'enroll_failed'}`);
  }

  const hasApptWebhook = Boolean(config.n8n_appointment_webhook_url);
  const hasEnrollWebhook = Boolean(config.n8n_enrollment_webhook_url);

  return (
    <div className="max-w-5xl pb-24 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Automation & Webhook Integrations</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Connect your storefront engines to n8n and Macrobiz ERP for automated workflows.
        </p>
      </div>

      {successType === 'webhooks' && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
          <Icons.CheckCircle2 size={18} /> Webhook settings saved successfully.
        </div>
      )}

      {successType === 'macrobiz' && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
          <Icons.CheckCircle2 size={18} /> Macrobiz ERP connection settings securely saved.
        </div>
      )}

      {testStatus === 'appt_success' && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
          <Icons.CheckCircle2 size={18} /> Test Appointment Webhook dispatched successfully! Check your n8n execution log.
        </div>
      )}

      {testStatus === 'appt_failed' && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
          <Icons.AlertTriangle size={18} /> Failed to dispatch Appointment Webhook. Please verify the URL is active in n8n.
        </div>
      )}

      {testStatus === 'enroll_success' && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
          <Icons.CheckCircle2 size={18} /> Test Enrollment Webhook dispatched successfully! Check your n8n execution log.
        </div>
      )}

      {testStatus === 'enroll_failed' && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
          <Icons.AlertTriangle size={18} /> Failed to dispatch Enrollment Webhook. Please verify the URL is active in n8n.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: CONFIGURATION FORMS */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* MACROBIZ ERP CONFIGURATION */}
          <form action={saveMacrobizAction} className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="bg-zinc-50 border-b border-zinc-200 p-6 flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
                <Icons.Hexagon size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-base font-bold text-zinc-900">Macrobiz ERP Connection</h2>
                  <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-zinc-200">
                    <input 
                      type="checkbox" 
                      name="macrobizActive" 
                      id="macrobizActive"
                      defaultChecked={macrobizConfig.is_active}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-zinc-300 cursor-pointer"
                    />
                    <label htmlFor="macrobizActive" className="text-xs font-bold text-zinc-700 cursor-pointer">Enable</label>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Automatically sync clients and generate official invoices when a contract is signed. Connects directly to your multi-tenant Macrobiz ledger.
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-700 flex items-center gap-2 mb-2">
                  <Icons.Building2 size={14} className="text-zinc-400" /> Macrobiz Business ID
                </label>
                <input
                  type="text"
                  name="businessId"
                  defaultValue={mbzCreds.businessId || ''}
                  placeholder="e.g. b8f9c1... (UUID from businesses table)"
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-mono text-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-700 flex items-center gap-2 mb-2">
                  <Icons.Key size={14} className="text-zinc-400" /> Secure API Key
                </label>
                <input
                  type="password"
                  name="apiKey"
                  defaultValue={mbzCreds.apiKey || ''}
                  placeholder="mbz_live_..."
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-mono text-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition-colors text-sm flex items-center gap-2 cursor-pointer"
                >
                  <Icons.Save size={16} /> Save Macrobiz Config
                </button>
              </div>
            </div>
          </form>

          {/* N8N WEBHOOK CONFIGURATION */}
          <form action={saveIntegrationsAction} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-zinc-200 space-y-6">
            <div className="border-b border-zinc-100 pb-4">
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Icons.Workflow size={18} className="text-emerald-600" /> Custom Webhooks (n8n)
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Paste your n8n Production Webhook URLs below. Next.js will fire an HTTP POST request whenever an event occurs.
              </p>
            </div>

            {/* Appointment Webhook */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Appointment Engine Webhook URL
                </label>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hasApptWebhook ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-500'}`}>
                  {hasApptWebhook ? 'Connected' : 'Not Set'}
                </span>
              </div>
              <input
                type="url"
                name="apptUrl"
                defaultValue={config.n8n_appointment_webhook_url || ''}
                placeholder="https://n8n.yourdomain.com/webhook/appointments-live"
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-mono text-zinc-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
              <p className="text-[11px] text-zinc-400">Triggered whenever a client confirms an appointment date and time slot.</p>
            </div>

            {/* Enrollment Webhook */}
            <div className="space-y-2 pt-2 border-t border-zinc-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  Class Enrollment Webhook URL
                </label>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hasEnrollWebhook ? 'bg-indigo-100 text-indigo-800' : 'bg-zinc-100 text-zinc-500'}`}>
                  {hasEnrollWebhook ? 'Connected' : 'Not Set'}
                </span>
              </div>
              <input
                type="url"
                name="enrollUrl"
                defaultValue={config.n8n_enrollment_webhook_url || ''}
                placeholder="https://n8n.yourdomain.com/webhook/enrollment-live"
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-mono text-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
              <p className="text-[11px] text-zinc-400">Triggered whenever a student registers for a scheduled class session.</p>
            </div>

            {/* Optional Webhook Secret */}
            <div className="space-y-2 pt-2 border-t border-zinc-100">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-700 flex items-center gap-2">
                <Icons.Key size={14} className="text-zinc-400" />
                Optional Webhook Secret Header (`X-Webhook-Secret`)
              </label>
              <input
                type="text"
                name="secret"
                defaultValue={config.n8n_webhook_secret || ''}
                placeholder="Optional security token"
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-mono text-zinc-800 focus:ring-2 focus:ring-zinc-400"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition-colors text-sm flex items-center gap-2 cursor-pointer"
              >
                <Icons.Save size={16} /> Save Webhooks
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: TESTING & HEALTH CHECKS */}
        <div className="space-y-6">
          <div className="bg-zinc-900 text-white p-6 rounded-2xl shadow-sm border border-zinc-800 space-y-6 sticky top-24">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 border-b border-zinc-800 pb-3 flex items-center gap-2">
              <Icons.Zap size={16} className="text-amber-400" /> Test Ping Triggers
            </h3>
            
            <p className="text-xs text-zinc-400 leading-relaxed">
              Verify your n8n workflow execution, Gmail dispatch, and Telegram alerts with one click without filling out the storefront form.
            </p>

            <div className="space-y-3">
              <form action={sendTestAppointmentAction}>
                <button
                  type="submit"
                  disabled={!hasApptWebhook}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2"><Icons.Send size={14} /> Test Appt Webhook</span>
                  <Icons.ArrowRight size={14} />
                </button>
              </form>

              <form action={sendTestEnrollmentAction}>
                <button
                  type="submit"
                  disabled={!hasEnrollWebhook}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2"><Icons.Send size={14} /> Test Enroll Webhook</span>
                  <Icons.ArrowRight size={14} />
                </button>
              </form>
            </div>

            <div className="pt-4 border-t border-zinc-800">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">Payload Structure</p>
              <pre className="text-[10px] font-mono bg-zinc-950 p-3 rounded-lg text-zinc-300 overflow-x-auto border border-zinc-800">
{`{
  "event": "appointment.created",
  "first_name": "...",
  "last_name": "...",
  "email": "...",
  "date": "YYYY-MM-DD",
  "time": "HH:MM AM/PM"
}`}
              </pre>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}