'use client';

import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Instagram, Facebook, MessageSquare, Mail, Slack, Database, Link as LinkIcon, Lock, CheckCircle, Users, Calendar, ShoppingCart, CreditCard } from "lucide-react";
import Link from "next/link";
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HubSpokeDiagram } from '@/components/ui/hub-spoke-diagram';
import { Accordion } from '@radix-ui/react-accordion';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import AnimatedCta from '@/components/AnimatedCta';
import Banner from '@/components/Banner';

const HubSpotIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.83,3.06A9,9,0,0,0,5.7,18.3a9,9.0,0,0,12.6,0A9,9,0,0,0,12.83,3.06ZM12,16.4a.6.6,0,0,1-.6-.6V8.2a.6.6,0,1,1,1.2,0v7.6A.6.6,0,0,1,12,16.4Z" fill="#ff7a59" stroke="none" />
    </svg>
);
const ZohoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16v16H4z" fill="#e42527" stroke="none" />
        <path d="M7 8h4v8H7zm6 0h4v8h-4z" fill="white" stroke="none" />
    </svg>
);
const SalesforceIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.04 15.6c-.45.34-1.03.55-1.64.55-1.63 0-2.95-1.33-2.95-2.96s1.32-2.96 2.95-2.96c.61 0 1.19.21 1.64.55l.01-.01c.42-.33.98-.54 1.58-.54 1.4 0 2.54 1.14 2.54 2.54s-1.14 2.54-2.54 2.54c-.6 0-1.16-.21-1.58-.54l-.01.01z" fill="#00a1e0" stroke="none" />
    </svg>
);
const PipedriveIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.25 12.88H9.72V9.12h4.53v3.76z" fill="#2ca02c" stroke="none" />
    </svg>
);
const MicrosoftTeamsIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm5.43,12.59-3.26,3.26a.5.5,0,0,1-.71,0l-1.42-1.42a.5.5,0,0,1,0-.71l3.26-3.26a.5.5,0,0,1,.71,0l1.42,1.42A.5.5,0,0,1,17.43,14.59ZM8.28,7.5a2.5,2.5,0,1,0,2.5,2.5A2.5,2.5,0,0,0,8.28,7.5Z" fill="#6264a7" stroke="none" />
    </svg>
);
const MailchimpIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.5,8.1a3.2,3.2,0,0,0-4.5,0L12,13.2,7,8.1a3.2,3.2,0,0,0-4.5,0,3.2,3.2,0,0,0,0,4.5l7.5,7.6a1.6,1.6,0,0,0,2,0l7.5-7.6a3.2,3.2,0,0,0,0,4.5Z" fill="#ffe01b" stroke="none" />
        <path d="M2.5,12.6A3.2,3.2,0,0,0,7,12.6a3.2,3.2,0,0,0,4.5,0L12,12l-1.5-1.5a3.2,3.2,0,0,0-4.5,0Z" fill="#fbb12f" stroke="none" />
    </svg>
);
const ZendeskIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16v4H4zm0 6h8v8H4z" fill="#03363d" stroke="none" />
        <path d="M12 10h8v8h-8z" fill="#03363d" stroke="none" />
    </svg>
);

// --- END ICONS ---

