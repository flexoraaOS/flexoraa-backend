'use client'
import { RootState } from '@/lib/store';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useSelector } from 'react-redux';

interface AnimatedCtaProps {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
}

const AnimatedCta = ({ title, subtitle, buttonText, buttonLink }: AnimatedCtaProps) => {
  const router = useRouter();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const handleClick = () => {
    if (isAuthenticated) {
      router.push(buttonLink);
    } else {
      router.push('/auth/login');
    }
  };

  return (
    <div className="group w-full max-w-7xl mx-auto" >
      <div
        className="relative rounded-xl sm:rounded-2xl p-[2px] sm:p-[3px]
                    before:absolute before:-inset-[2px] sm:before:-inset-[3px] before:rounded-[14px] sm:before:rounded-[18px]
                    before:bg-gradient-to-r before:from-red-500 before:to-red-700
                    before:opacity-60 before:transition-opacity before:duration-300
                    group-hover:before:opacity-100
                    group-hover:shadow-[0_0_15px_rgba(255,0,0,0.6)] sm:group-hover:shadow-[0_0_20px_rgba(255,0,0,0.7)]" id="theme-config"
      >
        {/* Spinning neon beam overlay */}
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-30 blur-lg animate-spin-slow"></div>
        </div>

        <div
          className="relative z-10 flex flex-col items-center justify-center
                      rounded-xl sm:rounded-2xl bg-[#EF4444] dark:bg-[#DC2626] px-4 py-8 sm:px-6 sm:py-10 md:px-8 md:py-12 text-center text-white"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">
            {title}
          </h2>

          <p className="mt-2 sm:mt-3 max-w-xl text-sm sm:text-base md:text-lg leading-6 sm:leading-7 md:leading-8 text-white/90 px-2">
            {subtitle}
          </p>

          <button
            onClick={handleClick}
            className="mt-4 sm:mt-5 md:mt-6 inline-block rounded-md bg-gray-900 dark:bg-gray-950 px-6 sm:px-8 md:px-9 py-2 sm:py-2.5
                       text-sm sm:text-base font-semibold leading-6 sm:leading-7 text-white shadow-sm
                       transition-all duration-200 hover:bg-gray-800 dark:hover:bg-gray-900 hover:scale-105 active:scale-95"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnimatedCta;
