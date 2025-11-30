import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';
import ClientProviders from '@/components/ClientProviders';
import LayoutWrapper from '@/components/LayoutWrapper';
import Script from 'next/script';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Flexoraa Intelligence OS',
  description: 'AI-Powered Business Automation Suite',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/vercel.svg" />
      </head>
      <body className="font-body antialiased">
        <ClientProviders>
          <LayoutWrapper >
            {children}
            <Script
          id="razorpay-checkout-js" src="https://checkout.razorpay.com/v1/checkout.js"/>
            <Toaster />
          </LayoutWrapper>
        </ClientProviders>

      </body>
    </html>
  );
}
