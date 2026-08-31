import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { sql } from '@/lib/db';

// Import the Client Sidebar
import AdminSidebar from '@/components/admin/AdminSidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ====================================================
  // 1. THE AUTHENTICATION GUARD (Absolute Security)
  // ====================================================
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');

  if (!session?.value) {
    redirect('/login');
  }

  // ====================================================
  // 2. DYNAMIC ENGINE FLAGS (Server-Side Query)
  // ====================================================
  const configResult = await sql`
    SELECT enable_appointments, enable_enrollments 
    FROM site_config 
    WHERE is_singleton = TRUE 
    LIMIT 1
  `;
  const config = configResult[0] || {};
  const enableAppointments = config.enable_appointments ?? true;
  const enableEnrollments = config.enable_enrollments ?? false;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-zinc-50">
      
      {/* WOZ FIX: Hydrate the Client Sidebar with Server Flags */}
      <AdminSidebar 
        enableAppointments={enableAppointments} 
        enableEnrollments={enableEnrollments} 
      />

      {/* Main Mutational Canvas */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Desktop Header */}
        <header className="h-16 bg-white border-b border-zinc-200 items-center justify-between px-8 flex-shrink-0 z-10 hidden lg:flex">
          <h2 className="text-zinc-800 font-semibold text-sm">Dashboard Overview</h2>
          <Link href="/" target="_blank" className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
            View Live Site
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 custom-scrollbar">
          {children}
        </div>
        
      </main>

    </div>
  );
}