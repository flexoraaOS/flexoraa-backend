import { cn } from '@/lib/utils';

export function LogoImage({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-8 w-8", className)}
      viewBox="0 0 160 160"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      // Set the stroke color to red
      stroke="#ef4444" 
    >
      <g strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        {/* Main body of the cube (Left face) */}
        <path d="M 20 40 L 20 120 L 80 150 L 80 70 Z" />

        {/* Top face, shifted up and to the right */}
        <g transform="translate(10, -10)">
          <path d="M 80 10 L 20 40 L 80 70 L 140 40 Z" />
        </g>
        
        {/* Right face, shifted out to the right */}
        <g transform="translate(15, 0)">
          <path d="M 140 40 L 140 120 L 80 150 L 80 70 Z" />
        </g>
      </g>
    </svg>
  );
}