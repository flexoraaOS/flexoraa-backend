'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

// Icon Imports from lucide-react
import {
    GitBranch, Bot, Flame, UserCheck, CalendarCheck,
    Users, Mail, Share2, Tag, Lock
} from 'lucide-react';

// Component Imports
import Banner from '@/components/Banner';
import FaqSection from '@/components/FaqSection';
import AnimatedCta from '@/components/AnimatedCta';
import { FeatureGrid } from '@/components/features/FeatureGrid';
import { FeatureCard } from '@/components/features/FeatureCard';
import { WorkflowTimeline } from '@/components/features/WorkflowTimeline'; // Correctly import the reusable component

// Data and Utility Imports
import { faqs } from '@/lib/data';
import { AgentOSFeatures } from '@/components/data/featuresData';

// Define the workflow steps data for AgentOS
const workflowSteps = [
    { icon: <GitBranch />, title: "1. Lead Entry", description: "Leads from Instagram, Facebook, and WhatsApp sync automatically into AgentOS." },
    { icon: <Bot />, title: "2. AI Activation", description: "The AI initiates smart, psychology-based conversations to engage and qualify leads." },
    { icon: <Flame />, title: "3. Lead Qualification", description: "Leads are auto-qualified as Hot, Warm, or Cold based on their buying signals." },
    { icon: <UserCheck />, title: "4. Auto-Assignment to SDR", description: "Leads are routed to the right SDR based on platform, temperature, or product line." },
    { icon: <CalendarCheck />, title: "5. Appointment Booking", description: "AgentOS sends branded calendar links to interested leads, and confirms the booking in-chat." },
    { icon: <Users />, title: "6. SDR Follow-up Call", description: "SDRs receive alerts and context, ensuring every call is timely and personal." },
    { icon: <Mail />, title: "7. Weekly Gmail Report", description: "You receive white-labeled reports with lead stats, SDR performance, and content insights." },
    { icon: <Share2 />, title: "8. Brand Monitoring", description: "AgentOS tracks mentions, UGC, comments, and tags, flagging hot conversations for your team." },
    { icon: <Tag />, title: "9. Manual Notes & Tags", description: "SDRs can add custom notes, labels, and tags to organize their lead flow." },
    { icon: <Lock />, title: "10. Anti-Lead Leakage Guard", description: "All interactions are logged and follow-up reminders are triggered to ensure zero wastage." }
];

/**
 * The main page component for the AgentOS product.
 * It showcases features, a detailed workflow, FAQs, and a call-to-action.
 */
export default function AgentOS() {
    const router = useRouter();

    const handleRedirectToLeadOS = () => {
        router.push('/leados');
    };

    return (
        <div className="bg-background text-foreground">
            <Banner
                title={
                    <>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-600 to-yellow-300 ">
                            AgentOS:
                        </span>
                        Your Multichannel AI Agent<br />
                    </>
                }
                subtitle="Engage customers across WhatsApp, Instagram, and Facebook with a single, intelligent AI workforce."
                primaryButtonText="View Pricing"
                onPrimaryClick={() => router.push('/pricing')}
                onSecondaryClick={handleRedirectToLeadOS}
            />
                
            <FeatureGrid
            Header='AgentOS – AI That Handles Your DMs, 24/7'
            Description='Built for businesses who get DMs but lose deals due to slow or missed responses.'
                data={AgentOSFeatures}
                renderItem={(feature) => (
                    <FeatureCard key={feature.title} feature={feature} />
                )}
                columnsMd={4}
                className="my-custom-padding"
            />

            {/* Use the reusable WorkflowTimeline component here */}
            <WorkflowTimeline
                title="AgentOS: Operational Workflow (10 Core Stages)"
                subtitle="From initial contact to closed deal, see how AgentOS intelligently handles every step of the process."
                steps={workflowSteps}
            />

            <FaqSection
                faqs={faqs}
                title="Frequently Asked Questions"
                subtitle="Find answers to common questions about AgentOS."
            />

            <section className="flex flex-col items-center justify-center bg-background p-4">
                <AnimatedCta
                    title="Ready to Supercharge Your Sales?"
                    subtitle="Get started with AgentOS today and turn more prospects into profits."
                    buttonText="View Plans"
                    buttonLink="/pricing"
                />
            </section>
        </div>
    );
}