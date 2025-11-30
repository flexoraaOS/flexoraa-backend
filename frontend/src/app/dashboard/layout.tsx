'use client';

import React from 'react';
import { DashboardNavbar } from '@/components/dashboard/DashboardNavbar';
import { cn } from '@/lib/utils';
import ProtectedRoute from '@/components/dashboard/ProtectedRoutes';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div id="animated-background" className="fixed inset-0 -z-10" />
      <div className="min-h-screen flex flex-col bg-transparent">
        <DashboardNavbar />
        <main className={cn('flex-1 p-4 md:p-8 lg:p-10 w-full')}>
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
