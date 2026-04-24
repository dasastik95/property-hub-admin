import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Setup = () => {
  const { user, loading, refreshRoles } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { document.title = "Setup — Purulia Admin"; }, []);

  const bootstrap = async () => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.rpc("bootstrap_super_admin", { _user_id: user.id });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("You are now a super admin");
    await refreshRoles();
    navigate("/admin", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-hero">
      <div className="w-full max-w-md animate-slide-up">
        <Card className="shadow-elegant">
          <CardContent className="p-6 sm:p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-accent shadow-accent">
              <ShieldCheck className="h-7 w-7 text-accent-foreground" />
            </div>
            <h1 className="text-2xl font-display font-semibold mb-2">First-time setup</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Bootstrap your account as the first super admin. This only works once — when no super admin exists yet.
            </p>

            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            ) : !user ? (
              <Button className="w-full" onClick={() => navigate("/login")}>Sign in first</Button>
            ) : (
              <>
                <p className="text-sm mb-4">Signed in as <span className="font-medium">{user.email}</span></p>
                <Button onClick={bootstrap} disabled={submitting} className="w-full gradient-accent text-accent-foreground font-semibold">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Become super admin"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Setup;
