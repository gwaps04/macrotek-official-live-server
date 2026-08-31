export const metadata = {
  title: 'CMS Control Panel',
  robots: 'noindex, nofollow', // Prevent search engines from indexing the admin panel
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 font-body text-zinc-900 antialiased">
      {children}
    </div>
  );
}