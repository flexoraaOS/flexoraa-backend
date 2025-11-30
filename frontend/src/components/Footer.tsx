'use client';

import React from 'react';
import { Logo } from './ui/logo';
import { LucideLinkedin, Twitter, Youtube } from 'lucide-react';
import Link from 'next/link';
import { ContactPopup } from './ContactPopup';

const Footer: React.FC = () => {
  return (
    <footer className="bg-card text-muted-foreground py-8 px-6 relative bottom-0 left-0 w-full z-10 ">
      <div className="max-w-7xl mt-10 mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">

        {/* Logo & About */}
        <div className="footer-column space-y-3">
          <h2 className="flex items-center text-2xl font-bold text-card-foreground">
            <Logo />
          </h2>
          <p className="leading-relaxed text-sm">
            AI-Powered Business Automation Suite
          </p>

          <div className="flex space-x-4">
            <Link href="https://x.com/Flexoraa?t=A_9Ici5sgxaHIw0ADFfufQ&s=09" target='_blank' className="text-muted-foreground hover:text-red-500">
              <Twitter className="h-5 w-5" />
            </Link>
            <Link href="https://www.linkedin.com/company/flexoraa/" target='_blank'  className="text-muted-foreground hover:text-red-500">
              <LucideLinkedin className="h-5 w-5" />
            </Link>
            <Link href="https://youtube.com/@flexoraaaa?si=9qnGSl8jXp6uP9uR" target='_blank'  className="text-muted-foreground hover:text-red-500">
              <Youtube className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Products */}
        <div className="footer-column">
          <h3 className="text-lg font-semibold text-card-foreground mb-3">Products</h3>
          <ul className="space-y-1 text-sm leading-relaxed">
            {[
              { name: 'LeadOS', href: '/leados' },
              { name: 'AgentOS', href: '/agentos' },
              { name: 'Pricing', href: '/pricing' },
            ].map((item) => (
              <li key={item.name}>
                <Link href={item.href} className="hover:text-red-500 transition-colors">
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div className="footer-column">
          <h3 className="text-lg font-semibold text-card-foreground mb-3">Company</h3>
          <ul className="space-y-1 text-sm leading-relaxed">
            <li>
              <Link href="/about" className="hover:text-red-500 transition-colors">
                About us
              </Link>
            </li>
            <li>
              <ContactPopup />
            </li>
          </ul>
        </div>

        {/* Legal */}
        <div className="footer-column">
          <h3 className="text-lg font-semibold text-card-foreground mb-3">Legal</h3>
          <ul className="space-y-1 text-sm leading-relaxed">
            {[
              { name: 'Privacy Policy', href: '/privacy-policy' },
              { name: 'Terms of Service', href: '/terms-of-service' },
            ].map((item) => (
              <li key={item.name}>
                <Link href={item.href} className="hover:text-red-500 transition-colors">
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

      </div>

      <div className="mt-6 border-t border-border/40 pt-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Flexoraa Intelligence OS. All rights reserved.
      </div>
      <div className=" pt-2 text-center text-xs text-muted-foreground">
        Flexoraa Intelligence OS™ is a flagship product of Flexoraa®
      </div>
    </footer>
  );
};

export default React.memo(Footer);
