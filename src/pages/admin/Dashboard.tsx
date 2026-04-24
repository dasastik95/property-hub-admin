import { useQuery } from "@tanstack/react-query";
import { Activity, Building2, CheckCircle2, Clock, TrendingUp, Users as UsersIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Stats {
  totalProperties: number;
  pending: number;
  active: number;
  totalUsers: number;
  byStatus: { status: string; count: number; color: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "hsl(38 95% 50%)",
  active: "hsl(142 71% 38%)",
  rejected: "hsl(0 75% 55%)",
  sold: "hsl(217 91% 55%)",
  rented: "hsl(270 70% 55%)",
};

const Dashboard = () => {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [allProps, pendingC, activeC, usersC] = await Promise.all([
        supabase.from("properties").select("status", { count: "exact" }),
        supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);

      const counts: Record<string, number> = {};
      (allProps.data ?? []).forEach((r: { status: string }) => {
        counts[r.status] = (counts[r.status] ?? 0) + 1;
      });
      const byStatus = ["pending", "active", "rejected", "sold", "rented"].map((s) => ({
        status: s,
        count: counts[s] ?? 0,
        color: STATUS_COLORS[s],
      }));

      return {
        totalProperties: allProps.count ?? 0,
        pending: pendingC.count ?? 0,
        active: activeC.count ?? 0,
        totalUsers: usersC.count ?? 0,
        byStatus,
      };
    },
  });

  const { data: activity = [] } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: async () => {
      const { data } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  const cards = [
    { label: "Total properties", value: stats?.totalProperties ?? 0, icon: Building2, accent: "from-accent to-accent-glow" },
    { label: "Pending approvals", value: stats?.pending ?? 0, icon: Clock, accent: "from-warning to-warning" },
    { label: "Active listings", value: stats?.active ?? 0, icon: CheckCircle2, accent: "from-success to-success" },
    { label: "Total users", value: stats?.totalUsers ?? 0, icon: UsersIcon, accent: "from-info to-info" },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of platform activity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <Card key={c.label} className="shadow-soft hover:shadow-elegant transition-base overflow-hidden relative animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-sm", c.accent)}>
                  <c.icon className="h-5 w-5 text-white" />
                </div>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-3xl font-display font-bold">
                {isLoading ? <Skeleton className="h-9 w-16" /> : c.value.toLocaleString("en-IN")}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{c.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display">Listings by status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.byStatus ?? []} margin={{ top: 8, right: 8, bottom: 8, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="status" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted))" }}
                      contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {(stats?.byStatus ?? []).map((entry) => (
                        <Cell key={entry.status} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Activity className="h-4 w-4 text-accent" /> Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">No activity yet</div>
            ) : (
              <ul className="space-y-3">
                {activity.map((log) => (
                  <li key={log.id} className="flex gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-accent mt-1.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{log.action}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {log.actor_email ?? "system"} · {log.entity_type}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
