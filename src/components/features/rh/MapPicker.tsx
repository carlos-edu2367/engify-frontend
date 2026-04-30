import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const GOIANIA_CENTER: [number, number] = [-16.6869, -49.2648];

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
  lat: number;
  lng: number;
  radius: number;
  onChange: (lat: number, lng: number) => void;
}

type SearchResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

function LocationMarker({ lat, lng, radius, onChange }: MapPickerProps) {
  const map = useMap();

  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom());
    }
  }, [lat, lng, map]);

  if (!lat || !lng) return null;

  return (
    <>
      <Marker position={[lat, lng]} />
      <Circle
        center={[lat, lng]}
        radius={radius}
        pathOptions={{
          fillColor: "hsl(var(--primary))",
          color: "hsl(var(--primary))",
          fillOpacity: 0.18,
        }}
      />
    </>
  );
}

export function MapPicker({ lat, lng, radius, onChange }: MapPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const defaultCenter: [number, number] = lat && lng ? [lat, lng] : GOIANIA_CENTER;

  const searchUrl = useMemo(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) return null;
    const params = new URLSearchParams({
      q: trimmed,
      format: "json",
      addressdetails: "0",
      limit: "5",
      countrycodes: "br",
    });
    return `https://nominatim.openstreetmap.org/search?${params.toString()}`;
  }, [query]);

  useEffect(() => {
    if (!searchUrl) {
      setResults([]);
      setSearchError("");
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      setSearchError("");
      try {
        const response = await fetch(searchUrl, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error("search-failed");
        const data = (await response.json()) as SearchResult[];
        setResults(data.slice(0, 5));
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
          setSearchError("Nao foi possivel buscar este local agora.");
        }
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 450);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [searchUrl]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
            placeholder="Buscar endereco ou local"
          />
        </div>
        {searchError ? <p className="text-xs text-destructive">{searchError}</p> : null}
        {results.length ? (
          <div className="max-h-40 overflow-y-auto rounded-md border bg-background">
            {results.map((result) => (
              <button
                key={result.place_id}
                type="button"
                className="block w-full px-3 py-2 text-left text-sm transition-colors duration-150 hover:bg-muted"
                onClick={() => {
                  onChange(Number(result.lat), Number(result.lon));
                  setQuery(result.display_name);
                  setResults([]);
                }}
              >
                {result.display_name}
              </button>
            ))}
          </div>
        ) : isSearching ? (
          <p className="text-xs text-muted-foreground">Buscando local...</p>
        ) : null}
      </div>
      <div className="h-[320px] w-full overflow-hidden rounded-lg border shadow-sm transition-shadow duration-200 hover:shadow-md">
        <MapContainer center={defaultCenter} zoom={15} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker lat={lat} lng={lng} radius={radius} onChange={onChange} />
        </MapContainer>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => onChange(GOIANIA_CENTER[0], GOIANIA_CENTER[1])}>
        Centralizar em Goiania
      </Button>
    </div>
  );
}
