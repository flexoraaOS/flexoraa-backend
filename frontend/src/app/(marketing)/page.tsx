'use client';

import React from 'react';
import Banner from '@/components/Banner';
import CompactAISuite from '@/components/CompactAISuite';
import StickyFeaturesSection, { FeatureItem } from '@/components/StickyFeaturesSection';
import { ShieldCheckIcon, MessageSquare, Target, Bot, Zap, Users, BarChart3, Calendar, Settings, Link2, CheckCircle } from 'lucide-react';
import AnimatedCta from '@/components/AnimatedCta';
import TrustedBySection from '@/components/TrustedBySection';
import { useRouter } from 'next/navigation';
import { Card, CardFooter, CardContent } from '@/components/ui/card';
import FaqSection from '@/components/FaqSection';
import { faqs } from '@/lib/data';

const demoFeatures: FeatureItem[] = [
  {
    icon: <ShieldCheckIcon className="h-6 w-6 text-red-500" />,
    title: 'End-to-End Lead Automation',
    description: 'From AI-powered verification and qualification on WhatsApp to a gamified SDR leaderboard, LeadOS manages your entire sales funnel.',
    imageSrc: 'https://images.unsplash.com/photo-1590065707046-4fde65275b2e?q=80&w=1630&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?q=80&w=1740&auto=format&fit=crop',
    imageHint: 'Encryption process'
  },
  {
    icon: <MessageSquare className="h-6 w-6 text-red-500" />,
    title: 'Omnichannel Conversational AI',
    description: 'AgentOS unifies your Instagram, Facebook, and WhatsApp DMs into one smart inbox where an AI that sells engages leads 24/7.',
    imageSrc: 'https://images.unsplash.com/photo-1747021627291-d81636d6f6ce?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?q=80&w=1740&auto=format&fit=crop',
    imageHint: 'Messaging interface'
  },
  {
    icon: <Target className="h-6 w-6  text-red-500" />,
    title: 'Deep Performance Analytics',
    description: 'Gain actionable insights with built-in ROI calculators, campaign intelligence panels, and revenue forecasting dashboards.',
    imageSrc: 'https://images.unsplash.com/photo-1596008194705-2091cd6764d4?q=80&w=1039&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?q=80&w=1740&auto=format&fit=crop',
    imageHint: 'Target analytics dashboard'
  }
];

