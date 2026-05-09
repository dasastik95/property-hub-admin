import { supabase } from "./client";
import { deletePropertyImagesByUrls } from "./storage";
import type { Json, Tables, TablesInsert, TablesUpdate } from "./types";

export type ProfileRow = Tables<"profiles">;
export type ProfileInsert = TablesInsert<"profiles">;
export type ProfileUpdate = TablesUpdate<"profiles">;

export type PropertyRow = Tables<"properties">;
export type PropertyInsert = TablesInsert<"properties">;
export type PropertyUpdate = TablesUpdate<"properties">;

export type SavedPropertyRow = Tables<"saved_properties">;
export type SavedPropertyInsert = TablesInsert<"saved_properties">;
export type DeletePropertyResult = {
  error: unknown;
  cleanupError: unknown;
};

const ADMIN_PROPERTY_SELECT =
  "id,title,description,property_type,listing_type,category,price,city,state,locality,address,pincode,latitude,longitude,bedrooms,bathrooms,area_sqft,furnishing,floor_number,total_floors,amenities,images,is_verified,is_featured,contact_phone,contact_whatsapp,owner_id,views,created_at,updated_at,status,owner_type";

function toRpcPayload(update: PropertyUpdate): Json {
  return Object.fromEntries(
    Object.entries(update).filter(([, value]) => value !== undefined),
  ) as Json;
}

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

function toFallbackAdminPropertyRow(data: Record<string, unknown>): PropertyRow {
  return {
    id: String(data.id),
    title: typeof data.title === "string" ? data.title : "",
    description: typeof data.description === "string" ? data.description : "",
    property_type: (data.property_type as PropertyRow["property_type"]) ?? "residential",
    listing_type: (data.listing_type as PropertyRow["listing_type"]) ?? "sale",
    category: typeof data.category === "string" ? data.category : null,
    price: Number(data.price ?? 0),
    city: typeof data.city === "string" ? data.city : "Purulia",
    locality: typeof data.locality === "string" ? data.locality : null,
    address: typeof data.address === "string" ? data.address : null,
    pincode: typeof data.pincode === "string" ? data.pincode : null,
    latitude: typeof data.latitude === "number" ? data.latitude : null,
    longitude: typeof data.longitude === "number" ? data.longitude : null,
    bedrooms: typeof data.bedrooms === "number" ? data.bedrooms : null,
    bathrooms: typeof data.bathrooms === "number" ? data.bathrooms : null,
    area_sqft: typeof data.area_sqft === "number" ? data.area_sqft : null,
    furnishing: typeof data.furnishing === "string" ? data.furnishing : null,
    floor_number: typeof data.floor_number === "number" ? data.floor_number : null,
    total_floors: typeof data.total_floors === "number" ? data.total_floors : null,
    amenities: Array.isArray(data.amenities) ? (data.amenities as string[]) : [],
    images: Array.isArray(data.images) ? (data.images as string[]) : [],
    is_verified: data.is_verified === true,
    is_featured: data.is_featured === true,
    contact_phone:
      typeof data.contact_phone === "string"
        ? data.contact_phone
        : typeof data.owner_phone === "string"
          ? data.owner_phone
          : null,
    contact_whatsapp:
      typeof data.contact_whatsapp === "string"
        ? data.contact_whatsapp
        : typeof data.owner_phone === "string"
          ? data.owner_phone
          : null,
    owner_id: String(data.owner_id),
    views: typeof data.views === "number" ? data.views : 0,
    created_at:
      typeof data.created_at === "string" ? data.created_at : new Date().toISOString(),
    updated_at:
      typeof data.updated_at === "string"
        ? data.updated_at
        : typeof data.created_at === "string"
          ? data.created_at
          : new Date().toISOString(),
    status: (data.status as PropertyRow["status"]) ?? "pending",
    owner_type: (data.owner_type as PropertyRow["owner_type"]) ?? "individual",
    state: typeof data.state === "string" ? data.state : "West Bengal",
  };
}

export async function getProfileById(userId: string) {
  return supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
}

export async function upsertProfile(profile: ProfileInsert) {
  return supabase.from("profiles").upsert(profile).select("*").single();
}

