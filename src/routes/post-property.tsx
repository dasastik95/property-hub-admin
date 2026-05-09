import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  MapPin,
  Check,
  Sparkles,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { BUSINESS } from "@/config/business";
import { useAuth } from "@/lib/auth";
import { createProperty } from "@/integrations/supabase/database";
import { deletePropertyImagesByUrls, uploadPropertyImages } from "@/integrations/supabase/storage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/post-property")({
  head: () => ({
    meta: [
      { title: `Post a Property — ${BUSINESS.name}` },
      {
        name: "description",
        content:
          "List your property for sale or rent on Purulia Properties — fast, free, and verified.",
      },
    ],
  }),
  component: PostPropertyPage,
});

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

const RESIDENTIAL_SUBTYPES = [
  { value: "house", label: "House", hint: "Independent house" },
  { value: "apartment", label: "Apartment / Flat", hint: "Flat in a building" },
  { value: "plot", label: "Plot / Land", hint: "Residential land for building" },
  { value: "villa", label: "Villa", hint: "Premium independent home" },
  { value: "pg", label: "PG / Hostel", hint: "Shared living space" },
] as const;

const COMMERCIAL_SUBTYPES = [
  { value: "office", label: "Office", hint: "Office or workspace" },
  { value: "shop", label: "Shop / Showroom", hint: "Retail or showroom" },
  { value: "warehouse", label: "Warehouse", hint: "Storage or godown" },
  { value: "industrial", label: "Industrial", hint: "Factory or industrial use" },
] as const;

const LAND_AREA_UNITS = [
  { value: "sq_ft", label: "Square foot" },
  { value: "decimal", label: "Decimal" },
  { value: "katha", label: "Katha" },
  { value: "bigha", label: "Bigha" },
] as const;

const ROAD_CONDITIONS = ["Concrete", "Blacktop", "Murram", "Kutcha", "Under construction"] as const;
const AVAILABILITY_OPTIONS = ["Available", "Nearby", "Not available", "Unknown"] as const;
const LOCALITY_TYPES = ["Hindu", "Muslim", "Mixed", "Other"] as const;
const PLOT_TYPES = [
  "Residential plot",
  "Corner plot",
  "Roadside plot",
  "Gated plot",
  "Agricultural land",
] as const;

function isResidentialPlot(form: Pick<FormState, "propertyType" | "category">) {
  return form.propertyType === "residential" && form.category === "plot";
}

function compactDetails(details: Array<[string, string]>) {
  return details
    .filter(([, value]) => value.trim())
    .map(([label, value]) => `${label}: ${value.trim()}`);
}

function getPlotAreaSqft(area: string, unit: string) {
  const value = Number(area);
  if (!Number.isFinite(value) || value <= 0) return null;
  if (unit === "decimal") return Math.round(value * 435.6);
  if (unit === "katha") return Math.round(value * 720);
  if (unit === "bigha") return Math.round(value * 14400);
  return Math.round(value);
}

function sanitizePhone(phone: string) {
  return phone.replace(/\D/g, "").slice(0, 10);
}

function isValidPhone(phone: string) {
  return sanitizePhone(phone).length === 10;
}

type FormState = {
  // Step 1
  ownerType: "individual" | "broker" | null;
  // Step 2
  propertyType: "residential" | "commercial" | null;
  listingType: "sale" | "rent" | null;
  // Step 3
  title: string;
  description: string;
  category: string;
  bedrooms: string;
  bathrooms: string;
  furnishing: string;
  floorNumber: string;
  totalFloors: string;
  areaSqft: string;
  plotAreaSqft: string;
  plotAreaUnit: string;
  frontRoadWidth: string;
  roadCondition: string;
  electricityAvailability: string;
  waterAvailability: string;
  communityLocality: string;
  nearestHospitalDistance: string;
  nearestSchoolDistance: string;
  marketDistance: string;
  plotType: string;
  amenities: string[];
  // Step 4
  city: string;
  locality: string;
  address: string;
  pincode: string;
  latitude: string;
  longitude: string;
  // Step 5
  price: string;
  contactPhone: string;
  contactWhatsapp: string;
  // Step 6
  images: { file: File; url: string }[];
};

