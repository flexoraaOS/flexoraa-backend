// src/app/leados/page.tsx

'use client';

import React from 'react'; // useRef and useInView are no longer needed here
import { useRouter } from 'next/navigation';

// Icon Imports
import {
    ShieldCheck,
    UploadCloud,
    Share2,
    ReplyAll,
    Sigma,
    CalendarCheck,
    ListChecks,
    KanbanSquare,
    BarChart2
} from 'lucide-react';

// Component Imports
import Banner from '@/components/Banner';
import FaqSection from '@/components/FaqSection';
import AnimatedCta from '@/components/AnimatedCta';
import { FeatureGrid } from '@/components/features/FeatureGrid';
import { FeatureCard } from '@/components/features/FeatureCard';
import { WorkflowTimeline } from '@/components/features/WorkflowTimeline'; // Import the new component

// Data and Utility Imports
import { faqs } from '@/lib/data';
import { LeadOSFeatures } from '@/components/data/featuresData';
// cn is no longer needed here if it was only for WorkflowNode

// Define workflow steps with imported icons
const workflowSteps = [
    { icon: <UploadCloud />, title: "1. Upload Data", description: "CSV import or CRM integration." },
    { icon: <ShieldCheck />, title: "2. WhatsApp & Call Verification", description: "Leads are first verified via our WhatsApp system. Remaining numbers undergo call verification to filter out any invalid contacts." },
    { icon: <Share2 />, title: "3. AI WhatsApp Outreach", description: "Message sent via Flexoraa or the client’s WABA." },
    { icon: <ReplyAll />, title: "4. AI-Powered Replies", description: "Auto handling of replies using brand tone + sales psychology." },
    { icon: <Sigma />, title: "5. Lead Scoring Engine", description: "Scored dynamically into Hot, Warm, Cold." },
    { icon: <CalendarCheck />, title: "6. Follow-Up Calendar", description: "Auto reminders and WhatsApp follow-up logic." },
    { icon: <ListChecks />, title: "7. Lead Timeline + Logs", description: "Complete chat history for trust + traceability." },
    { icon: <KanbanSquare />, title: "8. Pipeline Movement", description: "Drag-and-drop lead stage updates by SDR." },
    { icon: <BarChart2 />, title: "9. Dashboard + Export + Reporting", description: "Filter leads, export, view ROI, and access campaign insights." }
];

export default function LeadOS() {
    const router = useRouter();
    const handleRedirectToWaitlist = () => {
        router.push('/agentos');
    };

    // The WorkflowNode component has been moved to WorkflowTimeline.tsx

    return (
        <div className="bg-background text-foreground">
            <Banner
                title={
                    <>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r  from-red-500 via-yellow-600 to-yellow-300 ">
                            Lead OS :
                        </span>
                        Your AI Sales Rep<br />
                    </>
                }
                subtitle="Engage customers across WhatsApp, Instagram, and Facebook with a single, intelligent AI workforce."
                primaryButtonText="View Pricing"
                onPrimaryClick={() => router.push('/pricing')}
                onSecondaryClick={handleRedirectToWaitlist}
            />

            <FeatureGrid
            Header='LeadOS – Verified Leads. Real Intent. Real Results.'
            Description='Built for founders, marketers, and closers who are tired of fake leads and wasted follow-ups.'
                data={LeadOSFeatures}
                renderItem={(feature) => (
                    <FeatureCard key={feature.title} feature={feature} />
                )}
                columnsMd={4}
                className="my-custom-padding"
            />

            {/* Use the new reusable component here */}
            <WorkflowTimeline
                title="LeadOS: From Raw Data to Revenue (9 Core Stages)"
                subtitle="From raw data to booked appointments, see how LeadOS transforms your sales process with intelligent automation."
                steps={workflowSteps}
            />

            <FaqSection
                faqs={faqs}
                title="Frequently Asked Questions"
                subtitle="Find answers to common questions about LeadOS."
            />

            <section className="flex flex-col items-center justify-center bg-background p-4">
                <AnimatedCta
                    title="Ready to Supercharge Your Sales?"
                    subtitle="Get started with LeadOS today and turn more prospects into profits."
                    buttonText="View Plans"
                    buttonLink="/pricing"
                />
            </section>
        </div>
    );
}