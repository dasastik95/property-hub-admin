import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const authCallbackSearchSchema = z.object({
  redirect: fallback(z.string().optional(), undefined),
});

function normalizeRedirect(redirect?: string) {
  return redirect?.startsWith("/") ? redirect : "/dashboard";
}

export const Route = createFileRoute("/auth/callback")({
  validateSearch: zodValidator(authCallbackSearchSchema),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const redirectTo = normalizeRedirect(search.redirect);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the current session (Supabase will handle the OAuth callback automatically)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          navigate({ to: "/auth", search: { error: "session_error" } });
          return;
        }

        if (session) {
          // Session was established successfully
          window.location.assign(redirectTo);
        } else {
          // No session yet, check if there's an error in URL
          const hash = window.location.hash;
          if (hash.includes("error=")) {
            const errorMatch = hash.match(/error=([^&]*)/);
            const error = errorMatch ? decodeURIComponent(errorMatch[1]) : "Unknown error";
            console.error("OAuth error:", error);
            navigate({ to: "/auth", search: { error } });
          } else {
            navigate({ to: "/auth" });
          }
        }
      } catch (error) {
        console.error("OAuth callback error:", error);
        navigate({ to: "/auth", search: { error: "callback_error" } });
      }
    };

    handleCallback();
  }, [navigate, redirectTo]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Completing sign-in...</p>
      </div>
    </div>
  );
}
