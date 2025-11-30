
'use client';

import { cn } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import { Skeleton } from './skeleton';

export function LogoImage({ className }: { className?: string }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <Skeleton className={cn("h-8 w-8 rounded-full", className)} />;
  }

  return (
    <svg 
        className={cn("h-8 w-8", className)}
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <defs>
            <linearGradient id="logoGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--primary)" />
                <stop offset="100%" stopColor="var(--primary)" />
            </linearGradient>
        </defs>
        
        <g stroke="url(#logoGradient)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M80 10L150 45V115L80 150L10 115V45L80 10Z" />
            <path d="M10 45L80 80L150 45" />
            <path d="M80 150V80" />
            
            <circle cx="80" cy="80" r="10" fill="var(--primary)" stroke="none" />
        </g>
    </svg>
  );
}
