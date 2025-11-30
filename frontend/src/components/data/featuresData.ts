import {
  ShieldCheck,
  Flame,
  TrendingUp,
  BotMessageSquare,
  CalendarCheck,
  Clock,
  Move,
  Phone,
  BarChart3,
  BarChart2,
  PieChart,
  Lock,
  DownloadCloud,
  Calculator,
  Users,
  Trophy,
  type LucideIcon,
  Inbox,
  Bot,
  Share2,
  Bell,
  FileText,
  Megaphone,
  Funnel,
  Settings2,
} from "lucide-react";
export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  statPercentage: number;
  statDescription: string;
  statTrend: "up" | "down";
}

export const LeadOSFeatures: Feature[] = [
  {
    icon: ShieldCheck ,
    title: "Spam-Proof Your Pipeline",
    description:
      "Our AI pings every number with advanced verification tech, instantly filtering out fake, inactive, or switched-off leads. Stop wasting time and money on dead ends.",
    statPercentage: 99,
    statDescription: "Spam Lead Elimination",
    statTrend: "up",
  },
  {
    icon: Flame,
    title: "Automated Lead Qualification",
    description:
      "The AI engages leads on WhatsApp and intelligently categorizes them as HOT, WARM, or COLD based on their real-time responses and intent. Your team knows exactly who to prioritize.",
    statPercentage: 43,
    statDescription: "Higher Conversion Rate",
    statTrend: "up",
  },
  {
    icon: TrendingUp,
    title: "Dynamic Lead Scoring Engine",
    description:
      "Each lead gets a dynamic score based on interest, behavior, and campaign source. Your SDRs know who to chase first, maximizing their impact and closing speed.",
    statPercentage: 80,
    statDescription: "Enhanced Prioritization",
    statTrend: "up",
  },
  {
    icon: BotMessageSquare,
    title: "AI-Generated Smart Replies",
    description:
      "Save hours with AI that drafts smart, conversion-optimized WhatsApp messages in your brand’s tone. Eliminate writer’s block and maintain consistent quality.",
    statPercentage: 95,
    statDescription: "Less Time on Follow-ups",
    statTrend: "down",
  },
  {
    icon: CalendarCheck,
    title: "Automated Follow-Up Calendar",
    description:
      "Never miss a follow-up again. LeadOS provides auto-reminders and scheduling built right into your SDR’s WhatsApp workflow, ensuring no lead falls through the cracks.",
    statPercentage: 100,
    statDescription: "Follow-Up Rate Maintained",
    statTrend: "up",
  },
  {
    icon: Clock,
    title: "Full Lead Timeline & Logs",
    description:
      "Track the full journey of every lead with a detailed timeline, including every WhatsApp interaction. Complete visibility builds trust and speeds up closing.",
    statPercentage: 360,
    statDescription: "Complete Lead Visibility",
    statTrend: "up",
  },
  {
    icon: Move,
    title: "Drag-and-Drop Pipeline",
    description:
      "Visually manage your sales process by moving leads between stages like Trello or HubSpot. A simple, satisfying, and highly efficient SDR experience.",
    statPercentage: 50,
    statDescription: "Increase in SDR Efficiency",
    statTrend: "up",
  },
  {
    icon: Phone,
    title: "One-Click Engagement",
    description:
      "Call or message a lead directly from the dashboard with a single click. No more switching screens, copy-pasting numbers, or manual dialing. Pure speed.",
    statPercentage: 70,
    statDescription: "Reduction in Mundane Tasks",
    statTrend: "down",
  },
  {
    icon: Funnel,
    title: "Auto-Generated Funnel Reports",
    description:
      "Get a live snapshot of your funnel performance delivered every morning. Track how many leads came in, moved stages, and converted, without lifting a finger.",
    statPercentage: 24,
    statDescription: "Automated Monitoring",
    statTrend: "up",
  },
  {
    icon: BarChart2,
    title: "Drop-Off Analysis",
    description:
      "Pinpoint exactly where and why leads are slipping away from your funnel. Fix leaks with actionable data, not assumptions, and improve your process.",
    statPercentage: 25,
    statDescription: "Reduction in Lead Drop-off",
    statTrend: "down",
  },
  {
    icon: PieChart,
    title: "Campaign Intelligence Panel",
    description:
      "Discover which campaign, keyword, or landing page is delivering your best leads. Optimize your ad spend and stop wasting money on bad traffic.",
    statPercentage: 450,
    statDescription: "Return on Investment",
    statTrend: "up",
  },
  {
    icon: Lock,
    title: "Lead Privacy & Access Control",
    description:
      "Control exactly which SDR or manager sees what leads. Prevent internal poaching, protect premium client data, and maintain organizational structure.",
    statPercentage: 100,
    statDescription: "Secure Data Segregation",
    statTrend: "up",
  },
  {
    icon: DownloadCloud,
    title: "One-Click Data Export",
    description:
      "Export filtered lead lists to CSV or Excel anytime. You have full ownership of your data—no lock-in, ever. Your data is always yours.",
    statPercentage: 1,
    statDescription: "Data Portability",
    statTrend: "up",
  },
  {
    icon: Calculator,
    title: "Built-in ROI Calculator",
    description:
      "See your return on investment in real-time, calculated per campaign, per SDR, or for the entire operation. Make data-driven decisions with confidence.",
    statPercentage: 90,
    statDescription: "SDR Cost Reduction",
    statTrend: "down",
  },
  {
    icon: Users,
    title: "Role-Based Dashboards",
    description:
      "Managers get a high-level view of funnel reports, ROI, and team performance. SDRs get a streamlined toolkit designed for high-speed conversion and lead handling.",
    statPercentage: 2,
    statDescription: "Faster Decision Making",
    statTrend: "up",
  },
  {
    icon: Trophy,
    title: "Guaranteed Positive ROI",
    description:
      "We are so confident in our model that we prove its value. If our system doesn't deliver a tangible return, you don't risk your investment.",
    statPercentage: 10,
    statDescription: "Potential Revenue Growth",
    statTrend: "up",
  },
];

