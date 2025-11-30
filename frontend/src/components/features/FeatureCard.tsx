'use client';

import { Feature } from '@/lib/data';
import { motion, useInView, animate } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import React, { useEffect, useRef } from 'react';

export function FeatureCard({ feature }: { feature: Feature }) {
  const TrendIcon = feature.statTrend === 'up' ? TrendingUp : TrendingDown;
  const trendColor =
    feature.statTrend === 'up' ? 'text-emerald-500 h-4 w-4' : 'text-red-500 h-4 w-4';

  const numberRef = useRef<HTMLParagraphElement>(null);
  const isInView = useInView(numberRef, { once: true });

  useEffect(() => {
    if (isInView && numberRef.current) {
      const controls = animate(0, feature.statPercentage, {
        duration: 2,
        ease: 'easeOut',
        onUpdate(value) {
          if (numberRef.current) {
            numberRef.current.textContent = Math.round(value).toString();
          }
        },
      });
      return () => controls.stop();
    }
  }, [isInView, feature.statPercentage]);

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.04 }}
      transition={{ duration: 0.3, ease: "easeOut" }} 
      className="
        group
        relative
        flex
        h-full
        flex-col
        justify-between
        rounded-xl
        border
        border-border
        bg-card
        p-5
        shadow-md
        overflow-hidden
        hover:border-red-500
      "
    >
      {/* blood-red overlay on hover */}
      <div
        className="
          pointer-events-none
          absolute inset-0
          opacity-0
          group-hover:opacity-20
          transition-opacity
          duration-300
          ease-in-out
        "
      />

      {/* Hover Circle */}
      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          h-44 w-44
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-red-900/50
          opacity-0
          blur-3xl
          transition-opacity
          duration-500
          ease-in-out
          group-hover:opacity-100
        "
      />

      <div className="relative z-10">
        <feature.icon className="h-10 w-10 text-red-600" />
        <h3 className="mt-3 text-lg font-bold text-foreground">
          {feature.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {feature.description}
        </p>
      </div>

      <div className="relative z-10 mt-6">
        <div className="flex items-center gap-2 font-numeric">
          <p
            ref={numberRef}
            className="text-5xl font-bold text-foreground"
          >
            0
          </p>
          <p className="text-4xl font-semibold tracking-tighter text-foreground">%</p>
          <TrendIcon className={`mb-0.5 ${trendColor}`} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {feature.statDescription}
        </p>
      </div>
    </motion.div>
  );
}