import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  BadgeCheck,
  Eye,
  ImagePlus,
  Loader2,
  MapPin,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  type PropertyRow,
  getPropertyByIdForAdmin,
  getPropertyByIdForOwner,
  updatePropertyByIdForAdmin,
  updatePropertyByIdForOwner,
} from "@/integrations/supabase/database";
import { deletePropertyImagesByUrls, uploadPropertyImages } from "@/integrations/supabase/storage";
import { formatPrice } from "@/components/site/PropertyCard";

const RES_AMENITIES = [
  "Parking",
  "Lift",
  "Power Backup",
  "Security",
  "Garden",
  "Water Supply",
  "Gym",
  "Swimming Pool",
  "Park",
  "CCTV",
];

const COM_AMENITIES = [
  "Parking",
  "Lift",
  "Power Backup",
  "Security",
  "Conference Room",
  "Reception",
  "Pantry",
  "AC",
  "CCTV",
  "Internet",
];

const RES_CATEGORIES = [
  { value: "apartment", label: "Apartment / Flat" },
  { value: "house", label: "House" },
  { value: "villa", label: "Villa" },
  { value: "plot", label: "Plot / Land" },
  { value: "pg", label: "PG / Hostel" },
];

const COM_CATEGORIES = [
  { value: "office", label: "Office" },
  { value: "shop", label: "Shop / Showroom" },
  { value: "warehouse", label: "Warehouse" },
  { value: "industrial", label: "Industrial" },
];

const STATUS_OPTIONS: PropertyRow["status"][] = ["active", "inactive", "sold", "rented", "pending"];
const EMPTY_SELECT = "__none__";
const MAX_IMAGES = 10;

type PendingImage = {
  file: File;
  url: string;
};

type ValidationIssue = {
  message: string;
  fieldId?: string;
};

type OwnerListingDialogProps = {
  listingId: string | null;
  open: boolean;
  ownerId?: string;
  mode?: "owner" | "admin";
  onOpenChange: (open: boolean) => void;
  onSaved: (property: PropertyRow) => void;
};

type FormState = {
  ownerType: PropertyRow["owner_type"];
  propertyType: PropertyRow["property_type"];
  listingType: PropertyRow["listing_type"];
  title: string;
  description: string;
  category: string;
  price: string;
  city: string;
  locality: string;
  address: string;
  pincode: string;
  latitude: string;
  longitude: string;
  bedrooms: string;
  bathrooms: string;
  areaSqft: string;
  furnishing: string;
  floorNumber: string;
  totalFloors: string;
  amenities: string[];
  contactPhone: string;
  contactWhatsapp: string;
  status: PropertyRow["status"];
  isVerified: boolean;
  isFeatured: boolean;
  existingImages: string[];
};

function emptyForm(): FormState {
  return {
    ownerType: "individual",
    propertyType: "residential",
    listingType: "sale",
    title: "",
    description: "",
    category: "",
    price: "",
    city: "Purulia",
    locality: "",
    address: "",
    pincode: "",
    latitude: "",
    longitude: "",
    bedrooms: "",
    bathrooms: "",
    areaSqft: "",
    furnishing: "",
    floorNumber: "",
    totalFloors: "",
    amenities: [],
    contactPhone: "",
    contactWhatsapp: "",
    status: "active",
    isVerified: false,
    isFeatured: false,
    existingImages: [],
  };
}

function toInputValue(value: number | null) {
  return value == null ? "" : String(value);
}

function buildForm(property: PropertyRow): FormState {
  return {
    ownerType: property.owner_type,
    propertyType: property.property_type,
    listingType: property.listing_type,
    title: property.title,
    description: property.description,
    category: property.category ?? "",
    price: String(property.price),
    city: property.city,
    locality: property.locality ?? "",
    address: property.address ?? "",
    pincode: property.pincode ?? "",
    latitude: toInputValue(property.latitude),
    longitude: toInputValue(property.longitude),
    bedrooms: toInputValue(property.bedrooms),
    bathrooms: toInputValue(property.bathrooms),
    areaSqft: toInputValue(property.area_sqft),
    furnishing: property.furnishing ?? "",
    floorNumber: toInputValue(property.floor_number),
    totalFloors: toInputValue(property.total_floors),
    amenities: property.amenities ?? [],
    contactPhone: property.contact_phone ?? "",
    contactWhatsapp: property.contact_whatsapp ?? "",
    status: property.status,
    isVerified: property.is_verified,
    isFeatured: property.is_featured,
    existingImages: property.images ?? [],
  };
}

function toNullableNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNullableString(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function isPlotListing(form: Pick<FormState, "propertyType" | "category">) {
  return form.propertyType === "residential" && form.category === "plot";
}

export function OwnerListingDialog({
  listingId,
  open,
  ownerId,
  mode = "owner",
  onOpenChange,
  onSaved,
}: OwnerListingDialogProps) {
  const isAdminMode = mode === "admin";
  const [property, setProperty] = useState<PropertyRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationIssue, setValidationIssue] = useState<ValidationIssue | null>(null);

  const amenityOptions = useMemo(
    () => (form.propertyType === "commercial" ? COM_AMENITIES : RES_AMENITIES),
    [form.propertyType],
  );

  const categoryOptions = useMemo(
    () => (form.propertyType === "commercial" ? COM_CATEGORIES : RES_CATEGORIES),
    [form.propertyType],
  );

  const clearPendingImages = () => {
    setPendingImages((current) => {
      current.forEach((image) => URL.revokeObjectURL(image.url));
      return [];
    });
  };

  useEffect(() => {
    if (!open || !listingId) {
      setProperty(null);
      setForm(emptyForm());
      setValidationIssue(null);
      clearPendingImages();
      return;
    }

    if (!isAdminMode && !ownerId) {
      setProperty(null);
      setForm(emptyForm());
      setValidationIssue(null);
      return;
    }

    setLoading(true);
    const fetchProperty = isAdminMode
      ? getPropertyByIdForAdmin(listingId)
      : getPropertyByIdForOwner(listingId, ownerId!);

    fetchProperty
      .then(({ data, error }) => {
        if (error || !data) {
          console.error("Failed to fetch owner listing:", error);
          toast.error("Could not load this listing");
          setProperty(null);
          setForm(emptyForm());
          return;
        }

        setProperty(data);
        setForm(buildForm(data));
      })
      .catch((error) => {
        console.error("Failed to fetch listing:", error);
        toast.error("Could not load this listing");
        setProperty(null);
        setForm(emptyForm());
      })
      .finally(() => setLoading(false));
  }, [isAdminMode, listingId, open, ownerId]);

  useEffect(() => {
    return () => {
      pendingImages.forEach((image) => URL.revokeObjectURL(image.url));
    };
  }, [pendingImages]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setValidationIssue(null);
    setForm((current) => ({ ...current, [key]: value }));
  };

  const setDigitsOnlyField = (
    key: "contactPhone" | "contactWhatsapp" | "pincode",
    value: string,
    label: string,
  ) => {
    const digitsOnly = value.replace(/\D/g, "");

    if (digitsOnly !== value) {
      toast.error(`${label} must contain digits only`, {
        id: `${key}-digits-only`,
      });
    }

    setField(key, digitsOnly);
  };

  const toggleAmenity = (amenity: string) => {
    setValidationIssue(null);
    setForm((current) => ({
      ...current,
      amenities: current.amenities.includes(amenity)
        ? current.amenities.filter((item) => item !== amenity)
        : [...current.amenities, amenity],
    }));
  };

  const addImages = (files: FileList | File[]) => {
    const availableSlots = MAX_IMAGES - form.existingImages.length - pendingImages.length;
    if (availableSlots <= 0) {
      toast.error(`You can upload up to ${MAX_IMAGES} images`);
      return;
    }

    const nextImages = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, availableSlots)
      .map((file) => ({
        file,
        url: URL.createObjectURL(file),
      }));

    if (nextImages.length === 0) {
      toast.error("Please choose image files");
      return;
    }

    setValidationIssue(null);
    setPendingImages((current) => [...current, ...nextImages]);
  };

  const removePendingImage = (index: number) => {
    setValidationIssue(null);
    setPendingImages((current) => {
      const next = [...current];
      const [removed] = next.splice(index, 1);
      if (removed) {
        URL.revokeObjectURL(removed.url);
      }
      return next;
    });
  };

  const validate = (): ValidationIssue | null => {
    if (!form.title.trim()) {
      return { message: "Title is required", fieldId: "listing-title" };
    }
    if (!form.description.trim()) {
      return { message: "Description is required", fieldId: "listing-description" };
    }
    if (!form.locality.trim()) {
      return { message: "Locality is required", fieldId: "listing-locality" };
    }
    if (!form.price.trim() || Number(form.price) <= 0) {
      return { message: "Enter a valid price", fieldId: "listing-price" };
    }
    if (!form.contactPhone.trim() || form.contactPhone.trim().length < 10) {
      return { message: "Enter a valid contact phone", fieldId: "listing-phone" };
    }
    if (form.propertyType === "residential" && !isPlotListing(form)) {
      if (!form.bedrooms.trim()) {
        return {
          message: "Bedrooms are required for residential properties",
          fieldId: "listing-beds",
        };
      }
      if (!form.bathrooms.trim()) {
        return {
          message: "Bathrooms are required for residential properties",
          fieldId: "listing-baths",
        };
      }
    }
    if (form.existingImages.length + pendingImages.length === 0) {
      return { message: "Add at least one property image" };
    }

    return null;
  };

  const saveChanges = async (options?: { approve?: boolean }) => {
    if (!property || !listingId) {
      return;
    }

    const validationError = validate();
    if (validationError) {
      setValidationIssue(validationError);
      toast.error(validationError.message, {
        id: "listing-validation-error",
      });
      if (validationError.fieldId) {
        requestAnimationFrame(() => {
          const target = document.getElementById(validationError.fieldId!);
          target?.scrollIntoView({ behavior: "smooth", block: "center" });
          target?.focus({ preventScroll: true });
        });
      }
      return;
    }

    setValidationIssue(null);
    setSaving(true);
    let uploadedImageUrls: string[] = [];

    try {
      const originalForm = buildForm(property);
      const removedImages = property.images.filter((image) => !form.existingImages.includes(image));
      const hasContentChanges =
        JSON.stringify(originalForm) !== JSON.stringify(form) ||
        pendingImages.length > 0 ||
        removedImages.length > 0;
      const shouldReturnToReview =
        !isAdminMode && property.status === "active" && property.is_verified && hasContentChanges;
      const nextStatus = options?.approve
        ? "active"
        : isAdminMode
          ? form.status
          : shouldReturnToReview
            ? "pending"
            : property.status;
      const nextVerified = options?.approve
        ? true
        : isAdminMode
          ? form.isVerified
          : shouldReturnToReview
            ? false
            : property.is_verified;
      const nextFeatured = isAdminMode ? form.isFeatured : property.is_featured;

      if (pendingImages.length > 0) {
        const { urls, error } = await uploadPropertyImages(
          property.id,
          pendingImages.map((image) => image.file),
        );

        if (error) {
          throw error;
        }

        uploadedImageUrls = urls;
      }

      const nextImages = [...form.existingImages, ...uploadedImageUrls];
      const isPlot = isPlotListing(form);

      const payload = {
        owner_type: form.ownerType,
        property_type: form.propertyType,
        listing_type: form.listingType,
        title: form.title.trim(),
        description: form.description.trim(),
        category: toNullableString(form.category),
        price: Number(form.price),
        city: form.city.trim() || "Purulia",
        locality: toNullableString(form.locality),
        address: toNullableString(form.address),
        pincode: toNullableString(form.pincode),
        latitude: toNullableNumber(form.latitude),
        longitude: toNullableNumber(form.longitude),
        bedrooms: isPlot ? null : toNullableNumber(form.bedrooms),
        bathrooms: isPlot ? null : toNullableNumber(form.bathrooms),
        area_sqft: toNullableNumber(form.areaSqft),
        furnishing: isPlot ? null : toNullableString(form.furnishing),
        floor_number: isPlot ? null : toNullableNumber(form.floorNumber),
        total_floors: isPlot ? null : toNullableNumber(form.totalFloors),
        amenities: form.amenities,
        images: nextImages,
        contact_phone: toNullableString(form.contactPhone),
        contact_whatsapp: toNullableString(form.contactWhatsapp) ?? form.contactPhone.trim(),
        status: nextStatus,
        is_verified: nextVerified,
        is_featured: nextFeatured,
      } satisfies Partial<PropertyRow>;

      const { data, error } = isAdminMode
        ? await updatePropertyByIdForAdmin(property.id, payload)
        : await updatePropertyByIdForOwner(property.id, ownerId!, payload);

      if (error) {
        throw error;
      }

      // Since the update functions no longer return data due to RLS restrictions,
      // create the updated property by merging the payload with existing data
      const updatedProperty = { ...property, ...payload };

      if (removedImages.length > 0) {
        const cleanupResult = await deletePropertyImagesByUrls(removedImages);
        if (cleanupResult.error) {
          console.error("Failed to clean up removed property images:", cleanupResult.error);
          toast.error("Listing updated, but some removed images are still in storage");
        }
      }

      setProperty(updatedProperty);
      setForm(buildForm(updatedProperty));
      setValidationIssue(null);
      clearPendingImages();
      onSaved(updatedProperty);
      toast.success(
        options?.approve
          ? "Listing approved and published"
          : shouldReturnToReview
            ? "Changes saved and sent for admin approval"
            : "Listing updated successfully",
      );
      onOpenChange(false);
    } catch (error) {
      if (uploadedImageUrls.length > 0) {
        const rollbackResult = await deletePropertyImagesByUrls(uploadedImageUrls);
        if (rollbackResult.error) {
          console.error(
            "Failed to clean up uploaded images after save failure:",
            rollbackResult.error,
          );
        }
      }

      console.error("Failed to update property:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update listing");
    } finally {
      setSaving(false);
    }
  };

  const locationLine = [form.locality, form.city].filter(Boolean).join(", ");
  const displayImages = [...form.existingImages, ...pendingImages.map((image) => image.url)];
  const hasFieldError = (fieldId: string) => validationIssue?.fieldId === fieldId;
  const approvalNotice =
    !isAdminMode && property?.status === "active" && property.is_verified
      ? "Saving changes will send this listing back for admin approval before it shows publicly again."
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[45%] flex h-[min(84vh,880px)] w-[min(96vw,1100px)] max-w-none translate-y-[-45%] flex-col overflow-hidden border-border/70 p-0">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle className="font-display text-2xl font-extrabold">
            Listing Details
          </DialogTitle>
          <DialogDescription>
            {isAdminMode
              ? "Review every submitted detail, revise what you need, and approve the listing when it is ready to go live."
              : "Review everything about this property and edit any field before saving."}
          </DialogDescription>
        </DialogHeader>

        <div className="scrollbar-hidden min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !property ? (
            <div className="flex min-h-[360px] items-center justify-center text-center text-sm text-muted-foreground">
              This listing could not be loaded.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                <Card className="overflow-hidden p-0">
                  {displayImages.length > 0 ? (
                    <div className="grid gap-2 p-2 sm:grid-cols-[minmax(0,2fr)_minmax(180px,0.9fr)]">
                      <div className="overflow-hidden rounded-xl bg-muted">
                        <img
                          src={displayImages[0]}
                          alt={form.title}
                          className="h-[320px] w-full object-cover"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
                        {displayImages.slice(1, 5).map((image, index) => (
                          <div
                            key={`${image}-${index}`}
                            className="overflow-hidden rounded-xl bg-muted"
                          >
                            <img
                              src={image}
                              alt={`${form.title} ${index + 2}`}
                              className="h-[76px] w-full object-cover sm:h-[74px]"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-[320px] items-center justify-center bg-muted text-sm text-muted-foreground">
                      No property images
                    </div>
                  )}
                </Card>

                <Card className="space-y-4 p-5">
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-primary text-primary-foreground capitalize">
                      For {form.listingType}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">
                      {form.propertyType}
                    </Badge>
                    {form.isVerified ? (
                      <Badge className="bg-success text-success-foreground">
                        <BadgeCheck className="mr-1 h-3 w-3" /> Verified
                      </Badge>
                    ) : null}
                    {form.isFeatured ? (
                      <Badge className="bg-orange text-orange-foreground">
                        <Sparkles className="mr-1 h-3 w-3" /> Featured
                      </Badge>
                    ) : null}
                  </div>

                  <div>
                    <div className="font-display text-2xl font-extrabold">{form.title}</div>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 text-orange" />
                      <span>{locationLine || property.city}</span>
                    </div>
                  </div>

                  <div className="font-display text-3xl font-extrabold text-orange">
                    {Number(form.price) > 0
                      ? formatPrice(Number(form.price), form.listingType)
                      : "Set price"}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Card className="p-3">
                      <div className="text-xs text-muted-foreground">Status</div>
                      <div className="mt-1 font-medium capitalize">{form.status}</div>
                    </Card>
                    <Card className="p-3">
                      <div className="text-xs text-muted-foreground">Views</div>
                      <div className="mt-1 flex items-center gap-1 font-medium">
                        <Eye className="h-4 w-4 text-primary" /> {property.views}
                      </div>
                    </Card>
                    <Card className="p-3">
                      <div className="text-xs text-muted-foreground">Created</div>
                      <div className="mt-1 font-medium">
                        {new Date(property.created_at).toLocaleDateString("en-IN")}
                      </div>
                    </Card>
                    <Card className="p-3">
                      <div className="text-xs text-muted-foreground">Updated</div>
                      <div className="mt-1 font-medium">
                        {new Date(property.updated_at).toLocaleDateString("en-IN")}
                      </div>
                    </Card>
                  </div>

                  <Button asChild variant="outline" className="w-full">
                    <Link
                      to="/properties/$id"
                      params={{ id: property.id }}
                      onClick={() => onOpenChange(false)}
                    >
                      Open public page
                    </Link>
                  </Button>
                </Card>
              </div>

              <Card className="p-5">
                <h3 className="font-display text-lg font-bold">Basic Details</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Owner Type</Label>
                    <Select
                      value={form.ownerType}
                      onValueChange={(value) =>
                        setField("ownerType", value as FormState["ownerType"])
                      }
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="broker">Broker</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {isAdminMode ? (
                    <div>
                      <Label>Status</Label>
                      <Select
                        value={form.status}
                        onValueChange={(value) => setField("status", value as FormState["status"])}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status} value={status} className="capitalize">
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div>
                      <Label>Review Status</Label>
                      <div className="mt-1.5 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm capitalize text-muted-foreground">
                        {form.status}
                      </div>
                    </div>
                  )}
                  <div>
                    <Label>Property Type</Label>
                    <Select
                      value={form.propertyType}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          propertyType: value as FormState["propertyType"],
                          category: "",
                          amenities: [],
                        }))
                      }
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Listing Type</Label>
                    <Select
                      value={form.listingType}
                      onValueChange={(value) =>
                        setField("listingType", value as FormState["listingType"])
                      }
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sale">For Sale</SelectItem>
                        <SelectItem value="rent">For Rent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {isAdminMode ? (
                    <div className="md:col-span-2 grid gap-3 sm:grid-cols-2">
                      <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-3 text-sm">
                        <Checkbox
                          checked={form.isVerified}
                          onCheckedChange={(checked) => setField("isVerified", checked === true)}
                        />
                        Mark this listing as verified
                      </label>
                      <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-3 text-sm">
                        <Checkbox
                          checked={form.isFeatured}
                          onCheckedChange={(checked) => setField("isFeatured", checked === true)}
                        />
                        Feature this listing on the site
                      </label>
                    </div>
                  ) : null}
                  <div className="md:col-span-2">
                    <Label htmlFor="listing-title">Title</Label>
                    <Input
                      id="listing-title"
                      value={form.title}
                      onChange={(event) => setField("title", event.target.value)}
                      aria-invalid={hasFieldError("listing-title")}
                      className="mt-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/30"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="listing-description">Description</Label>
                    <Textarea
                      id="listing-description"
                      rows={5}
                      value={form.description}
                      onChange={(event) => setField("description", event.target.value)}
                      aria-invalid={hasFieldError("listing-description")}
                      className="mt-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/30"
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={form.category || EMPTY_SELECT}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          category: value === EMPTY_SELECT ? "" : value,
                          bedrooms: value === "plot" ? "" : current.bedrooms,
                          bathrooms: value === "plot" ? "" : current.bathrooms,
                          furnishing: value === "plot" ? "" : current.furnishing,
                          floorNumber: value === "plot" ? "" : current.floorNumber,
                          totalFloors: value === "plot" ? "" : current.totalFloors,
                        }))
                      }
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={EMPTY_SELECT}>None</SelectItem>
                        {categoryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="listing-price">
                      {form.listingType === "rent" ? "Monthly Rent (Rs)" : "Price (Rs)"}
                    </Label>
                    <Input
                      id="listing-price"
                      type="number"
                      min={0}
                      value={form.price}
                      onChange={(event) => setField("price", event.target.value)}
                      aria-invalid={hasFieldError("listing-price")}
                      className="mt-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/30"
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                {isPlotListing(form) ? (
                  <>
                    <h3 className="font-display text-lg font-bold">Land Specifications</h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="listing-area">Total Area (sq ft)</Label>
                        <Input
                          id="listing-area"
                          type="number"
                          min={0}
                          value={form.areaSqft}
                          onChange={(event) => setField("areaSqft", event.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                    </div>

                    <div className="mt-5">
                      <Label className="mb-2 block">Plot details</Label>
                      {form.amenities.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {form.amenities.map((detail) => (
                            <span
                              key={detail}
                              className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-foreground"
                            >
                              {detail}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Plot details are included in the listing description.
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="font-display text-lg font-bold">Specifications</h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <Label htmlFor="listing-beds">Bedrooms</Label>
                        <Input
                          id="listing-beds"
                          type="number"
                          min={0}
                          value={form.bedrooms}
                          onChange={(event) => setField("bedrooms", event.target.value)}
                          aria-invalid={hasFieldError("listing-beds")}
                          className="mt-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/30"
                        />
                      </div>
                      <div>
                        <Label htmlFor="listing-baths">Bathrooms</Label>
                        <Input
                          id="listing-baths"
                          type="number"
                          min={0}
                          value={form.bathrooms}
                          onChange={(event) => setField("bathrooms", event.target.value)}
                          aria-invalid={hasFieldError("listing-baths")}
                          className="mt-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/30"
                        />
                      </div>
                      <div>
                        <Label htmlFor="listing-area">Area (sq ft)</Label>
                        <Input
                          id="listing-area"
                          type="number"
                          min={0}
                          value={form.areaSqft}
                          onChange={(event) => setField("areaSqft", event.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label>Furnishing</Label>
                        <Select
                          value={form.furnishing || EMPTY_SELECT}
                          onValueChange={(value) =>
                            setField("furnishing", value === EMPTY_SELECT ? "" : value)
                          }
                        >
                          <SelectTrigger className="mt-1.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={EMPTY_SELECT}>None</SelectItem>
                            <SelectItem value="furnished">Furnished</SelectItem>
                            <SelectItem value="semi-furnished">Semi-Furnished</SelectItem>
                            <SelectItem value="unfurnished">Unfurnished</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="listing-floor">Floor Number</Label>
                        <Input
                          id="listing-floor"
                          type="number"
                          min={0}
                          value={form.floorNumber}
                          onChange={(event) => setField("floorNumber", event.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="listing-total-floors">Total Floors</Label>
                        <Input
                          id="listing-total-floors"
                          type="number"
                          min={0}
                          value={form.totalFloors}
                          onChange={(event) => setField("totalFloors", event.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                    </div>
                  </>
                )}

                {!isPlotListing(form) ? (
                  <div className="mt-5">
                    <Label className="mb-2 block">Amenities</Label>
                    <div className="flex flex-wrap gap-2">
                      {amenityOptions.map((amenity) => {
                        const selected = form.amenities.includes(amenity);

                        return (
                          <button
                            key={amenity}
                            type="button"
                            onClick={() => toggleAmenity(amenity)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                              selected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            {amenity}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </Card>

              <Card className="p-5">
                <h3 className="font-display text-lg font-bold">Location & Contact</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="listing-city">City</Label>
                    <Input
                      id="listing-city"
                      value={form.city}
                      onChange={(event) => setField("city", event.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="listing-locality">Locality</Label>
                    <Input
                      id="listing-locality"
                      value={form.locality}
                      onChange={(event) => setField("locality", event.target.value)}
                      aria-invalid={hasFieldError("listing-locality")}
                      className="mt-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/30"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="listing-address">Address</Label>
                    <Textarea
                      id="listing-address"
                      rows={3}
                      value={form.address}
                      onChange={(event) => setField("address", event.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="listing-pincode">Pincode</Label>
                    <Input
                      id="listing-pincode"
                      value={form.pincode}
                      onChange={(event) =>
                        setDigitsOnlyField("pincode", event.target.value, "Pincode")
                      }
                      className="mt-1.5"
                      inputMode="numeric"
                      maxLength={6}
                    />
                  </div>
                  <div>
                    <Label htmlFor="listing-phone">Contact Phone</Label>
                    <Input
                      id="listing-phone"
                      value={form.contactPhone}
                      onChange={(event) =>
                        setDigitsOnlyField("contactPhone", event.target.value, "Contact phone")
                      }
                      aria-invalid={hasFieldError("listing-phone")}
                      className="mt-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/30"
                      inputMode="numeric"
                      maxLength={15}
                    />
                  </div>
                  <div>
                    <Label htmlFor="listing-latitude">Latitude</Label>
                    <Input
                      id="listing-latitude"
                      value={form.latitude}
                      onChange={(event) => setField("latitude", event.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="listing-longitude">Longitude</Label>
                    <Input
                      id="listing-longitude"
                      value={form.longitude}
                      onChange={(event) => setField("longitude", event.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="listing-whatsapp">WhatsApp</Label>
                    <Input
                      id="listing-whatsapp"
                      value={form.contactWhatsapp}
                      onChange={(event) =>
                        setDigitsOnlyField("contactWhatsapp", event.target.value, "WhatsApp number")
                      }
                      className="mt-1.5"
                      inputMode="numeric"
                      maxLength={15}
                    />
                    <label className="mt-3 flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={!!form.contactPhone && form.contactWhatsapp === form.contactPhone}
                        onCheckedChange={(checked) =>
                          setField("contactWhatsapp", checked ? form.contactPhone : "")
                        }
                      />
                      Use the same number for WhatsApp
                    </label>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="font-display text-lg font-bold">Photos</h3>
                <div className="mt-4 space-y-4">
                  <label
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (event.dataTransfer.files) {
                        addImages(event.dataTransfer.files);
                      }
                    }}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 text-center transition hover:border-primary hover:bg-primary/5"
                  >
                    <ImagePlus className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">Drop new images here or click to upload</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Up to {MAX_IMAGES} total images
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(event) => {
                        if (event.target.files) {
                          addImages(event.target.files);
                          event.target.value = "";
                        }
                      }}
                    />
                  </label>

                  {displayImages.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                      {form.existingImages.map((image, index) => (
                        <div
                          key={image}
                          className="group relative overflow-hidden rounded-xl border border-border"
                        >
                          <img
                            src={image}
                            alt={`Existing ${index + 1}`}
                            className="aspect-square h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setField(
                                "existingImages",
                                form.existingImages.filter((current) => current !== image),
                              )
                            }
                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-destructive shadow-sm transition opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          {index === 0 ? (
                            <span className="absolute bottom-2 left-2 rounded bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground">
                              Cover
                            </span>
                          ) : null}
                        </div>
                      ))}

                      {pendingImages.map((image, index) => (
                        <div
                          key={image.url}
                          className="group relative overflow-hidden rounded-xl border border-border"
                        >
                          <img
                            src={image.url}
                            alt={`New ${index + 1}`}
                            className="aspect-square h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removePendingImage(index)}
                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-destructive shadow-sm transition opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <span className="absolute bottom-2 left-2 rounded bg-orange px-2 py-1 text-[10px] font-semibold text-orange-foreground">
                            New
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Card>
            </div>
          )}
        </div>

        <div className="border-t border-border px-6 py-4">
          {approvalNotice ? (
            <Alert className="mb-4 border-primary/30 bg-primary/10 text-foreground">
              <AlertTriangle className="h-4 w-4 text-primary" />
              <AlertTitle>Admin review required</AlertTitle>
              <AlertDescription>{approvalNotice}</AlertDescription>
            </Alert>
          ) : null}

          {validationIssue ? (
            <Alert className="mb-4 border-orange/40 bg-orange/10 text-foreground">
              <AlertTriangle className="h-4 w-4 text-orange" />
              <AlertTitle>Complete the required fields</AlertTitle>
              <AlertDescription>{validationIssue.message}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <div className="flex items-center gap-2">
              {isAdminMode &&
              property &&
              (property.status !== "active" || !property.is_verified) ? (
                <Button
                  variant="outline"
                  onClick={() => saveChanges({ approve: true })}
                  disabled={loading || saving || !property}
                >
                  <BadgeCheck className="h-4 w-4" />
                  Approve & Publish
                </Button>
              ) : null}
              <Button
                onClick={() => saveChanges()}
                disabled={loading || saving || !property}
                className="bg-orange text-orange-foreground hover:bg-orange/90"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
