import { useEffect, useState } from "react";
import type { Lead } from "@/lib/types/leadTypes";
import { createClient } from "@/lib/api/supabase-client";

export interface Appointment {
  id: string;
  created_at: string;
  user_id: string;
  lead_id: string;
  start_time: string;
  end_time: string;
  title: string;
  description?: string;
  status: "scheduled" | "completed" | "canceled" | "rescheduled" | "no-show";
  location?: string;
  timezone?: string;
  updated_at?: string;
}

interface DailyPoint {
  name: string;
  dateISO: string;
  uploaded: number;
  verified: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  pendingLeads: number;
  failedLeads: number;
  verificationRate: number;
}

export interface LeadStageDatum {
  stage: string;
  count: number;
  fill?: string;
}

interface DashboardData {
  campaigns: DailyPoint[];
  appointments: Appointment[];
  stages: LeadStageDatum[];
}

function toLocalDateISOFromParts(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d, 0, 0, 0, 0); 
  return dt.toISOString(); 
}

function startOfLocalDayISO(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
}
function endOfLocalDayISO(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
}

function toDateOnlyLocalISO(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function makeLabel(dateISO: string) {
  return new Date(dateISO).toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

function enumerateLocalDates(fromISODateOnly: string, toISODateOnly: string) {
  const arr: string[] = [];
  const [fy, fm, fd] = fromISODateOnly.split("-").map(Number);
  const [ty, tm, td] = toISODateOnly.split("-").map(Number);
  const cur = new Date(fy, fm - 1, fd, 0, 0, 0, 0);
  const end = new Date(ty, tm - 1, td, 0, 0, 0, 0);
  while (cur <= end) {
    arr.push(toDateOnlyLocalISO(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return arr;
}

export function useDashboardData(dateRange: { from?: string; to?: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {


    async function fetchLeads(fromISO?: string, toISO?: string) {
      const supabase = createClient();
      let q = supabase.from("leads").select("id,created_at,status,temperature").order("created_at", { ascending: true });
      if (fromISO) q = q.gte("created_at", fromISO);
      if (toISO) q = q.lte("created_at", toISO);
      const { data: rows, error: e } = await q;
      if (e) throw e;
      return (rows || []) as Lead[];
    }

    async function fetchAppointments(fromISO?: string, toISO?: string) {
      const supabase = createClient();
      let q = supabase.from("appointments").select("*").order("start_time", { ascending: true });
      if (fromISO) q = q.gte("start_time", fromISO);
      if (toISO) q = q.lte("start_time", toISO);
      const { data: rows, error: e } = await q;
      if (e) throw e;
      return (rows || []) as Appointment[];
    }

    async function run() {
      setLoading(true);
      setError(null);

      try {
        // build local-day inclusive boundaries (user timezone)
        let fromDateOnly: string | undefined = undefined; // "YYYY-MM-DD"
        let toDateOnly: string | undefined = undefined;
        let fromISO: string | undefined = undefined; // full ISO for DB
        let toISO: string | undefined = undefined;

        if (dateRange.from) {
          fromDateOnly = dateRange.from; // assumed "yyyy-MM-dd"
          fromISO = startOfLocalDayISO(dateRange.from);
        }
        if (dateRange.to) {
          toDateOnly = dateRange.to;
          toISO = endOfLocalDayISO(dateRange.to);
        }

        console.log("[useDashboardData] dateRange:", dateRange, { fromISO, toISO });

        const [leadRows, appointmentRows] = await Promise.all([
          fetchLeads(fromISO, toISO),
          fetchAppointments(fromISO, toISO),
        ]);
        console.log("[useDashboardData] fetched leads:", leadRows.length, leadRows.slice(0, 5));
        console.log("[useDashboardData] fetched appointments:", appointmentRows.length, appointmentRows.slice(0, 5));

        const map: Record<string, DailyPoint> = {};
        for (const l of leadRows) {
          if (!l?.created_at) continue;
          const dt = new Date(l.created_at);
          const dateOnly = toDateOnlyLocalISO(dt);
          if (!map[dateOnly]) {
            map[dateOnly] = {
              name: makeLabel(dateOnly),
              dateISO: dateOnly,
              uploaded: 0,
              verified: 0,
              hotLeads: 0,
              warmLeads:0,
              failedLeads:0,
              coldLeads:0,
              pendingLeads: 0,
              verificationRate: 0,
            };
          }

          const bucket = map[dateOnly];
          bucket.uploaded += 1;
          if (l.status === "valid") bucket.verified += 1;
          if (l.status === "pending" ) bucket.pendingLeads += 1;
          if (l.temperature === "hot") bucket.hotLeads += 1;
          if (l.temperature === "warm" ) bucket.warmLeads += 1;
          if (l.temperature === "cold" ) bucket.coldLeads += 1;
          if (l.status === "invalid" || l.status==="skipped" ) bucket.failedLeads += 1;
        }

        // pad with zero-days if range provided
        let points: DailyPoint[] = Object.values(map);
        if (fromDateOnly && toDateOnly) {
          const allDates = enumerateLocalDates(fromDateOnly, toDateOnly);
          points = allDates.map((d) => map[d] ?? {
            name: makeLabel(d),
            dateISO: d,
            uploaded: 0,
            verified: 0,
            hotLeads: 0,
            coldLeads:0,
            warmLeads:0,
            failedLeads:0,
            pendingLeads: 0,
            verificationRate: 0,
          });
        }

        // compute verificationRate and sort
        points = points
          .map(p => ({ ...p, verificationRate: p.uploaded > 0 ? (p.verified / p.uploaded) * 100 : 0 }))
          .sort((a, b) => a.dateISO.localeCompare(b.dateISO));

        console.log("[useDashboardData] final points:", points.length, points.slice(0, 6));
         const stages: LeadStageDatum[] = aggregateStages(points);

        setData({ campaigns: points, appointments: appointmentRows, stages });
      } catch (err: unknown) {
        console.error("[useDashboardData] error:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        setData({ campaigns: [], appointments: [], stages: [] });
      } finally {
        setLoading(false);
      }
    }

    run();

  }, [dateRange?.from, dateRange?.to]);

  return { data, loading, error };
}


function aggregateStages(points: DailyPoint[]): LeadStageDatum[] {
  const totals = {
    verified: 0,
    hotLeads: 0,
    warmLeads: 0,
    coldLeads: 0,
    pendingLeads: 0,
    failedLeads: 0,
  };

  for (const p of points) {
    totals.verified += p.verified;
    totals.hotLeads += p.hotLeads;
    totals.warmLeads += p.warmLeads;
    totals.coldLeads += p.coldLeads;
    totals.pendingLeads += p.pendingLeads;
    totals.failedLeads += p.failedLeads;
  }

  return [
    { stage: "Verified", count: totals.verified },
    { stage: "Hot", count: totals.hotLeads },
    { stage: "Warm", count: totals.warmLeads },
    { stage: "Cold", count: totals.coldLeads },
    { stage: "Pending", count: totals.pendingLeads },
    { stage: "Failed", count: totals.failedLeads },
  ];
}
