"use client";

import { Share2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ShareButtonProps {
  id: string;
  title: string;
  text: string;
}

export default function ShareButton({ id, title, text }: ShareButtonProps) {
  const [url, setUrl] = useState('');
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    // Safely construct the URL on the client-side
    const currentUrl = `${window.location.origin}/#news-${id}`;
    setUrl(currentUrl);
    
    // WOZ FIX: Strict TypeScript runtime type-checking
    if (typeof navigator.share === 'function') {
      setCanNativeShare(true);
    }
  }, [id]);

  const handleShare = async () => {
    // Double-check at execution time to satisfy TS strictly
    if (canNativeShare && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: title,
          text: `Check out this update: ${title}`,
          url: url,
        });
      } catch (error) {
        // User likely closed the share sheet without sharing, fail silently.
        console.log('Share canceled.');
      }
    } else {
      // GRACEFUL FALLBACK: If on an older desktop browser, force open Facebook Sharer
      const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
      window.open(fbShareUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <button 
      onClick={handleShare} 
      className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-emerald-600 transition-colors uppercase tracking-wider py-2"
      aria-label="Share this announcement"
    >
      <Share2 size={16} />
      <span>Share</span>
    </button>
  );
}