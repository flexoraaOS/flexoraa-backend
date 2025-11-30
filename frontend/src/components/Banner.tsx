import React from 'react';
import { Button } from './ui/button';

// A reusable arrow icon component
const ArrowRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

// Define the types for the props the Banner component will accept
interface BannerProps {
  title: React.ReactNode;
  subtitle: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
  className?: string; // ✨ Accept an optional className string
}

const Banner: React.FC<BannerProps> = ({
  title,
  subtitle,
  primaryButtonText,
  secondaryButtonText,
  onPrimaryClick,
  onSecondaryClick,
  className = '', // ✨ Destructure className, with a default empty string
}) => {
  return (
    // ✨ Merge the component's base classes with any passed-in classes
    <div
      className={`relative mx-auto overflow-hidden rounded-lg bg-gradient-to-r animated-background ${className}`}
    >
      <div
        className="absolute inset-0 bg-no-repeat bg-center "
        id="animated-background"
      ></div>
      <div className="relative z-10 text-center text-foreground py-12 sm:py-16 md:py-24 lg:py-32 px-6 sm:px-6 md:px-8 flex flex-col justify-center items-center h-full">
        <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tighter leading-tight">
          {title}
        </h1>
        <p className="mt-4 sm:mt-5 md:mt-6 text-base sm:text-lg md:text-xl max-w-3xl mx-auto text-muted-foreground px-2">
          {subtitle}
        </p>
        <div className="mt-6 sm:mt-8 md:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto px-4 sm:px-0">
          {primaryButtonText && (
            <Button
              onClick={onPrimaryClick}
              className="flex items-center justify-center gap-2 px-6 sm:px-8 md:px-10 py-2.5 sm:py-3 text-sm sm:text-base w-full sm:w-auto max-w-sm sm:max-w-none"
              variant="red"
            >
              {primaryButtonText} <ArrowRightIcon />
            </Button>
          )}

          {secondaryButtonText && (
            <Button 
              onClick={onSecondaryClick} 
              variant="discover"
              className="w-full sm:w-auto px-6 sm:px-8 md:px-10 py-2.5 sm:py-3 text-sm sm:text-base max-w-sm sm:max-w-none"
            >
              {secondaryButtonText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Banner;