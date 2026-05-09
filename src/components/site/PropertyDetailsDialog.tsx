import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  MapPin,
  Bed,
  Bath,
  Maximize,
  BadgeCheck,
  Phone,
  MessageCircle,
  Heart,
  Building2,
  Loader2,
  Share2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BUSINESS, whatsappLink } from "@/config/business";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatPrice, type PropertyCardData } from "@/components/site/PropertyCard";
import { ImageCarousel } from "@/components/site/ImageCarousel";

type PropertyFull = {
  id: string;
  title: string;
  description: string;
  property_type: "residential" | "commercial";
  listing_type: "sale" | "rent";
  category: string | null;
  price: number;
  city: string;
  locality: string | null;
  address: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqft: number | null;
  furnishing: string | null;
  floor_number: number | null;
  total_floors: number | null;
  amenities: string[];
  images: string[];
  is_verified: boolean;
  is_featured: boolean;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  owner_id: string;
  views: number;
  created_at: string;
};

type PropertyDetailsDialogProps = {
  propertyId: string;
  initialProperty?: PropertyCardData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function hasFullDetails(property?: PropertyCardData): property is PropertyFull {
  return Boolean(
    property &&
      typeof property.description === "string" &&
      typeof property.created_at === "string" &&
      Array.isArray(property.amenities),
  );
}

export function PropertyDetailsDialog({
  propertyId,
  initialProperty,
  open,
  onOpenChange,
}: PropertyDetailsDialogProps) {
  const { user } = useAuth();
  const [property, setProperty] = useState<PropertyFull | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (hasFullDetails(initialProperty)) {
      setProperty(initialProperty);
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed to fetch property:", error);
          setProperty(null);
        } else {
          setProperty(data as PropertyFull | null);
          if (data) {
            supabase
              .from("properties")
              .update({ views: (data.views ?? 0) + 1 })
              .eq("id", propertyId)
              .catch((err) => console.error("Failed to update views:", err));
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch property:", err);
        setProperty(null);
        setLoading(false);
      });
  }, [initialProperty, open, propertyId]);

  useEffect(() => {
    if (!user || !property || !open) {
      setSaved(false);
      return;
    }

    supabase
      .from("saved_properties")
      .select("property_id")
      .eq("user_id", user.id)
      .eq("property_id", property.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed to check saved status:", error);
        }
        setSaved(!!data);
      })
      .catch((err) => {
        console.error("Failed to check saved status:", err);
        setSaved(false);
      });
  }, [user, property, open]);

  const toggleSave = async () => {
    if (!user || !property) {
      toast.error("Please log in to save");
      return;
    }

    try {
      if (saved) {
        await supabase
          .from("saved_properties")
          .delete()
          .eq("user_id", user.id)
          .eq("property_id", property.id);
        setSaved(false);
        toast.success("Removed from saved");
      } else {
        await supabase.from("saved_properties").insert({
          user_id: user.id,
          property_id: property.id,
        });
        setSaved(true);
        toast.success("Saved");
      }
    } catch (err) {
      console.error("Failed to toggle save:", err);
      toast.error("Failed to save property");
    }
  };

  const share = async () => {
    if (!property) {
      return;
    }

    const url = `${window.location.origin}/properties/${property.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: property.title, url });
      } catch {
        return;
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex min-h-[320px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!property) {
      return (
        <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
          <Building2 className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 font-display text-2xl font-bold">Property not found</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            This listing may have been removed or is no longer active.
          </p>
        </div>
      );
    }

    const phone = property.contact_phone || BUSINESS.phoneRaw;
    const wa = property.contact_whatsapp || BUSINESS.whatsapp;
    const locationLine = [property.locality, property.address, property.city, property.pincode]
      .filter(Boolean)
      .join(", ");
    const hasCoords = property.latitude != null && property.longitude != null;

    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
        <div className="min-w-0 space-y-6">
          <ImageCarousel images={property.images} title={property.title} />

          <div className="flex flex-wrap gap-2">
            <Badge className="bg-primary text-primary-foreground capitalize">
              For {property.listing_type}
            </Badge>
            <Badge variant="secondary" className="bg-background/95 text-foreground capitalize">
              {property.property_type}
            </Badge>
            {property.is_verified ? (
              <Badge className="bg-success text-success-foreground">
                <BadgeCheck className="mr-1 h-3 w-3" /> Verified
              </Badge>
            ) : null}
            {property.is_featured ? (
              <Badge className="bg-orange text-orange-foreground">Featured</Badge>
            ) : null}
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-extrabold md:text-3xl">
                {property.title}
              </h2>
              <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-orange" />
                <span>{locationLine || property.city}</span>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="font-display text-3xl font-extrabold text-orange">
                {formatPrice(property.price, property.listing_type)}
              </div>
              {property.area_sqft ? (
                <div className="text-xs text-muted-foreground">
                  Rs{Math.round(property.price / property.area_sqft).toLocaleString("en-IN")}/ft²
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {property.bedrooms != null ? (
              <Card className="p-4">
                <Bed className="h-5 w-5 text-primary" />
                <div className="mt-2 font-display text-lg font-bold">{property.bedrooms}</div>
                <div className="text-xs text-muted-foreground">Bedrooms</div>
              </Card>
            ) : null}
            {property.bathrooms != null ? (
              <Card className="p-4">
                <Bath className="h-5 w-5 text-primary" />
                <div className="mt-2 font-display text-lg font-bold">{property.bathrooms}</div>
                <div className="text-xs text-muted-foreground">Bathrooms</div>
              </Card>
            ) : null}
            {property.area_sqft ? (
              <Card className="p-4">
                <Maximize className="h-5 w-5 text-primary" />
                <div className="mt-2 font-display text-lg font-bold">
                  {property.area_sqft.toLocaleString("en-IN")}
                </div>
                <div className="text-xs text-muted-foreground">Sq. ft.</div>
              </Card>
            ) : null}
            {property.furnishing ? (
              <Card className="p-4">
                <Building2 className="h-5 w-5 text-primary" />
                <div className="mt-2 font-display text-lg font-bold capitalize">
                  {property.furnishing}
                </div>
                <div className="text-xs text-muted-foreground">Furnishing</div>
              </Card>
            ) : null}
          </div>

          <Card className="p-6">
            <h3 className="font-display text-xl font-semibold">About this property</h3>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/85">
              {property.description}
            </p>

            {property.category || property.floor_number != null || property.total_floors != null ? (
              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-6 text-sm sm:grid-cols-3">
                {property.category ? (
                  <div>
                    <div className="text-xs text-muted-foreground">Category</div>
                    <div className="font-medium capitalize">{property.category}</div>
                  </div>
                ) : null}
                {property.floor_number != null ? (
                  <div>
                    <div className="text-xs text-muted-foreground">Floor</div>
                    <div className="font-medium">
                      {property.floor_number}
                      {property.total_floors ? ` of ${property.total_floors}` : ""}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </Card>

          {property.amenities.length > 0 ? (
            <Card className="p-6">
              <h3 className="font-display text-xl font-semibold">Amenities</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {property.amenities.map((amenity) => (
                  <Badge
                    key={amenity}
                    variant="secondary"
                    className="px-3 py-1.5 text-sm font-normal capitalize"
                  >
                    {amenity}
                  </Badge>
                ))}
              </div>
            </Card>
          ) : null}

          {hasCoords ? (
            <Card className="overflow-hidden p-0">
              <div className="border-b border-border p-4">
                <h3 className="font-display text-xl font-semibold">Location</h3>
                <p className="mt-1 text-sm text-muted-foreground">{locationLine}</p>
              </div>
            </Card>
          ) : null}
        </div>

        <aside className="space-y-4">
          <Card className="p-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Contact owner
            </div>
            <div className="mt-4 space-y-3">
              <Button asChild className="w-full bg-primary text-primary-foreground">
                <a
                  href={whatsappLink(
                    `Hi! I'm interested in "${property.title}" listed on Purulia Properties.`,
                    wa,
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <a href={`tel:${phone}`}>
                  <Phone className="mr-2 h-4 w-4" /> Call now
                </a>
              </Button>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={toggleSave}>
                  <Heart className={cn("h-4 w-4", saved && "fill-destructive text-destructive")} />{" "}
                  {saved ? "Saved" : "Save"}
                </Button>
                <Button variant="outline" size="sm" onClick={share}>
                  <Share2 className="h-4 w-4" /> Share
                </Button>
              </div>
              <Button asChild variant="ghost" className="w-full">
                <Link to="/properties/$id" params={{ id: property.id }} onClick={() => onOpenChange(false)}>
                  Open full page
                </Link>
              </Button>
            </div>
            <div className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Listed</span>
                <span>
                  {new Date(property.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span>Views</span>
                <span>{property.views ?? 0}</span>
              </div>
            </div>
          </Card>

          <Card className="border-primary/20 bg-primary/5 p-5 text-sm">
            <div className="font-display font-semibold text-primary">Trusted by Purulia</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Every listing is moderated. Report any issues and our team will investigate within
              24 hours.
            </p>
          </Card>
        </aside>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="property-details-dialog w-[min(96vw,1320px)] max-w-none gap-0 overflow-hidden border-border/70 bg-background p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{property?.title || "Property details"}</DialogTitle>
          <DialogDescription>
            Detailed property information, images, pricing, amenities, and contact actions.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[88vh] overflow-y-auto p-4 sm:p-6">{renderContent()}</div>
      </DialogContent>
    </Dialog>
  );
}
