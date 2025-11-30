
'use client';

import React from 'react';
import { LogoImage } from './newlogo';

type HubSpokeDiagramProps = {
  items: { icon: React.ReactNode, name: string }[];
};

export const HubSpokeDiagram = ({ items }: HubSpokeDiagramProps) => {
    const numItems = items.length;
    const radius = 150; 
    const iconContainerSize = 56;
    const diagramSize = radius * 2 + iconContainerSize;
    const center = diagramSize / 2;

    return (
        <div className="relative w-full h-full flex items-center justify-center" style={{ minHeight: `${diagramSize}px`, minWidth: `${diagramSize}px`}}>
            <svg 
                className="absolute inset-0 w-full h-full" 
                viewBox={`0 0 ${diagramSize} ${diagramSize}`}
            >
                {/* Lines */}
                {items.map((_, index) => {
                    const angle = (index / numItems) * 2 * Math.PI - (Math.PI / 2);
                    const endX = center + radius * Math.cos(angle);
                    const endY = center + radius * Math.sin(angle);
                    
                    return (
                        <g key={`line-group-${index}`}>
                           <path
                                d={`M ${center} ${center} L ${endX} ${endY}`}
                                stroke="var(--primary) / 0.15"
                                strokeWidth="1"
                            />
                           <path
                                d={`M ${center} ${center} L ${endX} ${endY}`}
                                className="lightning-line"
                                style={{ animationDelay: `${index * 0.2}s` }}
                            />
                        </g>
                    );
                })}

                {items.map((item, index) => {
                     const angle = (index / numItems) * 2 * Math.PI - (Math.PI / 2);
                     const x = center + radius * Math.cos(angle) - (iconContainerSize / 2);
                     const y = center + radius * Math.sin(angle) - (iconContainerSize / 2);

                    return (
                       <foreignObject 
                            key={item.name} 
                            x={x} 
                            y={y} 
                            width={iconContainerSize} 
                            height={iconContainerSize}
                            style={{
                                animation: `fade-in 0.5s ease-out ${index * 0.1}s forwards`,
                                opacity: 0,
                            }}
                       >
                            <div className="w-full h-full flex items-center justify-center">
                               <div className="p-3 bg-card rounded-full shadow-md border hover:scale-110 transition-transform">
                                   {item.icon}
                               </div>
                           </div>
                       </foreignObject>
                    );
                })}
            </svg>

            <LogoImage className="relative h-16 w-16 z-10" />
        </div>
    );
};
