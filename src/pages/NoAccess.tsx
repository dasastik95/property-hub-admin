import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldX } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const NoAccess = () => {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Access denied — Purulia Admin";
    if (isAdmin) navigate("/admin", { replace: true });
  }, [isAdmin, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-hero">
      <Card className="w-full max-w-md shadow-elegant animate-slide-up">
        <CardContent className="p-6 sm:p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/15">
            <ShieldX className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="text-2xl font-display font-semibold mb-2">Access denied</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {user ? (
              <>Your account <span className="font-medium text-foreground">{user.email}</span> doesn't have admin privileges. Contact a super admin to request access.</>
            ) : (
              "You need to be signed in with an admin account."
            )}
          </p>
          <div className="flex gap-2">
            {user && (
              <Button variant="outline" className="flex-1" onClick={async () => { await signOut(); navigate("/login"); }}>
                Sign out
              </Button>
            )}
            <Button className="flex-1 gradient-accent text-accent-foreground font-semibold" onClick={() => navigate("/login")}>
              {user ? "Switch account" : "Sign in"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NoAccess;
