'use client';
import React from 'react';
import { motion, Variants } from 'framer-motion';
import PricingCard from './PricingCard';
import { Plan } from '../data/pricingData'; 

// PROPS INTERFACE FOR THE COMPONENT
interface NewPricingTiresProps {
  title: string;
  description: string;
  plans: Plan[];
}

// CONTAINER VARIANTS FOR STAGGERED ANIMATION
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.3 }
  }
};

// REUSABLE PRICING TIERS COMPONENT
const NewPricingTires: React.FC<NewPricingTiresProps> = ({ title, description, plans }) => (
  <div className="min-h-screen bg-background py-16 p-4 md:px-5 lg:px-20 sm:px-0">
    <div className="mx-auto max-w-3xl text-center text-2xl">
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-3xl font-extrabold  bg-clip-text bg-gradient-to-r text-foreground"
      >
        {title}
      </motion.h1>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6}}
        className="mt-4 text-lg text-muted-foreground"
      >
        {description}
      </motion.p>
    </div>

    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mt-12 px-0 sm:px-1 md:px-1 lg:px-2 grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4 items-center max "
    >
      {plans.map((plan) => (
        <PricingCard key={plan.name} plan={plan} />
      ))}
    </motion.div>
  </div>
);

export default NewPricingTires;