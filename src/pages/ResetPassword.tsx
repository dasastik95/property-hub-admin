import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Set new password — Purulia Admin";
    // Detect recovery flow. Supabase puts a fragment with type=recovery.
    const hash = window.location.hash || "";
    if (hash.includes("type=recovery")) {
      setRecoveryReady(true);
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecoveryReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z.string().min(8, "Min 8 characters").max(100).safeParse(password);
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    if (password !== confirm) { toast.error("Passwords don't match"); return; }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-hero">
      <div className="w-full max-w-md animate-slide-up">
        <Card className="shadow-elegant">
          <CardContent className="p-6 sm:p-8">
            <h1 className="text-2xl font-display font-semibold mb-2">Set new password</h1>
            <p className="text-sm text-muted-foreground mb-6">
              {recoveryReady ? "Choose a strong password for your admin account." : "Waiting for recovery link…"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" required minLength={8} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="pl-9" required minLength={8} />
                </div>
              </div>
              <Button type="submit" disabled={submitting || !recoveryReady} className="w-full gradient-accent text-accent-foreground font-semibold">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
