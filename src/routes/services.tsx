import { createFileRoute, Link } from "@tanstack/react-router";
import { Home, Key, ShoppingBag, TrendingUp, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BUSINESS } from "@/config/business";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: `Services — ${BUSINESS.name}` },
      { name: "description", content: "Buying assistance, selling support, rental services, and investment consultation — full-service real estate brokerage." },
      { property: "og:title", content: `Services — ${BUSINESS.name}` },
      { property: "og:description", content: "Buy, sell, rent, invest — we handle every detail." },
      { property: "og:image", content: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80" },
    ],
  }),
  component: ServicesPage,
});

const SERVICES = [
  {
    icon: Home,
    title: "Buying Assistance",
    desc: "From shortlist to closing — we negotiate, navigate paperwork, and protect your interests every step of the way.",
    points: ["Personalized property matching", "Off-market access", "Expert negotiation", "Closing & paperwork support"],
  },
  {
    icon: Key,
    title: "Selling Support",
    desc: "Maximize your sale price with strategic pricing, professional marketing, and a polished, multi-channel presentation.",
    points: ["Market valuation", "Pro photography & staging", "Multi-channel listing", "Buyer screening & negotiation"],
  },
  {
    icon: ShoppingBag,
    title: "Rental Services",
    desc: "Whether tenant or landlord — we connect the right people with the right properties under the right terms.",
    points: ["Tenant matching", "Lease drafting", "Property management", "Renewal advisory"],
  },
  {
    icon: TrendingUp,
    title: "Investment Consultation",
    desc: "Build long-term wealth with data-driven property strategy — from yield analysis to portfolio diversification.",
    points: ["Market & yield analysis", "Portfolio strategy", "Off-market deals", "Exit planning"],
  },
];

function ServicesPage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-primary to-[oklch(0.25_0.10_262)] text-primary-foreground">
        <div className="container mx-auto px-4 py-20 md:px-6 md:py-28">
          <span className="text-xs font-semibold uppercase tracking-wider text-gold">Our Services</span>
          <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl lg:text-6xl">Everything property, under one roof</h1>
          <p className="mt-5 max-w-2xl text-lg text-primary-foreground/85">
            Whether you're making your first move or your fiftieth, our team has you covered.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20 md:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          {SERVICES.map(({ icon: Icon, title, desc, points }) => (
            <Card key={title} className="p-7">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Icon className="h-7 w-7" />
              </div>
              <h2 className="font-display text-2xl font-bold">{title}</h2>
              <p className="mt-2 text-muted-foreground">{desc}</p>
              <ul className="mt-5 space-y-2">
                {points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20 md:px-6">
        <div className="rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.30_0.14_262)] p-10 text-center text-primary-foreground md:p-16">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Not sure where to start?</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">Book a free consultation. We'll listen, answer questions, and recommend a path forward — no commitment.</p>
          <Button asChild size="lg" className="mt-7 bg-gold text-gold-foreground hover:bg-gold/90">
            <Link to="/contact">Book a Consultation <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