export default function LandingPage() {
  const router = useRouter()
  const handleRedirectToAgentos = () => {
    router.push('/agentos');
  };
  const handleRedirectToLeadOS= () => {
    router.push('/leados');
  };

  return (
    <div className="bg-background text-foreground">
      <Banner
        title={
          <>
            The Future of Business is Automated with<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r  from-red-500 via-yellow-600 to-yellow-300 ">
              Flexoraa Intelligence OS
            </span>
          </>
        }
        subtitle="Leverage our AI-powered suite to streamline your sales, engagement, and customer support. Focus on what matters most."
        primaryButtonText="Explore LeadOS"
        secondaryButtonText="Discover AgentOS"
        onPrimaryClick={handleRedirectToLeadOS}
        onSecondaryClick={handleRedirectToAgentos}
      />

      <StickyFeaturesSection
        title="What is Flexoraa Intelligence OS?"
        subtitle1="Flexoraa Intelligence OS is a full-stack AI ecosystem designed to automate your business from lead acquisition to customer engagement. Our two flagship models, LeadOS and AgentOS, work in tandem to create a self-sufficient growth engine. "
        subtitle2="LeadOS automates your entire sales funnel—from verifying leads with ping-back tech and qualifying them on WhatsApp to providing SDRs with gamified leaderboards and revenue forecasting. AgentOS unifies your customer conversations from Instagram, Facebook, and WhatsApp into a single inbox, where a persuasive AI not only answers questions but actively sells and books appointments."

        
        features={demoFeatures}
      />

      <CompactAISuite />

      {/* AI Persona Section */}
      <section className="py-12 sm:py-14 md:py-16 lg:py-20 bg-secondary/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <Bot className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-red-500" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Custom AI Personas</h2>
            </div>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2 leading-relaxed">
              Train unlimited AI agents with your brand voice, sales scripts, and personality. Create specialists for different product lines, customer types, and communication styles.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 max-w-6xl mx-auto">
            <Card className="text-center p-4 sm:p-5 md:p-6 hover:shadow-lg transition-shadow duration-300 border-red-200/20 hover:border-red-300/40">
              <CardContent className="pt-0">
                <Users className="h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 text-red-500 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">Brand Voice Consistency</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">Every response aligns with your brand personality, maintaining consistent messaging across all touchpoints.</p>
              </CardContent>
            </Card>

            <Card className="text-center p-4 sm:p-5 md:p-6 hover:shadow-lg transition-shadow duration-300 border-red-200/20 hover:border-red-300/40">
              <CardContent className="pt-0">
                <Zap className="h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 text-red-500 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">Specialized Roles</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">Different personas for qualification, nurturing, objection handling, and closing - all working together seamlessly.</p>
              </CardContent>
            </Card>

            <Card className="text-center p-4 sm:p-5 md:p-6 hover:shadow-lg transition-shadow duration-300 border-red-200/20 hover:border-red-300/40 sm:col-span-2 lg:col-span-1">
              <CardContent className="pt-0">
                <Settings className="h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 text-red-500 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">Adaptive Learning</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">AI learns from successful conversions and adapts its approach to match what works best for your specific audience.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Integrations & Team Section */}
      <section className="py-12 sm:py-14 md:py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-start lg:items-center">
            <div className="space-y-4 sm:space-y-5 md:space-y-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <Link2 className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-red-500 flex-shrink-0" />
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Unified Ecosystem</h2>
              </div>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                Connect everything in one powerful platform. From social media to CRM, email to calendars, we integrate with the tools you already use.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium">WhatsApp Business</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium">Instagram</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium">Facebook Messenger</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium">Gmail</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium">HubSpot CRM</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium">Salesforce</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium">Slack</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium">Google Calendar</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground pt-2">
                Plus 20+ more integrations and growing. Everything syncs automatically, eliminating data silos and manual entry.
              </p>
            </div>

            <div className="space-y-4 sm:space-y-5 md:space-y-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <Users className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-red-500 flex-shrink-0" />
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Team Collaboration</h2>
              </div>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                Build powerful teams with role-based access, company-wide dashboards, and collaborative workflows that scale.
              </p>

              <div className="space-y-3 sm:space-y-4 pt-2">
                <div className="flex items-start gap-2 sm:gap-3">
                  <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-foreground mb-1">Real-time Analytics</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">Company-wide performance tracking with ROI calculators and conversion forecasts.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 sm:gap-3">
                  <Target className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-foreground mb-1">Gamified Goals</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">Turn sales targets into friendly competition with leaderboards and achievement tracking.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 sm:gap-3">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-foreground mb-1">Automated Scheduling</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">AI books appointments directly into calendars, syncing with Google Calendar and Outlook.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="testimonials" className="px-4 sm:px-5 md:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-24 bg-secondary/10 flex justify-center items-center">
  <div className="container">
    <div className="text-center mb-8 sm:mb-10 md:mb-12">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-headline">Feedback from Our Customers</h2>
      <p className="mt-2 sm:mt-3 text-muted-foreground text-sm sm:text-base md:text-lg px-2">See how Flexoraa Intelligence OS is transforming companies.</p>
    </div>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
      <Card>
        <CardContent className="pt-4 sm:pt-5 md:pt-6">
          <p className="text-sm sm:text-base leading-relaxed">&ldquo;LeadOS increased our qualified leads by 300% in the first quarter. It&rsquo;s a game-changer for our sales team.&rdquo;</p>
        </CardContent>
        <CardFooter>
          <div>
            <p className="font-semibold text-sm sm:text-base">Jane Doe</p>
            <p className="text-xs sm:text-sm text-muted-foreground">CEO, Tech Innovators</p>
          </div>
        </CardFooter>
      </Card>
      <Card>
        <CardContent className="pt-4 sm:pt-5 md:pt-6">
          <p className="text-sm sm:text-base leading-relaxed">&ldquo;The ability of AgentOS to handle customer queries across multiple platforms is incredible. Our support costs are down 40%.&rdquo;</p>
        </CardContent>
        <CardFooter>
          <div>
            <p className="font-semibold text-sm sm:text-base">John Smith</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Head of Operations, MarketFinders</p>
          </div>
        </CardFooter>
      </Card>
      <Card>
        <CardContent className="pt-4 sm:pt-5 md:pt-6">
          <p className="text-sm sm:text-base leading-relaxed">&ldquo;Flexoraa&rsquo;s automation is seamless. We&rsquo;re closing deals faster and our customers are happier. I can&rsquo;t recommend it enough.&rdquo;</p>
        </CardContent>
        <CardFooter>
          <div>
            <p className="font-semibold text-sm sm:text-base">Sarah Adams</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Founder, Creative Solutions</p>
          </div>
        </CardFooter>
      </Card>
      <Card>
        <CardContent className="pt-4 sm:pt-5 md:pt-6">
          <p className="text-sm sm:text-base leading-relaxed">&ldquo;The AI-driven lead scoring is scarily accurate. It has completely changed how we prioritize our sales efforts.&rdquo;</p>
        </CardContent>
        <CardFooter>
          <div>
            <p className="font-semibold text-sm sm:text-base">Mike Johnson</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Sales Director, Growth Co.</p>
          </div>
        </CardFooter>
      </Card>
      <Card>
        <CardContent className="pt-4 sm:pt-5 md:pt-6">
          <p className="text-sm sm:text-base leading-relaxed">&ldquo;We&rsquo;ve reduced our SDR costs by over 50% without a drop in performance. LeadOS is the real deal.&rdquo;</p>
        </CardContent>
        <CardFooter>
          <div>
            <p className="font-semibold text-sm sm:text-base">David Chen</p>
            <p className="text-xs sm:text-sm text-muted-foreground">CFO, Enterprise Solutions</p>
          </div>
        </CardFooter>
      </Card>
      <Card>
        <CardContent className="pt-4 sm:pt-5 md:pt-6">
          <p className="text-sm sm:text-base leading-relaxed">&ldquo;The best part is the human handoff. The AI handles 90% of the conversation, and our team steps in at the perfect moment to close.&rdquo;</p>
        </CardContent>
        <CardFooter>
          <div>
            <p className="font-semibold text-sm sm:text-base">Emily Rodriguez</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Customer Success Manager, SaaSify</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  </div>
</section>

      {/* <TrustedBySection /> */}
      <FaqSection
                faqs={faqs}
                title="Frequently Asked Questions"
                subtitle="Find answers to common questions about AgentOS."
            />

      <section className="flex flex-col items-center justify-center bg-background px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        <AnimatedCta
          title="Ready to Supercharge Your Sales?"
          subtitle="Get started with LeadOS today and turn more prospects into profits."
          buttonText="View Plans"
          buttonLink="/waitlist"
        />
      </section>

    </div>
  );
}
