import { sql } from '@/lib/db';

export interface WebhookPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address?: string;
  date?: string;
  time?: string;
  title?: string;
  notes?: string;
  price?: number | string;
  instructor?: string;
  answers?: Record<string, string | string[]>; // WOZ FIX: Captures dynamic questionnaire answers
}

export async function dispatchWebhook(
  event: 'appointment.created' | 'enrollment.created' | 'test.ping',
  data: WebhookPayload
) {
  try {
    const configResult = await sql`
      SELECT 
        tenant_name,
        contact_business_name,
        n8n_appointment_webhook_url,
        n8n_enrollment_webhook_url,
        n8n_webhook_secret
      FROM site_config 
      WHERE is_singleton = TRUE 
      LIMIT 1
    `;

    const config = configResult[0];
    if (!config) return { success: false, reason: 'Site configuration missing' };

    // Select the appropriate URL based on the event type
    let targetUrl: string | null = null;
    if (event === 'appointment.created') targetUrl = config.n8n_appointment_webhook_url;
    else if (event === 'enrollment.created') targetUrl = config.n8n_enrollment_webhook_url;
    else if (event === 'test.ping') targetUrl = config.n8n_appointment_webhook_url || config.n8n_enrollment_webhook_url;

    if (!targetUrl || targetUrl.trim() === '') {
      return { success: false, reason: 'Webhook URL not configured in Admin' };
    }

    const businessName = config.contact_business_name || config.tenant_name || 'Our Company';

    // WOZ PAYLOAD NORMALIZATION: Formatted for direct n8n Code1 & Telegram consumption
    const payload = {
      event,
      business_name: businessName,
      timestamp: new Date().toISOString(),
      first_name: data.first_name,
      last_name: data.last_name,
      full_name: `${data.first_name} ${data.last_name}`.trim(),
      email: data.email,
      phone: data.phone,
      mobile_no: data.phone, // Guarantees compatibility with: {{ $('Code1').first().json.mobile_no }}
      address: data.address || '',
      date: data.date || '',
      time: data.time || '',
      class_title: data.title || '',
      instructor: data.instructor || '',
      price: data.price !== undefined ? data.price : '',
      notes: data.notes || '',
      prequalification_answers: data.answers || {}, // WOZ FIX: Injected directly into the outbound JSON
    };

    // Non-blocking fetch with a 5-second safety timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Event-Type': event,
    };

    if (config.n8n_webhook_secret) {
      headers['X-Webhook-Secret'] = config.n8n_webhook_secret;
    }

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    return {
      success: response.ok,
      status: response.status,
      reason: response.ok ? 'Dispatched' : `HTTP ${response.statusText}`,
    };
  } catch (error: any) {
    console.error('[n8n Webhook Dispatch Error]:', error.message || error);
    return { success: false, reason: error.message || 'Network error' };
  }
}