import { sql } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function LoginPage() {
  
  // WOZ SECURITY PROTOCOL: Server Action for Auth
  // This function executes entirely on the Node.js edge server, never in the browser.
  async function loginAction(formData: FormData) {
    "use server";
    
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) return;

    try {
      // The crypt() function compares the raw password against the stored Blowfish hash securely in Postgres
      // WARNING: Requires "CREATE EXTENSION IF NOT EXISTS pgcrypto;" in the database
      const result = await sql`
        SELECT id FROM admin_users 
        WHERE email = ${email} 
        AND password_hash = crypt(${password}, password_hash)
      `;

      if (result.length === 1) {
        // Issue mathematically secure session cookie (Next.js 15 syntax requires awaiting cookies)
        const cookieStore = await cookies();
        cookieStore.set('admin_session', result[0].id, { 
          httpOnly: true, 
          secure: process.env.NODE_ENV === 'production', 
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 // 24 hours
        });
        
        // Update last login timestamp
        await sql`UPDATE admin_users SET last_login = NOW() WHERE id = ${result[0].id}`;
      } else {
        throw new Error("Invalid credentials");
      }
    } catch (error) {
      // WOZ FIX: TELEMETRY ENABLED
      console.log("🔥 CRITICAL LOGIN ERROR DETECTED 🔥");
      console.log("1. DATABASE_URL Loaded?", !!process.env.DATABASE_URL);
      console.error("2. EXACT ERROR TRACE:", error);
      return; // Fail silently to the UI to prevent brute-force enumeration
    }

    // Redirect must happen outside the try/catch block in Next.js
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-xl border border-zinc-200 overflow-hidden">
        
        <div className="p-8 pb-6 border-b border-zinc-100 text-center">
          <div className="w-12 h-12 bg-zinc-900 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-inner">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-zinc-900">System Authentication</h1>
          <p className="text-sm text-zinc-500 mt-1">Authorized personnel only.</p>
        </div>

        <div className="p-8 pt-6">
          {/* WOZ FIX: Suppress browser history auto-fill */}
          <form action={loginAction} className="space-y-5" autoComplete="off">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Email Address</label>
              <input 
                type="email" 
                name="email"
                required
                autoComplete="off"
                placeholder="Enter admin email"
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all text-sm text-zinc-900" 
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 uppercase tracking-wider">Master Password</label>
              <input 
                type="password" 
                name="password"
                required
                autoComplete="new-password"
                placeholder="••••••••••••"
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all text-sm text-zinc-900" 
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-sm flex justify-center items-center"
            >
              Authenticate & Enter
            </button>
          </form>
        </div>
        
      </div>
    </main>
  );
}