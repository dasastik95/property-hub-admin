

# Real Estate Broker Website — Build Plan

A modern, mobile-first real estate website with 5 routes, royal blue + soft gold palette, demo property listings with working filters, and a database-backed contact form.

## Pages (separate routes for SEO)

```text
/              Home — hero, quick search, featured properties, services, testimonials, CTA
/about         About — story, stats, why choose us, values
/properties    Listings grid with URL-driven filters + search
/services      Buying, Selling, Renting, Investment consultation
/contact       Contact form + map + phone/email/WhatsApp
```

Each route gets its own `head()` with unique title, description, og:title, og:description, and og:image (the hero/section image becomes the share image).

## Shared Layout

- **Header** (sticky, in `__root.tsx`): wordmark logo, nav links, "Contact" CTA, mobile hamburger sheet
- **Footer**: tagline, quick links, contact info, social icons (Facebook, Instagram, LinkedIn, Twitter)
- **Floating WhatsApp button**: fixed bottom-right on every page → `wa.me/<number>` with prefilled message

## Design System (royal blue + soft gold)

Update `src/styles.css`:
- `--primary`: royal blue
- `--accent`: soft gold
- `--background`: white, `--muted`: light grey
- Playfair Display for headings + Inter for body (Google Fonts via root `head`)
- Animations: `animate-fade-in`, `animate-scale-in`, `hover-scale` on cards

## Home Page sections

1. **Hero** — full-width luxury home image, tagline *"Find Your Dream Property Today"*, sub-tagline *"Your Trusted Property Partner"*, CTAs ("View Listings", "Contact Us")
2. **Quick search bar** — overlapping hero: Location, Type, Price → submits to `/properties?...` via search params
3. **Featured properties** — 3 highlight cards
4. **Services teaser** — 4 icon cards → /services
5. **Why choose us** — 3 stats (Years Experience, Properties Sold, Happy Clients)
6. **Testimonials** — 3 client reviews with avatar, name, rating
7. **CTA band** — "Ready to find your next property?" + button

## Properties Page

- ~10 demo properties in `src/data/properties.ts` (title, type, listing, price, location, beds, baths, area, image, description)
- **Filters bar**: search, type, listing, price range, bedrooms — driven by URL search params via Zod (`validateSearch` + `fallback()`)
- **Grid**: 1col mobile / 2col tablet / 3col desktop — image, gold price, title, location, bed/bath/area icons, "View Details" + "WhatsApp" buttons
- **Empty state** when no matches

## Contact Page (backend-powered)

- Form: Name, Phone, Email, Message — Zod validation (trim, length, email format)
- Submits via TanStack server function → inserts into `contact_submissions` → sends confirmation email to user + notification to broker
- Below form: contact info cards (phone, email, WhatsApp, address) + embedded Google Map iframe (placeholder coords)

## Backend (Lovable Cloud)

**Table** `contact_submissions`: id, name, phone, email, message, created_at — RLS: anon insert allowed, only authenticated admins can read.

**Server function** `submitContactForm`: Zod validation → insert via admin client → trigger emails.

**Email templates** (React Email):
- `contact-confirmation.tsx` — "Thanks for reaching out, {name}"
- `contact-notification.tsx` — internal notification with submission details

Requires enabling Lovable Cloud + email sender domain setup (a setup dialog will appear when we proceed).

## Placeholders to swap later

Single config file at `src/config/business.ts`:
```ts
BUSINESS_NAME = "[Your Business Name]"
LOCATION = "[City]"
PHONE = "+1 (555) 000-0000"
EMAIL = "contact@yourdomain.com"
WHATSAPP_NUMBER = "15550000000"
SOCIAL = { facebook: "#", instagram: "#", linkedin: "#", twitter: "#" }
```

Edit one file to plug in real details everywhere.

## Technical notes

- All routes have proper `head()` metadata for SEO + Open Graph
- Property images via Unsplash URLs (no asset hosting needed)
- Mobile-first Tailwind, sticky header, hamburger sheet under `md`
- WhatsApp button: `https://wa.me/<number>?text=<encoded message>`
- Google Map = iframe embed (no API key)
- Filters: type-safe URL state via Zod adapter — shareable filtered links

