'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Settings, FileInput } from 'lucide-react';

interface DashboardHeaderProps {
  title:string;
    children: React.ReactNode; 
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({title, children }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <h1 className="text-3xl font-bold font-headline">{title} Dashboard</h1>
      <div className="flex items-center gap-2 flex-wrap">
        {children}
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href="/dashboard/ai-messaging">
            <Settings className="mr-2 h-4 w-4" />
            Configure AI
          </Link>
        </Button>
        <Button className="gradient-background text-primary-foreground hover:opacity-90 w-full sm:w-auto" asChild>
          <Link href="/dashboard/upload-leads">
            <FileInput className="mr-2 h-4 w-4" />
            Upload New Leads
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