export async function updateProfile(userId: string, update: ProfileUpdate) {
  return supabase.from("profiles").update(update).eq("id", userId).select("*").single();
}

export async function createProperty(payload: PropertyInsert) {
  try {
    console.log("Creating property with payload:", payload);

    const { data, error } = await supabase.from("properties").insert(payload).select("*").single();

    if (error) {
      console.error("Property creation error:", error);
      console.error("Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      throw error;
    }

    console.log("Property created successfully:", data);
    return { data, error: null };
  } catch (error) {
    console.error("Failed to create property:", error);
    return { data: null, error };
  }
}

export async function getPropertiesByOwner(ownerId: string) {
  return supabase
    .from("properties")
    .select(
      "id,title,price,listing_type,property_type,city,locality,images,status,views,is_featured,created_at",
    )
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
}

export async function getPropertyByIdForOwner(propertyId: string, ownerId: string) {
  return supabase
    .from("properties")
    .select(ADMIN_PROPERTY_SELECT)
    .eq("id", propertyId)
    .eq("owner_id", ownerId)
    .maybeSingle();
}

export async function updatePropertyByIdForOwner(
  propertyId: string,
  ownerId: string,
  update: PropertyUpdate,
) {
  const { error } = await supabase
    .from("properties")
    .update(update, { returning: "minimal" })
    .eq("id", propertyId)
    .eq("owner_id", ownerId);

  return { data: null, error };
}

export async function getPropertyByIdForAdmin(propertyId: string) {
  const fullRpcResult = await supabase.rpc("get_admin_property_full_details_rpc", {
    p_property_id: propertyId,
  });

  if (fullRpcResult.data?.[0]) {
    return {
      data: fullRpcResult.data[0] as PropertyRow,
      error: fullRpcResult.error,
    };
  }

  const directResult = await supabase
    .from("properties")
    .select(ADMIN_PROPERTY_SELECT)
    .eq("id", propertyId)
    .maybeSingle();

  if (directResult.data) {
    return {
      data: directResult.data,
      error: directResult.error,
    };
  }

  const legacyRpcResult = await supabase.rpc("get_admin_property_details_rpc", {
    p_property_id: propertyId,
  });

  if (legacyRpcResult.data?.[0]) {
    return {
      data: toFallbackAdminPropertyRow(legacyRpcResult.data[0] as Record<string, unknown>),
      error: legacyRpcResult.error,
    };
  }

  return {
    data: null,
    error:
      legacyRpcResult.error ??
      directResult.error ??
      (isMissingRpcError(fullRpcResult.error) ? null : fullRpcResult.error),
  };
}

export async function updatePropertyByIdForAdmin(propertyId: string, update: PropertyUpdate) {
  const rpcResult = await supabase.rpc("admin_update_property_rpc", {
    p_property_id: propertyId,
    p_updates: toRpcPayload(update),
  });

  if (!rpcResult.error) {
    return { data: null, error: null };
  }

  if (!isMissingRpcError(rpcResult.error)) {
    return { data: null, error: rpcResult.error };
  }

  const { error } = await supabase
    .from("properties")
    .update(update, { returning: "minimal" })
    .eq("id", propertyId);

  return { data: null, error };
}

export async function getSavedPropertiesCount(userId: string) {
  return supabase
    .from("saved_properties")
    .select("property_id", { count: "exact", head: true })
    .eq("user_id", userId);
}

export async function deletePropertyById(id: string) {
  const { data: property, error: fetchError } = await supabase
    .from("properties")
    .select("images")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError, cleanupError: null } satisfies DeletePropertyResult;
  }

  const { data: deletedProperty, error } = await supabase
    .from("properties")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error, cleanupError: null } satisfies DeletePropertyResult;
  }

  if (!deletedProperty) {
    return {
      error: new Error("Property could not be deleted. It may have already been removed."),
      cleanupError: null,
    } satisfies DeletePropertyResult;
  }

  let cleanupError: unknown = null;
  if (property?.images?.length) {
    const cleanupResult = await deletePropertyImagesByUrls(property.images);
    cleanupError = cleanupResult.error;
  }

  return { error: null, cleanupError } satisfies DeletePropertyResult;
}
