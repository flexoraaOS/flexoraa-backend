// components/StickyFeaturesSection.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * Defines the structure for a single feature item.
 */
export interface FeatureItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  imageSrc: string;
  imageHint?: string;
}

/**
 * Defines the props for the StickyFeaturesSection component.
 */
export interface StickyFeaturesProps {
  title: string;
  subtitle1: string;
  subtitle2: string;
  features: FeatureItem[];
}

/**
 * A reusable section component that displays features with a sticky image
 * that updates as the user scrolls through the corresponding text.
 * This version is fully responsive for all screen sizes.
 */
const StickyFeaturesSection: React.FC<StickyFeaturesProps> = ({ title, subtitle1,subtitle2, features }) => {
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const featureRefs = useRef<(HTMLDivElement | null)[]>([]);

  // This effect is for the desktop's sticky functionality
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = featureRefs.current.indexOf(entry.target as HTMLDivElement);
            if (index !== -1) {
              setActiveFeatureIndex(index);
            }
          }
        });
      },
      // Activates when the feature text is in the vertical center of the viewport
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 }
    );

    const refs = featureRefs.current;
    refs.forEach((ref) => {
      if (ref) observer.observe(ref);
    });
    
    return () => {
      refs.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          
        </div>

        <div className="max-w-7xl mx-auto">
          {/* DESKTOP VIEW: Two-column sticky layout */}
          {/* This layout is hidden on mobile and tablet, and displayed as a grid on medium screens and up. */}
          <div className="hidden lg:grid lg:grid-cols-2 lg:gap-12 xl:gap-16 items-start">
            {/* Left Column: Sticky Image */}
            <div className="lg:sticky top-24 h-auto">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-headline">{title}</h2>
              <p className="mt-3 sm:mt-4 text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed">{subtitle1}</p>
              <p className="mt-3 sm:mt-4 text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed">{subtitle2}</p>
              <br />
              <div className="relative w-full aspect-square bg-muted rounded-xl overflow-hidden">
                {features.map((feature, index) => (
                  <Image
                    key={feature.title + '-desktop'}
                    src={feature.imageSrc}
                    alt={feature.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className={cn(
                      'rounded-xl shadow-2xl transition-opacity duration-300 ease-in-out object-cover',
                      activeFeatureIndex === index ? 'opacity-100' : 'opacity-0'
                    )}
                    data-ai-hint={feature.imageHint}
                    priority={index === 0}
                  />
                ))}
              </div>
            </div>

            {/* Right Column: Scrolling Text */}
            <div className="space-y-48 lg:space-y-56 xl:space-y-64">
              {features.map((feature, index) => (
                <div
                  key={feature.title + '-desktop-text'}
                  ref={(el) => { featureRefs.current[index] = el; }}
                  className={cn(
                    'transition-opacity duration-300',
                    activeFeatureIndex === index ? 'opacity-100' : 'opacity-40'
                  )}
                >
                  <div className="flex gap-3 sm:gap-4 items-start sm:items-center mb-3 sm:mb-4">
                    <div className="bg-red-500/10 transition-colors duration-300 p-2.5 sm:p-3 md:p-[0.8rem] rounded-md flex-shrink-0 text-primary">
                      {feature.icon}
                    </div>
                    <h3 className="font-headline text-xl sm:text-2xl font-bold">{feature.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* TABLET & MOBILE VIEW: Stacked layout */}
          {/* This layout is visible by default and hidden on large screens. */}
          <div className="lg:hidden">
            {/* Title and subtitles for mobile/tablet */}
            <div className="mb-8 sm:mb-10 md:mb-12">
              <h2 className="text-xl sm:text-3xl md:text-4xl font-bold font-headline text-center">{title}</h2>
              <p className="mt-3 sm:mt-4 text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed text-center">{subtitle1}</p>
              <p className="mt-3 sm:mt-4 text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed text-center">{subtitle2}</p>
            </div>
            
            {features.map((feature, index) => (
              <div key={feature.title + '-mobile'} className="mb-10 sm:mb-12 md:mb-16 last:mb-0">
                {/* Image for this feature */}
                <div className="relative w-full aspect-video sm:aspect-square mb-4 sm:mb-6 rounded-xl overflow-hidden">
                  <Image
                    src={feature.imageSrc}
                    alt={feature.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 50vw"
                    className="rounded-xl shadow-lg object-cover"
                    data-ai-hint={feature.imageHint}
                    priority={index === 0}
                  />
                </div>
                {/* Text for this feature */}
                <div>
                  <div className="flex gap-3 sm:gap-4 items-start sm:items-center mb-2 sm:mb-3">
                    <div className="p-2 sm:p-2.5 md:p-3 rounded-md bg-red-500/10 flex-shrink-0 text-primary">
                      {feature.icon}
                    </div>
                    <h3 className="font-headline text-lg sm:text-xl md:text-2xl font-bold">{feature.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StickyFeaturesSection;
