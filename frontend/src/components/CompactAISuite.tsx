import React from 'react';
import { BarChart, MessagesSquare, ArrowRight, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

// --- Mock Components for Demonstration ---
// These are simplified versions for this example.
// In a real app, you would import these from your UI library.

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children: React.ReactNode;
}

interface CardContentProps {
  children: React.ReactNode;
}

interface CardFooterProps {
  children: React.ReactNode;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface ButtonProps {
  children: React.ReactNode;
  variant?: string;
  className?: string;
}

interface LinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = "" }) => (
  <div
    className={`
      bg-card
      border border-border rounded-2xl shadow-lg
      min-h-[280px] sm:min-h-[320px] md:min-h-[340px] lg:min-h-[360px]
      ${className}
    `}
  >
    {children}
  </div>
);

const CardHeader: React.FC<CardHeaderProps> = ({ children }) => (
  <div className="p-4 sm:p-5 md:p-6 pb-2 sm:pb-3">{children}</div>
);

const CardContent: React.FC<CardContentProps> = ({ children }) => (
  <div className="px-4 sm:px-5 md:px-6 pb-3 sm:pb-4">{children}</div>
);

const CardFooter: React.FC<CardFooterProps> = ({ children }) => (
  <div className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6">{children}</div>
);

const CardTitle: React.FC<CardTitleProps> = ({ children, className = "" }) => (
  <h3 className={`text-xl sm:text-2xl md:text-3xl font-semibold text-card-foreground ${className}`}>
    {children}
  </h3>
);

const Button: React.FC<ButtonProps> = ({ children, variant = "default", className = "" }) => (
  <button className={`inline-flex items-center justify-center ${className}`}>
    {children}
  </button>
);

const Link: React.FC<LinkProps> = ({ href, children, className = "" }) => (
  <a href={href} className={className}>
    {children}
  </a>
);
// --- End of Mock Components ---


export default function CompactAISuite(): React.JSX.Element {
   const router = useRouter()
    const handleRedirectToAgentos = () => {
      router.push('/agentos');
    };
    const handleRedirectToLeadOS= () => {
      router.push('/leados');
    };
  return (
    <section className="py-12 sm:py-14 md:py-16 lg:py-20" id='animated-background'>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-card-foreground to-muted-foreground bg-clip-text text-transparent">
            Our AI Suite
          </h2>
          <p className="mt-2 sm:mt-3 text-muted-foreground font-medium text-base sm:text-lg md:text-xl px-2">
            Two powerful solutions to cover all your automation needs.
          </p>
        </div>

        <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7 md:gap-8 max-w-5xl mx-auto">
          {/* LeadOS Card */}
          <Card className="group transition-all duration-300 hover:shadow-xl hover:shadow-red-500/20 hover:scale-[1.02] md:hover:scale-105 hover:-translate-y-1 border-black hover:border-red-500/40">
            <CardHeader>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-2.5 md:p-3 rounded-xl bg-red-500/10 border border-red-500/20 group-hover:bg-red-500/20 transition-colors duration-300 flex-shrink-0">
                  <BarChart className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-red-500" />
                </div>
                <CardTitle>LeadOS</CardTitle>
              </div>
              
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed font-medium">
                The ultimate sales development representative. LeadOS verifies,
                engages, and scores leads via WhatsApp, booking appointments
                directly into your calendar.
              </p>
              <ul className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 mt-0.5 flex-shrink-0" /> <span>AI Lead Verification & Scoring</span></li>
                <li className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 mt-0.5 flex-shrink-0" /> <span>Automated WhatsApp Engagement</span></li>
                <li className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 mt-0.5 flex-shrink-0" /> <span>Gamified SDR Performance Dashboards</span></li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="link" className="group/btn p-0 h-auto">
                <Link
                  href="/leados"
                  className="inline-flex items-center text-red-500 hover:text-red-400 transition-colors duration-300 font-semibold text-sm sm:text-base"
                >
                  Learn more about LeadOS
                  <ArrowRight className="ml-1.5 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* AgentOS Card */}
          <Card className="group transition-all duration-300 hover:shadow-xl hover:shadow-red-500/20 hover:scale-[1.02] md:hover:scale-105 hover:-translate-y-1 border-border hover:border-red-500/40">
            <CardHeader>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2 sm:p-2.5 md:p-3 rounded-xl bg-red-500/10 border border-red-500/20 group-hover:bg-red-500/20 transition-colors duration-300 flex-shrink-0">
                  <MessagesSquare className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-red-500" />
                </div>
                <CardTitle>AgentOS</CardTitle>
              </div>
            <br/>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed font-medium">
                Your multi-channel AI agent. AgentOS connects to WhatsApp,
                Instagram, Facebook, and Gmail to provide instant, intelligent
                responses and support.
              </p>
              <ul className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 mt-0.5 flex-shrink-0" /> <span>Unified Omnichannel Inbox</span></li>
                <li className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 mt-0.5 flex-shrink-0" /> <span>Conversational AI That Sells</span></li>
                <li className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 mt-0.5 flex-shrink-0" /> <span>Automated Appointment Booking</span></li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="link" className="group/btn p-0 h-auto">
                <Link
                  href="/agentos"
                  className="inline-flex items-center text-red-500 hover:text-red-400 transition-colors duration-300 font-semibold text-sm sm:text-base"
                >
                  Learn more about AgentOS
                  <ArrowRight className="ml-1.5 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
}
