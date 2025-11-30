// src/components/dashboard/data.ts
import { subDays } from 'date-fns';

// Type Definitions
export type ClientData = {
  client: string;
  industry: string;
  contact: string;
  product: string;
  status: 'Active' | 'Inactive';
  contractStart: string;
  contractEnd: string;
  plan: string;
  accountManager: string;
  leadOsCredits: number;
  leadOsMax: number;
  agentOsCredits: number;
  agentOsMax: number;
  avatarHint: string;
};

// All your data objects go here...
export const businessKPIs = {
    activeClients: { total: 42, new: 5, churned: 1 },
    mrr: 45231,
    arr: 45231 * 12,
    retention: 97.6,
};

export const leadOsAnalytics = {
    executions: 250000,
    accuracy: 96.5,
    costSaved: 28500,
};

export const agentOsAnalytics = {
    inboundLeads: 8850,
    persuasionSuccess: 22.3,
    appointmentsBooked: 450,
};

export const systemHealth = {
    uptime: 99.98,
    errors24h: 2,
    errors7d: 15,
};

export const financialData = {
    revenue: { total: 52130, leados: 35000, agentos: 17130, recurring: 40000, topUp: 12130 },
    costs: { total: 18500, api: 12000, infra: 4500, ops: 2000 },
    profit: { gross: 52130 - 12000, net: 52130 - 18500 },
    cashBalance: 125430.50
};

export const growthData = [
    { month: 'Jan', clients: 2 },
    { month: 'Feb', clients: 3 },
    { month: 'Mar', clients: 5 },
    { month: 'Apr', clients: 4 },
    { month: 'May', clients: 6 },
    { month: 'Jun', clients: 7 },
    { month: 'Jul', clients: 5 },
];

export const initialClientManagementData: ClientData[] = [
    { client: 'Innovate Inc.', industry: 'Tech Startup', contact: 'Alice Johnson', product: 'LeadOS & AgentOS', status: 'Active', contractStart: '2023-01-15', contractEnd: '2025-01-14', plan: 'Pro', accountManager: 'John Doe', leadOsCredits: 45000, leadOsMax: 50000, agentOsCredits: 8000, agentOsMax: 10000, avatarHint: 'abstract logo' },
    { client: 'Solutions Corp.', industry: 'Consulting', contact: 'Bob Williams', product: 'LeadOS', status: 'Active', contractStart: '2023-06-01', contractEnd: '2024-05-31', plan: 'Growth', accountManager: 'Jane Smith', leadOsCredits: 18000, leadOsMax: 25000, agentOsCredits: 0, agentOsMax: 0, avatarHint: 'geometric logo' },
    { client: 'Data Dynamics', industry: 'Data Analytics', contact: 'Charlie Brown', product: 'AgentOS', status: 'Active', contractStart: '2024-03-20', contractEnd: '2025-03-19', plan: 'Starter', accountManager: 'John Doe', leadOsCredits: 0, leadOsMax: 0, agentOsCredits: 4500, agentOsMax: 5000, avatarHint: 'data logo' },
    { client: 'Market Movers', industry: 'Marketing Agency', contact: 'Diana Prince', product: 'LeadOS', status: 'Inactive', contractStart: '2023-02-10', contractEnd: '2024-02-09', plan: 'Growth', accountManager: 'Jane Smith', leadOsCredits: 0, leadOsMax: 10000, agentOsCredits: 0, agentOsMax: 0, avatarHint: 'marketing logo' },
];

// ... and so on for all other data constants.