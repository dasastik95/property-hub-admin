import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { formatPrice, type PropertyCardData } from "./PropertyCard";
import "leaflet/dist/leaflet.css";

type MapProperty = PropertyCardData & {
  latitude?: number | null;
  longitude?: number | null;
};

const PURULIA_CENTER: [number, number] = [23.3322, 86.3616];

export function PropertyMap({ properties, height = 480 }: { properties: MapProperty[]; height?: number }) {
  const [mounted, setMounted] = useState(false);
  const [mod, setMod] = useState<{
    MapContainer: typeof import("react-leaflet").MapContainer;
    TileLayer: typeof import("react-leaflet").TileLayer;
    Marker: typeof import("react-leaflet").Marker;
    Popup: typeof import("react-leaflet").Popup;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [rl, leaflet] = await Promise.all([
        import("react-leaflet"),
        import("leaflet"),
      ]);
      const L = leaflet.default;
      // Fix default marker icons
      L.Marker.prototype.options.icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      if (!cancelled) {
        setMod({
          MapContainer: rl.MapContainer,
          TileLayer: rl.TileLayer,
          Marker: rl.Marker,
          Popup: rl.Popup,
        });
        setMounted(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const withCoords = properties.filter((p) => p.latitude != null && p.longitude != null);
  const center: [number, number] = withCoords.length
    ? [Number(withCoords[0].latitude), Number(withCoords[0].longitude)]
    : PURULIA_CENTER;

  if (!mounted || !mod) {
    return (
      <div
        className="flex items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted/30 text-sm text-muted-foreground"
        style={{ height }}
      >
        Loading map…
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup } = mod;

  return (
    <div className="overflow-hidden rounded-2xl border border-border" style={{ height }}>
      <MapContainer
        center={center}
        zoom={withCoords.length ? 13 : 12}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {withCoords.map((p) => (
          <Marker key={p.id} position={[Number(p.latitude), Number(p.longitude)]}>
            <Popup>
              <div className="min-w-45">
                <div className="font-semibold">{p.title}</div>
                <div className="text-xs text-gray-600">
                  {[p.locality, p.city].filter(Boolean).join(", ")}
                </div>
                <div className="mt-1 font-bold" style={{ color: "hsl(35 100% 45%)" }}>
                  {formatPrice(p.price, p.listing_type)}
                </div>
                <Link
                  to="/properties/$id"
                  params={{ id: p.id }}
                  className="mt-2 inline-block text-xs text-blue-700 underline"
                >
                  View details →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
