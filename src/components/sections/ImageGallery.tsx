"use client";

import { useState, CSSProperties } from 'react';

export interface CustomCSS extends CSSProperties {
  [key: `--${string}`]: string | number | undefined;
}

export interface GalleryImage {
  id: string;
  title: string;
  image_url: string;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  sectionTitle?: string;
  sectionSubtitle?: string;
  
  bgType?: string;
  bgColor?: string;
  bgGradientTo?: string;
  textColor?: string;
  fontFamily?: string;
}

export default function ImageGallery({ 
  images,
  sectionTitle = "Our Gallery",
  sectionSubtitle = "Moments & Highlights",
  bgType = 'solid',
  bgColor = '#ffffff',
  bgGradientTo = '#f8fafc',
  textColor = '#18181b',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif'
}: ImageGalleryProps) {
  
  // WOZ LOGIC: Interactive Pagination State (Starts at 8 images = 2 rows of 4)
  const [visibleCount, setVisibleCount] = useState(8);

  if (!images || images.length === 0) return null;

  const visibleImages = images.slice(0, visibleCount);
  const hasMore = images.length > visibleCount;

  const sectionStyles: CustomCSS = {
    fontFamily: fontFamily,
    color: textColor,
    ...(bgType === 'gradient' 
      ? { backgroundImage: `linear-gradient(135deg, ${bgColor}, ${bgGradientTo})` }
      : { backgroundColor: bgColor }),
  };

  return (
    <section id="gallery" className="w-full py-24 relative z-10 transition-colors duration-500" style={sectionStyles}>
      <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-semibold tracking-wide uppercase text-sm mb-3 opacity-80">
            {sectionTitle}
          </h2>
          <h3 className="font-display text-3xl md:text-4xl font-bold">
            {sectionSubtitle}
          </h3>
        </div>

        {/* 4x2 Masonry/Grid Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {visibleImages.map((img) => (
            <div 
              key={img.id} 
              className="group relative w-full aspect-square rounded-2xl overflow-hidden bg-black/5 border border-current/10 shadow-sm"
            >
              {/* Image Layer */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                style={{ backgroundImage: `url(${img.image_url})` }}
              />
              
              {/* Editorial Gradient Overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
              
              {/* Title Layer */}
              <div className="absolute inset-x-0 bottom-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 ease-out">
                <h4 className="text-white font-display font-bold text-lg leading-tight line-clamp-2 shadow-black drop-shadow-md">
                  {img.title}
                </h4>
              </div>
            </div>
          ))}
        </div>

        {/* Interactive "See More" Button */}
        {hasMore && (
          <div className="mt-12 flex justify-center">
            <button 
              onClick={() => setVisibleCount(prev => prev + 8)}
              className="px-8 py-3 rounded-full border-2 border-current/20 font-bold text-sm tracking-wider uppercase hover:bg-current/5 transition-colors"
            >
              Load More Photos
            </button>
          </div>
        )}

      </div>
    </section>
  );
}