import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const PAGE_SIZE = 25;

const ActivityLogs = () => {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const [entity, setEntity] = useState("all");
  const [page, setPage] = useState(0);

  const { data: filterOpts } = useQuery({
    queryKey: ["log-filter-opts"],
    queryFn: async () => {
      const { data } = await supabase.from("activity_logs").select("action, entity_type").limit(1000);
      const actions = Array.from(new Set((data ?? []).map((r) => r.action))).sort();
      const entities = Array.from(new Set((data ?? []).map((r) => r.entity_type))).sort();
      return { actions, entities };
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["activity-logs", { search, action, entity, page }],
    queryFn: async () => {
      let q = supabase
        .from("activity_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (action !== "all") q = q.eq("action", action);
      if (entity !== "all") q = q.eq("entity_type", entity);
      if (search.trim()) q = q.ilike("actor_email", `%${search.trim()}%`);

      const { data: rows, count, error } = await q;
      if (error) throw error;
      return { rows: rows ?? [], count: count ?? 0 };
    },
  });

  const total = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Activity Logs</h1>
        <p className="text-muted-foreground">{total} event{total === 1 ? "" : "s"} recorded</p>
      </div>

      <Card className="p-4 shadow-soft">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by actor email…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
          </div>
          <Select value={action} onValueChange={(v) => { setAction(v); setPage(0); }}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Action" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {(filterOpts?.actions ?? []).map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={entity} onValueChange={(v) => { setEntity(v); setPage(0); }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Entity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All entities</SelectItem>
              {(filterOpts?.entities ?? []).map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="shadow-soft overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Entity ID</TableHead>
              <TableHead>Metadata</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
              ))
            ) : data?.rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No matching events</TableCell></TableRow>
            ) : (
              data?.rows.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/40">
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                    {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                  </TableCell>
                  <TableCell className="text-sm">{log.actor_email ?? <span className="text-muted-foreground italic">system</span>}</TableCell>
                  <TableCell><Badge variant="outline" className="font-mono text-xs">{log.action}</Badge></TableCell>
                  <TableCell className="text-sm capitalize">{log.entity_type}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">{log.entity_id?.slice(0, 8) ?? "—"}</TableCell>
                  <TableCell className="text-xs max-w-xs">
                    {log.metadata && Object.keys(log.metadata).length > 0 ? (
                      <code className="text-muted-foreground truncate block">{JSON.stringify(log.metadata)}</code>
                    ) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between p-4 border-t">
          <div className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ActivityLogs;
