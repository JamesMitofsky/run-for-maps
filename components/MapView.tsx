"use client";

import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, type ReactNode } from "react";

export type MapMarker = {
  id: number | string;
  lat: number;
  lon: number;
  color: string;
  label?: string;
  onClick?: () => void;
  // Rendered inside a Leaflet popup that opens when the marker is clicked.
  popup?: ReactNode;
};

type Props = {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  // polyline as [lat, lon][]
  line?: [number, number][];
  userPos?: [number, number] | null;
  // Compass heading in degrees (0 = north, clockwise). Draws a direction cone.
  userHeading?: number | null;
  onMapClick?: (lat: number, lon: number) => void;
  // Fired when the user drags the map, so callers can drop "follow me" mode.
  onUserPan?: () => void;
  recenterKey?: string; // change to force recenter on `center`
  className?: string;
};

// Colored pin via divIcon — avoids Leaflet's broken default marker assets.
function pin(color: string, label?: string) {
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;">
      <span style="transform:rotate(45deg);color:#fff;font-size:11px;font-weight:700;line-height:1;">${label ?? ""}</span></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
  });
}

// Blue location dot, with an optional Apple/Google-style direction cone that
// fans out toward the heading (null heading = dot only).
function userDot(heading?: number | null) {
  const cone =
    heading == null
      ? ""
      : `<svg width="64" height="64" viewBox="0 0 64 64" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(${heading}deg);">
          <defs><radialGradient id="userCone" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stop-color="#2563eb" stop-opacity="0.55"/>
            <stop offset="100%" stop-color="#2563eb" stop-opacity="0"/>
          </radialGradient></defs>
          <path d="M32 32 L16 4 A30 30 0 0 1 48 4 Z" fill="url(#userCone)"/>
        </svg>`;
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:64px;height:64px;">
      ${cone}
      <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:#2563eb;width:16px;height:16px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 2px #2563eb;"></div>
    </div>`,
    iconSize: [64, 64],
    iconAnchor: [32, 32],
  });
}

function Recenter({ center, recenterKey }: { center: [number, number]; recenterKey?: string }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recenterKey]);
  return null;
}

function ClickHandler({
  onMapClick,
  onUserPan,
}: {
  onMapClick?: (lat: number, lon: number) => void;
  onUserPan?: () => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
    // Only user-initiated drags fire dragstart; programmatic setView does not.
    dragstart() {
      onUserPan?.();
    },
  });
  return null;
}

export default function MapView({
  center,
  zoom = 14,
  markers = [],
  line,
  userPos,
  userHeading,
  onMapClick,
  onUserPan,
  recenterKey,
  className,
}: Props) {
  return (
    <MapContainer center={center} zoom={zoom} className={className} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter center={center} recenterKey={recenterKey} />
      <ClickHandler onMapClick={onMapClick} onUserPan={onUserPan} />
      {line && line.length > 1 && <Polyline positions={line} pathOptions={{ color: "#2563eb", weight: 5, opacity: 0.8 }} />}
      {markers.map((m) => (
        <Marker
          key={m.id}
          position={[m.lat, m.lon]}
          icon={pin(m.color, m.label)}
          eventHandlers={m.onClick ? { click: m.onClick } : undefined}
        >
          {m.popup && <Popup>{m.popup}</Popup>}
        </Marker>
      ))}
      {userPos && <Marker position={userPos} icon={userDot(userHeading)} />}
    </MapContainer>
  );
}
