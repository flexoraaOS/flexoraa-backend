import React from 'react';
import { Link, Bot, Tag, CalendarCheck, Phone, FileText, Monitor, Edit3, ShieldCheck, BotIcon } from 'lucide-react';
import { ProcessCarousel, ProcessStep } from './ProcessCarousal'; 

const steps: ProcessStep[] = [
  { step: 1, title: 'Lead Entry', description: 'Leads from Instagram, Facebook, and WhatsApp sync automatically into AgentOS.', icon: Link },
  { step: 2, title: 'AI Activation', description: 'The AI initiates smart, psychology-based conversations to engage and qualify leads.', icon: Bot },
  { step: 3, title: 'Lead Qualification', description: 'Leads are auto-qualified as Hot, Warm, or Cold based on their buying signals.', icon: Tag },
  { step: 4, title: 'Auto-Assignment to SDR', description: 'Leads are routed to the right SDR based on platform, temperature, or product line.', icon: BotIcon },
  { step: 5, title: 'Appointment Booking', description: 'AgentOS sends branded calendar links to interested leads, and confirms the booking in-chat.', icon: CalendarCheck },
  { step: 6, title: 'SDR Follow-up Call', description: 'SDRs receive alerts and context, ensuring every call is timely and personal.', icon: Phone },
  { step: 7, title: 'Weekly Gmail Report', description: 'You receive white-labeled reports with lead stats, SDR performance, and content insights.', icon: FileText },
  { step: 8, title: 'Brand Monitoring', description: 'AgentOS tracks mentions, UGC, comments, and tags, flagging hot conversations for your team.', icon: Monitor },
  { step: 9, title: 'Manual Notes & Tags', description: 'SDRs can add custom notes, labels, and tags to organize their lead flow.', icon: Edit3 },
  { step: 10, title: 'Anti-Lead Leakage Guard', description: 'All interactions are logged and follow-up reminders are triggered to ensure zero wastage.', icon: ShieldCheck },
];

export default function Workflow() {
  return (
    <section className=" bg-black flex flex-col justify-center scrollbar-hide px-5 " >
        {/* You can add a title here if you want */}
        {/* <h2 className="text-4xl font-bold text-white text-center mb-8">Our Workflow</h2> */}
      <ProcessCarousel steps={steps} />
    </section>
  );
}