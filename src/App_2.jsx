import React, { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// --- Demo data fallback ---
const DEMO_LISTINGS = [
  // same sample listings as before (Yi Spa, Moonlight, Nice Wellness)
];

// --- Utilities ---
function kmBetween(a, b) {
  return L.latLng(a.lat, a.lng).distanceTo(L.latLng(b.lat, b.lng)) / 1000;
}

function filterListings(listings, { center, query }) {
  const q = (query || "").toLowerCase();
  return listings.filter((x) => {
    if (!x.approved) return false;
    const inQuery =
      !q ||
      x.name.toLowerCase().includes(q) ||
      x.services.join(" ").toLowerCase().includes(q) ||
      x.address.toLowerCase().includes(q);
    return inQuery; // no radius filtering; we'll sort by proximity later
  });
}

export default function App() {
  const [center, setCenter] = useState({ lat: 1.3048, lng: 103.8318 });
    const [query, setQuery] = useState("");
  const [listings, setListings] = useState(DEMO_LISTINGS);
  const [locationDetected, setLocationDetected] = useState(false);
  const [locationAddress, setLocationAddress] = useState("");

  // Try to load external listings.json
  useEffect(() => {
    fetch('/listings.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data)) setListings(data);
      })
      .catch(() => {});
  }, []);

  // Detect current user location once
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCenter(coords);
          setLocationDetected(true);

          // Reverse geocode using OpenStreetMap Nominatim
          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json`)
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
              if (data && data.display_name) {
                setLocationAddress(data.display_name);
              }
            })
            .catch(() => {});
        },
        (err) => {
          console.warn("Geolocation error", err);
        }
      );
    }
  }, []);

  const filtered = useMemo(() => {
    const matches = filterListings(listings, { center, query });
    return matches
      .map((x) => ({ ...x, _distKm: kmBetween(x.loc, center) }))
      .sort((a, b) => a._distKm - b._distKm);
  }, [listings, query, center]);

  return (
    <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-3" style={{ background: "linear-gradient(135deg, #e0f7f4, #fefdfb)" }}>
      <div className="p-4 lg:col-span-1 space-y-4 overflow-y-auto bg-white/80 backdrop-blur rounded-r-2xl text-left pl-4">
        <h1 className="text-2xl font-bold text-emerald-700">Spa Finder (MVP)</h1>
        {locationDetected && (
          <div className="text-xs text-emerald-700 flex flex-col gap-1">
            <span>📍 Using your current location</span>
            {locationAddress && <span className="italic text-gray-600">{locationAddress}</span>}
          </div>
        )}
        <div className="shadow-md rounded-2xl bg-white p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-emerald-700">Search services, spa name, or address</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-emerald-200 pl-4"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. aromatherapy, foot reflexology"
            />
          </div>
          
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-emerald-700">Results ({filtered.length}) — nearest first</h2>
          {filtered.map((x) => (
            <div key={x.id} className="rounded-2xl overflow-hidden shadow hover:shadow-lg transition bg-white/80 backdrop-blur text-left pl-4">
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-emerald-800">{x.name}</h3>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 rounded px-2 py-0.5">Approved</span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">{x.address}</p>
                {locationDetected && (
                  <p className="text-xs text-emerald-700 mt-1">{x._distKm.toFixed(1)} km away</p>
                )}
                <div className="mt-1 flex flex-wrap gap-1">
                  {x.services.map((s) => (
                    <span key={s} className="text-[10px] bg-emerald-50 text-emerald-700 rounded px-2 py-0.5">{s}</span>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <button
                    onClick={() => (window.location.href = `tel:${x.phone}`)}
                    className="w-full text-center text-sm bg-emerald-600 text-white rounded-lg px-3 py-2 hover:bg-emerald-700 transition"
                  >
                    Call
                  </button>
                  <button
                    onClick={() => window.open(`https://wa.me/${x.whats.replace(/\D/g, "")}`, '_blank')}
                    className="w-full text-center text-sm bg-green-500 text-white rounded-lg px-3 py-2 hover:bg-green-600 transition"
                  >
                    WhatsApp
                  </button>
                  <button
                    onClick={() => window.open(`https://www.google.com/maps?q=${x.loc.lat},${x.loc.lng}`, '_blank')}
                    className="w-full text-center text-sm bg-blue-500 text-white rounded-lg px-3 py-2 hover:bg-blue-600 transition"
                  >
                    Show on map
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
