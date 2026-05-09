/**
 * Business configuration — edit this file to customize the website.
 */

export const BUSINESS = {
  name: "Purulia Properties",
  shortName: "Purulia Properties",
  tagline: "Your Trusted Property Partner in Purulia",
  location: "Purulia, West Bengal",
  fullAddress: "Purulia, West Bengal 723101, India",
  phone: "+91 70014 28212",
  phoneRaw: "917001428212",
  email: "contact@puruliaproperties.in",
  whatsapp: "917001428212",
  whatsappMessage: "Hi! I'd like to know more about a property listing.",
  social: {
    facebook: "https://facebook.com",
    instagram: "https://instagram.com",
    linkedin: "https://linkedin.com",
    twitter: "https://twitter.com",
  },
  stats: {
    yearsExperience: "10+",
    propertiesSold: "500+",
    happyClients: "1,200+",
    citiesServed: "Purulia & nearby",
  },
  // Default map centre — Purulia town
  mapCenter: { lat: 23.3322, lng: 86.3616 },
} as const;

export const whatsappLink = (msg?: string, phone?: string) =>
  `https://wa.me/${phone ?? BUSINESS.whatsapp}?text=${encodeURIComponent(msg ?? BUSINESS.whatsappMessage)}`;
