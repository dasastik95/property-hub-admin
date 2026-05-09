import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Building2, User, Search, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

const KEY = "pp_onboarded_v1";

export function OnboardingDialog() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<"buyer" | "seller" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = localStorage.getItem(KEY);
    if (dismissed) return;
    if (user && profile?.onboarded) return;
    const t = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(t);
  }, [user, profile]);

  const dismiss = () => {
    localStorage.setItem(KEY, "1");
    setOpen(false);
  };

  const choose = async (r: "buyer" | "seller") => {
    setRole(r);
    if (user) {
      try {
        await supabase.from("profiles").update({ role: r === "buyer" ? "buyer" : "seller", onboarded: true }).eq("id", user.id);
        await refreshProfile();
      } catch (err) {
        console.error("Failed to update profile:", err);
      }
    }
    setStep(2);
  };

  const go = (path: "/properties" | "/post-property" | "/auth") => {
    dismiss();
    navigate({ to: path });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) dismiss(); }}>
      <DialogContent className="max-w-md">
        {step === 1 ? (
          <>
            <DialogTitle className="font-display text-2xl">Welcome to Purulia Properties 👋</DialogTitle>
            <DialogDescription>Tell us what brings you here so we can personalise your experience.</DialogDescription>
            <div className="mt-4 grid gap-3">
              <button
                onClick={() => choose("buyer")}
                className="group flex items-start gap-4 rounded-xl border border-border p-4 text-left transition hover:border-primary hover:bg-primary/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
                  <Search className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-display font-semibold">I'm looking to buy or rent</div>
                  <div className="text-sm text-muted-foreground">Browse verified properties in Purulia.</div>
                </div>
              </button>
              <button
                onClick={() => choose("seller")}
                className="group flex items-start gap-4 rounded-xl border border-border p-4 text-left transition hover:border-orange hover:bg-orange/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange/10 text-orange group-hover:bg-orange group-hover:text-orange-foreground transition">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-display font-semibold">I want to list my property</div>
                  <div className="text-sm text-muted-foreground">Sell or rent out your property fast.</div>
                </div>
              </button>
            </div>
            <button onClick={dismiss} className="mt-3 text-center text-xs text-muted-foreground hover:underline">
              Skip for now
            </button>
          </>
        ) : (
          <>
            <DialogTitle className="font-display text-2xl">
              {role === "buyer" ? "Let's find your home" : "Ready to list?"}
            </DialogTitle>
            <DialogDescription>
              {role === "buyer"
                ? "Browse properties or save listings to your account."
                : "Post your property in a few minutes — it's free."}
            </DialogDescription>
            <div className="mt-4 flex flex-col gap-2">
              {role === "buyer" ? (
                <>
                  <Button onClick={() => go("/properties")} className="w-full"><Search className="h-4 w-4" /> Browse properties</Button>
                  {!user && (
                    <Button onClick={() => go("/auth")} variant="outline" className="w-full"><User className="h-4 w-4" /> Create free account</Button>
                  )}
                </>
              ) : (
                <>
                  <Button onClick={() => go("/post-property")} className="w-full bg-orange text-orange-foreground hover:bg-orange/90"><Plus className="h-4 w-4" /> Post Property</Button>
                  {!user && (
                    <Button onClick={() => go("/auth")} variant="outline" className="w-full"><User className="h-4 w-4" /> Sign up first</Button>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
