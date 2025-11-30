'use client';

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqs } from '@/lib/data';

export default function FaqSection() {
    return (
        <section id="faq" className="py-20 md:py-24 bg-background">
            <div className="container max-w-3xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold font-headline text-foreground">Frequently Asked Questions</h2>
                    <p className="mt-2 text-muted-foreground">Find answers to common questions about LeadOS.</p>
                </div>
                <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq: any, index: any) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                            <AccordionTrigger className="text-lg hover:no-underline">{faq.question}</AccordionTrigger>
                            <AccordionContent className="text-base text-muted-foreground">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    );
}
