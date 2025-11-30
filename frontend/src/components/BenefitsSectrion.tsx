'use client';

import React from 'react';
import { UserCheck, BrainCircuit, Workflow, LinkIcon, Bell, Mail, MessageCircle, BarChart2, Tag, Lock } from 'lucide-react';
import { StatNode } from '@/components/ui/StatNode';

// For better reusability, this data could be passed in as a prop.
const leadosBenefits = [
    { icon: <UserCheck className="h-10 w-10" />, title: "Unified Omnichannel Inbox", description: "Pull DMs, messages, and comments from Instagram, Facebook, and WhatsApp into one powerful dashboard.", stat: { target: 3, suffix: "x", label: "Faster Response Time", trend: "up" } },
    { icon: <BrainCircuit className="h-10 w-10" />, title: "Conversational AI That Sells", description: "Our AI uses psychological triggers and persuasive language to guide leads to book—just like your top closer.", stat: { target: 40, suffix: "%", label: "Increase in Lead Conversion", trend: "up" } },
    { icon: <Workflow className="h-10 w-10" />, title: "Intelligent Lead Routing", description: "Automatically assign leads to the right SDRs based on platform, product, or lead temperature.", stat: { target: 98, suffix: "%", label: "Lead Assignment Accuracy", trend: "up" } },
    { icon: <LinkIcon className="h-10 w-10" />, title: "Automated Appointment Booking", description: "Once the AI qualifies a lead, AgentOS sends a branded calendar link to lock in the next step.", stat: { target: 75, suffix: "%", label: "Reduction in Scheduling Time", trend: "down" } },
    { icon: <Bell className="h-10 w-10" />, title: "Perfectly-Timed SDR Alerts", description: "On the appointment date, your SDRs get a notification with all lead context, ensuring every call is personal.", stat: { target: 100, suffix: "%", label: "Timely Follow-up Rate" } },
    { icon: <Mail className="h-10 w-10" />, title: "White-Labeled Weekly Reports", description: "Impress clients with beautiful, branded reports via Gmail, detailing lead breakdowns and top content.", stat: { target: 90, suffix: "%", label: "Reduction in Manual Reporting", trend: "down" } },
    { icon: <MessageCircle className="h-10 w-10" />, title: "Social Listening & Engagement", description: "AgentOS monitors mentions, tags, comments, and UGC. Reply instantly or flag hot conversations.", stat: { target: 50, suffix: "%", label: "Increase in Social Engagement", trend: "up" } },
    { icon: <BarChart2 className="h-10 w-10" />, title: "Actionable Performance Analytics", description: "See which posts are driving inquiries, what time your audience is most active to inform your sales strategy.", stat: { target: 20, suffix: "%", label: "More Data-Driven Decisions", trend: "up" } },
    { icon: <Tag className="h-10 w-10" />, title: "Custom Lead Management", description: "Add custom statuses, notes, and tags to build your own lead flow and stay organized.", stat: { target: 100, suffix: "%", label: "Pipeline Customization" } },
    { icon: <Lock className="h-10 w-10" />, title: "Zero Lead Leakage", description: "Every message, comment, and DM is tracked, engaged, and followed up with. Never miss a potential customer.", stat: { target: 100, suffix: "%", label: "Lead Capture Rate" } }
];

/**
 * A section to display the key benefits of AgentOS in a grid layout.
 * It uses the StatNode component to feature animated statistics.
 */
export const BenefitsSection = () => {
    return (
        <section className="py-20 md:py-24 bg-background">
            <div className="container">
                <div className="text-center mb-12 md:mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold font-headline text-foreground">AgentOS – AI That Handles Your DMs, 24/7</h2>
                    <p className="mt-2 text-muted-foreground max-w-2xl mx-auto text-lg">
                        Built for businesses who get DMs but lose deals due to slow or missed responses.
                    </p>
                </div>
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {leadosBenefits.map((benefit, index) => (
                            <StatNode
                                key={index}
                                icon={benefit.icon}
                                target={benefit.stat.target}
                                suffix={benefit.stat.suffix || ''}
                                label={benefit.stat.label}
                                title={benefit.title}
                                description={benefit.description}
                                trend={benefit.stat.trend as 'up' | 'down' | undefined}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};