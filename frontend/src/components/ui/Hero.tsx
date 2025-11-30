"use client"
import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ArrowRight } from 'lucide-react';

// A fallback for the ArrowRight icon if lucide-react is not available.
const ArrowRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="ml-3 w-5 h-5"
  >
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);


const Hero: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  // State to track if the component has mounted on the client
  const [isMounted, setIsMounted] = useState(false);

  // This effect runs only on the client, after the initial render.
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // GSAP text animation effect, now dependent on isMounted
  useEffect(() => {
    // We wait for the component to be mounted on the client to avoid hydration mismatch.
    if (!isMounted) {
      return;
    }

    // GSAP context for safe cleanup
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.from('.hero-subtitle', { y: 40, opacity: 0, duration: 0.8, ease: 'power3.out' })
        .from(
          '.hero-title',
          { y: 50, opacity: 0, duration: 0.8, ease: 'power3.out' },
          '-=0.6' // Stagger the animation
        )
        .from(
          '.hero-button',
          { y: 50, opacity: 0, duration: 0.6, ease: 'power3.out' },
          '-=0.5' // Stagger the animation
        );
    }, heroRef);

    // Cleanup function to revert animations
    return () => ctx.revert();
  }, [isMounted]); // The effect will re-run when isMounted changes to true

  return (
    <div className="relative w-full h-screen flex items-center justify-start overflow-hidden bg-black">
      {/* Background Video */}
      {isMounted && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute z-0 w-auto min-w-full min-h-full max-w-none object-cover"
          // Using a placeholder video that will work in previews
          src="./Flexoraa_OS_Promo.mp4"
          onError={(e) => (e.currentTarget.style.display = 'none')} // Hide if video fails
        >
          Your browser does not support the video tag.
        </video>
      )}

      {/* Dark Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Text Content */}
      <div ref={heroRef} className="relative z-10 text-left px-8 sm:px-12 md:px-24">
        <p className="hero-subtitle text-xl md:text-2xl text-orange-400 mb-4 font-semibold">
          Forge Your Digital Empire
        </p>
        <h1 className="hero-title text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 mb-10 max-w-5xl">
          Ignite Your Brand Revolution
        </h1>
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0px 10px 30px rgba(239, 68, 68, 0.4)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => console.log("Button Clicked!")}
          className="hero-button inline-flex items-center px-10 py-5 bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold rounded-full shadow-lg shadow-red-500/30 transition-all duration-300 text-lg"
        >
          DISCOVER YOUR POWER
          {/* Using a fallback icon for robustness */}
          {typeof ArrowRight !== 'undefined' ? <ArrowRight className="ml-3 w-5 h-5" /> : <ArrowRightIcon />}
        </motion.button>
      </div>
    </div>
  );
}

export default Hero;