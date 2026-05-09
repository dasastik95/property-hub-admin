import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { PropertyCard, type PropertyCardData } from "@/components/site/PropertyCard";
import { BUSINESS } from "@/config/business";

export const Route = createFileRoute("/dashboard/saved")({
  head: () => ({ meta: [{ title: `Saved Properties — ${BUSINESS.name}` }] }),
  component: SavedPage,
});

function SavedPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<PropertyCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from("saved_properties")
      .select("property_id")
      .eq("user_id", user.id)
      .then(async ({ data, error }) => {
        if (error) {
          console.error("Failed to fetch saved properties:", error);
          setItems([]);
          setLoading(false);
          return;
        }
        const ids = (data ?? []).map((s) => s.property_id);
        if (!ids.length) {
          setItems([]);
          setLoading(false);
          return;
        }
        const { data: props } = await supabase
          .from("properties")
          .select(
            "id,title,description,property_type,listing_type,category,price,city,locality,address,pincode,latitude,longitude,bedrooms,bathrooms,area_sqft,furnishing,floor_number,total_floors,amenities,images,is_verified,is_featured,contact_phone,contact_whatsapp,owner_id,views,created_at",
          )
          .in("id", ids)
          .eq("status", "active")
          .eq("is_verified", true);
        setItems((props ?? []) as PropertyCardData[]);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch saved properties:", err);
        setItems([]);
        setLoading(false);
      });
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center md:px-6">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 md:px-6 md:py-14">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange/10 text-orange">
          <Heart className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-extrabold md:text-3xl">Saved Properties</h1>
          <p className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? "property" : "properties"} saved.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="mt-8 p-10 text-center">
          <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-3 font-display text-lg font-semibold">Nothing saved yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap the heart icon on any listing to save it here.
          </p>
          <Button asChild className="mt-5">
            <Link to="/properties">Browse properties</Link>
          </Button>
        </Card>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </div>
  );
}
