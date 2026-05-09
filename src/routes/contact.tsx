import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Phone, Mail, MapPin, MessageCircle, Loader2, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BUSINESS, whatsappLink } from "@/config/business";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: `Contact — ${BUSINESS.name}` },
      { name: "description", content: `Get in touch with ${BUSINESS.name}. Call, email, WhatsApp, or visit our office in ${BUSINESS.location}.` },
      { property: "og:title", content: `Contact — ${BUSINESS.name}` },
      { property: "og:description", content: "Reach out — we typically reply within a few hours." },
    ],
  }),
  component: ContactPage,
});

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  phone: z.string().trim().min(1, "Phone is required").max(30),
  email: z.string().trim().email("Please enter a valid email").max(255),
  message: z.string().trim().min(1, "Message is required").max(2000),
});

const mapEmbedUrl = `https://www.google.com/maps?q=${BUSINESS.mapCenter.lat},${BUSINESS.mapCenter.lng}&z=13&output=embed`;

function ContactPage() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors((errs) => ({ ...errs, [field]: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        if (i.path[0]) fieldErrors[String(i.path[0])] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setStatus("loading");
    // Open WhatsApp with prefilled message
    const text = `Hi! I'm ${parsed.data.name} (${parsed.data.phone}, ${parsed.data.email}).\n\n${parsed.data.message}`;
    window.open(whatsappLink(text), "_blank");
    setStatus("success");
    setForm({ name: "", phone: "", email: "", message: "" });
  };

  return (
    <div>
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 py-16 md:px-6 md:py-24">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">Contact</span>
          <h1 className="mt-2 font-display text-4xl font-bold md:text-5xl lg:text-6xl">Let's start a conversation</h1>
          <p className="mt-5 max-w-2xl text-lg text-primary-foreground/85">
            Tell us what you're looking for, and we'll be in touch within hours.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 md:px-6">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Card className="p-7 md:p-9">
              <h2 className="font-display text-2xl font-bold">Send us a message</h2>
              <p className="mt-1 text-sm text-muted-foreground">All fields are required. We'll reply on WhatsApp.</p>

              {status === "success" ? (
                <div className="mt-8 rounded-lg border border-accent/30 bg-accent/10 p-6 text-center">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-accent" />
                  <h3 className="mt-3 font-display text-xl font-semibold">Message ready!</h3>
                  <p className="mt-2 text-sm text-muted-foreground">We've opened WhatsApp with your message — just hit send.</p>
                  <Button variant="outline" className="mt-5" onClick={() => setStatus("idle")}>Send another message</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" value={form.name} onChange={handleChange("name")} className="mt-1.5" maxLength={100} />
                      {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" type="tel" value={form.phone} onChange={handleChange("phone")} className="mt-1.5" maxLength={30} />
                      {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={form.email} onChange={handleChange("email")} className="mt-1.5" maxLength={255} />
                    {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" rows={5} value={form.message} onChange={handleChange("message")} className="mt-1.5" maxLength={2000} placeholder="Tell us what kind of property you're looking for, your budget, timeline…" />
                    {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message}</p>}
                  </div>
                  <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={status === "loading"}>
                    {status === "loading" ? <><Loader2 className="h-4 w-4 animate-spin" /> Opening…</> : "Send via WhatsApp"}
                  </Button>
                </form>
              )}
            </Card>
          </div>

          <div className="space-y-4 lg:col-span-2">
            <Card className="p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Phone className="h-5 w-5" /></div>
              <h3 className="mt-3 font-display text-lg font-semibold">Phone</h3>
              <a href={`tel:${BUSINESS.phoneRaw}`} className="mt-1 block text-sm text-muted-foreground hover:text-primary">{BUSINESS.phone}</a>
            </Card>
            <Card className="p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Mail className="h-5 w-5" /></div>
              <h3 className="mt-3 font-display text-lg font-semibold">Email</h3>
              <a href={`mailto:${BUSINESS.email}`} className="mt-1 block text-sm text-muted-foreground hover:text-primary">{BUSINESS.email}</a>
            </Card>
            <Card className="p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent"><MessageCircle className="h-5 w-5" /></div>
              <h3 className="mt-3 font-display text-lg font-semibold">WhatsApp</h3>
              <a href={whatsappLink()} target="_blank" rel="noreferrer" className="mt-1 block text-sm text-muted-foreground hover:text-primary">Chat with us instantly</a>
            </Card>
            <Card className="p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent"><MapPin className="h-5 w-5" /></div>
              <h3 className="mt-3 font-display text-lg font-semibold">Office</h3>
              <p className="mt-1 text-sm text-muted-foreground">{BUSINESS.fullAddress}</p>
            </Card>
          </div>
        </div>

        <div className="mt-16 overflow-hidden rounded-2xl border border-border">
          <iframe
            src={mapEmbedUrl}
            width="100%"
            height="420"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Office location"
          />
        </div>
      </section>
    </div>
  );
}
