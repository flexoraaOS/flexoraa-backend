// src/components/WorkflowTimeline.tsx

'use client';

import React, { useRef } from 'react';
import { useInView } from 'framer-motion';
import { cn } from '@/lib/utils';

// Define the type for a single workflow step
type WorkflowStep = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

// Define the props for the main WorkflowTimeline component
type WorkflowTimelineProps = {
  title: string;
  subtitle: string;
  steps: WorkflowStep[];
};

// --- Helper Component: WorkflowNode (Internal to this file) ---
const WorkflowNode = ({ icon, title, description, index }: { icon: React.ReactNode; title: string; description: string; index: number }) => {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, amount: 0.5 });
    const isEven = index % 2 === 0;

    return (
        <div
            ref={ref}
            className={cn(
                "flex items-center w-full md:w-auto",
                // Mobile: Always Icon -> Card (flex-row-reverse because DOM is Card, Icon)
                "flex-row-reverse",
                // Desktop: Alternating
                isEven ? "md:flex-row-reverse" : "md:flex-row",
                "transition-all duration-700 ease-out",
                isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
            )}
        >
            {/* Card Container */}
            <div 
    className="
        w-full md:w-[28rem] p-6 rounded-lg bg-card border border-border
        
        // Key classes for the hover effect
        transition-shadow  
        shadow-[0_0_0_rgba(255,0,0,0.2)]
        hover:shadow-[0_30px_50px_rgba(255,0,0,0.1)]
    "
>
    <h3 className="text-[1.4rem] font-bold font-headline mb-2 text-[#ec4343]">
        {title}
    </h3>
    <p className="text-muted-foreground text-base">{description}</p>
</div>
            {/* Timeline Icon */}
            <div className="relative w-16 h-16 flex-shrink-0 mx-4 md:mx-8">
                {/* Pulsing glow behind */}
                <div className="absolute inset-0 rounded-full bg-[#ec4343] animate-ping filter blur-xxl [animation-duration:2000ms] "></div>
                {/* Icon button itself */}
                <div className="relative w-full h-full bg-background border-2 border-[#ec4343] rounded-full flex items-center justify-center text-[#ec4343] shadow-[0_0_5px_rgba(255,0,0,0.8)] hover:shadow-[0_0_25px_rgba(255,0,0,1)] transition-shadow duration-300">
                    {React.cloneElement(icon as React.ReactElement)}
                </div>
            </div>
        </div>
    );
};


// --- Main Export: WorkflowTimeline Component ---
export const WorkflowTimeline = ({ title, subtitle, steps }: WorkflowTimelineProps) => {
    return (
        <section className="py-16 md:py-24 px-4 overflow-hidden" id="animated-background">
            <div className="container mx-auto flex flex-col items-center">
                <div className="text-center mb-12 md:mb-20">
                    <h2 className="text-xl md:text-4xl lg:text-5xl font-bold font-headline">
                        {title}
                    </h2>
                    <p className="text-lg text-muted-foreground mt-4 max-w-3xl mx-auto">
                        {subtitle}
                    </p>
                </div>

                <div className="relative flex flex-col items-center gap-12">
                    {/* The vertical timeline line for desktop */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-0.5 bg-border hidden md:block" />
                    {/* The vertical timeline line for mobile - Left aligned through icon center */}
                    {/* Icon is w-16 (4rem) + mx-4 (1rem) = starts at 1rem, center at 3rem */}
                    <div className="absolute top-0 left-[3rem] -translate-x-1/2 h-full w-0.5 bg-border md:hidden" />

                    {steps.map((step, index) => (
                        <div key={step.title} className="flex justify-center w-full relative ">
                            <WorkflowNode
                                index={index}
                                icon={step.icon}
                                title={step.title}
                                description={step.description}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};