export const AgentOSFeatures: Feature[] = [
  {
    icon: Inbox,
    title: "Unified Omnichannel Inbox",
    description:
      "Pull DMs, messages, and comments from Instagram, Facebook, and WhatsApp into one powerful dashboard. No more switching between platforms.",
    statPercentage: 3,
    statDescription: "Faster Response Time",
    statTrend: "up",
  },
  {
    icon: Bot,
    title: "Conversational AI That Sells",
    description:
      "Our AI uses psychological triggers, persuasive language, and smart intent detection to guide leads to book—just like your top closer.",
    statPercentage: 40,
    statDescription: "Increase in Lead Conversion",
    statTrend: "up",
  },
  {
    icon: Share2,
    title: "Intelligent Lead Routing",
    description:
      "Automatically assign leads to the right SDRs based on platform, product, or lead temperature. Full control, zero chaos.",
    statPercentage: 98,
    statDescription: "Lead Assignment Accuracy",
    statTrend: "up",
  },
  {
    icon: CalendarCheck,
    title: "Automated Appointment Booking",
    description:
      "Once the AI qualifies a lead, AgentOS sends a branded calendar link to lock in the next step. Stop chasing, start closing.",
    statPercentage: 75,
    statDescription: "Reduction in Scheduling Time",
    statTrend: "down",
  },
  {
    icon: Bell,
    title: "Perfectly-Timed SDR Alerts",
    description:
      "On the appointment date, your SDRs get a notification with all lead context, ensuring every call feels personal and timely.",
    statPercentage: 100,
    statDescription: "Timely Follow-up Rate",
    statTrend: "up",
  },
  {
    icon: FileText,
    title: "White-Labeled Weekly Reports",
    description:
      "Impress clients with beautiful, branded reports via Gmail, detailing lead breakdowns, top content, and engagement stats.",
    statPercentage: 90,
    statDescription: "Reduction in Manual Reporting",
    statTrend: "down",
  },
  {
    icon: Megaphone,
    title: "Social Listening & Engagement",
    description:
      "AgentOS monitors mentions, tags, comments, and UGC on Instagram and Facebook. Reply instantly or flag hot conversations.",
    statPercentage: 50,
    statDescription: "Increase in Social Engagement",
    statTrend: "up",
  },
  {
    icon: BarChart3,
    title: "Actionable Performance Analytics",
    description:
      "See which posts are driving inquiries, which stories generate clicks, and what time your audience is most active to inform your sales strategy.",
    statPercentage: 20,
    statDescription: "More Data-Driven Decisions",
    statTrend: "up",
  },
  {
    icon: Settings2,
    title: "Custom Lead Management",
    description:
      "Hot, Warm, Cold, Interested, Ghosted. Add custom statuses, notes, and tags to build your own lead flow and stay organized.",
    statPercentage: 100,
    statDescription: "Pipeline Customization",
    statTrend: "up",
  },
  {
    icon: ShieldCheck,
    title: "Zero Lead Leakage",
    description:
      "Every message, comment, and DM is tracked, engaged, and followed up with. Never miss a potential customer again.",
    statPercentage: 100,
    statDescription: "Lead Capture Rate",
    statTrend: "up",
  },
];
