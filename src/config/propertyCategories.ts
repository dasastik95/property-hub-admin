export type PropertyCategoryType = "residential" | "commercial";

export type PropertyCategoryKey =
  | "apartment"
  | "house"
  | "villa"
  | "plot"
  | "pg"
  | "office"
  | "shop"
  | "warehouse"
  | "industrial";

export type PropertyCategoryOption = {
  value: PropertyCategoryKey;
  label: string;
  type: PropertyCategoryType;
  aliases: string[];
};

export const PROPERTY_CATEGORY_OPTIONS: PropertyCategoryOption[] = [
  {
    value: "apartment",
    label: "Apartment / Flat",
    type: "residential",
    aliases: ["apartment", "Apartment / Flat", "apartment / flat", "flat"],
  },
  {
    value: "house",
    label: "House",
    type: "residential",
    aliases: ["house", "House", "independent house"],
  },
  {
    value: "villa",
    label: "Villa",
    type: "residential",
    aliases: ["villa", "Villa", "House / Villa", "house / villa"],
  },
  {
    value: "plot",
    label: "Plot / Land",
    type: "residential",
    aliases: ["plot", "Plot / Land", "plot / land", "land"],
  },
  {
    value: "pg",
    label: "PG / Hostel",
    type: "residential",
    aliases: ["pg", "PG / Hostel", "pg / hostel", "hostel"],
  },
  {
    value: "office",
    label: "Office",
    type: "commercial",
    aliases: ["office", "Office", "offices"],
  },
  {
    value: "shop",
    label: "Shop / Showroom",
    type: "commercial",
    aliases: ["shop", "Shop / Showroom", "shop / showroom", "showroom", "shops"],
  },
  {
    value: "warehouse",
    label: "Warehouse",
    type: "commercial",
    aliases: ["warehouse", "Warehouse", "warehouses"],
  },
  {
    value: "industrial",
    label: "Industrial",
    type: "commercial",
    aliases: ["industrial", "Industrial"],
  },
];

function normalizeCategoryValue(value: string) {
  return value.trim().toLowerCase();
}

export function getPropertyCategoryOption(category?: string | null) {
  if (!category) {
    return undefined;
  }

  const normalizedCategory = normalizeCategoryValue(category);

  return PROPERTY_CATEGORY_OPTIONS.find(
    (option) =>
      option.value === normalizedCategory ||
      option.aliases.some((alias) => normalizeCategoryValue(alias) === normalizedCategory),
  );
}

export function getPropertyCategoryQueryValues(category?: string | null) {
  const option = getPropertyCategoryOption(category);

  if (!option) {
    return category ? [category] : [];
  }

  return [...new Set(option.aliases)];
}