const integrationCategories = [
    {
        icon: () => <Users className="h-10 w-10 text-primary" />,
        title: "Customer Communication",
        description: "Unify every channel. Turn conversations into revenue with a single, intelligent view of your customer.",
        integrations: [
            { icon: () => <Instagram className="h-8 w-8 text-[#E4405F]" />, name: "Instagram Business", description: "Turn every DM into a deal. The Execution OS captures, qualifies, and responds instantly so you never lose high-intent leads." },
            { icon: () => <Facebook className="h-8 w-8 text-[#1877F2]" />, name: "Facebook Pages & Messenger", description: "Every comment, every inbox message, unified in one window. The Execution OS ensures you respond faster and convert conversations into revenue." },
            { icon: () => <MessageSquare className="h-8 w-8 text-[#25D366]" />, name: "WhatsApp Business", description: "Customers trust WhatsApp. Flexoraa Execution OS keeps every chat tracked, tagged, and linked to your pipeline — zero leakage." },
            { icon: () => <Mail className="h-8 w-8 text-[#EA4335]" />, name: "Gmail", description: "Invoices, proposals, or follow-ups — The Execution OS connects Gmail with WhatsApp, Instagram, and Facebook, recognizing the same client across channels." },
        ]
    },
    {
        icon: () => <Database className="h-10 w-10 text-primary" />,
        title: "CRMs & Sales",
        description: "Eliminate manual data entry. Sync conversations and deals automatically to keep your pipeline clean and your team focused.",
        integrations: [
            { icon: () => <HubSpotIcon className="h-8 w-8" />, name: "HubSpot CRM", description: "Eliminate manual entry. The Execution OS pushes qualified leads directly into HubSpot, improving CRM adoption and sales velocity." },
            { icon: () => <ZohoIcon className="h-8 w-8" />, name: "Zoho CRM", description: "Every conversation flows into Zoho pipelines in real time. The Execution OS keeps your data clean and sales team focused on closing." },
            { icon: () => <SalesforceIcon className="h-8 w-8" />, name: "Salesforce", description: "The Execution OS keeps Salesforce updated with conversations, deals, and accounts — ensuring total pipeline visibility." },
            { icon: () => <PipedriveIcon className="h-8 w-8" />, name: "Pipedrive", description: "From WhatsApp to pipeline in seconds. The Execution OS accelerates deal creation in Pipedrive automatically." },
        ]
    },
    {
        icon: () => <LinkIcon className="h-10 w-10 text-primary" />,
        title: "Collaboration & Productivity",
        description: "Turn conversations into actions. Send alerts to Slack, create tasks, and sync files to keep your entire team aligned and moving fast.",
        integrations: [
            { icon: () => <Slack className="h-8 w-8 text-[#4A154B]" />, name: "Slack", description: "The Execution OS sends instant alerts into Slack so your team responds before competitors do." },
            { icon: () => <MicrosoftTeamsIcon className="h-8 w-8" />, name: "Microsoft Teams", description: "Client conversations linked directly into team collaboration — keeping every department aligned inside the Execution OS." },
            { icon: () => <MailchimpIcon className="h-8 w-8" />, name: "Mailchimp", description: "Feed qualified leads into campaigns instantly. The Execution OS closes the gap between lead capture and nurturing." },
            { icon: () => <ZendeskIcon className="h-8 w-8" />, name: "Zendesk", description: "Support tickets and sales conversations unified. The Execution OS keeps service and sales aligned for customer satisfaction." },
        ]
    }
];

const faqs = [
    { question: "How do I connect WhatsApp, Instagram, or Facebook?", answer: "With Flexoraa Execution OS, you click once, log in, and your business accounts are connected via OAuth2." },
    { question: "Can I use Gmail with Flexoraa?", answer: "Yes. Emails are auto-linked to the right lead, even if that lead started on WhatsApp or Instagram." },
    { question: "Do I need a developer account?", answer: "No. Flexoraa handles technical integrations — you just log in once." },
    { question: "Which CRMs are supported?", answer: "HubSpot, Salesforce, Zoho, and Pipedrive are supported today. More are coming soon." },
    { question: "Is Flexoraa secure?", answer: "Yes. Flexoraa uses official APIs with encrypted connections and lets you disconnect anytime." }
];

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Flexoraa Intelligence OS",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description": "Flexoraa Intelligence OS is The Execution Operating System that connects WhatsApp, Instagram, Facebook, Gmail, HubSpot, Salesforce, Zoho, Slack, and more in one window.",
    "url": "https://www.flexoraa.com/integrations/",
    "featureList": [
        "WhatsApp Business Integration",
        "Instagram Business Integration",
        "Facebook Messenger Integration",
        "Gmail Integration",
        "HubSpot CRM Integration",
        "Salesforce Integration",
        "Zoho CRM Integration",
        "Slack Integration",
        "Google Drive Integration"
    ]
}


