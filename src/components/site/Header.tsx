import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Menu,
  X,
  Plus,
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  Heart,
  Settings,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUSINESS } from "@/config/business";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/properties", label: "Properties" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  // Debug: Log profile role
  useEffect(() => {
    if (user && profile) {
      console.log("Header - User logged in:", {
        userId: user.id,
        email: user.email,
        profileRole: profile.role,
        profileData: profile,
      });
    }
  }, [user, profile]);

  const initial = (profile?.display_name || user?.email || "?").charAt(0).toUpperCase();
  const isDark = theme === "dark";
  const themeLabel = isDark ? "Switch to day mode" : "Switch to night mode";

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const handleEditProfile = () => {
    setProfileOpen(false);
    window.location.assign("/dashboard/profile");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link to="/" className="group flex items-center gap-3" onClick={() => setOpen(false)}>
          <img
            src="/purulia-properties-icon.svg"
            alt="Purulia Properties"
            className="h-10 w-10 shrink-0 rounded-lg object-contain shadow-sm transition-transform group-hover:scale-105"
          />
          <div className="hidden min-w-0 sm:block">
            <div className="font-display text-base font-extrabold leading-none tracking-tight text-foreground md:text-lg">
              Purulia
            </div>
            <div className="font-display text-base font-extrabold leading-none tracking-tight text-orange md:text-lg">
              Properties
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
              activeProps={{ className: "text-primary" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}

          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="ml-2"
            aria-label={themeLabel}
            title={themeLabel}
            onClick={toggleTheme}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button
            asChild
            size="sm"
            className="ml-2 bg-orange text-orange-foreground shadow-[0_0_20px_hsl(var(--orange)/0.25)] hover:bg-orange/90"
          >
            <Link to="/post-property">
              <Plus className="h-4 w-4" /> Post Property
            </Link>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-2 flex items-center gap-2 rounded-full p-1 hover:bg-muted">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">
                  {profile?.display_name || user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard">
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/saved">
                    <Heart className="h-4 w-4" /> Saved
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                  <UserIcon className="h-4 w-4" /> Profile
                </DropdownMenuItem>
                {profile?.role === "admin" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin">
                        <Settings className="h-4 w-4" /> Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="ml-2">
              <Link to="/auth">Login</Link>
            </Button>
          )}
        </nav>

        <button
          type="button"
          aria-label="Toggle menu"
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-muted"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "md:hidden overflow-hidden border-t border-border/60 bg-background transition-[max-height] duration-300",
          open ? "max-h-[32rem]" : "max-h-0",
        )}
      >
        <nav className="container mx-auto flex flex-col gap-1 px-4 py-3">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-3 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-primary"
              activeProps={{ className: "text-primary bg-muted" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
          <Button
            type="button"
            variant="outline"
            className="mt-2 justify-start"
            aria-label={themeLabel}
            onClick={toggleTheme}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {isDark ? "Day Mode" : "Night Mode"}
          </Button>
          <Button
            asChild
            size="sm"
            className="mt-2 bg-orange text-orange-foreground shadow-[0_0_20px_hsl(var(--orange)/0.25)] hover:bg-orange/90"
          >
            <Link to="/post-property" onClick={() => setOpen(false)}>
              <Plus className="h-4 w-4" /> Post Property
            </Link>
          </Button>
          {user ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => {
                  setOpen(false);
                  setProfileOpen(true);
                }}
              >
                Profile
              </Button>
              <Button asChild size="sm" variant="outline" className="mt-2">
                <Link to="/dashboard" onClick={() => setOpen(false)}>
                  Dashboard
                </Link>
              </Button>
              {profile?.role === "admin" && (
                <Button asChild size="sm" variant="outline" className="mt-2">
                  <Link to="/admin" onClick={() => setOpen(false)}>
                    Admin Panel
                  </Link>
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="mt-1"
                onClick={() => {
                  setOpen(false);
                  handleSignOut();
                }}
              >
                Sign out
              </Button>
            </>
          ) : (
            <Button asChild size="sm" className="mt-2">
              <Link to="/auth" onClick={() => setOpen(false)}>
                Login / Sign up
              </Link>
            </Button>
          )}
        </nav>
      </div>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Profile details</DialogTitle>
            <DialogDescription>
              Review your profile and navigate to account settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {profile?.display_name ?? "Profile"}
              </p>
              <p className="text-xs text-muted-foreground capitalize">{profile?.role ?? "buyer"}</p>
            </div>
            <div className="space-y-3 rounded-2xl border border-border/70 bg-muted p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Email</div>
              <div className="text-sm font-medium text-foreground break-all">
                {profile?.email ?? user?.email}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-muted p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Mobile
                </div>
                <div className="text-sm font-medium text-foreground">
                  {profile?.phone ?? "Not added"}
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  WhatsApp
                </div>
                <div className="text-sm font-medium text-foreground">
                  {profile?.whatsapp ?? "Not added"}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleEditProfile}>
              Edit profile
            </Button>
            <Button type="button" onClick={() => setProfileOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="hidden text-xs text-muted-foreground border-t border-border/40 py-1.5 text-center md:block">
        {BUSINESS.tagline}
      </p>
    </header>
  );
}
