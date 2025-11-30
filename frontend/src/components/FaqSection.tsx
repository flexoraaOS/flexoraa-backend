"use client"; 

import { useState } from 'react';
import FaqItem from './FaqItem';
import { FAQ } from '@/lib/data';

interface FaqSectionProps {
  faqs: FAQ[];
  title: string;
  subtitle: string;
}

const FaqSection = ({ faqs, title, subtitle }: FaqSectionProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full bg-background text-foreground py-12 sm:py-16 md:py-20 lg:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg leading-6 sm:leading-7 md:leading-8 text-muted-foreground px-2">
            {subtitle}
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="mt-8 sm:mt-10 md:mt-12">
          {faqs.map((faq, index) => (
            <FaqItem 
              key={faq.question} 
              question={faq.question} 
              answer={faq.answer}
              isOpen={openIndex === index}
              onToggle={() => handleToggle(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;