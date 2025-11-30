'use client';

import React, { useEffect, useRef } from 'react';
import { Shield, Clock, Award, Briefcase } from 'lucide-react';

const Features = () => {
  const containerRef = useRef(null);
  const itemsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js';
    script.onload = () => {
      const { gsap } = window as any;

      // Set initial state
      gsap.set(itemsRef.current, {
        opacity: 0,
        y: 50,
        scale: 0.8,
      });

      // Create timeline for staggered animation
      const tl = gsap.timeline();
      tl.to(itemsRef.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        stagger: 0.2,
        ease: 'back.out(1.7)',
      });

      // Hover animations
      itemsRef.current.forEach(item => {
        if (!item) return;
        const icon = item.querySelector('.icon');
        const text = item.querySelector('.text-content');

        item.addEventListener('mouseenter', () => {
          gsap.to(icon, {
            scale: 1.2,
            rotation: 5,
            duration: 0.3,
            ease: 'power2.out',
          });
          gsap.to(text, {
            y: -2,
            duration: 0.3,
            ease: 'power2.out',
          });
        });
        item.addEventListener('mouseleave', () => {
          gsap.to(icon, {
            scale: 1,
            rotation: 0,
            duration: 0.3,
            ease: 'power2.out',
          });
          gsap.to(text, {
            y: 0,
            duration: 0.3,
            ease: 'power2.out',
          });
        });
      });

      // Floating icons
      gsap.to('.icon', {
        y: -3,
        duration: 2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        stagger: 0.3,
      });
    };
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const features = [
    {
      icon: Shield,
      title: 'World-class services',
    },
    {
      icon: Clock,
      title: 'Experience strategy',
    },
    {
      icon: Award,
      title: 'Award winning agency',
    },
    {
      icon: Briefcase,
      title: 'Grow your business',
    },
  ];

  return (
    <div ref={containerRef} className="bg-black text-white w-full mx-auto py-4 px-6 md:py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {features.map((feature, index) => (
          <div
            key={index}
            ref={el => { if (el) itemsRef.current[index] = el; }}
            className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-neutral-800 shadow-sm hover:shadow-lg transition-shadow duration-300 cursor-pointer"
          >
            <div className="icon p-3 rounded-xl bg-orange-100">
              <feature.icon className="w-6 h-6 text-orange-500" strokeWidth={1.5} />
            </div>
            <div className="text-content">
              <h3 className="font-semibold text-white text-lg leading-tight">
                {feature.title}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Features;
