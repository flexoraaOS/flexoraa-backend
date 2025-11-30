import React, { useRef, useEffect, useCallback } from 'react';
import {
  Bot,
  Tag,
  CalendarCheck,
  Phone,
  FileText,
  Monitor,
  Edit3,
  ShieldCheck,
} from 'lucide-react';

export interface ProcessStep {
  step: number;
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface ProcessCarouselProps {
  steps: ProcessStep[];
  onEndScroll?: () => void;
  onStartScroll?: () => void;
}

/**
 * A horizontal carousel component that allows scrolling with the mouse wheel.
 * When the user scrolls past the beginning or end, it can trigger page scrolling.
 */
export function ProcessCarousel({ steps, onEndScroll, onStartScroll }: ProcessCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Refs to manage animation state without causing re-renders
  const animationId = useRef<number >();
  const isPageScrolling = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout>();

  const handlePageScroll = (direction: 'up' | 'down') => {
    if (isPageScrolling.current) return;

    isPageScrolling.current = true;
    const scrollAmount = direction === 'down' ? window.innerHeight : -window.innerHeight;

    // Use built-in page scroll functions if available, otherwise scroll the window
    if (direction === 'down' && onEndScroll) {
      onEndScroll?.();
    } else if (direction === 'up' && onStartScroll) {
      onStartScroll?.();
    } else {
      window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
    }

    // Reset the flag after a delay to prevent jittery scrolling
    scrollTimeout.current = setTimeout(() => {
      isPageScrolling.current = false;
    }, 1000); // 1-second cooldown
  };

  const handleWheel = useCallback((event: WheelEvent) => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    event.preventDefault(); // Prevent default vertical page scroll

    const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;
    const isAtStart = carousel.scrollLeft < 5; // Using a small buffer
    const isAtEnd = carousel.scrollLeft > maxScrollLeft - 5;
    const isScrollingDown = event.deltaY > 0;
    const isScrollingUp = event.deltaY < 0;

    // --- Page Transition Logic ---
    if (isScrollingDown && isAtEnd) {
      handlePageScroll('down');
      return;
    }
    if (isScrollingUp && isAtStart) {
      handlePageScroll('up');
      return;
    }

    // --- Carousel Scrolling Logic ---
    carousel.scrollBy({
      left: event.deltaY * 2, // Adjust multiplier for scroll speed
      behavior: 'auto', // Use 'auto' for immediate scroll to prevent lag
    });
  }, [onEndScroll, onStartScroll]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      if (animationId.current) {
        cancelAnimationFrame(animationId.current);
      }
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [handleWheel]);

  return (
    <div ref={containerRef} className="w-full py-16 bg-black overflow-hidden group/container">
      {/* Optional: Add visual cues for scrolling */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 pl-4 text-white/30 opacity-0 group-data-[scrolled=true]:opacity-100 transition-opacity">
        &lt;
      </div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 pr-4 text-white/30 opacity-100 group-data-[ended=true]:opacity-0 transition-opacity">
        &gt;
      </div>

      <div
        ref={carouselRef}
        className="flex items-center overflow-x-scroll scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onScroll={(e) => {
          // Update data attributes for visual cues
          const target = e.currentTarget;
          const isAtEnd = target.scrollLeft >= target.scrollWidth - target.clientWidth - 5;
          const isScrolled = target.scrollLeft > 5;
          containerRef.current?.setAttribute('data-ended', String(isAtEnd));
          containerRef.current?.setAttribute('data-scrolled', String(isScrolled));
        }}
      >
        <div className="inline-flex space-x-8 px-16 md:px-24 lg:px-32">
          {steps.map(({ step, title, description, icon: Icon }) => (
            <div
              key={step}
              className="
                snap-start flex-shrink-0 w-96 h-64 bg-gradient-to-br from-red-950 via-black to-red-900
                border border-red-800/50 rounded-xl p-8 flex flex-col space-y-4
                transition-all duration-500 ease-out
                hover:border-red-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-red-500/25
                relative overflow-hidden group/card
              "
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 via-transparent to-red-600/10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 rounded-xl border border-red-500 animate-pulse" />
              </div>

              <div className="flex items-start justify-between relative z-10">
                <h4 className="text-red-100 font-bold text-xl w-4/5 group-hover/card:text-white transition-colors duration-300">
                  <span className="text-red-400 group-hover/card:text-red-300 transition-colors duration-300">
                    {String(step).padStart(2, '0')}
                  </span>
                  . {title}
                </h4>
                {Icon && (
                  <div className="relative">
                    <Icon className="w-10 h-10 text-red-400 group-hover/card:text-red-300 transition-all duration-300 group-hover/card:scale-110" />
                    <div className="absolute inset-0 w-10 h-10 opacity-0 group-hover/card:opacity-75 transition-opacity duration-300">
                      <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
                    </div>
                  </div>
                )}
              </div>

              <p className="text-red-200/80 text-base flex-1 pt-2 group-hover/card:text-red-100 transition-colors duration-300">
                {description}
              </p>

              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}