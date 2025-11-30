import { ShieldCheck, Flame, TrendingUp, Bot, CalendarCheck, GitPullRequest, TrelloIcon, Phone, BarChart3, Filter, Search, Lock, Download, Wallet, Users, Trophy, UploadCloud, MessageSquare, BarChart2 } from 'lucide-react';

const leadosBenefits = [
    {
        icon: <ShieldCheck className="h-10 w-10" />,
        title: "Spam-Proof Your Pipeline",
        description: "Our AI pings every number with advanced verification tech, instantly filtering out fake, inactive, or switched-off leads. Stop wasting time and money on dead ends.",
        stat: { target: 99, suffix: "%", label: "Spam Lead Elimination", trend: "up" }
    },
    {
        icon: <Flame className="h-10 w-10" />,
        title: "Automated Lead Qualification",
        description: "The AI engages leads on WhatsApp and intelligently categorizes them as HOT, WARM, or COLD based on their real-time responses and intent. Your team knows exactly who to prioritize.",
        stat: { target: 43, suffix: "%", label: "Higher Conversion Rate", trend: "up" }
    },
    {
        icon: <TrendingUp className="h-10 w-10" />,
        title: "Dynamic Lead Scoring Engine",
        description: "Each lead gets a dynamic score based on interest, behavior, and campaign source. Your SDRs know who to chase first, maximizing their impact and closing speed.",
        stat: { target: 80, suffix: "%", label: "Faster Lead Prioritization", trend: "up" }
    },
    {
        icon: <Bot className="h-10 w-10" />,
        title: "AI-Generated Smart Replies",
        description: "Save hours with AI that drafts smart, conversion-optimized WhatsApp messages in your brand's tone. Eliminate writer's block and maintain consistent quality.",
        stat: { target: 95, suffix: "%", label: "Less Time on Follow-ups", trend: "down" }
    },
    {
        icon: <CalendarCheck className="h-10 w-10" />,
        title: "Automated Follow-Up Calendar",
        description: "Never miss a follow-up again. LeadOS provides auto-reminders and scheduling built right into your SDR’s WhatsApp workflow, ensuring no lead falls through the cracks.",
        stat: { target: 100, suffix: "%", label: "Follow-up Rate Maintained", trend: "up" }
    },
    {
        icon: <GitPullRequest className="h-10 w-10" />,
        title: "Full Lead Timeline & Logs",
        description: "Track the full journey of every lead with a detailed timeline, including every WhatsApp interaction. Complete visibility builds trust and speeds up closing.",
        stat: { target: 360, suffix: "°", label: "Complete Lead Visibility", isTime: true }
    },
    {
        icon: <TrelloIcon className="h-10 w-10" />,
        title: "Drag-and-Drop Pipeline",
        description: "Visually manage your sales process by moving leads between stages like Trello or HubSpot. A simple, satisfying, and highly efficient SDR experience.",
        stat: { target: 50, suffix: "%", label: "Increase in SDR Efficiency", trend: "up" }
    },
    {
        icon: <Phone className="h-10 w-10" />,
        title: "One-Click Engagement",
        description: "Call or message a lead directly from the dashboard with a single click. No more switching screens, copy-pasting numbers, or manual dialing. Pure speed.",
        stat: { target: 70, suffix: "%", label: "Reduction in Mundane Tasks", trend: "down" }
    },
    {
        icon: <BarChart3 className="h-10 w-10" />,
        title: "Auto-Generated Funnel Reports",
        description: "Get a live snapshot of your funnel performance delivered every morning. Track how many leads came in, moved stages, and converted, without lifting a finger.",
        stat: { target: 24, suffix: "/7", label: "Automated Monitoring", isTime: true }
    },
    {
        icon: <Filter className="h-10 w-10" />,
        title: "Drop-Off Analysis",
        description: "Pinpoint exactly where and why leads are slipping away from your funnel. Fix leaks with actionable data, not assumptions, and improve your process.",
        stat: { target: 25, suffix: "%", label: "Reduction in Lead Drop-off", trend: "down" }
    },
    {
        icon: <Search className="h-10 w-10" />,
        title: "Campaign Intelligence Panel",
        description: "Discover which campaign, keyword, or landing page is delivering your best leads. Optimize your ad spend and stop wasting money on bad traffic.",
        stat: { target: 450, suffix: "+%", label: "Return on Investment", trend: "up" }
    },
    {
        icon: <Lock className="h-10 w-10" />,
        title: "Lead Privacy & Access Control",
        description: "Control exactly which SDR or manager sees what leads. Prevent internal poaching, protect premium client data, and maintain organizational structure.",
        stat: { target: 100, suffix: "%", label: "Secure Data Segregation" }
    },
    {
        icon: <Download className="h-10 w-10" />,
        title: "One-Click Data Export",
        description: "Export filtered lead lists to CSV or Excel anytime. You have full ownership of your data—no lock-in, ever. Your data is always yours.",
        stat: { target: 1, suffix: "-Click", label: "Data Portability", isTime: true }
    },
    {
        icon: <Wallet className="h-10 w-10" />,
        title: "Built-in ROI Calculator",
        description: "See your return on investment in real-time, calculated per campaign, per SDR, or for the entire operation. Make data-driven decisions with confidence.",
        stat: { target: 90, suffix: "%", label: "SDR Cost Reduction", trend: "down" }
    },
    {
        icon: <Users className="h-10 w-10" />,
        title: "Role-Based Dashboards",
        description: "Managers get a high-level view of funnel reports, ROI, and team performance. SDRs get a streamlined toolkit designed for high-speed conversion and lead handling.",
        stat: { target: 2, suffix: "X", label: "Faster Decision Making", trend: "up" }
    },
    {
        icon: <Trophy className="h-10 w-10" />,
        title: "Guaranteed Positive ROI",
        description: "We are so confident in our model that we prove its value. If our system doesn't deliver a tangible return, you don't risk your investment. Your growth is backed by results.",
        stat: { target: 10, suffix: "X", label: "Potential Revenue Growth", trend: "up" }
    },
];

const workflowSteps = [
    {
        icon: <UploadCloud className="h-10 w-10" />,
        title: "1. Upload Your Leads",
        description: "Securely upload your lead list. The system ingests and prepares your data for the AI engine."
    },
    {
        icon: <Bot className="h-10 w-10" />,
        title: "2. AI Verification & Filtering",
        description: "Our AI automatically verifies each contact, filtering out invalid or inactive numbers to create a clean, high-intent list."
    },
    {
        icon: <MessageSquare className="h-10 w-10" />,
        title: "3. Automated WhatsApp Outreach",
        description: "LeadOS initiates personalized WhatsApp conversations, engaging your verified leads instantly."
    },
    {
        icon: <Flame className="h-10 w-10" />,
        title: "4. AI Scoring & Qualification",
        description: "The AI analyzes responses in real-time, scoring leads as HOT, WARM, or COLD based on their engagement and intent."
    },
    {
        icon: <CalendarCheck className="h-10 w-10" />,
        title: "5. Automated Appointment Booking",
        description: "For all HOT leads, the AI seamlessly books appointments directly into your sales team's calendar."
    },
    {
        icon: <BarChart2 className="h-10 w-10" />,
        title: "6. Monitor & Optimize",
        description: "Track everything on your dashboard. See real-time analytics, conversion rates, and ROI."
    }
];