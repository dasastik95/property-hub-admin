import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Linkedin, Twitter, Mail, Phone, MapPin, Building2 } from "lucide-react";
import { BUSINESS } from "@/config/business";

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/40 mt-24">
      <div className="container mx-auto px-4 py-14 md:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="h-5 w-5" />
              </span>
              <span className="font-display text-lg font-extrabold">
                Purulia <span className="text-orange">Properties</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">{BUSINESS.tagline}</p>
            <div className="mt-4 flex gap-3">
              <a href={BUSINESS.social.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="text-muted-foreground hover:text-primary">
                <Facebook className="h-5 w-5" />
              </a>
              <a href={BUSINESS.social.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="text-muted-foreground hover:text-primary">
                <Instagram className="h-5 w-5" />
              </a>
              <a href={BUSINESS.social.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="text-muted-foreground hover:text-primary">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href={BUSINESS.social.twitter} target="_blank" rel="noreferrer" aria-label="Twitter" className="text-muted-foreground hover:text-primary">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider">Explore</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link to="/" className="text-muted-foreground hover:text-primary">Home</Link></li>
              <li><Link to="/properties" className="text-muted-foreground hover:text-primary">Browse Properties</Link></li>
              <li><Link to="/post-property" className="text-muted-foreground hover:text-primary">Post a Property</Link></li>
              <li><Link to="/about" className="text-muted-foreground hover:text-primary">About</Link></li>
              <li><Link to="/contact" className="text-muted-foreground hover:text-primary">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider">Property Types</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/properties" search={{ listing: "sale" } as never} className="hover:text-primary">Buy</Link></li>
              <li><Link to="/properties" search={{ listing: "rent" } as never} className="hover:text-primary">Rent</Link></li>
              <li><Link to="/properties" search={{ type: "residential" } as never} className="hover:text-primary">Residential</Link></li>
              <li><Link to="/properties" search={{ type: "commercial" } as never} className="hover:text-primary">Commercial</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider">Contact</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange" />
                <span>{BUSINESS.fullAddress}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-orange" />
                <a href={`tel:${BUSINESS.phoneRaw}`} className="hover:text-primary">{BUSINESS.phone}</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-orange" />
                <a href={`mailto:${BUSINESS.email}`} className="hover:text-primary">{BUSINESS.email}</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Purulia Properties. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
