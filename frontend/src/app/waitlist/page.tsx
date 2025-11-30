'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Mail, Check, Loader2 } from "lucide-react";
import { cn } from '@/lib/utils';

export default function WaitlistPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleGetAccess = () => {
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <div
      id="animated-background"
      className="min-h-screen w-full flex flex-col items-center justify-center p-4"
    >
      <div className="w-full max-w-xl text-center">
        <div className="flex justify-center mb-6">
          <div
            className={cn(
              "p-5 rounded-full transition-all duration-500 ease-in-out",
              "bg-red-500/10 border-4 border-red-500/20"
            )}
          >
            {!isSubmitted ? (
              <Mail className="h-14 w-14 text-red-500 transition-transform duration-500" />
            ) : (
              <Check className="h-14 w-14 text-red-500 transition-transform duration-500 scale-100 animate-in fade-in zoom-in-50" />
            )}
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">
          {isSubmitted ? "You're on the Waitlist!" : "You're Almost There!"}
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          {isSubmitted
            ? "Thank you for signing up. Keep an eye on your inbox for our launch announcement!"
            : "Be the first to get access when Flexoraa Intelligence OS goes live."}
        </p>

        <blockquote className="border-l-4 border-red-400 pl-6 py-2 my-12 italic text-foreground text-2xl font-medium max-w-md mx-auto">
          “You don’t need more leads. You need sharper intelligence to turn the right ones into revenue.”
        </blockquote>

        {!isSubmitted && (
          <Button
            size="lg"
            variant="red"
            className="w-full max-w-xs mx-auto-lg py-7"
            onClick={handleGetAccess}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Sending Request...
              </>
            ) : (
              "Get Early Access"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
