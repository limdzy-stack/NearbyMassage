"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Spatify‑style Spa Finder MVP (Pending listings hidden)
 * - Pending listings are always excluded from results and map pins
 * - Removed toggle for showing pending
 * - Added tests to ensure pending never appear
 */

// --- Demo data (approved listings only show details) ---
const DEMO_LISTINGS = [
  {
    id: "spa-1",
    name: "Yi Spa",
    approved: true,
    services: ["Chinese massage", "Aromatherapy"],
    phone: "+65 6392 3038",
    whats: "+65 6392 3038",
    loc: { lat: 1.305, lng: 103.856 },
    address: "768 North Bridge Rd, Singapore 198736",
    photos: ["https://images.unsplash.com/photo-1544161515-4ab6ce6db874"],
  },
  {
    id: "spa-2",
    name: "Moonlight Health Club",
    approved: true,
    services: ["Deep tissue", "Foot reflexology"],
    phone: "+65 8123 4567",
    whats: "+65 8123 4567",
    loc: { lat: 1.31, lng: 103.862 },
    address: "129 Tyrwhitt Rd, Singapore 207552",
    photos: ["https://images.unsplash.com/photo-1600334129128-685c5582fd5b"],
  },
  {
    id: "spa-3",
    name: "Nice Wellness TCM",
    approved: false,
    services: ["TCM massage"],
    phone: "+65 8000 0000",
    whats: "+65 8000 0000",
    loc: { lat: 1.299, lng: 103.85 },
    address: "Jalan Besar, Singapore",
    photos: ["https://images.unsplash.com/photo-1581235720704-06d3acfcb36f"],
  },
];

// --- Leaflet marker icon ---
const pinIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  shadowSize: [41, 41],
});

function FlyTo({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 14, { duration: 0.6 });
  }, [position]);
  return null;
}

// --- Utilities + Tests ---
function kmBetween(a, b) {
  return L.latLng(a.lat, a.lng).distanceTo(L.latLng(b.lat, b.lng)) / 1000;
}

function filterListings(listings, { center, radiusKm, query }) {
  const q = (query || "").toLowerCase();
  return listings.filter((x) => {
    if (!x.approved) return false; // always hide pending
    const inQuery =
      !q ||
      x.name.toLowerCase().includes(q) ||
      x.services.join(" ").toLowerCase().includes(q) ||
      x.address.toLowerCase().includes(q);
    const d = kmBetween(x.loc, center);
    return inQuery && d <= radiusKm;
  });
}

(function runTests() {
  const centerSG = { lat: 1.3048, lng: 103.8318 };

  // Test 1: Pending should never appear
  const all = filterListings(DEMO_LISTINGS, { center: centerSG, radiusKm: 50, query: "" });
  console.assert(all.every((x) => x.approved), "Test 1 failed: pending listings must be hidden");

  // Test 2: Query matches service
  const t2 = filterListings(DEMO_LISTINGS, { center: centerSG, radiusKm: 50, query: "aromatherapy" });
  console.assert(t2.some((x) => x.name === "Yi Spa"), "Test 2 failed: query should match 'Yi Spa' by service");

  // Test 3: Tiny radius around Yi Spa should include Yi Spa only
  const yiCenter = DEMO_LISTINGS[0].loc;
  const t3 = filterListings(DEMO_LISTINGS, { center: yiCenter, radiusKm: 0.5, query: "" });
  console.assert(t3.length === 1 && t3[0].id === "spa-1", "Test 3 failed: should include Yi Spa only");
})();

export default function App() {
  const [center, setCenter] = useState({ lat: 1.3048, lng: 103.8318 }); // SG default
  const [radiusKm, setRadiusKm] = useState(3);
  const [query, setQuery] = useState("");
  const [userLoc, setUserLoc] = useState(null);

  const filtered = useMemo(() => {
    return filterListings(DEMO_LISTINGS, { center, radiusKm, query });
  }, [query, center, radiusKm]);

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserLoc(c);
      setCenter(c);
    });
  };

  // --- JSX RETURN ---
  return (
    <div className="w-full h-screen grid grid-cols-1 lg:grid-cols-3 bg-gray-50">
      {/* Left: Controls & List */}
      <div className="p-4 lg:col-span-1 space-y-4 overflow-y-auto">
        <h1 className="text-2xl font-bold">Spa Finder (MVP)</h1>

        {/* Controls card */}
        <div className="shadow-md rounded-2xl bg-white p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Search services, spa name, or address</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. aromatherapy, foot reflexology"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Radius</span>
              <span className="text-xs bg-gray-100 rounded px-2 py-0.5">{radiusKm} km</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex gap-2">
            <button onClick={handleLocate} className="px-3 py-2 text-sm rounded-lg bg-gray-900 text-white hover:opacity-90">
              Use my location
            </button>
            <button
              onClick={() => setCenter({ lat: 1.3048, lng: 103.8318 })}
              className="px-3 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              Reset to SG
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Results ({filtered.length})</h2>
          {filtered.map((x) => (
            <div key={x.id} className="rounded-2xl overflow-hidden shadow hover:shadow-lg transition bg-white">
              <div className="grid grid-cols-3 gap-0">
                <img src={x.photos[0]} alt={x.name} className="col-span-1 h-28 w-full object-cover" />
                <div className="col-span-2 p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">{x.name}</h3>
                    <span className="text-[10px] bg-green-100 text-green-700 rounded px-2 py-0.5">Approved</span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{x.address}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {x.services.map((s) => (
                      <span key={s} className="text-[10px] bg-gray-100 rounded px-2 py-0.5">{s}</span>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <a className="text-sm underline" href={`tel:${x.phone}`}>Call</a>
                    <a className="text-sm underline" href={`https://wa.me/${x.whats.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">WhatsApp</a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Map */}
      <div className="lg:col-span-2 relative">
        <MapContainer center={[center.lat, center.lng]} zoom={13} className="h-full w-full z-0">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FlyTo position={center} />
          <Circle center={[center.lat, center.lng]} radius={radiusKm * 1000} />
          {(userLoc ? [userLoc] : []).map((c) => (
            <Marker key="me" position={[c.lat, c.lng]} icon={pinIcon}>
              <Popup>You are here</Popup>
            </Marker>
          ))}
          {filtered.map((x) => (
            <Marker key={x.id} position={[x.loc.lat, x.loc.lng]} icon={pinIcon}>
              <Popup>
                <div className="space-y-1">
                  <div className="font-bold">{x.name}</div>
                  <div className="text-xs">{x.address}</div>
                  <div className="text-xs">{x.services.join(", ")}</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        <div className="absolute top-4 right-4 z-10">
          <div className="shadow-lg rounded bg-white p-2 text-xs">Drag the map or change radius to refine results.</div>
        </div>
      </div>
    </div>
  );
}
