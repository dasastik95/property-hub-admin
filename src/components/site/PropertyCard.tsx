import { useNavigate } from "@tanstack/react-router";
import { Bed, Bath, Maximize, MapPin, Heart, Phone, MessageCircle, BadgeCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { whatsappLink, BUSINESS } from "@/config/business";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PropertyDetailsDialog } from "@/components/site/PropertyDetailsDialog";

export type PropertyCardData = {
  id: string;
  title: string;
  property_type: "residential" | "commercial";
  listing_type: "sale" | "rent";
  price: number;
  city: string | null;
  locality: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqft: number | null;
  images: string[];
  is_verified?: boolean;
  is_featured?: boolean;
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
  description?: string;
  category?: string | null;
  address?: string | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  furnishing?: string | null;
  floor_number?: number | null;
  total_floors?: number | null;
  amenities?: string[];
  owner_id?: string;
  views?: number;
  created_at?: string;
};

type PropertyCardProps = {
  property: PropertyCardData;
  variant?: "default" | "recent";
};

export function formatPrice(price: number, listing: "sale" | "rent") {
  const inLakhs = price >= 100000;
  const inCrores = price >= 10000000;
  const formatted = inCrores
    ? `₹${(price / 10000000).toFixed(2)} Cr`
    : inLakhs
      ? `₹${(price / 100000).toFixed(price >= 1000000 ? 1 : 2)} L`
      : `₹${price.toLocaleString("en-IN")}`;
  return listing === "rent" ? `${formatted}/mo` : formatted;
}

export function PropertyCard({ property, variant = "default" }: PropertyCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const cover = property.images?.[0] ?? "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80";
  const locationLine = [property.locality, property.city].filter(Boolean).join(", ");

  useEffect(() => {
    if (!user) return;
    supabase.from("saved_properties").select("property_id").eq("user_id", user.id).eq("property_id", property.id).maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error("Failed to check saved status:", error);
        setSaved(!!data);
      })
      .catch((err) => {
        console.error("Failed to check saved status:", err);
        setSaved(false);
      });
  }, [user, property.id]);

  const toggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Please log in to save properties");
      return;
    }
    try {
      if (saved) {
        await supabase.from("saved_properties").delete().eq("user_id", user.id).eq("property_id", property.id);
        setSaved(false);
        toast.success("Removed from saved");
      } else {
        await supabase.from("saved_properties").insert({ user_id: user.id, property_id: property.id });
        setSaved(true);
        toast.success("Saved");
      }
    } catch (err) {
      console.error("Failed to toggle save:", err);
      toast.error("Failed to save property");
    }
  };

  const phone = property.contact_phone || BUSINESS.phoneRaw;
  const wa = property.contact_whatsapp || BUSINESS.whatsapp;
  const isRecent = variant === "recent";
  const detailsPath = `/properties/${property.id}`;

  const openDetails = () => {
    if (!user) {
      navigate({
        to: "/auth",
        search: { redirect: detailsPath },
      });
      return;
    }

    setDetailsOpen(true);
  };

  return (
    <Card
      className={cn(
        "group relative flex h-full flex-col overflow-hidden border-border/60 transition-all hover:-translate-y-1 hover:shadow-xl",
        isRecent && "recent-property-card",
      )}
    >
      {isRecent ? <span aria-hidden="true" className="recent-property-card__glow" /> : null}
      <div
        role="button"
        tabIndex={0}
        onClick={openDetails}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openDetails();
          }
        }}
        className="block relative aspect-[4/3] overflow-hidden bg-muted text-left"
      >
        <img
          src={cover}
          alt={property.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <Badge className="bg-primary text-primary-foreground hover:bg-primary capitalize">
            For {property.listing_type}
          </Badge>
          <Badge variant="secondary" className="bg-background/90 text-foreground capitalize">
            {property.property_type}
          </Badge>
          {property.is_verified && (
            <Badge className="bg-success text-success-foreground hover:bg-success">
              <BadgeCheck className="h-3 w-3" /> Verified
            </Badge>
          )}
        </div>
        {property.is_featured && (
          <Badge className="absolute right-3 top-3 bg-orange text-orange-foreground hover:bg-orange">Featured</Badge>
        )}
        <button
          onClick={toggleSave}
          aria-label="Save property"
          className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 backdrop-blur hover:bg-background transition"
        >
          <Heart className={cn("h-4 w-4", saved ? "fill-destructive text-destructive" : "text-foreground/70")} />
        </button>
        <div className="absolute bottom-3 right-3 rounded-md bg-foreground/90 px-3 py-1.5 backdrop-blur">
          <span className="font-display text-base font-bold text-orange">
            {formatPrice(property.price, property.listing_type)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <button
          type="button"
          onClick={openDetails}
          className="text-left"
        >
          <h3 className="font-display text-base font-semibold leading-tight line-clamp-1 transition-colors hover:text-primary">
            {property.title}
          </h3>
        </button>
        {locationLine && (
          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-orange" />
            <span className="line-clamp-1">{locationLine}</span>
          </div>
        )}

        <div className="mt-3 flex items-center gap-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
          {property.bedrooms ? (
            <span className="flex items-center gap-1.5">
              <Bed className="h-4 w-4 text-primary" /> {property.bedrooms}
            </span>
          ) : null}
          {property.bathrooms ? (
            <span className="flex items-center gap-1.5">
              <Bath className="h-4 w-4 text-primary" /> {property.bathrooms}
            </span>
          ) : null}
          {property.area_sqft ? (
            <span className="flex items-center gap-1.5">
              <Maximize className="h-4 w-4 text-primary" /> {property.area_sqft.toLocaleString("en-IN")} ft²
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex gap-2">
          <Button className="flex-1" size="sm" onClick={openDetails}>
            View Details
          </Button>
          <Button asChild size="sm" variant="outline" className="border-success/50 text-success hover:bg-success hover:text-success-foreground" aria-label="WhatsApp">
            <a href={whatsappLink(`Hi! I'm interested in "${property.title}".`, wa)} target="_blank" rel="noreferrer">
              <MessageCircle className="h-4 w-4" />
            </a>
          </Button>
          <Button asChild size="sm" variant="outline" aria-label="Call">
            <a href={`tel:${phone}`}>
              <Phone className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
      <PropertyDetailsDialog
        propertyId={property.id}
        initialProperty={property}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </Card>
  );
}
