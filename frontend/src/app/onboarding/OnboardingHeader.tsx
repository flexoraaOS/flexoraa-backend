import React from 'react';
import { Logo } from '@/components/ui/logo';

export default function OnboardingHeader({ product }: { product: 'leados' | 'agentos' }) {
  return (
    <header className="text-center mb-10">
      <div className="flex justify-center mb-4">
        <Logo />
      </div>
      <h1 className="text-3xl md:text-4xl font-bold font-headline mb-3">
        Welcome to <span className="gradient-text">{product === 'leados' ? 'LeadOS' : 'AgentOS'}</span> 🚀
      </h1>
      <p className="text-muted-foreground max-w-2xl mx-auto">
        {product === 'leados'
          ? "Let’s connect your WhatsApp Business account to start qualifying leads with AI."
          : "Let’s connect your social media channels so the AI can start engaging leads."
        }
      </p>
    </header>
  );
}