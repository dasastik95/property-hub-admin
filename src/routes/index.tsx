import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Search,
  ArrowRight,
  ShieldCheck,
  MapPin,
  TrendingUp,
  Home as HomeIcon,
  Building,
  Store,
  Warehouse,
  Star,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertyCard } from "@/components/site/PropertyCard";
import { BUSINESS } from "@/config/business";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PropertyCardData } from "@/components/site/PropertyCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `Purulia Properties — Buy, Sell, Rent in Purulia` },
      {
        name: "description",
        content: `${BUSINESS.tagline}. Browse verified residential and commercial properties for sale and rent in Purulia.`,
      },
      { property: "og:title", content: `Purulia Properties — ${BUSINESS.tagline}` },
      { property: "og:description", content: BUSINESS.tagline },
      {
        property: "og:image",
        content:
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  }),
  component: HomePage,
});

const CATEGORIES = [
  { icon: HomeIcon, label: "Apartments", filter: { category: "apartment", type: "residential" } },
  { icon: Building, label: "Houses & Villas", filter: { category: "house", type: "residential" } },
  { icon: MapPin, label: "Plots", filter: { category: "plot", type: "residential" } },
  { icon: Store, label: "Shops", filter: { category: "shop", type: "commercial" } },
  { icon: Warehouse, label: "Warehouses", filter: { category: "warehouse", type: "commercial" } },
  { icon: Building, label: "Offices", filter: { category: "office", type: "commercial" } },
];

const TESTIMONIALS = [
  {
    name: "Subrata D.",
    role: "Buyer in Purulia",
    text: "Found a 3BHK in Bhatbandh within two weeks. The verified listings made all the difference.",
  },
  {
    name: "Ananya G.",
    role: "Landlord",
    text: "Listed my shop on Saheed Khudiram Road and got three serious enquiries the first day.",
  },
  {
    name: "Rahul P.",
    role: "Investor",
    text: "Honest pricing, real photos, and genuine sellers. Exactly what Purulia needed.",
  },
];

function HomePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"sale" | "rent">("sale");
  const [q, setQ] = useState("");
  const [featured, setFeatured] = useState<PropertyCardData[]>([]);
  const [recent, setRecent] = useState<PropertyCardData[]>([]);

  useEffect(() => {
    supabase
      .from("properties")
      .select(
        "id,title,description,property_type,listing_type,category,price,city,locality,address,pincode,latitude,longitude,bedrooms,bathrooms,area_sqft,furnishing,floor_number,total_floors,amenities,images,is_verified,is_featured,contact_phone,contact_whatsapp,owner_id,views,created_at",
      )
      .eq("status", "active")
      .eq("is_verified", true)
      .eq("is_featured", true)
      .limit(6)
      .then(({ data }) => setFeatured((data ?? []) as PropertyCardData[]))
      .catch((err) => {
        console.error("Failed to fetch featured properties:", err);
        setFeatured([]);
      });

    supabase
      .from("properties")
      .select(
        "id,title,description,property_type,listing_type,category,price,city,locality,address,pincode,latitude,longitude,bedrooms,bathrooms,area_sqft,furnishing,floor_number,total_floors,amenities,images,is_verified,is_featured,contact_phone,contact_whatsapp,owner_id,views,created_at",
      )
      .eq("status", "active")
      .eq("is_verified", true)
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => setRecent((data ?? []) as PropertyCardData[]))
      .catch((err) => {
        console.error("Failed to fetch recent properties:", err);
        setRecent([]);
      });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      to: "/properties",
      search: { q: q || undefined, listing: tab } as never,
    });
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/80 to-[hsl(215_70%_18%/0.85)]" />
        <div className="relative container mx-auto px-4 pt-16 pb-32 md:px-6 md:pt-24 md:pb-44">
          <div className="max-w-3xl text-primary-foreground animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="inline-block rounded-full bg-orange/20 border border-orange/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-orange">
              {BUSINESS.tagline}
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl md:text-6xl lg:text-7xl">
              Find Your <span className="text-orange">Perfect Home</span> in Purulia
            </h1>
            <p className="mt-5 max-w-xl text-base text-primary-foreground/90 md:text-lg">
              Verified listings, real photos, and honest prices. Buy, rent, or post your property in
              just a few clicks.
            </p>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative container mx-auto px-4 -mb-12 md:-mb-16 md:px-6">
          <div className="relative -mt-20 md:-mt-24 rounded-2xl border border-border bg-card p-4 md:p-6 shadow-2xl">
            <Tabs value={tab} onValueChange={(v) => setTab(v as "sale" | "rent")} className="mb-4">
              <TabsList className="grid w-full max-w-xs grid-cols-2">
                <TabsTrigger value="sale">Buy</TabsTrigger>
                <TabsTrigger value="rent">Rent</TabsTrigger>
              </TabsList>
            </Tabs>
            <form onSubmit={handleSearch} className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by locality, landmark, or area in Purulia…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="h-12 pl-10 text-base"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-12 bg-orange text-orange-foreground hover:bg-orange/90"
              >
                <Search className="h-4 w-4" /> Search
              </Button>
            </form>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>Popular:</span>
              {["Bhatbandh", "Hatuara", "Saheed Khudiram Road", "Ranchi Road", "Manbazar"].map(
                (p) => (
                  <Link
                    key={p}
                    to="/properties"
                    search={{ q: p } as never}
                    className="rounded-full border border-border px-2.5 py-1 hover:border-primary hover:text-primary"
                  >
                    {p}
                  </Link>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 pt-32 pb-12 md:px-6">
        <h2 className="mb-6 font-display text-2xl font-bold md:text-3xl">Browse by category</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {CATEGORIES.map(({ icon: Icon, label, filter }) => (
            <Link key={label} to="/properties" search={filter as never}>
              <Card className="flex flex-col items-center gap-2 p-4 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-primary">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-xs font-medium text-center">{label}</span>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="container mx-auto px-4 py-12 md:px-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-orange">
                Handpicked
              </span>
              <h2 className="mt-1 font-display text-2xl font-bold md:text-3xl">
                Featured Properties
              </h2>
            </div>
            <Button asChild variant="outline" className="hidden md:inline-flex">
              <Link to="/properties">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </section>
      )}

      {/* Recent */}
      <section className="bg-secondary/40 py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-orange">
                Just listed
              </span>
              <h2 className="mt-1 font-display text-2xl font-bold md:text-3xl">
                Recent Properties
              </h2>
            </div>
            <Button asChild variant="outline" className="hidden md:inline-flex">
              <Link to="/properties">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          {recent.length === 0 ? (
            <Card className="p-10 text-center">
              <h3 className="font-display text-lg font-semibold">No listings yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Be the first to list your property on Purulia Properties.
              </p>
              <Button asChild className="mt-5 bg-orange text-orange-foreground hover:bg-orange/90">
                <Link to="/post-property">
                  <Plus className="h-4 w-4" /> Post your property
                </Link>
              </Button>
            </Card>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((p) => (
                <PropertyCard key={p.id} property={p} variant="recent" />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why us */}
      <section className="container mx-auto px-4 py-16 md:px-6">
        <div className="mx-auto max-w-2xl text-center mb-10">
          <span className="text-xs font-semibold uppercase tracking-wider text-orange">
            Why choose us
          </span>
          <h2 className="mt-1 font-display text-2xl font-bold md:text-3xl">
            Purulia's most trusted property platform
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "Verified Listings",
              desc: "Every property is reviewed before going live. No fakes, no surprises.",
            },
            {
              icon: MapPin,
              title: "Hyper-local Focus",
              desc: "Built specifically for Purulia — every locality, every landmark.",
            },
            {
              icon: TrendingUp,
              title: "Direct Owner Contact",
              desc: "Talk directly with owners and brokers via WhatsApp or call.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="p-6">
              <Icon className="mb-3 h-10 w-10 text-orange" />
              <h3 className="font-display text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto grid grid-cols-2 gap-6 px-4 md:grid-cols-4 md:px-6 text-center">
          {[
            { v: BUSINESS.stats.yearsExperience, l: "Years serving Purulia" },
            { v: BUSINESS.stats.propertiesSold, l: "Properties closed" },
            { v: BUSINESS.stats.happyClients, l: "Happy clients" },
            { v: BUSINESS.stats.citiesServed, l: "Areas covered" },
          ].map((s) => (
            <div key={s.l}>
              <div className="font-display text-3xl md:text-4xl font-extrabold text-orange">
                {s.v}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wider text-primary-foreground/80">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-16 md:px-6">
        <div className="mb-10 text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-orange">
            Testimonials
          </span>
          <h2 className="mt-1 font-display text-2xl font-bold md:text-3xl">What our users say</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name} className="p-6">
              <div className="mb-3 flex gap-1 text-orange">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-foreground/80">"{t.text}"</p>
              <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-16 md:px-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[hsl(215_70%_18%)] p-10 md:p-14 text-center text-primary-foreground">
          <h2 className="font-display text-2xl font-bold md:text-4xl">
            Have a property to sell or rent?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/90">
            List it free on Purulia Properties and reach thousands of genuine buyers and tenants.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-7 bg-orange text-orange-foreground hover:bg-orange/90"
          >
            <Link to="/post-property">
              Post Property Free <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
