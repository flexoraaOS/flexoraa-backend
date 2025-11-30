'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const BusinessSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftContentRef = useRef<HTMLDivElement>(null);
  const rightImagesRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);
  const image1Ref = useRef<HTMLDivElement>(null);
  const image2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    gsap.set([leftContentRef.current, rightImagesRef.current], {
      opacity: 0,
      y: 100,
    });

    const mainTl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play none none reverse',
      },
    });

    mainTl
      .to(leftContentRef.current, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power2.out',
      })
      .to(
        rightImagesRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power2.out',
        },
        '-=0.5'
      );

    gsap.to(image1Ref.current, {
      y: -50,
      x: 20,
      rotation: 2,
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
      },
    });

    gsap.to(image2Ref.current, {
      y: -30,
      x: -15,
      rotation: -1,
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
      },
    });

    gsap.to(circleRef.current, {
      strokeDasharray: '254 283', // 90%
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
      },
    });

    gsap.to(image1Ref.current, {
      y: '+=10',
      duration: 3,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });

    gsap.to(image2Ref.current, {
      y: '+=8',
      duration: 2.5,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: 1,
    });

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
      mainTl.kill();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full bg-background text-foreground py-16 md:py-24 px-6 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div ref={leftContentRef} className="space-y-8">
            <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-4 py-2 rounded-full text-sm font-medium uppercase tracking-wide inline-block">
              About Business
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
              Smart and effective business solutions.
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-lg">
              We are excited for our work and how it positively impacts
              clients. With over 12 years of experience, we constantly provide
              excellent automation solutions.
            </p>

            {/* Stats Circle */}
            <div className="flex items-center space-x-6 pt-8">
              <div className="relative w-24 h-24">
                <svg
                  className="w-24 h-24 transform -rotate-90"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    className="stroke-muted"
                    strokeWidth="6"
                    fill="none"
                  />
                  <circle
                    ref={circleRef}
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="#f97316"
                    strokeWidth="7"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray="0 500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-foreground">75%</span>
                </div>
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">Increased revenue in</p>
                <p className="text-lg text-muted-foreground">
                  the{' '}
                  <span className="text-orange-500 underline">
                    last 2 years.
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Right Images */}
          <div ref={rightImagesRef} className="relative">
            <div className="grid grid-cols-2 gap-4 h-96 md:h-[500px]">
              {/* Image 1 */}
              <div
                ref={image1Ref}
                className="rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-orange-400 to-orange-600"
              >
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{
                    backgroundImage:
                      "url('https://images.unsplash.com/photo-1537511446984-935f663eb1f4?w=1026')",
                  }}
                />
              </div>

              {/* Image 2 */}
              <div
                ref={image2Ref}
                className="rounded-2xl overflow-hidden shadow-xl mt-8 md:mt-12 bg-gradient-to-br from-gray-700 to-gray-900"
              >
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{
                    backgroundImage:
                      "url('https://images.unsplash.com/photo-1548783300-70b41bc84f56?w=1084')",
                  }}
                />
              </div>
            </div>

            {/* Decorative Blurs */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-orange-200 rounded-full opacity-60 blur-xl" />
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-orange-300 rounded-full opacity-40 blur-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessSection;
