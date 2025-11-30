
'use client';

import { cn } from '@/lib/utils';
import React, { useEffect, useRef, useState } from 'react';

interface AnimatedStatProps {
  target: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  isTime?: boolean;
}

export function AnimatedStat({ 
  target, 
  duration = 1500, 
  className,
  prefix = '',
  suffix = '',
  isTime = false,
}: AnimatedStatProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref as React.RefObject<Element>);

  useEffect(() => {
    if (isInView) {
      if (isTime) {
        setCount(target);
        return;
      }
      let start = 0;
      const end = target;
      if (start === end) {
        setCount(end);
        return;
      };

      const totalFrames = Math.round(duration / (1000 / 60));
      const increment = (end - start) / totalFrames;
      
      let currentFrame = 0;
      
      const timer = setInterval(() => {
        currentFrame++;
        start += increment;
        
        if (currentFrame >= totalFrames) {
          clearInterval(timer);
          setCount(end);
        } else {
          setCount(parseFloat(start.toFixed(2)));
        }
      }, 1000 / 60);

      return () => clearInterval(timer);
    }
  }, [isInView, target, duration, isTime]);

  const displayValue = isTime ? target : (Number.isInteger(count) ? count.toLocaleString() : parseFloat(count.toFixed(1)).toLocaleString());

  return (
    <span ref={ref} className={cn(className)}>
      {prefix}{isTime ? displayValue : (Number.isInteger(target) ? Math.ceil(count).toLocaleString() : parseFloat(count.toFixed(1)).toLocaleString())}{suffix}
    </span>
  );
}


function useInView(ref: React.RefObject<Element>): boolean {
    const [isIntersecting, setIntersecting] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIntersecting(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.1 }
        );

        const currentRef = ref.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
              observer.unobserve(currentRef);
            }
        };
    }, [ref]);

    return isIntersecting;
}
