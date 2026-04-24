import { createContext, ReactNode, useCallback, useContext, useState } from "react";
import { PropertyDetailDrawer } from "./PropertyDetailDrawer";

interface PropertyDetailContextValue {
  openProperty: (id: string) => void;
  closeProperty: () => void;
}

const Ctx = createContext<PropertyDetailContextValue | undefined>(undefined);

export function PropertyDetailProvider({ children }: { children: ReactNode }) {
  const [propertyId, setPropertyId] = useState<string | null>(null);

  const openProperty = useCallback((id: string) => setPropertyId(id), []);
  const closeProperty = useCallback(() => setPropertyId(null), []);

  return (
    <Ctx.Provider value={{ openProperty, closeProperty }}>
      {children}
      <PropertyDetailDrawer
        propertyId={propertyId}
        open={!!propertyId}
        onOpenChange={(o) => { if (!o) setPropertyId(null); }}
      />
    </Ctx.Provider>
  );
}

export function usePropertyDetail() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePropertyDetail must be used within PropertyDetailProvider");
  return ctx;
}
