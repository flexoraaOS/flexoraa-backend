import { createClient } from "@/lib/api/supabase-client";
import { Users, CheckCircle, Zap, Flame } from "lucide-react";

export interface DashboardStat {
  title: string;
  value: string;
  href: string;
  icon: any;
  description: React.ReactNode;
}

export async function getDashboardStats(): Promise<DashboardStat[]> {
  const supabase = createClient();
  const { count: totalLeads } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true });

  // Verified
  const { count: verifiedLeads } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("status", "valid");

  // Engaged
  const { count: engagedLeads } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("status", "processed");

  // Qualified (HOT)
  const { count: hotLeads } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("temperature", "hot");

  return [
    {
      title: "Leads Uploaded",
      value: totalLeads?.toLocaleString() ?? "0",
      href: "/dashboard/uploaded-leads",
      icon: Users,
      description: (
        <>
          <span className="text-green-400">+20%</span> from last month
        </>
      ),
    },
    {
      title: "Leads Verified",
      value: verifiedLeads?.toLocaleString() ?? "0",
      href: "/dashboard/verified-leads",
      icon: CheckCircle,
      description: (
        <>
          <span className="text-green-400">
            {totalLeads ? ((verifiedLeads! / totalLeads) * 100).toFixed(1) : 0}%
          </span>{" "}
          verification rate
        </>
      ),
    },
    {
      title: "Leads Engaged",
      value: engagedLeads?.toLocaleString() ?? "0",
      href: "/dashboard/engaged-leads",
      icon: Zap,
      description: (
        <>
          <span className="text-green-400">+15%</span> from last week
        </>
      ),
    },
    {
      title: "Qualified (HOT)",
      value: hotLeads?.toLocaleString() ?? "0",
      href: "/dashboard/qualified-leads",
      icon: Flame,
      description: (
        <>
          <span className="text-green-400">
            {totalLeads ? ((hotLeads! / totalLeads) * 100).toFixed(1) : 0}%
          </span>{" "}
          of uploaded
        </>
      ),
    },
  ];
}
