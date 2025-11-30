import type { LucideIcon } from 'lucide-react';

export interface DashboardStat {
  title: string;
  value: string;
  href: string;
  icon: LucideIcon;
  description: string;
}


export interface DashboardLead {
  id: string;
  phone_number: string;
  email: string | null;
  status: string;
  created_at: string | null;
}

export interface LeadStage {
  name: string;
  value: number;
}


export interface FunnelStage {
  stage: string;
  count: number;
}



export interface CampaignPoint {
  date: string;
  verified: number;
  hotLeads: number;
  qualifiedLeads: number;
  start_date: string;
  end_date:string;
}


export interface CampaignLeads {
  id: string;
  campaign_id: string;
  lead_id: string;
  first_message_time:string;
  last_message_time:string;
  status:string|null;
}



export interface RevenuePoint {
  name: string;
  value: number;
}

