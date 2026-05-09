// Admin database queries and operations
import { supabase } from "./client";
import { deletePropertyById, type PropertyRow } from "./database";
import { deletePropertyImagesByUrls } from "./storage";
import type { Json } from "./types";

function isMissingRpcError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error && typeof error.code === "string" ? error.code : "";
  const message = "message" in error && typeof error.message === "string" ? error.message : "";

  return (
    code === "PGRST202" ||
    code === "42883" ||
    message.includes("Could not find the function") ||
    message.includes("does not exist")
  );
}

// ===== USERS MANAGEMENT =====
export async function getAdminUsers(filters?: {
  search?: string;
  role?: string;
  limit?: number;
  offset?: number;
}) {
  return supabase.rpc("get_admin_users_rpc", {
    p_search: filters?.search || null,
    p_role: filters?.role || null,
    p_limit: filters?.limit || 50,
    p_offset: filters?.offset || 0,
  });
}

export async function getUserWithDetails(userId: string) {
  const { data, error } = await supabase.rpc("get_admin_user_details_rpc", {
    p_user_id: userId,
  });

  return {
    data: data?.[0] || null,
    error,
  };
}

export async function getUserWithStats(userId: string) {
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();

  const { count: propertiesCount } = await supabase
    .from("properties")
    .select("*", { count: "exact" })
    .eq("owner_id", userId);

  return { profile, propertiesCount };
}

export async function updateUserRole(
  userId: string,
  role: "buyer" | "seller" | "broker" | "admin",
) {
  return supabase.rpc("update_user_role_rpc", {
    p_user_id: userId,
    p_new_role: role,
  });
}

export async function blockUser(userId: string) {
  return supabase.from("profiles").update({ onboarded: false }).eq("id", userId);
}

// ===== PROPERTIES MANAGEMENT =====
export async function getAdminProperties(filters?: {
  search?: string;
  status?: string;
  propertyType?: string;
  listingType?: string;
  limit?: number;
  offset?: number;
}) {
  return supabase.rpc("get_admin_properties_rpc", {
    p_search: filters?.search || null,
    p_status: filters?.status || null,
    p_property_type: filters?.propertyType || null,
    p_listing_type: filters?.listingType || null,
    p_limit: filters?.limit || 50,
    p_offset: filters?.offset || 0,
  });
}

export async function getPropertyWithDetails(propertyId: string) {
  const { data, error } = await supabase.rpc("get_admin_property_details_rpc", {
    p_property_id: propertyId,
  });

  return {
    data: data?.[0] || null,
    error,
  };
}

export async function getPropertyPhotos(propertyId: string) {
  const { data, error } = await supabase.rpc("get_admin_property_details_rpc", {
    p_property_id: propertyId,
  });

  return {
    data: data?.[0]?.images || [],
    error,
  };
}

export async function deletePropertyPhoto(propertyId: string, photoUrl: string) {
  return supabase.rpc("delete_property_photo_rpc", {
    p_property_id: propertyId,
    p_photo_url: photoUrl,
  });
}

export async function updatePropertyStatus(
  propertyId: string,
  status: "pending" | "active" | "sold" | "rented" | "inactive",
) {
  return supabase.rpc("update_property_status_rpc", {
    p_property_id: propertyId,
    p_new_status: status,
  });
}

export async function verifyProperty(propertyId: string, verified: boolean) {
  return supabase.rpc("verify_property_rpc", {
    p_property_id: propertyId,
    p_verified: verified,
  });
}

export async function featureProperty(propertyId: string, featured: boolean) {
  return supabase.rpc("feature_property_rpc", {
    p_property_id: propertyId,
    p_featured: featured,
  });
}

export async function deleteProperty(propertyId: string) {
  const rpcResult = await supabase.rpc("admin_delete_property_rpc", {
    p_property_id: propertyId,
  });

  if (!rpcResult.error) {
    const imageUrls = Array.isArray(rpcResult.data)
      ? rpcResult.data.filter((value): value is string => typeof value === "string")
      : [];

    if (imageUrls.length === 0) {
      return { error: null, cleanupError: null };
    }

    const cleanupResult = await deletePropertyImagesByUrls(imageUrls);
    return { error: null, cleanupError: cleanupResult.error };
  }

  if (!isMissingRpcError(rpcResult.error)) {
    return { error: rpcResult.error, cleanupError: null };
  }

  return deletePropertyById(propertyId);
}

export async function approveProperty(propertyId: string) {
  const rpcResult = await supabase.rpc("approve_property_rpc", {
    p_property_id: propertyId,
  });

  if (!rpcResult.error) {
    return { data: null, error: null };
  }

  if (!isMissingRpcError(rpcResult.error)) {
    return { data: null, error: rpcResult.error };
  }

  const statusResult = await updatePropertyStatus(propertyId, "active");
  if (statusResult.error) {
    return { data: null, error: statusResult.error };
  }

  const verifyResult = await verifyProperty(propertyId, true);
  if (verifyResult.error) {
    return { data: null, error: verifyResult.error };
  }

  return { data: null, error: null };
}

// ===== DASHBOARD ANALYTICS =====
export async function getDashboardStats() {
  const { data, error } = await supabase.rpc("get_dashboard_stats_rpc");

  if (error || !data?.[0]) {
    return {
      totalUsers: 0,
      totalProperties: 0,
      activeListings: 0,
      pendingApprovals: 0,
      soldRented: 0,
    };
  }

  const stats = data[0];
  return {
    totalUsers: Number(stats.total_users) || 0,
    totalProperties: Number(stats.total_properties) || 0,
    activeListings: Number(stats.active_listings) || 0,
    pendingApprovals: Number(stats.pending_approvals) || 0,
    soldRented: Number(stats.sold_rented) || 0,
  };
}

export async function getPropertiesByType() {
  return supabase
    .from("properties")
    .select("property_type")
    .then(({ data }) => {
      if (!data) return {};
      return data.reduce<Partial<Record<PropertyRow["property_type"], number>>>((acc, item) => {
        acc[item.property_type] = (acc[item.property_type] || 0) + 1;
        return acc;
      }, {});
    });
}

export async function getUserGrowth() {
  // Get users created in last 30 days, grouped by day
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return supabase
    .from("profiles")
    .select("created_at")
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: true });
}

// ===== ADMIN AUDIT LOGS =====
export async function logAdminAction(
  userId: string,
  action: string,
  targetType: string,
  targetId: string,
  details?: Json,
) {
  return supabase.from("admin_audit_logs").insert({
    admin_id: userId,
    action,
    target_type: targetType,
    target_id: targetId,
    details,
    timestamp: new Date().toISOString(),
  });
}
