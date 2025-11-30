'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-1 border border-border rounded-md p-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
          <Sun className="h-4 w-4 text-foreground" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
          <Moon className="h-4 w-4 text-foreground" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
          <Monitor className="h-4 w-4 text-foreground" />
        </Button>
      </div>
    );
  }

  const currentTheme = theme === 'system' ? systemTheme : theme;

  return (
    <div className="flex items-center gap-1 border border-border rounded-md p-1 bg-background">
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${theme === 'light' ? 'bg-accent' : ''}`}
        onClick={() => setTheme('light')}
        title="Light mode"
      >
        <Sun className="h-4 w-4 text-foreground" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${theme === 'dark' ? 'bg-accent' : ''}`}
        onClick={() => setTheme('dark')}
        title="Dark mode"
      >
        <Moon className="h-4 w-4 text-foreground" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${theme === 'system' ? 'bg-accent' : ''}`}
        onClick={() => setTheme('system')}
        title="System theme"
      >
        <Monitor className="h-4 w-4 text-foreground" />
      </Button>
    </div>
  );
}