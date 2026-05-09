import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, Plus, Heart, Eye, Trash2, Loader2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { OwnerListingDialog } from "@/components/site/OwnerListingDialog";
import {
  deletePropertyById,
  getPropertiesByOwner,
  getSavedPropertiesCount,
} from "@/integrations/supabase/database";
import type { PropertyRow } from "@/integrations/supabase/database";
import { BUSINESS } from "@/config/business";
import { formatPrice } from "@/components/site/PropertyCard";
import { toast } from "sonner";

type MyListing = {
  id: string;
  title: string;
  price: number;
  listing_type: "sale" | "rent";
  property_type: "residential" | "commercial";
  city: string;
  locality: string | null;
  images: string[];
  status: string;
  views: number;
  is_featured: boolean;
  created_at: string;
};

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: `Dashboard — ${BUSINESS.name}` }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [listings, setListings] = useState<MyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedCount, setSavedCount] = useState(0);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([getPropertiesByOwner(user.id), getSavedPropertiesCount(user.id)])
      .then(([{ data, error: listError }, { count, error: countError }]) => {
        if (listError) {
          console.error("Failed to fetch listings:", listError);
          setListings([]);
        } else {
          setListings((data ?? []) as MyListing[]);
        }
        if (countError) {
          console.error("Failed to fetch saved count:", countError);
          setSavedCount(0);
        } else {
          setSavedCount(count ?? 0);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch dashboard data:", err);
        setListings([]);
        setSavedCount(0);
        setLoading(false);
      });
  }, [user]);

  const deleteListing = async (id: string) => {
    if (!confirm("Delete this listing? This cannot be undone.")) return;
    const { error, cleanupError } = await deletePropertyById(id);
    if (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete listing");
      return;
    }
    setListings((l) => l.filter((p) => p.id !== id));
    if (selectedListingId === id) {
      setSelectedListingId(null);
    }
    if (cleanupError) {
      console.error("Property deleted but image cleanup failed:", cleanupError);
      toast.error("Listing deleted, but some storage images could not be removed");
      return;
    }

    toast.success("Listing deleted");
  };

  const syncListing = (property: PropertyRow) => {
    setListings((current) =>
      current.map((listing) =>
        listing.id === property.id
          ? {
              ...listing,
              title: property.title,
              price: property.price,
              listing_type: property.listing_type,
              property_type: property.property_type,
              city: property.city,
              locality: property.locality,
              images: property.images,
              status: property.status,
              views: property.views,
              is_featured: property.is_featured,
              created_at: property.created_at,
            }
          : listing,
      ),
    );
  };

  if (authLoading || !user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center md:px-6">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (pathname !== "/dashboard") {
    return <Outlet />;
  }

  const totalViews = listings.reduce((sum, l) => sum + (l.views ?? 0), 0);
  const activeCount = listings.filter((l) => l.status === "active").length;
  const pendingCount = listings.filter((l) => l.status === "pending").length;

  return (
    <div className="container mx-auto px-4 py-10 md:px-6 md:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold md:text-3xl">
              Welcome back{profile?.display_name ? `, ${profile.display_name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your listings and saved properties.
            </p>
          </div>
        </div>
        <Button asChild className="bg-orange text-orange-foreground hover:bg-orange/90">
          <Link to="/post-property">
            <Plus className="h-4 w-4" /> Post a property
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            My listings
          </div>
          <div className="mt-2 font-display text-3xl font-extrabold">{listings.length}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {activeCount} active, {pendingCount} pending approval
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total views
          </div>
          <div className="mt-2 font-display text-3xl font-extrabold text-primary">{totalViews}</div>
          <div className="mt-1 text-xs text-muted-foreground">across all listings</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Saved properties
          </div>
          <div className="mt-2 font-display text-3xl font-extrabold text-orange">{savedCount}</div>
          <Link to="/dashboard/saved" className="mt-1 text-xs text-primary hover:underline">
            View all →
          </Link>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Profile
          </div>
          <div className="mt-2 font-display text-base font-semibold">
            {profile?.display_name ?? "Your profile"}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            <div>{profile?.email ?? "No email"}</div>
            <div>{profile?.phone ?? "No phone"}</div>
            <div className="capitalize">{profile?.role ?? "buyer"}</div>
          </div>
          <Button
            type="button"
            variant="link"
            className="mt-3 block text-xs text-primary hover:underline"
            onClick={() => window.location.assign("/dashboard/profile")}
          >
            Edit profile →
          </Button>
        </Card>
      </div>

      {/* My listings */}
      <div className="mt-10">
        <h2 className="font-display text-xl font-bold">My Listings</h2>
        {loading ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="h-32 animate-pulse rounded-xl bg-muted" />
            <div className="h-32 animate-pulse rounded-xl bg-muted" />
          </div>
        ) : listings.length === 0 ? (
          <Card className="mt-4 p-10 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-3 font-display text-lg font-semibold">No listings yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Post your first property to start receiving enquiries.
            </p>
            <Button asChild className="mt-5 bg-orange text-orange-foreground hover:bg-orange/90">
              <Link to="/post-property">
                <Plus className="h-4 w-4" /> Post a property
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="mt-4 space-y-3">
            {listings.map((l) => (
              <Card key={l.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <Link
                  to="/properties/$id"
                  params={{ id: l.id }}
                  className="aspect-video w-full shrink-0 overflow-hidden rounded-md bg-muted sm:h-24 sm:w-32"
                >
                  <img
                    src={
                      l.images[0] ||
                      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400"
                    }
                    alt={l.title}
                    className="h-full w-full object-cover"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to="/properties/$id"
                      params={{ id: l.id }}
                      className="font-display text-base font-semibold hover:text-primary line-clamp-1"
                    >
                      {l.title}
                    </Link>
                    <Badge
                      variant={l.status === "active" ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {l.status}
                    </Badge>
                    {l.is_featured && (
                      <Badge className="bg-orange text-orange-foreground">Featured</Badge>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {[l.locality, l.city].filter(Boolean).join(", ")}
                  </div>
                  {l.status === "pending" ? (
                    <div className="mt-1 text-xs text-amber-600">
                      Waiting for admin approval before it appears publicly.
                    </div>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                    <span className="font-display font-bold text-orange">
                      {formatPrice(l.price, l.listing_type)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="h-3.5 w-3.5" /> {l.views ?? 0} views
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelectedListingId(l.id)}>
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteListing(l.id)}
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Card className="bg-primary/5 border-primary/20 p-5">
          <Heart className="h-6 w-6 text-orange" />
          <h3 className="mt-3 font-display text-base font-semibold">Saved Properties</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {savedCount} {savedCount === 1 ? "property" : "properties"} saved.
          </p>
          <Button asChild size="sm" variant="outline" className="mt-3">
            <Link to="/dashboard/saved">View saved</Link>
          </Button>
        </Card>
        <Card className="p-5">
          <h3 className="font-display text-base font-semibold">Need help?</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Our team is here to help you list and sell faster.
          </p>
          <Button asChild size="sm" variant="outline" className="mt-3">
            <Link to="/contact">Contact support</Link>
          </Button>
        </Card>
      </div>

      <OwnerListingDialog
        listingId={selectedListingId}
        open={selectedListingId != null}
        ownerId={user.id}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedListingId(null);
          }
        }}
        onSaved={syncListing}
      />

      <Outlet />
    </div>
  );
}
