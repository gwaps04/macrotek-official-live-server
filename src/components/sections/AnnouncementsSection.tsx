import React from 'react';
// WOZ FIX: Import the new interactive Client Component
import ShareButton from '@/components/ui/ShareButton';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
}

interface AnnouncementsSectionProps {
  announcements: Announcement[];
  sectionTitle?: string;
  sectionSubtitle?: string;
  bgType?: string;
  bgColor?: string;
}

export default function AnnouncementsSection({
  announcements,
  sectionTitle,
  sectionSubtitle,
  bgType = 'solid',
  bgColor = '#f8fafc'
}: AnnouncementsSectionProps) {
  if (!announcements || announcements.length === 0) return null;

  return (
    <section 
      id="news"
      className="py-24 border-t border-zinc-200" 
      style={{ 
        backgroundColor: bgType === 'solid' ? bgColor : 'transparent',
        backgroundImage: bgType === 'gradient' ? `linear-gradient(to bottom right, ${bgColor}, #ffffff)` : 'none'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">
            {sectionTitle || 'Latest Updates'}
          </h2>
          {sectionSubtitle && (
            <p className="mt-4 text-lg text-zinc-600">
              {sectionSubtitle}
            </p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {announcements.map((post) => (
            // WOZ FIX: Added explicit ID for deep-linking from social media
            <article key={post.id} id={`news-${post.id}`} className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              {post.image_url && (
                <div className="w-full h-48 overflow-hidden bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" loading="lazy" />
                </div>
              )}
              
              <div className="p-8 flex flex-col flex-1">
                <time className="text-[11px] font-bold tracking-wider text-emerald-600 uppercase mb-3 block">
                  {new Date(post.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </time>
                <h3 className="text-xl font-bold text-zinc-900 mb-4">{post.title}</h3>
                
                <div 
                  className="prose prose-sm prose-zinc text-zinc-600 line-clamp-4 flex-1 mb-6"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
                
                {/* WOZ FIX: Injected the Social Share action bar */}
                <div className="pt-4 border-t border-zinc-100 mt-auto flex items-center justify-between">
                  <ShareButton id={post.id} title={post.title} text={post.content} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}