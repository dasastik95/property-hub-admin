import { ReactNode } from "react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { NotificationsBell } from "./NotificationsBell";
import { PropertyDetailProvider } from "./PropertyDetailContext";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User as UserIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, signOut, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <PropertyDetailProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AdminSidebar />
          <SidebarInset className="flex-1 min-w-0">
            <header className="sticky top-0 z-20 h-16 border-b bg-background/80 backdrop-blur-md flex items-center gap-3 px-4 sm:px-6">
              <SidebarTrigger />
              <div className="flex-1" />
              <NotificationsBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full hover:bg-muted p-1 pr-3 transition-base">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback className="gradient-accent text-accent-foreground text-xs font-bold">
                        {(user?.email ?? "?").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium hidden sm:inline truncate max-w-[140px]">{user?.email}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="font-medium truncate">{user?.email}</div>
                    <div className="text-xs text-muted-foreground font-normal">{isSuperAdmin ? "Super Admin" : "Moderator"}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <UserIcon className="h-4 w-4 mr-2" /> Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={async () => { await signOut(); navigate("/login"); }} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </header>
            <main className="p-4 sm:p-6 lg:p-8 animate-fade-in">{children}</main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </PropertyDetailProvider>
  );
}