export default function IntegrationsPage() {
    return (
        <div className="bg-background overflow-x-hidden">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {/* Hero Section */}
            <Banner
                title={
                    <>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r  from-red-500 via-yellow-600 to-yellow-300 ">
                           The Execution OS 
                        </span>
                            is expanding.<br />
                    </>
                }
                subtitle="More integrations on the way to power your growth ecosystem."
            />

            {/* Integrations Section */}
            <section className="py-20 md:py-24 space-y-24 md:space-y-32">
                {integrationCategories.map((category, catIndex) => (
                    <div key={category.title} className="container mx-auto px-4">
                        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
                            <div className={cn("relative w-full flex items-center justify-center min-h-[350px] md:min-h-[400px]", catIndex % 2 === 1 && "md:order-2")}>
                                <HubSpokeDiagram items={category.integrations.map(integration => ({ icon: integration.icon(), name: integration.name }))} />
                            </div>
                            <div className="relative z-10">
                                <h2 className="text-3xl md:text-4xl font-bold font-headline mb-4">{category.title}</h2>
                                <p className="text-lg text-muted-foreground mb-8">{category.description}</p>
                                <div className="space-y-4">
                                    {category.integrations.map(integration => (
                                        <div key={integration.name} className="flex items-start gap-3">
                                            <div className="p-2 bg-secondary rounded-md">{integration.icon()}</div>
                                            <div>
                                                <h3 className="font-semibold">{integration.name}</h3>
                                                <p className="text-sm text-muted-foreground">{integration.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </section>

            {/* Coming Soon Section */}
            <section className="py-16 md:py-24 bg-background">
                <div className="container max-w-5xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold font-headline text-foreground">The Execution OS is expanding.</h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                        More integrations on the way to power your growth ecosystem.
                    </p>
                </div>
            </section>

            {/* SEO Section */}
            <section className="py-16 md:py-24">
                <div className="container max-w-4xl mx-auto space-y-12">
                    <div className="text-center">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">Why Flexoraa Execution OS Integrations?</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8 text-lg">
                        <div className="flex items-start gap-4">
                            <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                            <p><strong className="text-foreground">70% faster workflows</strong> across all your sales and support channels.</p>
                        </div>
                        <div className="flex items-start gap-4">
                            <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                            <p><strong className="text-foreground">Zero human error</strong> with fully automated, real-time data synchronization.</p>
                        </div>
                        <div className="flex items-start gap-4">
                            <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                            <p><strong className="text-foreground">Cross-channel identity recognition</strong> (WhatsApp ↔ Gmail ↔ Instagram).</p>
                        </div>
                        <div className="flex items-start gap-4">
                            <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                            <p><strong className="text-foreground">Secure, official connections</strong> with Meta, Google, Microsoft, and leading CRMs.</p>
                        </div>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-6 flex items-center gap-4 border">
                        <Lock className="h-8 w-8 text-primary flex-shrink-0" />
                        <p className="text-muted-foreground">
                            <strong>Trust Badge:</strong> Built on official Meta, Google, Microsoft, and CRM connections. Secure, reliable, and always under your control.
                        </p>
                    </div>
                    <div className="pt-8">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold font-headline">FAQs</h2>
                        </div>
                        <Accordion type="single" collapsible className="w-full">
                            {faqs.map((faq, index) => (
                                <AccordionItem key={index} value={`item-${index}`}>
                                    <AccordionTrigger className="text-lg text-left hover:no-underline">{faq.question}</AccordionTrigger>
                                    <AccordionContent className="text-base text-muted-foreground">
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            </section>


            {/* CTA Banner Section */}
            <section className="flex flex-col items-center justify-center bg-background p-4">
                <AnimatedCta
                    title="Automate 70% of Your Workflow"
                    subtitle="Flexoraa gives your business the power of automated productivity, slashing costs and letting your team focus on the 30% of high-impact work that truly matters."
                    buttonText="Run on Flexoraa"
                    buttonLink="/pricing"
                />
            </section>
           
        </div>
    );
}
