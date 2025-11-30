import { subDays, format } from 'date-fns';

// This file contains all the mock data previously in page.tsx

export const allCampaignData = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i);
    let uploaded;
    if (i < 10) { 
        uploaded = 10000 + (1000 * i); 
    } else if (i < 20) {
        uploaded = 20000 + (1000 * (i - 10));
    } else { 
        uploaded = 30000 + Math.floor(Math.random() * 2000 - 1000);
    }
    const verified = Math.floor(uploaded * (0.35 + Math.random() * 0.1));
    const hotLeads = Math.floor(verified * (0.1 + Math.random() * 0.05));
    const qualifiedLeads = Math.floor(verified * (0.2 + Math.random() * 0.1));
    return {
        name: format(date, 'MMM d'),
        date: format(date, 'yyyy-MM-dd'),
        uploaded,
        verified,
        hotLeads,
        qualifiedLeads,
        verificationRate: parseFloat(((verified / uploaded) * 100).toFixed(1)),
    };
});

export const sdrPerformanceData = [
    {
        name: 'Samantha Ray', avatar: 'https://placehold.co/40x40/F87171/FFFFFF?text=SR',
        assigned: 167, contacted: 160, closed: 35,
        closeRate: (35/160) * 100, revenueAdded: 15750,
    },
    {
        name: 'Alex Green', avatar: 'https://placehold.co/40x40/4ADE80/FFFFFF?text=AG',
        assigned: 167, contacted: 150, closed: 25,
        closeRate: (25/150) * 100, revenueAdded: 11250,
    },
     {
        name: 'Ben Carter', avatar: 'https://placehold.co/40x40/60A5FA/FFFFFF?text=BC',
        assigned: 166, contacted: 140, closed: 20,
        closeRate: (20/140) * 100, revenueAdded: 9000,
    },
];

export const revenueData = {
    earnedRevenue: 55000,
    potentialRevenue: 75000,
    totalGoal: 150000,
};

export const leadStageData = [
    { stage: 'Verified', count: 20000, fill: "url(#gradient-verified)" },
    { stage: 'Engaged', count: 16500, fill: "url(#gradient-engaged)" },
    { stage: 'Hot', count: 2550, fill: "url(#gradient-hot)" },
    { stage: 'Warm', count: 7200, fill: "url(#gradient-warm)" },
    { stage: 'Cold', count: 6750, fill: "url(#gradient-cold)" },
    { stage: 'Failed', count: 30000, fill: "var(--muted-foreground) / 0.5)" },
];

export const leadFunnelData = [
  { status: 'Hot', leads: 2550, fill: 'var(--chart-1)' },
  { status: 'Warm', leads: 9750, fill: 'var(--chart-2)' },
  { status: 'Cold', leads: 7600, fill: 'var(--chart-3)' },
];

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const dayAfter = new Date(today);
dayAfter.setDate(dayAfter.getDate() + 2);

export const appointments = [
    { date: today, time: '10:00 AM', leadId: 'LD004', with: 'Sales Rep A', conversation: "Lead is highly interested in the enterprise plan." },
    { date: today, time: '02:00 PM', leadId: 'LD021', with: 'Sales Rep B', conversation: "Lead is evaluating several options and is in the early stages." },
    { date: tomorrow, time: '11:30 AM', leadId: 'LD008', with: 'Sales Rep A', conversation: "This lead was a referral." },
];
