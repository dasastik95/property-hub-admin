import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Bed, Bath, Maximize, BadgeCheck, Phone, MessageCircle, Heart, Building2, Loader2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BUSINESS, whatsappLink } from "@/config/business";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/components/site/PropertyCard";
import { ImageCarousel } from "@/components/site/ImageCarousel";
import { PropertyInquiryForm } from "@/components/site/PropertyInquiryForm";

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

export const Route = createFileRoute("/properties/$id")({
  head: () => ({ meta: [{ title: `Property — ${BUSINESS.name}` }] }),
  component: PropertyDetailsPage,
});

function PropertyDetailsPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [property, setProperty] = useState<PropertyFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({
        to: "/auth",
        search: { redirect: `/properties/${id}` },
      });
    }
  }, [authLoading, id, navigate, user]);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    supabase.from("properties").select("*").eq("id", id).maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed to fetch property:", error);
          setProperty(null);
        } else {
          setProperty(data as PropertyFull | null);
          if (data) {
            supabase.from("properties").update({ views: (data.views ?? 0) + 1 }).eq("id", id)
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
  }, [id, user]);

  useEffect(() => {
    if (!user || !property) return;
    supabase.from("saved_properties").select("property_id").eq("user_id", user.id).eq("property_id", property.id).maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error("Failed to check saved status:", error);
        setSaved(!!data);
      })
      .catch((err) => {
        console.error("Failed to check saved status:", err);
        setSaved(false);
      });
  }, [user, property]);

  const toggleSave = async () => {
    if (!user || !property) { toast.error("Please log in to save"); return; }
    try {
      if (saved) {
        await supabase.from("saved_properties").delete().eq("user_id", user.id).eq("property_id", property.id);
        setSaved(false); toast.success("Removed from saved");
      } else {
        await supabase.from("saved_properties").insert({ user_id: user.id, property_id: property.id });
        setSaved(true); toast.success("Saved");
      }
    } catch (err) {
      console.error("Failed to toggle save:", err);
      toast.error("Failed to save property");
    }
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: property?.title, url }); } catch {/* canceled */}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  };

  if (authLoading || !user || loading) {
    return <div className="container mx-auto px-4 py-20 text-center md:px-6"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!property) {
    return (
      <div className="container mx-auto px-4 py-20 text-center md:px-6">
        <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 font-display text-2xl font-bold">Property not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">This listing may have been removed or is no longer active.</p>
        <Button asChild className="mt-6"><Link to="/properties">Browse other properties</Link></Button>
      </div>
    );
  }

  const phone = property.contact_phone || BUSINESS.phoneRaw;
  const wa = property.contact_whatsapp || BUSINESS.whatsapp;
  const locationLine = [property.locality, property.address, property.city, property.pincode].filter(Boolean).join(", ");
  const hasCoords = property.latitude != null && property.longitude != null;

  return (
    <div className="container mx-auto px-4 py-6 md:px-6 md:py-10">
      <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/properties" })} className="mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to listings
      </Button>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Image Carousel */}
          <ImageCarousel images={property.images} title={property.title} />

          {/* Property Badges */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="bg-primary text-primary-foreground capitalize">For {property.listing_type}</Badge>
            <Badge variant="secondary" className="bg-background/95 text-foreground capitalize">{property.property_type}</Badge>
            {property.is_verified && <Badge className="bg-success text-success-foreground"><BadgeCheck className="h-3 w-3 mr-1" /> Verified</Badge>}
            {property.is_featured && <Badge className="bg-orange text-orange-foreground">Featured</Badge>}
          </div>

          {/* Title & price */}
          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-extrabold md:text-3xl">{property.title}</h1>
              <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-orange" />
                <span>{locationLine || property.city}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-3xl font-extrabold text-orange">{formatPrice(property.price, property.listing_type)}</div>
              {property.area_sqft ? (
                <div className="text-xs text-muted-foreground">₹{Math.round(property.price / property.area_sqft).toLocaleString("en-IN")}/ft²</div>
              ) : null}
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {property.bedrooms != null && (
              <Card className="p-4">
                <Bed className="h-5 w-5 text-primary" />
                <div className="mt-2 font-display text-lg font-bold">{property.bedrooms}</div>
                <div className="text-xs text-muted-foreground">Bedrooms</div>
              </Card>
            )}
            {property.bathrooms != null && (
              <Card className="p-4">
                <Bath className="h-5 w-5 text-primary" />
                <div className="mt-2 font-display text-lg font-bold">{property.bathrooms}</div>
                <div className="text-xs text-muted-foreground">Bathrooms</div>
              </Card>
            )}
            {property.area_sqft && (
              <Card className="p-4">
                <Maximize className="h-5 w-5 text-primary" />
                <div className="mt-2 font-display text-lg font-bold">{property.area_sqft.toLocaleString("en-IN")}</div>
                <div className="text-xs text-muted-foreground">Sq. ft.</div>
              </Card>
            )}
            {property.furnishing && (
              <Card className="p-4">
                <Building2 className="h-5 w-5 text-primary" />
                <div className="mt-2 font-display text-lg font-bold capitalize">{property.furnishing}</div>
                <div className="text-xs text-muted-foreground">Furnishing</div>
              </Card>
            )}
          </div>

          {/* Description */}
          <Card className="mt-6 p-6">
            <h2 className="font-display text-xl font-semibold">About this property</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/85">{property.description}</p>

            {(property.floor_number != null || property.total_floors != null || property.category) && (
              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-6 text-sm sm:grid-cols-3">
                {property.category && (
                  <div><div className="text-xs text-muted-foreground">Category</div><div className="font-medium capitalize">{property.category}</div></div>
                )}
                {property.floor_number != null && (
                  <div><div className="text-xs text-muted-foreground">Floor</div><div className="font-medium">{property.floor_number}{property.total_floors ? ` of ${property.total_floors}` : ""}</div></div>
                )}
              </div>
            )}
          </Card>

          {/* Amenities */}
          {property.amenities.length > 0 && (
            <Card className="mt-6 p-6">
              <h2 className="font-display text-xl font-semibold">Amenities</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {property.amenities.map((a) => (
                  <Badge key={a} variant="secondary" className="px-3 py-1.5 text-sm font-normal capitalize">{a}</Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Map */}
          {hasCoords && (
            <Card className="mt-6 overflow-hidden p-0">
              <div className="border-b border-border p-4">
                <h2 className="font-display text-xl font-semibold">Location</h2>
                <p className="mt-1 text-sm text-muted-foreground">{locationLine}</p>
              </div>
            </Card>
          )}
        </div>

        {/* Sticky contact rail */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <Card className="p-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact owner</div>
              <div className="mt-3 space-y-3">
                <PropertyInquiryForm
                  propertyId={property.id}
                  propertyTitle={property.title}
                />
                <Button asChild variant="outline" className="w-full">
                  <a href={whatsappLink(`Hi! I'm interested in "${property.title}" listed on Purulia Properties.`, wa)} target="_blank" rel="noreferrer">
                    <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
                  </a>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <a href={`tel:${phone}`}><Phone className="h-4 w-4 mr-2" /> Call now</a>
                </Button>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={toggleSave}>
                    <Heart className={cn("h-4 w-4", saved && "fill-destructive text-destructive")} /> {saved ? "Saved" : "Save"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={share}>
                    <Share2 className="h-4 w-4" /> Share
                  </Button>
                </div>
              </div>
              <div className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Listed</span>
                  <span>{new Date(property.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span>Views</span>
                  <span>{property.views ?? 0}</span>
                </div>
              </div>
            </Card>

            <Card className="bg-primary/5 border-primary/20 p-5 text-sm">
              <div className="font-display font-semibold text-primary">Trusted by Purulia</div>
              <p className="mt-1 text-xs text-muted-foreground">Every listing is moderated. Report any issues and our team will investigate within 24 hours.</p>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
}
