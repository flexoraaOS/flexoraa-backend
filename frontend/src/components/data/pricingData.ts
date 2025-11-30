import { Plan } from '@/lib/types/paymentsTypes';

// --- INTERFACE FOR PRICING PLANS ---
export interface Plan {
  name: string;
  plan: string; // A unique identifier for the plan
  tagline: string;
  description: string;
  price: string;
  amountInPaisa: number; // The actual amount for payment processing
  priceDetails?: string;
  features: string[];
  buttonText: string;
  isRecommended?: boolean;
  isCustom?: boolean;
}

// --- DATA FOR FLEXORAA LEADOS ---
export const leadOSPlans: Plan[] = [
  {
    name: 'Starter',
    plan: 'leados-starter',
    tagline: '10,000 Lead Verifications',
    description: 'Ideal for lean sales teams. WhatsApp API Cost: ₹0.78 per valid lead (paid directly to Meta).',
    price: '₹7,999',
    amountInPaisa: 799900,
    priceDetails: '/ month',
    features: [
      'Clients must provide their own WhatsApp API for automation',
      'AI-Based Lead Qualification (Hot/Warm/Cold)',
      'Ping-back Number Verification',
      'Automated WhatsApp First Touch',
      'Daily Funnel & Lead Summary Reports (CSV)',
      'Basic SDR Cost Simulator',
      'Single Batch Data Upload (Monthly)',
      '7-Day Data Retention',
    ],
    buttonText: 'Choose Starter',
  },
  {
    name: 'Growth',
    plan: 'leados-growth',
    tagline: '25,000 Lead Verifications',
    description: 'For mid-size teams. WhatsApp API Cost: ₹0.78 per valid lead (paid directly to Meta).',
    price: '₹14,999',
    amountInPaisa: 1499900,
    priceDetails: '/ month',
    features: [
      "Everything in Starter, plus:",
      "Dynamic Lead Scoring Engine",
      "Multi-Stage WhatsApp Follow-Up Sequences",
      "Real-Time ROI & Cost-per-Sale Dashboard",
      "Campaign Intelligence Panel",
      "Drag-and-Drop Visual Pipeline",
      "30-Day Data Retention",
      "3 Admin & SDR User Licenses",
    ],
    buttonText: 'Choose Growth',
    isRecommended: true,
  },
  {
    name: 'Pro',
    plan: 'leados-pro',
    tagline: '50,000 Lead Verifications',
    description: 'For high-velocity teams. WhatsApp API Cost: ₹0.78 per valid lead (paid directly to Meta).',
    price: '₹26,999',
    amountInPaisa: 2699900,
    priceDetails: '/ month',
    features: [
      "Everything in Growth, plus:",
      "AI-Generated WhatsApp Replies",
      "Automated Appointment Booking Agent",
      "SDR Leaderboard & Gamification",
      "Revenue Forecasting Dashboard",
      "Native CRM Integrations (Zoho, HubSpot)",
      "Lead Privacy & Access Controls",
      "60-Day Data Retention",
      "5 Admin & SDR User Licenses",
    ],
    buttonText: 'Choose Pro',
  },
  {
    name: 'Enterprise',
    plan: 'leados-enterprise',
    tagline: 'Unlimited Verifications',
    description: 'For large-scale operations with custom needs.',
    price: 'Custom',
    amountInPaisa: -1,
    features: [
      'Everything in Pro, plus:',
      'Custom Lead Volume & Integrations',
      'Dedicated Onboarding & Support',
      'Full API Access',
      'Bespoke AI Model Training',
    ],
    buttonText: 'Contact Sales',
    isCustom: true,
  },
];

// --- DATA FOR AGENTOS ---
export const agentOSPlans: Plan[] = [
    {
        name: 'Demo',
        plan: 'agentos-demo',
        tagline: '50 Conversations Free',
        description: 'Valid for 7 Days. WhatsApp not included.',
        price: '₹0',
        amountInPaisa: 0,
        features: [
            'Channels: IG, Facebook, Gmail',
            'AI Smart Tagging (Hot, Warm, Cold)',
            'Unified Inbox (Preview)',
            'Basic AI Auto-Responses',
            'No API Access or Human Handover',
        ],
        buttonText: 'Start Free Demo',
    },
    {
        name: 'Starter',
        plan: 'agentos-starter',
        tagline: '2,000 Conversations',
        description: 'WhatsApp API Cost: ₹0.78 x 2,000 = ₹1,560 (paid to Meta directly)',
        price: '₹4,999',
        amountInPaisa: 499900,
        priceDetails: '/ month',
        features: [
          "All Channels: WhatsApp, IG, FB, Gmail",
          "Unified Chat Inbox",
          "AI Smart Tagging",
          "Human Handover to SDRs",
          "Basic Analytics Dashboard",
          "7-Day Support Access",
        ],
        buttonText: 'Choose Starter',
    },
    {
        name: 'Growth',
        plan: 'agentos-growth',
        tagline: '5,000 Conversations',
        description: 'WhatsApp API Cost: ₹0.78 x 5,000 = ₹3,900 (paid to Meta directly)',
        price: '₹9,999',
        amountInPaisa: 999900,
        priceDetails: '/ month',
        features: [
            'Everything in Starter, plus:',
            'Conversational AI That Sells',
            'Automated Appointment Booking',
            'Intelligent Lead Routing',
            'Priority Support',
        ],
        buttonText: 'Choose Growth',
        isRecommended: true,
    },
    {
        name: 'Pro',
        plan: 'agentos-pro',
        tagline: '10,000 Conversations',
        description: 'WhatsApp API Cost: ₹0.78 x 10,000 = ₹7,800 (paid to Meta directly)',
        price: '₹18,999',
        amountInPaisa: 1899900,
        priceDetails: '/ month',
        features: [
          "Everything in Growth, plus:",
          "Advanced Social Listening (Tags, Mentions)",
          "Real-Time Performance Analytics",
          "Custom Lead Statuses & Tags",
          "Role-Based Access for Teams",
          "API Integration Support",
        ],
        buttonText: 'Choose Pro',
    },
    {
        name: 'Enterprise',
        plan: 'agentos-enterprise',
        tagline: '15K – 100K+ Conversations',
        description: 'For teams with high volume or special needs.',
        price: 'Custom Pricing',
        amountInPaisa: -1,
        features: [
            'Everything in Pro, plus:',
            'Fully Tailored Conversation Plans',
            'Dedicated Account Manager & SLA',
            'Bespoke AI Persuasion Models',
            'WhatsApp Green Tick Setup',
        ],
        buttonText: 'Contact Sales',
        isCustom: true,
    },
];