type ValidationIssue = {
  message: string;
  fieldId?: string;
};

const STEPS = ["You", "Property", "Details", "Location", "Pricing", "Photos"];

function PostPropertyPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [validationIssue, setValidationIssue] = useState<ValidationIssue | null>(null);
  const [form, setForm] = useState<FormState>({
    ownerType: null,
    propertyType: null,
    listingType: null,
    title: "",
    description: "",
    category: "",
    bedrooms: "",
    bathrooms: "",
    furnishing: "",
    floorNumber: "",
    totalFloors: "",
    areaSqft: "",
    plotAreaSqft: "",
    plotAreaUnit: "sq_ft",
    frontRoadWidth: "",
    roadCondition: "",
    electricityAvailability: "",
    waterAvailability: "",
    communityLocality: "",
    nearestHospitalDistance: "",
    nearestSchoolDistance: "",
    marketDistance: "",
    plotType: "",
    amenities: [],
    city: "Purulia",
    locality: "",
    address: "",
    pincode: "",
    latitude: "",
    longitude: "",
    price: "",
    contactPhone: "",
    contactWhatsapp: "",
    images: [],
  });

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please log in to post a property");
      navigate({ to: "/auth" });
    }
  }, [user, authLoading, navigate]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setValidationIssue(null);
    setForm((f) => ({ ...f, [k]: v }));
  };

  const choosePropertyType = (propertyType: "residential" | "commercial") => {
    setValidationIssue(null);
    setForm((current) => ({
      ...current,
      propertyType,
      category: "",
      bedrooms: "",
      bathrooms: "",
      furnishing: "",
      floorNumber: "",
      totalFloors: "",
      areaSqft: "",
      plotAreaSqft: "",
      plotAreaUnit: "sq_ft",
      frontRoadWidth: "",
      roadCondition: "",
      electricityAvailability: "",
      waterAvailability: "",
      communityLocality: "",
      nearestHospitalDistance: "",
      nearestSchoolDistance: "",
      marketDistance: "",
      plotType: "",
      amenities: [],
    }));
  };

  const chooseCategory = (category: string) => {
    setValidationIssue(null);
    setForm((current) => ({
      ...current,
      category,
      bedrooms: category === "plot" ? "" : current.bedrooms,
      bathrooms: category === "plot" ? "" : current.bathrooms,
      furnishing: category === "plot" ? "" : current.furnishing,
      floorNumber: category === "plot" ? "" : current.floorNumber,
      totalFloors: category === "plot" ? "" : current.totalFloors,
      areaSqft: category === "plot" ? "" : current.areaSqft,
      amenities: [],
    }));
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set("latitude", pos.coords.latitude.toFixed(6));
        set("longitude", pos.coords.longitude.toFixed(6));
        toast.success("Location detected");
      },
      () => toast.error("Could not detect location"),
    );
  };

  const handleFiles = (files: FileList | File[]) => {
    const arr = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 10 - form.images.length);
    const next = arr.map((file) => ({ file, url: URL.createObjectURL(file) }));
    set("images", [...form.images, ...next]);
  };

  const removeImage = (idx: number) => {
    URL.revokeObjectURL(form.images[idx].url);
    set(
      "images",
      form.images.filter((_, i) => i !== idx),
    );
  };

  const showValidationIssue = (issue: ValidationIssue) => {
    setValidationIssue(issue);
    if (!issue.fieldId) return;

    requestAnimationFrame(() => {
      const field = document.getElementById(issue.fieldId!);
      field?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (
        field instanceof HTMLInputElement ||
        field instanceof HTMLTextAreaElement ||
        field instanceof HTMLButtonElement
      ) {
        field.focus({ preventScroll: true });
      }
    });
  };

  const hasFieldError = (fieldId: string) => validationIssue?.fieldId === fieldId;
  const errorInputClass = (fieldId: string) =>
    hasFieldError(fieldId) ? "border-destructive ring-1 ring-destructive/40" : "";

  const validateStep = (): ValidationIssue | null => {
    if (step === 0 && !form.ownerType) return { message: "Please choose owner type." };
    if (step === 1) {
      if (!form.propertyType) return { message: "Choose residential or commercial." };
      if (!form.category) return { message: "Choose the exact property type." };
      if (!form.listingType) return { message: "Choose sale or rent." };
    }
    if (step === 2) {
      if (!form.title.trim()) return { message: "Listing title is required.", fieldId: "title" };
      if (form.title.trim().length < 10)
        return {
          message: "Listing title must be at least 10 characters.",
          fieldId: "title",
        };
      if (!form.description.trim() || form.description.trim().length < 30)
        return {
          message: "Description must be at least 30 characters.",
          fieldId: "desc",
        };
      if (isResidentialPlot(form)) {
        if (!form.plotAreaSqft || Number(form.plotAreaSqft) <= 0)
          return { message: "Total land area is required.", fieldId: "plot-area" };
        if (!form.plotAreaUnit) return { message: "Choose land area unit." };
        if (!form.plotType) return { message: "Choose plot type." };
        if (!form.frontRoadWidth || Number(form.frontRoadWidth) <= 0)
          return { message: "Front road width is required.", fieldId: "road-width" };
        if (!form.roadCondition) return { message: "Choose front road condition." };
        if (!form.electricityAvailability) return { message: "Choose electricity availability." };
        if (!form.waterAvailability) return { message: "Choose water availability." };
        if (!form.communityLocality) return { message: "Choose locality type." };
        if (!form.nearestSchoolDistance)
          return { message: "Nearest school distance is required.", fieldId: "school-distance" };
        if (!form.nearestHospitalDistance)
          return {
            message: "Nearest hospital distance is required.",
            fieldId: "hospital-distance",
          };
        if (!form.marketDistance)
          return { message: "Market distance is required.", fieldId: "market-distance" };
        return null;
      }
      if (!form.areaSqft || Number(form.areaSqft) <= 0)
        return { message: "Built-up area is required.", fieldId: "area" };
      if (form.propertyType === "residential" && (!form.bedrooms || !form.bathrooms))
        return {
          message: "Bedrooms and bathrooms are required.",
          fieldId: !form.bedrooms ? "beds" : "baths",
        };
    }
    if (step === 3 && !form.locality.trim())
      return { message: "Locality or area is required.", fieldId: "loc" };
    if (step === 4) {
      if (!form.price || Number(form.price) <= 0)
        return { message: "Price is required.", fieldId: "price" };
      if (!isValidPhone(form.contactPhone))
        return { message: "Enter a valid contact phone number.", fieldId: "cphone" };
      if (form.contactWhatsapp && !isValidPhone(form.contactWhatsapp))
        return { message: "Enter a valid WhatsApp number.", fieldId: "cwa" };
    }
    if (step === 5 && form.images.length === 0)
      return { message: "Please add at least one property photo." };
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) {
      showValidationIssue(err);
      return;
    }
    setValidationIssue(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    console.log("🚀 SUBMIT BUTTON CLICKED!");
    console.log("Current step:", step);
    console.log("Total steps:", STEPS.length);
    console.log("Is final step?", step === STEPS.length - 1);
    console.log("Form data:", form);
    console.log("Submitting state:", submitting);

    // Check if we're on the final step
    if (step !== STEPS.length - 1) {
      console.log("❌ Not on final step, cannot submit");
      showValidationIssue({ message: "Please complete all steps before submitting." });
      return;
    }

    const err = validateStep();
    console.log("Validation error:", err);
    if (err) {
      console.log("❌ Validation failed:", err);
      showValidationIssue(err);
      return;
    }

    console.log("✅ Validation passed, proceeding with submission...");
    if (!user) {
      console.error("No user found - user is null");
      toast.error("You must be logged in to post a property");
      return;
    }

    console.log("User object:", user);
    console.log("User ID:", user.id);

    // Check if user session is valid
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Session error:", sessionError);
        toast.error("Your session has expired. Please log in again.");
        return;
      }
      if (!session) {
        console.error("No active session");
        toast.error("You must be logged in to post a property");
        return;
      }
      console.log("Session is valid:", session.user.id);
    } catch (sessionCheckError) {
      console.error("Session check failed:", sessionCheckError);
      toast.error("Authentication check failed. Please try again.");
      return;
    }

    setSubmitting(true);
    let uploadedImageUrls: string[] = [];
    try {
      console.log("Starting property submission...");
      console.log("Form data:", form);

      // Upload images first to storage
      console.log("Uploading images...");
      const { urls: imageUrls, error: uploadError } = await uploadPropertyImages(
        crypto.randomUUID(), // temporary ID for organizing uploads
        form.images.map((image) => image.file),
      );

      if (uploadError || imageUrls.length === 0) {
        console.error("Image upload failed:", uploadError);
        throw new Error("Image upload failed. Please try again.");
      }

      console.log("Images uploaded successfully:", imageUrls);
      uploadedImageUrls = imageUrls;

      const isPlotListing = isResidentialPlot(form);
      const plotDetails = isPlotListing
        ? compactDetails([
            ["Plot area", `${form.plotAreaSqft} ${form.plotAreaUnit.replace("_", " ")}`],
            ["Plot type", form.plotType],
            ["Front road width", `${form.frontRoadWidth} ft`],
            ["Front road condition", form.roadCondition],
            ["Electricity", form.electricityAvailability],
            ["Water", form.waterAvailability],
            ["Locality type", form.communityLocality],
            ["Nearest school", form.nearestSchoolDistance],
            ["Nearest hospital", form.nearestHospitalDistance],
            ["Nearest market", form.marketDistance],
          ])
        : [];
      const plotAreaSqft = isPlotListing
        ? getPlotAreaSqft(form.plotAreaSqft, form.plotAreaUnit)
        : null;
      const description = isPlotListing
        ? `${form.description.trim()}\n\nLand details:\n${plotDetails.join("\n")}`
        : form.description.trim();
      const contactPhone = sanitizePhone(form.contactPhone);
      const contactWhatsapp = sanitizePhone(form.contactWhatsapp);

      // Create property with image URLs
      const propertyPayload = {
        owner_id: user.id,
        owner_type: form.ownerType!,
        property_type: form.propertyType!,
        listing_type: form.listingType!,
        title: form.title.trim(),
        description,
        category: form.category || null,
        price: Number(form.price),
        city: form.city.trim() || "Purulia",
        state: "West Bengal",
        locality: form.locality.trim() || null,
        address: form.address.trim() || null,
        pincode: form.pincode.trim() || null,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        bedrooms: isPlotListing ? null : form.bedrooms ? Number(form.bedrooms) : null,
        bathrooms: isPlotListing ? null : form.bathrooms ? Number(form.bathrooms) : null,
        area_sqft: isPlotListing ? plotAreaSqft : form.areaSqft ? Number(form.areaSqft) : null,
        furnishing: isPlotListing ? null : form.furnishing || null,
        floor_number: isPlotListing ? null : form.floorNumber ? Number(form.floorNumber) : null,
        total_floors: isPlotListing ? null : form.totalFloors ? Number(form.totalFloors) : null,
        amenities: isPlotListing ? plotDetails : form.amenities,
        images: imageUrls,
        contact_phone: contactPhone,
        contact_whatsapp: contactWhatsapp || contactPhone,
        status: "pending",
        is_verified: false,
      };

      console.log("Property payload:", propertyPayload);

      const { data, error } = await createProperty(propertyPayload);

      if (error) {
        console.error("Property creation error:", error);
        throw error;
      }

      if (!data) {
        console.error("No data returned from property creation");
        throw new Error("Property creation failed - no data returned");
      }

      console.log("Property created successfully:", data);
      toast.success("Property submitted for admin approval");
      navigate({ to: "/dashboard" });
    } catch (e) {
      if (uploadedImageUrls.length > 0) {
        const cleanupResult = await deletePropertyImagesByUrls(uploadedImageUrls);
        if (cleanupResult.error) {
          console.error(
            "Failed to clean up uploaded property images after submit failure:",
            cleanupResult.error,
          );
        }
      }

      console.error("Submit error:", e);
      toast.error(e instanceof Error ? e.message : "Failed to post property");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center md:px-6">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isPlotForm = isResidentialPlot(form);
  const amenityList = form.propertyType === "commercial" ? COM_AMENITIES : RES_AMENITIES;
  const subtypeOptions =
    form.propertyType === "commercial" ? COMMERCIAL_SUBTYPES : RESIDENTIAL_SUBTYPES;
  const areaForPricing = isPlotForm
    ? getPlotAreaSqft(form.plotAreaSqft, form.plotAreaUnit)
    : form.areaSqft
      ? Number(form.areaSqft)
      : null;
  const suggestedPrice =
    areaForPricing && form.listingType
      ? form.listingType === "sale"
        ? areaForPricing * 3500
        : areaForPricing * 18
      : null;

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange/10 text-orange">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold md:text-3xl">Post Your Property</h1>
            <p className="text-sm text-muted-foreground">It's free and takes just a few minutes.</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="mb-6 hidden md:flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition",
                  i < step
                    ? "bg-success text-success-foreground"
                    : i === step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs font-medium",
                  i === step ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={cn("h-px flex-1", i < step ? "bg-success" : "bg-border")} />
              )}
            </div>
          ))}
        </div>
        <div className="mb-6 md:hidden">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Step {step + 1} of {STEPS.length}
            </span>
            <span>{STEPS[step]}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        <Card className="p-6 md:p-8">
          {validationIssue && (
            <Alert className="mb-5 border-destructive/50 bg-destructive/10 text-foreground">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertTitle>Please check this field</AlertTitle>
              <AlertDescription className="text-foreground/90">
                {validationIssue.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Step 0: Owner type */}
          {step === 0 && (
            <div>
              <h2 className="font-display text-xl font-semibold">Are you posting as…</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                This helps us tag your listing correctly.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {(["individual", "broker"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => set("ownerType", t)}
                    className={cn(
                      "rounded-xl border-2 p-5 text-left transition",
                      form.ownerType === t
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    <div className="font-display text-lg font-semibold capitalize">
                      {t === "individual" ? "Individual Owner" : "Broker / Agent"}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {t === "individual" ? "I own this property" : "I'm representing the owner"}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Property + listing type */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-semibold">What kind of property?</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {(["residential", "commercial"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => choosePropertyType(t)}
                      className={cn(
                        "rounded-xl border-2 p-4 text-left transition",
                        form.propertyType === t
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50",
                      )}
                    >
                      <div className="font-display font-semibold capitalize">{t}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {t === "residential"
                          ? "House, apartment, plot, villa"
                          : "Office, shop, warehouse"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              {form.propertyType && (
                <div>
                  <h2 className="font-display text-xl font-semibold">Choose exact property type</h2>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {subtypeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => chooseCategory(option.value)}
                        className={cn(
                          "rounded-xl border-2 p-4 text-left transition",
                          form.category === option.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50",
                        )}
                      >
                        <div className="font-display font-semibold">{option.label}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">{option.hint}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <h2 className="font-display text-xl font-semibold">Listing type</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {(["sale", "rent"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => set("listingType", t)}
                      className={cn(
                        "rounded-xl border-2 p-4 text-left transition",
                        form.listingType === t
                          ? "border-orange bg-orange/5"
                          : "border-border hover:border-orange/50",
                      )}
                    >
                      <div className="font-display font-semibold capitalize">For {t}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-semibold">Property details</h2>
              <div>
                <Label htmlFor="title">Listing title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  aria-invalid={hasFieldError("title")}
                  className={cn("mt-1.5", errorInputClass("title"))}
                  placeholder={
                    form.propertyType === "commercial"
                      ? "e.g. Prime shop on Saheed Khudiram Road"
                      : "e.g. Spacious 3 BHK in Bhatbandh"
                  }
                  maxLength={120}
                />
                <p className="mt-1 text-xs text-muted-foreground">{form.title.length}/120</p>
              </div>
              <div>
                <Label htmlFor="desc">Description *</Label>
                <Textarea
                  id="desc"
                  rows={5}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  aria-invalid={hasFieldError("desc")}
                  className={cn("mt-1.5", errorInputClass("desc"))}
                  maxLength={2000}
                  placeholder="Tell buyers what makes this property special — neighbourhood, schools nearby, recent renovations…"
                />
                <p className="mt-1 text-xs text-muted-foreground">{form.description.length}/2000</p>
              </div>

              {isPlotForm ? (
                <div className="space-y-5 rounded-xl border border-border bg-secondary/25 p-4">
                  <div>
                    <h3 className="font-display text-lg font-semibold">Land / plot details</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      This form is only for land listings, so no BHK or room fields are shown.
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <Label htmlFor="plot-area">Total land area *</Label>
                      <Input
                        id="plot-area"
                        type="number"
                        min={0}
                        value={form.plotAreaSqft}
                        onChange={(e) => set("plotAreaSqft", e.target.value)}
                        aria-invalid={hasFieldError("plot-area")}
                        className={cn("mt-1.5", errorInputClass("plot-area"))}
                      />
                    </div>
                    <div>
                      <Label>Area unit *</Label>
                      <Select
                        value={form.plotAreaUnit}
                        onValueChange={(v) => set("plotAreaUnit", v)}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {LAND_AREA_UNITS.map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Plot type *</Label>
                      <Select value={form.plotType} onValueChange={(v) => set("plotType", v)}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select plot type" />
                        </SelectTrigger>
                        <SelectContent>
                          {PLOT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="road-width">Front road width (ft) *</Label>
                      <Input
                        id="road-width"
                        type="number"
                        min={0}
                        value={form.frontRoadWidth}
                        onChange={(e) => set("frontRoadWidth", e.target.value)}
                        aria-invalid={hasFieldError("road-width")}
                        className={cn("mt-1.5", errorInputClass("road-width"))}
                      />
                    </div>
                    <div>
                      <Label>Front road condition *</Label>
                      <Select
                        value={form.roadCondition}
                        onValueChange={(v) => set("roadCondition", v)}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select road condition" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROAD_CONDITIONS.map((condition) => (
                            <SelectItem key={condition} value={condition}>
                              {condition}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <Label>Electricity availability *</Label>
                      <Select
                        value={form.electricityAvailability}
                        onValueChange={(v) => set("electricityAvailability", v)}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABILITY_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Water availability *</Label>
                      <Select
                        value={form.waterAvailability}
                        onValueChange={(v) => set("waterAvailability", v)}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {AVAILABILITY_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Locality type *</Label>
                      <Select
                        value={form.communityLocality}
                        onValueChange={(v) => set("communityLocality", v)}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {LOCALITY_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <Label htmlFor="school-distance">Nearest school distance *</Label>
                      <Input
                        id="school-distance"
                        value={form.nearestSchoolDistance}
                        onChange={(e) => set("nearestSchoolDistance", e.target.value)}
                        aria-invalid={hasFieldError("school-distance")}
                        className={cn("mt-1.5", errorInputClass("school-distance"))}
                        placeholder="e.g. 1.2 km"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hospital-distance">Nearest hospital distance *</Label>
                      <Input
                        id="hospital-distance"
                        value={form.nearestHospitalDistance}
                        onChange={(e) => set("nearestHospitalDistance", e.target.value)}
                        aria-invalid={hasFieldError("hospital-distance")}
                        className={cn("mt-1.5", errorInputClass("hospital-distance"))}
                        placeholder="e.g. 3 km"
                      />
                    </div>
                    <div>
                      <Label htmlFor="market-distance">Market distance *</Label>
                      <Input
                        id="market-distance"
                        value={form.marketDistance}
                        onChange={(e) => set("marketDistance", e.target.value)}
                        aria-invalid={hasFieldError("market-distance")}
                        className={cn("mt-1.5", errorInputClass("market-distance"))}
                        placeholder="e.g. 800 m"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {form.propertyType === "residential" && (
                      <>
                        <div>
                          <Label htmlFor="beds">Bedrooms *</Label>
                          <Input
                            id="beds"
                            type="number"
                            min={0}
                            value={form.bedrooms}
                            onChange={(e) => set("bedrooms", e.target.value)}
                            aria-invalid={hasFieldError("beds")}
                            className={cn("mt-1.5", errorInputClass("beds"))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="baths">Bathrooms *</Label>
                          <Input
                            id="baths"
                            type="number"
                            min={0}
                            value={form.bathrooms}
                            onChange={(e) => set("bathrooms", e.target.value)}
                            aria-invalid={hasFieldError("baths")}
                            className={cn("mt-1.5", errorInputClass("baths"))}
                          />
                        </div>
                      </>
                    )}
                    <div>
                      <Label htmlFor="area">Built-up area (sq ft) *</Label>
                      <Input
                        id="area"
                        type="number"
                        min={0}
                        value={form.areaSqft}
                        onChange={(e) => set("areaSqft", e.target.value)}
                        aria-invalid={hasFieldError("area")}
                        className={cn("mt-1.5", errorInputClass("area"))}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <Label>Furnishing</Label>
                      <Select value={form.furnishing} onValueChange={(v) => set("furnishing", v)}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="furnished">Furnished</SelectItem>
                          <SelectItem value="semi-furnished">Semi-Furnished</SelectItem>
                          <SelectItem value="unfurnished">Unfurnished</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="floor">Floor number</Label>
                      <Input
                        id="floor"
                        type="number"
                        min={0}
                        value={form.floorNumber}
                        onChange={(e) => set("floorNumber", e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tfloor">Total floors</Label>
                      <Input
                        id="tfloor"
                        type="number"
                        min={0}
                        value={form.totalFloors}
                        onChange={(e) => set("totalFloors", e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">Amenities</Label>
                    <div className="flex flex-wrap gap-2">
                      {amenityList.map((a) => {
                        const on = form.amenities.includes(a);
                        return (
                          <button
                            key={a}
                            type="button"
                            onClick={() =>
                              set(
                                "amenities",
                                on ? form.amenities.filter((x) => x !== a) : [...form.amenities, a],
                              )
                            }
                            className={cn(
                              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                              on
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border hover:border-primary/50",
                            )}
                          >
                            {on && <Check className="h-3 w-3" />} {a}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-semibold">Where is the property?</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="loc">Locality / Area *</Label>
                  <Input
                    id="loc"
                    value={form.locality}
                    onChange={(e) => set("locality", e.target.value)}
                    aria-invalid={hasFieldError("loc")}
                    className={cn("mt-1.5", errorInputClass("loc"))}
                    placeholder="e.g. Bhatbandh, Hatuara…"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="addr">Full address</Label>
                <Textarea
                  id="addr"
                  rows={2}
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  className="mt-1.5"
                  placeholder="Street, landmark, building name…"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="pin">Pincode</Label>
                  <Input
                    id="pin"
                    value={form.pincode}
                    onChange={(e) => set("pincode", e.target.value)}
                    className="mt-1.5"
                    maxLength={6}
                  />
                </div>
                <div>
                  <Label htmlFor="lat">Latitude</Label>
                  <Input
                    id="lat"
                    value={form.latitude}
                    onChange={(e) => set("latitude", e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="lng">Longitude</Label>
                  <Input
                    id="lng"
                    value={form.longitude}
                    onChange={(e) => set("longitude", e.target.value)}
                    className="mt-1.5"
                  />
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={detectLocation}>
                <MapPin className="h-4 w-4" /> Detect my location
              </Button>
            </div>
          )}

          {/* Step 4: Pricing & Contact */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-semibold">Pricing & contact</h2>
              <div>
                <Label htmlFor="price">
                  {form.listingType === "rent" ? "Monthly rent (₹) *" : "Price (₹) *"}
                </Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  aria-invalid={hasFieldError("price")}
                  className={cn("mt-1.5", errorInputClass("price"))}
                />
                {suggestedPrice && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-orange" />
                    Suggested: ₹{suggestedPrice.toLocaleString("en-IN")}{" "}
                    {form.listingType === "rent" ? "/month" : ""} (based on local averages)
                  </p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="cphone">Contact phone *</Label>
                  <Input
                    id="cphone"
                    type="tel"
                    value={form.contactPhone}
                    onChange={(e) => set("contactPhone", sanitizePhone(e.target.value))}
                    aria-invalid={hasFieldError("cphone")}
                    className={cn("mt-1.5", errorInputClass("cphone"))}
                    placeholder="10-digit number"
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                  />
                </div>
                <div>
                  <Label htmlFor="cwa">WhatsApp (optional)</Label>
                  <Input
                    id="cwa"
                    type="tel"
                    value={form.contactWhatsapp}
                    onChange={(e) => set("contactWhatsapp", sanitizePhone(e.target.value))}
                    aria-invalid={hasFieldError("cwa")}
                    className={cn("mt-1.5", errorInputClass("cwa"))}
                    placeholder="If different from phone"
                    maxLength={10}
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={!!form.contactPhone && form.contactWhatsapp === form.contactPhone}
                  onCheckedChange={(c) => set("contactWhatsapp", c ? form.contactPhone : "")}
                />
                Use the same number for WhatsApp
              </label>
            </div>
          )}

          {/* Step 5: Photos */}
          {step === 5 && (
            <div className="space-y-5">
              <h2 className="font-display text-xl font-semibold">Add photos</h2>
              <p className="text-sm text-muted-foreground">
                High-quality photos get up to 5x more enquiries. Add up to 10 images.
              </p>

              <label
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
                }}
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-8 text-center transition hover:border-primary hover:bg-primary/5"
              >
                <ImagePlus className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Drag and drop images here, or click to browse</p>
                <p className="mt-1 text-xs text-muted-foreground">JPG, PNG up to 10MB each</p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />
              </label>

              {form.images.length > 0 && (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {form.images.map((img, i) => (
                    <div
                      key={img.url}
                      className="group relative aspect-square overflow-hidden rounded-lg border border-border"
                    >
                      <img
                        src={img.url}
                        alt={`Upload ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        onClick={() => removeImage(i)}
                        type="button"
                        className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-1.5 left-1.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                          Cover
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Preview */}
              <Card className="bg-secondary/50 p-4">
                <h3 className="font-display font-semibold text-sm">Preview</h3>
                <div className="mt-2 text-sm">
                  <div className="font-medium">{form.title || "Untitled"}</div>
                  <div className="text-xs text-muted-foreground">
                    {[form.locality, form.city].filter(Boolean).join(", ")}
                  </div>
                  <div className="mt-1 font-display font-bold text-orange">
                    ₹{Number(form.price || 0).toLocaleString("en-IN")}
                    {form.listingType === "rent" ? "/mo" : ""}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Nav buttons */}
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5">
            <Button variant="ghost" size="sm" onClick={back} disabled={step === 0}>
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={() => {
                  console.log("Button clicked!");
                  submit();
                }}
                disabled={submitting}
                className="bg-orange text-orange-foreground hover:bg-orange/90"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Posting…
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Post Property
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          By posting, you agree to our terms and confirm the information is accurate.{" "}
          <Link to="/contact" className="text-primary hover:underline">
            Need help?
          </Link>
        </p>
      </div>
    </div>
  );
}
