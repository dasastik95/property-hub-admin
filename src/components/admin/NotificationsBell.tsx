import { useEffect, useRef, useState } from "react";
import { Bell, Check, X, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { logActivity } from "@/lib/activity";
import { usePropertyDetail } from "./PropertyDetailContext";
import { formatDistanceToNow } from "date-fns";

interface PendingProperty {
  id: string;
  title: string;
  city: string | null;
  price: number;
  created_at: string;
}

export function NotificationsBell() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { openProperty } = usePropertyDetail();
  const [open, setOpen] = useState(false);
  const seenIds = useRef<Set<string>>(new Set());

  const { data: pending = [] } = useQuery<PendingProperty[]>({
    queryKey: ["pending-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, title, city, price, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    pending.forEach((p) => seenIds.current.add(p.id));
  }, [pending]);

  useEffect(() => {
    const channel = supabase
      .channel("notifications-pending-properties")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "properties", filter: "status=eq.pending" },
        (payload) => {
          const row = payload.new as PendingProperty;
          if (!seenIds.current.has(row.id)) {
            seenIds.current.add(row.id);
            toast.info("New property submitted", {
              description: row.title,
              action: { label: "View", onClick: () => openProperty(row.id) },
            });
            queryClient.invalidateQueries({ queryKey: ["pending-properties"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
            queryClient.invalidateQueries({ queryKey: ["properties"] });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "properties" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["pending-properties"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
          queryClient.invalidateQueries({ queryKey: ["properties"] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient, openProperty]);

  const updateStatus = async (id: string, status: "active" | "rejected", title: string) => {
    const { error } = await supabase.from("properties").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    await logActivity(`property.${status === "active" ? "approve" : "reject"}`, "property", id, { title });
    toast.success(status === "active" ? "Approved" : "Rejected");
    queryClient.invalidateQueries({ queryKey: ["pending-properties"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    queryClient.invalidateQueries({ queryKey: ["properties"] });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {pending.length > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full gradient-accent text-accent-foreground border-0 text-[10px] font-bold">
              {pending.length > 9 ? "9+" : pending.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div>
            <div className="font-semibold text-sm">Pending approvals</div>
            <div className="text-xs text-muted-foreground">{pending.length} awaiting review</div>
          </div>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setOpen(false); navigate("/admin/properties"); }}>
            View all
          </Button>
        </div>
        <ScrollArea className="max-h-96">
          {pending.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              All caught up 🎉
            </div>
          ) : (
            <ul className="divide-y">
              {pending.map((p) => (
                <li key={p.id} className="px-4 py-3 hover:bg-muted/40 transition-base">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{p.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {p.city ?? "—"} · ₹{Number(p.price).toLocaleString("en-IN")}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => { setOpen(false); openProperty(p.id); }}>
                      <Eye className="h-3 w-3 mr-1" /> View
                    </Button>
                    <Button size="sm" className="h-7 text-xs bg-success text-success-foreground hover:bg-success/90" onClick={() => updateStatus(p.id, "active", p.title)}>
                      <Check className="h-3 w-3 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => updateStatus(p.id, "rejected", p.title)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
