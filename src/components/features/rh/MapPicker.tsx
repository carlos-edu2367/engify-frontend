import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon in Leaflet + Vite/React
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

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
          fillColor: "var(--primary)",
          color: "var(--primary)",
          fillOpacity: 0.2,
        }}
      />
    </>
  );
}

export function MapPicker({ lat, lng, radius, onChange }: MapPickerProps) {
  const defaultCenter: [number, number] = lat && lng ? [lat, lng] : [-23.55052, -46.633308]; // São Paulo default

  return (
    <div className="h-[300px] w-full overflow-hidden rounded-lg border shadow-sm">
      <MapContainer
        center={defaultCenter}
        zoom={15}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker lat={lat} lng={lng} radius={radius} onChange={onChange} />
      </MapContainer>
    </div>
  );
}
