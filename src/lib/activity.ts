import { supabase } from "@/integrations/supabase/client";

export async function logActivity(
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("activity_logs").insert({
      actor_id: user?.id ?? null,
      actor_email: user?.email ?? null,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata: metadata as never,
    });
  } catch (err) {
    // Never let logging crash the app
    console.warn("logActivity failed:", err);
  }
}
