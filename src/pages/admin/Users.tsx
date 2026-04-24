import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, MoreVertical, Search, ShieldAlert, ShieldCheck, Trash2, UserCog, UserMinus, UserPlus } from "lucide-react";
import { supabase, type AppRole } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { logActivity } from "@/lib/activity";
import { format } from "date-fns";

interface UserRow {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  user_type: string | null;
  is_verified: boolean | null;
  is_blocked: boolean | null;
  created_at: string;
  roles: AppRole[];
}

const roleStyles: Record<AppRole, string> = {
  super_admin: "bg-accent/15 text-accent border-accent/30",
  moderator: "bg-info/15 text-info border-info/30",
  user: "bg-muted text-muted-foreground border-border",
};

const Users = () => {
  const { isSuperAdmin, user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<UserRow | null>(null);

  const { data: users = [], isLoading } = useQuery<UserRow[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const rolesByUser = new Map<string, AppRole[]>();
      (roles ?? []).forEach((r: { user_id: string; role: AppRole }) => {
        const arr = rolesByUser.get(r.user_id) ?? [];
        arr.push(r.role);
        rolesByUser.set(r.user_id, arr);
      });
      return (profiles ?? []).map((p) => ({ ...p, roles: rolesByUser.get(p.id) ?? [] })) as UserRow[];
    },
  });

  const filtered = users.filter((u) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (u.email ?? "").toLowerCase().includes(s) || (u.full_name ?? "").toLowerCase().includes(s);
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
  };

  const toggleBlock = async (u: UserRow) => {
    const newVal = !u.is_blocked;
    const { error } = await supabase.from("profiles").update({ is_blocked: newVal }).eq("id", u.id);
    if (error) { toast.error(error.message); return; }
    await logActivity(newVal ? "user.block" : "user.unblock", "user", u.id, { email: u.email });
    toast.success(newVal ? "User blocked" : "User unblocked");
    invalidate();
  };

  const toggleVerify = async (u: UserRow) => {
    const newVal = !u.is_verified;
    const { error } = await supabase.from("profiles").update({ is_verified: newVal }).eq("id", u.id);
    if (error) { toast.error(error.message); return; }
    await logActivity(newVal ? "user.verify" : "user.unverify", "user", u.id, { email: u.email });
    toast.success(newVal ? "User verified" : "Verification removed");
    invalidate();
  };

  const assignRole = async (u: UserRow, role: AppRole) => {
    if (u.roles.includes(role)) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", u.id).eq("role", role);
      if (error) { toast.error(error.message); return; }
      await logActivity("role.remove", "user", u.id, { email: u.email, role });
      toast.success(`Removed ${role}`);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: u.id, role });
      if (error) { toast.error(error.message); return; }
      await logActivity("role.assign", "user", u.id, { email: u.email, role });
      toast.success(`Assigned ${role}`);
    }
    invalidate();
  };

  const deleteUser = async (u: UserRow) => {
    // Frontend can only delete profile row; auth.users must be deleted via dashboard or admin API
    const { error } = await supabase.from("profiles").delete().eq("id", u.id);
    if (error) { toast.error(error.message); return; }
    await logActivity("user.delete_profile", "user", u.id, { email: u.email });
    toast.success("Profile deleted (auth user remains — remove from Supabase dashboard if needed)");
    setConfirmDelete(null);
    invalidate();
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">{users.length} registered user{users.length === 1 ? "" : "s"}</p>
      </div>

      <Card className="p-4 shadow-soft">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by email or name…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </Card>

      <Card className="shadow-soft overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No users found</TableCell></TableRow>
            ) : (
              filtered.map((u) => (
                <TableRow key={u.id} className="hover:bg-muted/40">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={u.avatar_url ?? undefined} />
                        <AvatarFallback className="gradient-accent text-accent-foreground text-xs font-bold">
                          {(u.full_name ?? u.email ?? "?").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-medium truncate max-w-[220px]">{u.full_name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[220px]">{u.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.roles.length === 0 && <Badge variant="outline" className={roleStyles.user}>user</Badge>}
                      {u.roles.map((r) => (
                        <Badge key={r} variant="outline" className={roleStyles[r]}>{r.replace("_", " ")}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {u.is_blocked && <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/30 w-fit">Blocked</Badge>}
                      {u.is_verified && <Badge variant="outline" className="bg-success/15 text-success border-success/30 w-fit"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>}
                      {!u.is_blocked && !u.is_verified && <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(u.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => toggleVerify(u)}>
                          {u.is_verified ? <><ShieldAlert className="h-4 w-4 mr-2" /> Remove verification</> : <><ShieldCheck className="h-4 w-4 mr-2" /> Verify user</>}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleBlock(u)} className={u.is_blocked ? "" : "text-destructive focus:text-destructive"}>
                          {u.is_blocked ? <><UserPlus className="h-4 w-4 mr-2" /> Unblock</> : <><UserMinus className="h-4 w-4 mr-2" /> Block</>}
                        </DropdownMenuItem>
                        {isSuperAdmin && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs text-muted-foreground">Roles</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => assignRole(u, "super_admin")}>
                              <UserCog className="h-4 w-4 mr-2" /> {u.roles.includes("super_admin") ? "Remove" : "Make"} Super Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => assignRole(u, "moderator")}>
                              <UserCog className="h-4 w-4 mr-2" /> {u.roles.includes("moderator") ? "Remove" : "Make"} Moderator
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled={u.id === currentUser?.id}
                              onClick={() => setConfirmDelete(u)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete profile
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes the profile row for <strong>{confirmDelete?.email}</strong>. The auth account must be removed separately from the Supabase dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDelete && deleteUser(confirmDelete)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Users;
