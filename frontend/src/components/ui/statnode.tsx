'use client';

import React, { useRef } from 'react';
import { AnimatedStat } from './animated-stat';
import { useInView } from '@/hooks/useInView';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatNodeProps {
  target: number;
  suffix?: string;
  label: string;
  trend?: 'up' | 'down';
}

export function StatNode({ target, suffix = '', label, trend }: StatNodeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { threshold: 0.5 });

  return (
    <div ref={ref} className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="flex items-center gap-1">
        {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
        {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
        <AnimatedStat value={isInView ? target : 0} suffix={suffix} />
      </div>
      <span>{label}</span>
    </div>
  );
}
