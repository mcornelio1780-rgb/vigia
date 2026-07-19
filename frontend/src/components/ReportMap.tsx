"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Report, STATUS_LABELS } from "@/lib/api";

const DEFAULT_CENTER: [number, number] = [19.4326, -99.1332];

const draftIcon = L.divIcon({
  className: "",
  html: '<div style="width:18px;height:18px;border-radius:50%;background:#111;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.5)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function ClickCapture({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyToSelected({ report }: { report: Report | null }) {
  const map = useMap();
  useEffect(() => {
    if (report) map.flyTo([report.lat, report.lng], Math.max(map.getZoom(), 15));
  }, [report, map]);
  return null;
}

type Props = {
  reports: Report[];
  selected: Report | null;
  onSelect: (report: Report) => void;
  picking: boolean;
  draft: { lat: number; lng: number } | null;
  onPick: (lat: number, lng: number) => void;
};

export default function ReportMap({ reports, selected, onSelect, picking, draft, onPick }: Props) {
  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={14}
      className="h-full w-full"
      style={{ cursor: picking ? "crosshair" : undefined }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {picking && <ClickCapture onPick={onPick} />}
      <FlyToSelected report={selected} />
      {reports.map((r) => (
        <CircleMarker
          key={r.id}
          center={[r.lat, r.lng]}
          radius={selected?.id === r.id ? 12 : 8}
          pathOptions={{
            color: "#ffffff",
            weight: 2,
            fillColor: r.category.color,
            fillOpacity: r.status === "resuelto" ? 0.4 : 0.9,
          }}
          eventHandlers={{ click: () => onSelect(r) }}
        >
          <Popup>
            <div className="min-w-44">
              <p className="font-semibold">{r.title}</p>
              <p className="text-xs text-neutral-600">
                {r.category.name} · {STATUS_LABELS[r.status]}
              </p>
              {r.description && <p className="mt-1 text-xs">{r.description}</p>}
            </div>
          </Popup>
        </CircleMarker>
      ))}
      {draft && <Marker position={[draft.lat, draft.lng]} icon={draftIcon} />}
    </MapContainer>
  );
}
