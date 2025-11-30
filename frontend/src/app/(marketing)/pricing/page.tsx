import Banner from '@/components/Banner';
import { agentOSPlans, leadOSPlans } from '@/components/data/pricingData'
import PricingTiers from '@/components/features/FlexoraaPricingTiers'
import NewPricingTires from '@/components/features/NewPricingTires';
import PricingCard from '@/components/features/PricingCard';
import React from 'react'

export const dynamic = 'force-dynamic';

export const onboardingTrialPlan = {
  name: 'Onboarding Trial',
  plan: 'onboarding-trial',
  tagline: '600 Lead Verifications',
  description: 'Risk-free trial designed for validation before scaling.',
  price: '₹599',
  amountInPaisa: 599000,
  priceDetails: '/ One-Time',
  features: [
    "Full Access to AI Filtering & Scoring Systems",
    "Performance Report with Sales Cost Projections",
    "Integrated Call Verification + Outreach Trigger",
    "One-Time Lead Upload & Analysis",
    "SDR Cost-to-Conversion Calculator",
    "Ideal for institutional buyers & proof-of-concept teams",
  ],
  buttonText: 'Start Trial',
};


function page() {
  return (
    <div>

      <Banner 
                title={
                    <>
                        Flexible Pricing for Every
                        <span className="text-transparent bg-clip-text bg-gradient-to-r  from-red-500 via-yellow-600 to-yellow-300 ">
                            {''} Business
                        </span>
                    </>
                }
                subtitle="Choose the right plan for your team. Start with our powerful AI models and scale as you grow."
                className="h-[60vh] sm:h-[50vh] md:h-[35vh] lg:h-[50vh]"
              
            />
      
        
        <NewPricingTires
        title="Flexoraa LeadOS Pricing Tiers"
        description="AI-Powered Lead Qualification & Prioritization Engine for Sales-Driven Teams. Maximize conversions. Minimize SDR inefficiencies. Optimize every outreach."
        plans={leadOSPlans}
        />
        <section className="pt-0 top-0 pb-15 flex justify-center bg-background">
      <div className='px-4 min-h-screen bg-background py-16 p-4 md:px-5 lg:px-20 sm:px-0'>
        <PricingCard plan={onboardingTrialPlan } />
      </div>
    </section>
      
      

      <PricingTiers
        title="AgentOS: Multi-Channel AI Conversation Engine"
        description="AI-powered system that manages conversations across WhatsApp, Instagram, Facebook Messenger, and Gmail — qualifying leads, tagging them as Hot/Warm/Cold, and syncing all chats to your premium sales dashboard."
        plans={agentOSPlans}
      />
    </div>
  )
}

export default page
