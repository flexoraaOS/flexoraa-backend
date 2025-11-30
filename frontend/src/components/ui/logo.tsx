import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 text-foreground", className)}>
      <Image
        src="/logo.png"
        alt="Flexoraa Logo"
        width={45} // exact size for better LCP
        height={45}
        priority // ensures the logo is preloaded for faster LCP
      />
      <span className="text-xl font-semibold font-headline text-inherit">
        Flexoraa
      </span>
    </Link>
  );
}
