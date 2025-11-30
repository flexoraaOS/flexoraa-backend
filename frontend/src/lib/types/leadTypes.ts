import {  LEAD_STAGES, LEAD_STATUSES, LEAD_TEMPERATURE } from "./constants";

export interface Lead {
  id?: string;
  name?: string | null;
  user_id?: string | null;
  phone_number: string;
  created_at?: string | null;
  email?: string | null;
  tags?:string|null;
  updated_at?: string | null;
  status?: LeadStatus;
  message?: string | null;
  temperature?: string|"natural";
  campaign_id?: string | null;
  metadata?: Record<string,any> | null;
  has_whatsapp?: boolean | null;
  conversation_score?: string | 10;
  followup_date?:string|null;
  followup_time?:string|null;
  closed?:boolean;
  contacted?:boolean;
  booked_timestamp?:string|null;
  stage?:LeadStages |"new";
  note?:string|null;

}

export interface Campaign {
  id?: string;
  user_id?:string|null;
  name: string;
  description?: string | null;
  start_date?:string|null;
  end_date?:string|null;
  status?: 'draft' | 'active' | 'paused' | 'archived';
  created_at?: string |null;
  updated_at?: string | null;
  // metadata?: Record<string, any> | null;
}

export interface Contact {
  id: string;
  created_at?: string;
  name?: string | null;
  email?: string | null;
  message?: string | null;

}


export interface ContactHistory{
  id :string ;
  user_id:string ;
  campaign_id:string ;
  lead_id:string ;
  direction:string | null;
  message_text:string | null;
  message_type:string | null;
  sent_at:string | null;
}

export interface ContactData {
  name: string;
  email: string;
  message: string;
}

export interface FeedbackData {
  created_at?:string|null;
  name: string;
  email: string;
  feedback: string;
}
export interface Profiles {
  id:string|null;
  role:string;
  full_name:string|null;
}



export type LeadStatus = typeof LEAD_STATUSES[number] | (string & {});
export type LeadStages = typeof LEAD_STAGES[number] | (string & {});
export type LeadTemperature = typeof LEAD_TEMPERATURE[number] | (string & {})


export type LeadInput = {
  phone_number: string;
  status?: LeadStatus;
  team_id?: string | null;
};

export type LeadDBRow = {
  id: string;
  user_id: string | null;
  phone_number: string;
  status: LeadStatus;
  team_id: string | null;
  created_at: string | null;
  last_called_at: string | null;
};

export type LeadUpdatePayload = Partial<{
  phone_number: string;
  status: LeadStatus;
  team_id: string | null;
  last_called_at: string | null;
}> & { id: string };

export type InsertLeadResult = LeadDBRow;

export type PaginatedLeads = {
  items: LeadDBRow[];
  total: number;
  page: number;
  pageSize: number;
};

export const getErrorMessage = (error: unknown, defaultMessage = 'Something went wrong'): string => {
  if (error instanceof Error) {
    if (error.name === 'AuthRetryableFetchError') {
      return 'Could not connect to the server. Check network and try again.';
    }
    return error.message;
  }
  return defaultMessage;
};

const digitsOnly = (s: string) => s.replace(/\D/g, '');

export function normalizePhone(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const d = digitsOnly(raw);
  if (d.length === 10) {
    return `+91${d}`;
  }
  if (d.length === 11 && d.startsWith('0')) {
    return `+91${d.slice(1)}`;
  }
  if (d.length === 12 && d.startsWith('91')) {
    return `+${d}`;
  }
  return null;
}

export function isValidIndianPhone(raw: string): boolean {
  return normalizePhone(raw) !== null;
}

export function prepareLeadForInsert(input: LeadInput): Lead & { user_id?: string | null } {
  const normalized = normalizePhone(input.phone_number);
  if (!normalized) {
    throw new Error('Invalid phone number — must be 10 digits for India');
  }
  return {
    phone_number: normalized,
    status: input.status ?? 'pending',
    team_id: input.team_id ?? null,
  };
}




export type Message = {
  type: "user" | "ai" | "sdr";
  content: string;
};

export type Tag = {
  text: string;
  type: "info" | "warning" | "success" | "danger";
};

export type Conversation = {
  id: string;
  customer: string;
  avatar: string;
  channel: "WhatsApp" | "Instagram" | "Facebook" | "Gmail" | string;
  lastMessage: string;
  thread: Message[];
  status: "Needs Attention" | "AI Handled" | "Resolved" | string;
  timestamp: string;
  subject: string;
  tags: Tag[];
  fromEmail?: string;
  engagementScore?: number;
};