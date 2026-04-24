import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, ImageIcon, Loader2, Mail, Phone, Star, Trash2, Upload, User as UserIcon, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { logActivity } from "@/lib/activity";
import { cn } from "@/lib/utils";

interface Props {
  propertyId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PropertyForm {
  title: string;
  description: string;
  price: number;
  listing_type: "sale" | "rent";
  category: "residential" | "commercial" | "land";
  status: "pending" | "active" | "rejected" | "sold" | "rented";
  address: string | null;
  city: string | null;
  area: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqft: number | null;
  is_featured: boolean;
  is_verified: boolean;
}

export function PropertyDetailDrawer({ propertyId, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PropertyForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const { data: property, isLoading } = useQuery({
    queryKey: ["property", propertyId],
    queryFn: async () => {
      if (!propertyId) return null;
      const { data, error } = await supabase.from("properties").select("*").eq("id", propertyId).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!propertyId && open,
  });

  const { data: owner } = useQuery({
    queryKey: ["owner", property?.owner_id],
    queryFn: async () => {
      if (!property?.owner_id) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", property.owner_id).maybeSingle();
      return data;
    },
    enabled: !!property?.owner_id,
  });

  const { data: images = [], refetch: refetchImages } = useQuery({
    queryKey: ["property-images", propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      const { data, error } = await supabase
        .from("property_images")
        .select("*")
        .eq("property_id", propertyId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!propertyId && open,
  });

  useEffect(() => {
    if (property) {
      setForm({
        title: property.title,
        description: property.description ?? "",
        price: Number(property.price),
        listing_type: property.listing_type,
        category: property.category,
        status: property.status,
        address: property.address,
        city: property.city,
        area: property.area,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area_sqft: property.area_sqft,
        is_featured: property.is_featured ?? false,
        is_verified: property.is_verified ?? false,
      });
    } else {
      setForm(null);
    }
  }, [property]);

  const save = async () => {
    if (!form || !propertyId) return;
    setSaving(true);
    const { error } = await supabase.from("properties").update(form).eq("id", propertyId);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    await logActivity("property.update", "property", propertyId, { title: form.title });
    toast.success("Saved");
    queryClient.invalidateQueries({ queryKey: ["property", propertyId] });
    queryClient.invalidateQueries({ queryKey: ["properties"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
  };

  const quickStatus = async (status: PropertyForm["status"]) => {
    if (!propertyId) return;
    const { error } = await supabase.from("properties").update({ status }).eq("id", propertyId);
    if (error) { toast.error(error.message); return; }
    await logActivity(`property.${status}`, "property", propertyId, { title: form?.title });
    toast.success(`Marked as ${status}`);
    queryClient.invalidateQueries({ queryKey: ["property", propertyId] });
    queryClient.invalidateQueries({ queryKey: ["properties"] });
    queryClient.invalidateQueries({ queryKey: ["pending-properties"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
  };

  const deleteProperty = async () => {
    if (!propertyId) return;
    const { error } = await supabase.from("properties").delete().eq("id", propertyId);
    if (error) { toast.error(error.message); return; }
    await logActivity("property.delete", "property", propertyId, { title: form?.title });
    toast.success("Property deleted");
    onOpenChange(false);
    queryClient.invalidateQueries({ queryKey: ["properties"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    queryClient.invalidateQueries({ queryKey: ["pending-properties"] });
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length || !propertyId) return;
    setUploading(true);
    try {
      const maxSort = Math.max(0, ...images.map((i) => i.sort_order ?? 0));
      let sort = maxSort + 1;
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `${propertyId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("property-images").upload(path, file, { cacheControl: "3600" });
        if (upErr) { toast.error(upErr.message); continue; }
        const { data: pub } = supabase.storage.from("property-images").getPublicUrl(path);
        const { error: insErr } = await supabase.from("property_images").insert({
          property_id: propertyId,
          url: pub.publicUrl,
          storage_path: path,
          sort_order: sort++,
        });
        if (insErr) toast.error(insErr.message);
      }
      await refetchImages();
      toast.success("Uploaded");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const deleteImage = async (id: string, storagePath: string) => {
    await supabase.storage.from("property-images").remove([storagePath]);
    const { error } = await supabase.from("property_images").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Image removed");
    refetchImages();
  };

  const setCover = async (url: string) => {
    if (!propertyId) return;
    const { error } = await supabase.from("properties").update({ cover_image_url: url }).eq("id", propertyId);
    if (error) { toast.error(error.message); return; }
    toast.success("Cover updated");
    queryClient.invalidateQueries({ queryKey: ["property", propertyId] });
    queryClient.invalidateQueries({ queryKey: ["properties"] });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
          {isLoading || !property || !form ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          ) : (
            <>
              <SheetHeader className="p-6 pb-4 border-b sticky top-0 bg-background z-10">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={form.status} />
                      {form.is_featured && <span className="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent font-medium">Featured</span>}
                      {form.is_verified && <span className="text-xs px-2 py-0.5 rounded-full bg-info/15 text-info font-medium">Verified</span>}
                    </div>
                    <SheetTitle className="font-display truncate">{form.title}</SheetTitle>
                    <SheetDescription className="truncate">{form.address ?? form.city ?? "No address"}</SheetDescription>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-3">
                  <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90" onClick={() => quickStatus("active")}>
                    <Check className="h-3.5 w-3.5 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => quickStatus("rejected")}>
                    <X className="h-3.5 w-3.5 mr-1" /> Reject
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete property?</AlertDialogTitle>
                        <AlertDialogDescription>This permanently removes the listing and its images. This cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteProperty} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </SheetHeader>

              <Tabs defaultValue="details" className="px-6 py-4">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="images">Images ({images.length})</TabsTrigger>
                  <TabsTrigger value="owner">Owner</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Price (₹)</Label>
                      <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as PropertyForm["status"] })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="sold">Sold</SelectItem>
                          <SelectItem value="rented">Rented</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Listing type</Label>
                      <Select value={form.listing_type} onValueChange={(v) => setForm({ ...form, listing_type: v as "sale" | "rent" })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sale">Sale</SelectItem>
                          <SelectItem value="rent">Rent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as PropertyForm["category"] })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="residential">Residential</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                          <SelectItem value="land">Land</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input value={form.city ?? ""} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Area</Label>
                      <Input value={form.area ?? ""} onChange={(e) => setForm({ ...form, area: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>Bedrooms</Label>
                      <Input type="number" value={form.bedrooms ?? ""} onChange={(e) => setForm({ ...form, bedrooms: e.target.value === "" ? null : Number(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Bathrooms</Label>
                      <Input type="number" value={form.bathrooms ?? ""} onChange={(e) => setForm({ ...form, bathrooms: e.target.value === "" ? null : Number(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Area (sqft)</Label>
                      <Input type="number" value={form.area_sqft ?? ""} onChange={(e) => setForm({ ...form, area_sqft: e.target.value === "" ? null : Number(e.target.value) })} />
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <Label className="font-medium">Featured</Label>
                      <p className="text-xs text-muted-foreground">Highlight on homepage</p>
                    </div>
                    <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <Label className="font-medium">Verified</Label>
                      <p className="text-xs text-muted-foreground">Mark as admin-verified</p>
                    </div>
                    <Switch checked={form.is_verified} onCheckedChange={(v) => setForm({ ...form, is_verified: v })} />
                  </div>

                  <Button onClick={save} disabled={saving} className="w-full gradient-accent text-accent-foreground font-semibold">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
                  </Button>
                </TabsContent>

                <TabsContent value="images" className="mt-4 space-y-4">
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files)}
                  />
                  <Button onClick={() => fileInput.current?.click()} disabled={uploading} variant="outline" className="w-full">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                    Upload images
                  </Button>

                  {images.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                      <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No images yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {images.map((img) => {
                        const isCover = property?.cover_image_url === img.url;
                        return (
                          <div key={img.id} className="group relative aspect-square rounded-lg overflow-hidden border bg-muted">
                            <img
                              src={img.url}
                              alt=""
                              className="w-full h-full object-cover cursor-zoom-in transition-base group-hover:scale-105"
                              onClick={() => setViewerImage(img.url)}
                            />
                            {isCover && (
                              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center gap-1">
                                <Star className="h-2.5 w-2.5 fill-current" /> COVER
                              </div>
                            )}
                            <div className={cn("absolute inset-x-0 bottom-0 p-2 flex gap-1 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-base")}>
                              {!isCover && (
                                <Button size="sm" variant="secondary" className="h-7 text-xs flex-1" onClick={() => setCover(img.url)}>
                                  <Star className="h-3 w-3 mr-1" /> Cover
                                </Button>
                              )}
                              <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => deleteImage(img.id, img.storage_path)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="owner" className="mt-4">
                  {!owner ? (
                    <div className="text-center py-12 text-sm text-muted-foreground">Owner not found</div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
                        <Avatar className="h-14 w-14">
                          <AvatarImage src={owner.avatar_url ?? undefined} />
                          <AvatarFallback className="gradient-accent text-accent-foreground font-bold">
                            {(owner.full_name ?? owner.email ?? "?").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold truncate">{owner.full_name ?? "Unnamed"}</div>
                          <div className="text-xs text-muted-foreground">{owner.user_type ?? "user"}</div>
                        </div>
                        {owner.is_verified && <span className="text-xs px-2 py-1 rounded-full bg-info/15 text-info font-medium">Verified</span>}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {owner.email ?? "—"}</div>
                        <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {owner.phone ?? "—"}</div>
                        <div className="flex items-center gap-2"><UserIcon className="h-4 w-4 text-muted-foreground" /> ID: <code className="text-xs">{owner.id.slice(0, 8)}…</code></div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={!!viewerImage} onOpenChange={(o) => !o && setViewerImage(null)}>
        <DialogContent className="max-w-5xl p-0 bg-transparent border-0 shadow-none">
          {viewerImage && <img src={viewerImage} alt="" className="w-full h-auto rounded-lg" />}
        </DialogContent>
      </Dialog>
    </>
  );
}
