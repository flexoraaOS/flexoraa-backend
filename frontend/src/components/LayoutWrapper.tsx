"use client";

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const hiddenRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/reset-password', '/dashboard' , '/auth/verify-otp'];

export default function LayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideLayout = hiddenRoutes.some(route => pathname.startsWith(route));
  console.log("Current pathname:", pathname);

  // for exceptions
  if (hideLayout) {
    return <main>{children}</main>;
  }

  return (
    <div className="flex  justify-between flex-col ">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
