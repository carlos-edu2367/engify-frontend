import { Circle, MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

type RhMapPreviewProps = {
  marker?: { latitude?: number | null; longitude?: number | null } | null;
  authorizedLocation?: {
    latitude?: number | null;
    longitude?: number | null;
    raio_metros?: number | null;
  } | null;
  label?: string;
};

function isCoordinate(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value);
}

export function RhMapPreview({ marker, authorizedLocation, label }: RhMapPreviewProps) {
  const markerPosition = isCoordinate(marker?.latitude) && isCoordinate(marker?.longitude)
    ? ([marker!.latitude!, marker!.longitude!] as [number, number])
    : null;
  const locationPosition = isCoordinate(authorizedLocation?.latitude) && isCoordinate(authorizedLocation?.longitude)
    ? ([authorizedLocation!.latitude!, authorizedLocation!.longitude!] as [number, number])
    : null;
  const center = markerPosition ?? locationPosition;

  if (!center) {
    return (
      <div className="flex min-h-[220px] items-center justify-center rounded-md border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
        Nenhum local autorizado associado a este registro.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border shadow-sm transition-shadow duration-200 hover:shadow-md">
      {label ? <div className="border-b bg-muted/40 px-3 py-2 text-sm font-medium">{label}</div> : null}
      <MapContainer center={center} zoom={16} scrollWheelZoom={false} dragging={false} className="h-[260px] w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locationPosition ? (
          <Circle
            center={locationPosition}
            radius={authorizedLocation?.raio_metros ?? 100}
            pathOptions={{ color: "hsl(var(--primary))", fillColor: "hsl(var(--primary))", fillOpacity: 0.16 }}
          />
        ) : null}
        {markerPosition ? <Marker position={markerPosition} /> : null}
      </MapContainer>
    </div>
  );
}
