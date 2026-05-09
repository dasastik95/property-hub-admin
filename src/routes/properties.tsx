import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Search, SlidersHorizontal, X, Plus, Map as MapIcon, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PropertyCard, type PropertyCardData } from "@/components/site/PropertyCard";
import { BUSINESS } from "@/config/business";
import {
  getPropertyCategoryOption,
  getPropertyCategoryQueryValues,
  PROPERTY_CATEGORY_OPTIONS,
} from "@/config/propertyCategories";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type ListItem = PropertyCardData & { latitude?: number | null; longitude?: number | null };

const propertiesSearchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  type: fallback(z.enum(["residential", "commercial"]).optional(), undefined),
  listing: fallback(z.enum(["sale", "rent"]).optional(), undefined),
  category: fallback(z.string().optional(), undefined),
  beds: fallback(z.coerce.number().int().min(0), 0).default(0),
  minPrice: fallback(z.coerce.number().min(0).optional(), undefined),
  maxPrice: fallback(z.coerce.number().min(0).optional(), undefined),
  sort: fallback(z.enum(["newest", "price-asc", "price-desc"]), "newest").default("newest"),
});

export const Route = createFileRoute("/properties")({
  validateSearch: zodValidator(propertiesSearchSchema),
  head: () => ({
    meta: [
      { title: `Properties for Sale & Rent in Purulia — ${BUSINESS.name}` },
      { name: "description", content: `Browse verified residential & commercial properties for sale and rent in Purulia.` },
    ],
  }),
  component: PropertiesPage,
});

const PRICE_MIN = 0;
const PRICE_MAX = 500000;
const PRICE_STEP = 1000;

function PropertiesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "map">("grid");
  const activeCategory = getPropertyCategoryOption(search.category);
  const availableCategories = search.type
    ? PROPERTY_CATEGORY_OPTIONS.filter((option) => option.type === search.type)
    : PROPERTY_CATEGORY_OPTIONS;
  const [priceRange, setPriceRange] = useState<[number, number]>([
    search.minPrice ?? PRICE_MIN,
    search.maxPrice ?? PRICE_MAX,
  ]);

  useEffect(() => {
    setLoading(true);
    let q = supabase
      .from("properties")
      .select("id,title,description,property_type,listing_type,category,price,city,locality,address,pincode,latitude,longitude,bedrooms,bathrooms,area_sqft,furnishing,floor_number,total_floors,amenities,images,is_verified,is_featured,contact_phone,contact_whatsapp,owner_id,views,created_at")
      .eq("status", "active")
      .eq("is_verified", true);

    if (search.type) q = q.eq("property_type", search.type);
    if (search.listing) q = q.eq("listing_type", search.listing);
    if (search.category) {
      const categoryQueryValues = getPropertyCategoryQueryValues(search.category);

      if (categoryQueryValues.length > 1) {
        q = q.in("category", categoryQueryValues);
      } else if (categoryQueryValues.length === 1) {
        q = q.ilike("category", categoryQueryValues[0]);
      }

      if (activeCategory && !search.type) {
        q = q.eq("property_type", activeCategory.type);
      }
    }
    if (search.beds > 0) q = q.gte("bedrooms", search.beds);
    if (search.minPrice != null) q = q.gte("price", search.minPrice);
    if (search.maxPrice != null) q = q.lte("price", search.maxPrice);
    if (search.q) q = q.or(`title.ilike.%${search.q}%,locality.ilike.%${search.q}%,city.ilike.%${search.q}%,description.ilike.%${search.q}%`);

    if (search.sort === "price-asc") q = q.order("price", { ascending: true });
    else if (search.sort === "price-desc") q = q.order("price", { ascending: false });
    else q = q.order("created_at", { ascending: false });

    q.limit(60)
      .then(({ data }) => {
        setItems((data ?? []) as ListItem[]);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch properties:", err);
        setItems([]);
        setLoading(false);
      });
  }, [search.q, search.type, search.listing, search.category, search.beds, search.minPrice, search.maxPrice, search.sort]);

  useEffect(() => {
    setPriceRange([
      search.minPrice ?? PRICE_MIN,
      search.maxPrice ?? PRICE_MAX,
    ]);
  }, [search.minPrice, search.maxPrice]);

  const update = (patch: Partial<typeof search>) => {
    navigate({ search: (prev: typeof search) => ({ ...prev, ...patch }) });
  };

  const hasFilters =
    search.q ||
    search.type ||
    search.listing ||
    search.beds > 0 ||
    search.category ||
    search.minPrice != null ||
    search.maxPrice != null;

  return (
    <div>
      <section className="bg-gradient-to-br from-primary to-[hsl(215_70%_18%)] text-primary-foreground">
        <div className="container mx-auto px-4 py-10 md:px-6 md:py-14">
          <span className="text-xs font-semibold uppercase tracking-wider text-orange">Properties</span>
          <h1 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">
            {search.listing === "rent" ? "Properties for Rent" : search.listing === "sale" ? "Properties for Sale" : "All Properties"} in Purulia
          </h1>
          <p className="mt-2 max-w-xl text-primary-foreground/85 text-sm">
            {loading ? "Loading…" : `${items.length} ${items.length === 1 ? "property" : "properties"} available.`}
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 md:px-6">
        <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-sm md:p-5">
          <div className="grid gap-3 md:grid-cols-5">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Locality, landmark, title…"
                  value={search.q}
                  onChange={(e) => update({ q: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Type</label>
              <Select
                value={search.type ?? "any"}
                onValueChange={(v) => {
                  const nextType = v === "any" ? undefined : (v as "residential" | "commercial");
                  update({
                    type: nextType,
                    category:
                      nextType && activeCategory && activeCategory.type !== nextType
                        ? undefined
                        : search.category,
                  });
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Listing</label>
              <Select value={search.listing ?? "any"} onValueChange={(v) => update({ listing: v === "any" ? undefined : (v as "sale" | "rent") })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="sale">For Sale</SelectItem>
                  <SelectItem value="rent">For Rent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Category</label>
              <Select
                value={activeCategory?.value ?? "any"}
                onValueChange={(v) => {
                  if (v === "any") {
                    update({ category: undefined });
                    return;
                  }

                  const selectedCategory = PROPERTY_CATEGORY_OPTIONS.find((option) => option.value === v);
                  if (!selectedCategory) {
                    return;
                  }

                  update({
                    category: selectedCategory.value,
                    type: selectedCategory.type,
                  });
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  {availableCategories.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Price range (₹)</label>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  type="number"
                  min={0}
                  placeholder="Min"
                  value={search.minPrice ?? ""}
                  onChange={(e) => update({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
                />
                <Input
                  type="number"
                  min={0}
                  placeholder="Max"
                  value={search.maxPrice ?? ""}
                  onChange={(e) => update({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Min Beds</label>
              <Select value={String(search.beds)} onValueChange={(v) => update({ beds: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any</SelectItem>
                  <SelectItem value="1">1+</SelectItem>
                  <SelectItem value="2">2+</SelectItem>
                  <SelectItem value="3">3+</SelectItem>
                  <SelectItem value="4">4+</SelectItem>
                  <SelectItem value="5">5+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4" />
              <span>Sort by</span>
              <Select value={search.sort} onValueChange={(v) => update({ sort: v as "newest" | "price-asc" | "price-desc" })}>
                <SelectTrigger className="h-8 w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="price-asc">Price: low to high</SelectItem>
                  <SelectItem value="price-desc">Price: high to low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-md border border-border p-0.5">
                <button onClick={() => setView("grid")} className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition ${view === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  <LayoutGrid className="h-3.5 w-3.5" /> Grid
                </button>
                <button onClick={() => setView("map")} className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition ${view === "map" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  <MapIcon className="h-3.5 w-3.5" /> Map
                </button>
              </div>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ search: { q: "", type: undefined, listing: undefined, beds: 0, minPrice: undefined, maxPrice: undefined, sort: "newest", category: undefined } })}
                >
                  <X className="h-4 w-4" /> Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-20 text-center">
            <h3 className="font-display text-xl font-semibold">No properties match your search</h3>
            <p className="mt-2 text-sm text-muted-foreground">Try adjusting your filters or be the first to post one.</p>
            <div className="mt-5 flex justify-center gap-2">
              <Button asChild variant="outline"><Link to="/contact">Contact us</Link></Button>
              <Button asChild className="bg-orange text-orange-foreground hover:bg-orange/90"><Link to="/post-property"><Plus className="h-4 w-4" /> Post Property</Link></Button>
            </div>
          </div>
        ) : view === "map" ? (
          <PropertyMap properties={items} height={600} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => <PropertyCard key={p.id} property={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}
