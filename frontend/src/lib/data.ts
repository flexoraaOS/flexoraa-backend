import {
  ShieldCheck,
  Flame,
  TrendingUp,
  BotMessageSquare,
  type LucideIcon,
  Calendar,
  CalendarCheck,
} from 'lucide-react';
import { CampaignPoint } from './types/dashboard';

export interface FAQ {
  question: string;
  answer: string;
}

export const faqs: FAQ[] = [
  {
    question: 'How does the AI verify leads?',
    answer:
      'LeadOS uses a combination of ping-back technology and number validation checks to confirm if a phone number is active and reachable on WhatsApp. This multi-step process effectively filters out inactive or invalid contacts before you spend any money on outreach.',
  },
  {
    question: 'Can I customize the lead scoring rules?',
    answer:
      'Yes, on our Pro and Enterprise plans. While our default model is trained on millions of interactions, you can work with our team to adjust the scoring logic based on keywords, industries, or specific user behaviors that are unique to your business.',
  },
  {
    question: 'Is my lead data secure?',
    answer:
      'Absolutely. Data security is our top priority. All data is encrypted in transit and at rest. With our Lead Privacy & Access Control features, you have granular control over which team members can see specific lead lists, ensuring confidentiality and preventing data leakage.',
  },
  {
    question: 'How does the drag-and-drop pipeline work?',
    answer:
      "It works just like a physical whiteboard or a tool like Trello. Leads appear as cards in different columns representing stages (e.g., 'New,' 'Contacted,' 'Closed'). Your SDRs can simply click and drag a lead from one column to the next to update their status, which automatically updates all related analytics.",
  },
];

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  statPercentage: number;
  statDescription: string;
  statTrend: 'up' | 'down';
}

export const featuresData: Feature[] = [
  {
    icon: ShieldCheck,
    title: 'Spam-Proof Your Pipeline',
    description:
      'Our AI pings every number with advanced verification tech, instantly filtering out fake, inactive, or switched-off leads. Stop wasting time and money on dead ends.',
    statPercentage: 99,
    statDescription: 'Spam Lead Elimination',
    statTrend: 'up',
  },
  {
    icon: Flame,
    title: 'Automated Lead Qualification',
    description:
      'The AI engages leads on WhatsApp and intelligently categorizes them as HOT, WARM, or COLD based on their real-time responses and intent. Your team knows exactly who to prioritize.',
    statPercentage: 43,
    statDescription: 'Higher Conversion Rate',
    statTrend: 'up',
  },
  {
    icon: TrendingUp,
    title: 'Dynamic Lead Scoring Engine',
    description:
      'Each lead gets a dynamic score based on interest, behavior, and campaign source. Your SDRs know who to chase first, maximizing their impact and closing speed.',
    statPercentage: 80,
    statDescription: 'Enhanced Prioritization',
    statTrend: 'up',
  },
  {
    icon: BotMessageSquare,
    title: 'AI-Generated Smart Replies',
    description:
      "Never miss a follow-up again. LeadOS provides auto-reminders and scheduling built right into your SDR’s WhatsApp workflow, ensuring no lead falls through the cracks.",
    statPercentage: 100,
    statDescription: 'Less Time on Follow-ups',
    statTrend: 'down',
  },
  {
    icon: CalendarCheck,
    title: 'Automated Follow-Up Calendar',
    description:
      "Save hours with AI that drafts smart, conversion-optimized WhatsApp messages in your brand's tone. Eliminate writer's block and maintain consistent quality.",
    statPercentage: 95,
    statDescription: 'Follow-Up Efficiency',
    statTrend: 'up',
  },
];

export const dummyFunnelData = [
  {
    temperature: "Instagram",
    leads: 150,
    fill: "#E1306C", // Insta pink
  },
  {
    temperature: "WhatsApp",
    leads: 200,
    fill: "#25D366", // WhatsApp green
  },
  {
    temperature: "Gmail",
    leads: 120,
    fill: "#EA4335", // Gmail red
  },
  {
    temperature: "Facebook",
    leads: 180,
    fill: "#1877F2", // Facebook blue
  },
];

