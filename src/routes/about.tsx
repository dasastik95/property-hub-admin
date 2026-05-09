import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, Users, Building2, TrendingUp, ShieldCheck, Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BUSINESS } from "@/config/business";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: `About — ${BUSINESS.name}` },
      { name: "description", content: `Learn about ${BUSINESS.name}, our story, values, and the team behind ${BUSINESS.stats.propertiesSold} successful real estate transactions.` },
      { property: "og:title", content: `About — ${BUSINESS.name}` },
      { property: "og:description", content: `${BUSINESS.tagline} — meet the team behind the deals.` },
      { property: "og:image", content: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div>
      <section className="bg-gradient-to-br from-primary to-[oklch(0.25_0.10_262)] text-primary-foreground">
        <div className="container mx-auto px-4 py-20 md:px-6 md:py-28">
          <span className="text-xs font-semibold uppercase tracking-wider text-gold">About Us</span>
          <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl lg:text-6xl">Real estate, done with care</h1>
          <p className="mt-5 max-w-2xl text-lg text-primary-foreground/85">
            We are a boutique brokerage built on local expertise, transparent advice, and an unwavering commitment to our clients' goals.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20 md:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80" alt="Our team" className="h-full w-full object-cover" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gold">Our Story</span>
            <h2 className="mt-1 font-display text-3xl font-bold md:text-4xl">Built on relationships, powered by results</h2>
            <p className="mt-4 text-muted-foreground">
              Founded in {BUSINESS.location}, {BUSINESS.name} began with a simple belief: that buying or selling a property should feel personal, transparent, and stress-free. Today, we serve a community of families, professionals, and investors across {BUSINESS.stats.citiesServed} cities.
            </p>
            <p className="mt-3 text-muted-foreground">
              Every listing, every showing, every negotiation — we treat it as if it were our own home or investment. That's why our clients come back, and why they refer us to the people they care about most.
            </p>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-2 gap-6 md:grid-cols-4">
          {[
            { value: BUSINESS.stats.yearsExperience, label: "Years of experience" },
            { value: BUSINESS.stats.propertiesSold, label: "Properties closed" },
            { value: BUSINESS.stats.happyClients, label: "Happy clients" },
            { value: BUSINESS.stats.citiesServed, label: "Cities served" },
          ].map((s) => (
            <Card key={s.label} className="p-6 text-center">
              <div className="font-display text-4xl font-bold text-primary">{s.value}</div>
              <div className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-secondary/40 py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-gold">Why choose us</span>
            <h2 className="mt-1 font-display text-3xl font-bold md:text-4xl">A different kind of brokerage</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: ShieldCheck, title: "Transparent", desc: "No hidden fees, no surprises. Every step is explained." },
              { icon: Heart, title: "People-first", desc: "We take the time to understand what truly matters to you." },
              { icon: Award, title: "Award-winning", desc: "Recognized for service excellence, year after year." },
              { icon: TrendingUp, title: "Data-driven", desc: "Decisions backed by hard market data, not hunches." },
              { icon: Building2, title: "Wide network", desc: "Off-market access through our trusted relationships." },
              { icon: Users, title: "Always available", desc: "Direct access to your agent — never an answering service." },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="p-6">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20 md:px-6">
        <div className="rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.30_0.14_262)] p-10 text-center text-primary-foreground md:p-16">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Let's start a conversation</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">Whether you're buying, selling, or just exploring — we'd love to help.</p>
          <Button asChild size="lg" className="mt-7 bg-gold text-gold-foreground hover:bg-gold/90">
            <Link to="/contact">Contact Us <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
