"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu, LogOut, User, ChevronDown, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import React, { useRef, useEffect, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { logoutUser } from "@/lib/features/authSlice";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "./ThemeToggle";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/leados", label: "LeadOS" },
  { href: "/agentos", label: "AgentOS" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About Us" },
];

const AnimatedNavLink = ({ href, label }: { href: string; label: string }) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  const linkRef = useRef<HTMLAnchorElement>(null);
  const underlineRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const link = linkRef.current;
      const underline = underlineRef.current;

      const handleMouseEnter = () => {
        gsap.to(link, {
          y: -2,
          duration: 0.3,
          ease: "power2.out",
        });
        gsap.to(underline, {
          scaleX: 1,
          opacity: 1,
          duration: 0.3,
          ease: "power2.out",
        });
      };

      const handleMouseLeave = () => {
        gsap.to(link, {
          y: 0,
          duration: 0.3,
          ease: "power2.out",
        });
        if (!isActive) {
          gsap.to(underline, {
            scaleX: 0,
            opacity: 0,
            duration: 0.3,
            ease: "power2.out",
          });
        }
      };

      link?.addEventListener("mouseenter", handleMouseEnter);
      link?.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        link?.removeEventListener("mouseenter", handleMouseEnter);
        link?.removeEventListener("mouseleave", handleMouseLeave);
      };
    },
    { scope: linkRef, dependencies: [isActive] }
  );

  useEffect(() => {
    gsap.to(underlineRef.current, {
      scaleX: isActive ? 1 : 0,
      opacity: isActive ? 1 : 0,
      duration: 0.3,
      ease: "power2.inOut",
    });
  }, [isActive]);

  return (
    <Link
      ref={linkRef}
      href={href}
      className={cn(
        "relative text-sm font-medium transition-colors duration-200 px-1 py-2",
        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      <span
        ref={underlineRef}
        className="absolute bottom-0 left-0 w-full h-[2px] bg-red-500 origin-left rounded-full"
        style={{ transform: "scaleX(0)", opacity: 0 }}
      />
    </Link>
  );
};

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isInitialized } = useAppSelector(
    (state) => state.auth
  );
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // GSAP animations
  useGSAP(
    () => {
      if (isInitialized) {
        gsap.from(".header-animate-in", {
          y: -20,
          opacity: 0,
          stagger: 0.05,
          duration: 0.6,
          ease: "power3.out",
          delay: 0.1,
        });
      }
    },
    { scope: headerRef, dependencies: [isInitialized] }
  );

  const handleSignOut = () => {
    setIsOpen(false);
    dispatch(logoutUser());
  };

  return (
    <header
      ref={headerRef}
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 supports-[backdrop-filter]:bg-background/60",
        scrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border/40 shadow-sm"
          : "bg-background/80 backdrop-blur-md border-b border-transparent"
      )}
    >
      <div className="container mx-auto flex h-16 md:h-20 items-center justify-between px-4 md:px-8">
        <div className="header-animate-in flex-shrink-0">
          <Logo />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
          {navLinks.map((link) => (
            <div key={link.href} className="header-animate-in">
              <AnimatedNavLink {...link} />
            </div>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-4 header-animate-in">
          {!isInitialized ? (
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-24 rounded-full" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
          ) : isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex">
                <ThemeToggle />
              </div>
              
              <Button 
                variant="red" 
                size="sm" 
                asChild 
                className="hidden sm:inline-flex rounded-full px-6 font-medium shadow-md hover:shadow-lg transition-all"
              >
                <Link href="/dashboard/profile">
                  Dashboard
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 pl-2 pr-3 h-10 rounded-full hover:bg-accent/50 transition-colors border border-transparent hover:border-border/40"
                  >
                    <Avatar className="h-8 w-8 border border-border/50">
                      <AvatarImage
                        src={user?.user_metadata?.avatar_url}
                        alt={user?.user_metadata?.first_name || "User"}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold">
                        {(
                          user?.user_metadata?.first_name?.[0] ||
                          user?.email?.[0] ||
                          "U"
                        ).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:inline-block text-sm font-medium max-w-[100px] truncate">
                      {user?.user_metadata?.first_name || "User"}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1 p-2">
                      <p className="text-sm font-medium leading-none">
                        {user?.user_metadata?.first_name &&
                        user?.user_metadata?.last_name
                          ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                          : user?.user_metadata?.first_name || "User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground truncate">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="rounded-md cursor-pointer">
                    <Link href="/dashboard/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-md cursor-pointer sm:hidden">
                    <Link href="/dashboard/profile" className="flex items-center">
                      <Sparkles className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => dispatch(logoutUser())}
                    className="rounded-md cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex">
                <ThemeToggle />
              </div>
              <Button 
                variant="ghost" 
                asChild 
                className="hidden md:inline-flex font-medium hover:bg-transparent hover:text-primary transition-colors"
              >
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button 
                variant="red" 
                asChild 
                className="hidden md:inline-flex rounded-full px-6 shadow-md hover:shadow-lg transition-all"
              >
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu Trigger */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden -mr-2">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] p-0 border-l border-border/40">
              <div className="flex flex-col h-full bg-background/95 backdrop-blur-xl">
                <div className="p-6 border-b border-border/40">
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <Logo />
                </div>
                <nav className="flex-1 overflow-y-auto py-6 px-4">
                  <div className="flex flex-col space-y-1">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center px-4 py-3 text-base font-medium rounded-lg transition-all duration-200",
                          pathname === link.href
                            ? "bg-red-500/10 text-red-600 dark:text-red-400"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </nav>
                
                <div className="p-6 border-t border-border/40 bg-muted/30">
                  <div className="mb-4 flex justify-center">
                    <ThemeToggle />
                  </div>
                  {isAuthenticated ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 px-2">
                        <Avatar className="h-10 w-10 border border-border">
                          <AvatarImage src={user?.user_metadata?.avatar_url} />
                          <AvatarFallback>
                            {(user?.user_metadata?.first_name?.[0] || "U").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-sm font-medium truncate">
                            {user?.user_metadata?.first_name || "User"}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {user?.email}
                          </span>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Button variant="outline" className="w-full justify-start" asChild>
                          <Link href="/dashboard/profile" onClick={() => setIsOpen(false)}>
                            <User className="mr-2 h-4 w-4" /> Profile
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                          onClick={handleSignOut}
                        >
                          <LogOut className="mr-2 h-4 w-4" /> Sign Out
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      <Button
                        variant="outline"
                        className="w-full justify-center"
                        asChild
                      >
                        <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                          Log In
                        </Link>
                      </Button>
                      <Button 
                        variant="red" 
                        className="w-full justify-center shadow-md" 
                        asChild
                      >
                        <Link href="/auth/signup" onClick={() => setIsOpen(false)}>
                          Get Started
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
