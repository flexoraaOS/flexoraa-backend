import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Youtube, Download, HelpCircle } from 'lucide-react';

export default function OnboardingHelp() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-primary" />Need Help?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          If you&apos;re having trouble, watch our video guide or download the step-by-step instructions.
        </p>
        <Button variant="outline" className="w-full justify-start" asChild>
          <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer">
            <Youtube className="mr-2 h-4 w-4 text-red-500" /> Watch Video Guide
          </a>
        </Button>
        <Button variant="outline" className="w-full justify-start" asChild>
          <a href="/setup-guide.pdf" download>
            <Download className="mr-2 h-4 w-4" /> Download PDF Guide
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}