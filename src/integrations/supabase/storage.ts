// Supabase Storage Utilities
// Use these functions to handle file uploads and downloads

import { supabase } from "./client";

export interface UploadOptions {
  bucket: string;
  path: string;
  file: File | Blob;
  contentType?: string;
  public?: boolean;
}

export interface UploadResult {
  path: string | null;
  publicUrl?: string;
  error: unknown;
}

// Available storage buckets
export const STORAGE_BUCKETS = {
  PROPERTY_IMAGES: "property-images",
  PROPERTY_DOCUMENTS: "property-documents",
  USER_AVATARS: "user-avatars",
  USER_DOCUMENTS: "user-documents",
} as const;

// Upload a file to Supabase storage
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const { bucket, path, file, contentType, public: isPublic = true } = options;

  try {
    // Generate unique filename to avoid conflicts
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const originalName = file instanceof File ? file.name : "file";
    const extension = originalName.split(".").pop() || "";
    const uniquePath = path.endsWith("/")
      ? `${path}${timestamp}-${random}.${extension}`
      : `${path}/${timestamp}-${random}.${extension}`;

    const { data, error } = await supabase.storage.from(bucket).upload(uniquePath, file, {
      contentType: contentType || (file instanceof File ? file.type : "application/octet-stream"),
      upsert: false,
    });

    if (error) {
      throw error;
    }

    // Get public URL if needed
    let publicUrl: string | undefined;
    if (isPublic) {
      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(uniquePath);
      publicUrl = publicUrlData.publicUrl;
    }

    return {
      path: data?.path || uniquePath,
      publicUrl,
      error: null,
    };
  } catch (error) {
    console.error("File upload error:", error);
    return {
      path: null,
      error,
    };
  }
}

// Upload multiple files
export async function uploadFiles(
  options: Omit<UploadOptions, "file"> & { files: File[] },
): Promise<UploadResult[]> {
  const { files, ...rest } = options;
  const results = await Promise.all(files.map((file) => uploadFile({ ...rest, file })));
  return results;
}

// Delete a file from storage
export async function deleteFile(bucket: string, path: string): Promise<{ error: unknown }> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error("File deletion error:", error);
    return { error };
  }
}

// Delete multiple files
export async function deleteFiles(bucket: string, paths: string[]): Promise<{ error: unknown }> {
  try {
    const { error } = await supabase.storage.from(bucket).remove(paths);

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error("Files deletion error:", error);
    return { error };
  }
}

// Get public URL for a file
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return data.publicUrl;
}

// Get signed URL for a file (for private files)
export async function getSignedUrl(bucket: string, path: string, expiresIn: number = 3600) {
  try {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);

    if (error) {
      throw error;
    }

    return { url: data?.signedUrl || null, error: null };
  } catch (error) {
    console.error("Get signed URL error:", error);
    return { url: null, error };
  }
}

// List files in a bucket
export async function listFiles(bucket: string, path: string = "") {
  try {
    const { data, error } = await supabase.storage.from(bucket).list(path, {
      limit: 100,
      offset: 0,
      sortBy: { column: "created_at", order: "desc" },
    });

    if (error) {
      throw error;
    }

    return { files: data || [], error: null };
  } catch (error) {
    console.error("List files error:", error);
    return { files: [], error };
  }
}

// Upload avatar for user
export async function uploadUserAvatar(userId: string, file: File): Promise<UploadResult> {
  try {
    const result = await uploadFile({
      bucket: STORAGE_BUCKETS.USER_AVATARS,
      path: userId,
      file,
      contentType: file.type,
      public: true,
    });

    if (result.path && !result.error) {
      // Update user profile with avatar URL
      const avatarUrl = getPublicUrl(STORAGE_BUCKETS.USER_AVATARS, result.path);
      await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", userId);
    }

    return result;
  } catch (error) {
    console.error("Upload avatar error:", error);
    return { path: null, error };
  }
}

// Upload property images
export async function uploadPropertyImages(
  propertyId: string,
  files: File[],
  options?: { syncToPropertyRecord?: boolean },
): Promise<{ urls: string[]; results: UploadResult[]; error: unknown }> {
  try {
    const results = await uploadFiles({
      bucket: STORAGE_BUCKETS.PROPERTY_IMAGES,
      path: propertyId,
      files,
      public: true,
    });

    // Get all successful image URLs
    const imageUrls = results
      .filter((r) => r.path && !r.error)
      .map((r) => getPublicUrl(STORAGE_BUCKETS.PROPERTY_IMAGES, r.path!));

    if (imageUrls.length === 0) {
      return {
        urls: [],
        results,
        error: new Error("No images were successfully uploaded"),
      };
    }

    if (options?.syncToPropertyRecord) {
      // Update property with images
      try {
        const { data: property } = await supabase
          .from("properties")
          .select("images")
          .eq("id", propertyId)
          .single();

        const existingImages = property?.images || [];
        await supabase
          .from("properties")
          .update({ images: [...existingImages, ...imageUrls] })
          .eq("id", propertyId);
      } catch (updateError) {
        console.error("Error updating property images:", updateError);
      }
    }

    return {
      urls: imageUrls,
      results,
      error: null,
    };
  } catch (error) {
    console.error("Upload property images error:", error);
    return {
      urls: [],
      results: [],
      error,
    };
  }
}

function getStoragePathFromPublicUrl(bucket: string, publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const markerIndex = url.pathname.indexOf(marker);

    if (markerIndex === -1) {
      return null;
    }

    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
  } catch (error) {
    console.error("Failed to parse storage URL:", error);
    return null;
  }
}

export async function deletePropertyImagesByUrls(imageUrls: string[]) {
  const paths = [...new Set(
    imageUrls
      .map((url) => getStoragePathFromPublicUrl(STORAGE_BUCKETS.PROPERTY_IMAGES, url))
      .filter((path): path is string => Boolean(path)),
  )];

  if (paths.length === 0) {
    return { error: null };
  }

  return deleteFiles(STORAGE_BUCKETS.PROPERTY_IMAGES, paths);
}
