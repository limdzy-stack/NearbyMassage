"use client";

import React, { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import DEMO_LISTINGS from "./listings.json"; // ✅ Import from external JSON

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
    return inQuery;
  });
}

// --- UI: thumbnails only with popup ---
function PhotoStrip({ photos, alt }) {
  const [openIdx, setOpenIdx] = useState(null);
  const open = openIdx !== null;

  return (
    <div style={{ width: '100%', fontFamily: 'Arial, sans-serif' }}>
      <div className="thumbnail-container" style={{ display: 'flex', flexDirection: 'row', gap: '12px', padding: '20px', background: '#f0f9f6', borderRadius: '12px' }}>
        {photos.map((p, i) => (
          <div
            key={p + i}
            onClick={() => setOpenIdx(i)}
            style={{
              width: 80,
              height: 80,
              flex: '0 0 auto',
              border: '1px solid #d1fae5',
              borderRadius: 8,
              overflow: 'hidden',
              background: '#fff',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              cursor: 'pointer'
            }}
          >
            <img src={p} alt={`${alt} ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}
      </div>

      {open && (
        <div
          onClick={() => setOpenIdx(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}
          >
            <img
              src={photos[openIdx]}
              alt={`${alt} preview`}
              style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }}
            />
            <button
              onClick={() => setOpenIdx(null)}
              style={{ position: 'absolute', top: -12, right: -12, width: 32, height: 32, borderRadius: '9999px', background: '#fff', color: '#065f46', border: 'none', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [center, setCenter] = useState({ lat: 1.3048, lng: 103.8318 });
  const [query, setQuery] = useState("");
  const [listings, setListings] = useState(DEMO_LISTINGS);
  const [locationDetected, setLocationDetected] = useState(false);
  const [locationAddress, setLocationAddress] = useState("");

  // Load listings from /listings.json if available
  useEffect(() => {
    fetch('/listings.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data)) setListings(data);
      })
      .catch(() => {
        // keep fallback DEMO_LISTINGS on any error
      });
  }, []);

  // Detect user geolocation + reverse geocode to street name
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCenter(coords);
          setLocationDetected(true);
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
        {/* Disclaimer link top right */}
      <div className="absolute top-4 right-4 text-xs text-gray-500">
        <a href="/disclaimer" className="underline hover:text-emerald-700">
          Disclaimer
        </a>
      </div>
      <div className="p-4 lg:col-span-1 space-y-4 overflow-y-auto bg-white/80 backdrop-blur rounded-r-2xl text-left pl-4">
        <h1 className="text-2xl font-bold text-emerald-700">Nearby Massage</h1>
        {locationDetected && (
          <div className="text-xs text-emerald-700">
            📍 Using your current location
            {locationAddress ? ` — ${locationAddress}` : ` (${center.lat.toFixed(4)}, ${center.lng.toFixed(4)})`}
          </div>
        )}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-emerald-700">Results ({filtered.length}) — nearest first</h2>
          {filtered.map((x) => (
            <div key={x.id} className="rounded-2xl overflow-hidden shadow hover:shadow-lg transition bg-white/80 backdrop-blur text-left pl-4">
              <div className="grid grid-cols-3 gap-0">
                <PhotoStrip photos={x.photos} alt={x.name} />
                <div className="col-span-2 p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-emerald-800">{x.name}</h3>
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
                      onClick={() => window.location.href = `tel:${x.phone}`}
                      className="w-full text-center text-sm bg-emerald-600 text-white rounded-lg px-3 py-2 hover:bg-emerald-700 transition"
                    >
                      Call
                    </button>
                    <button
                      onClick={() => window.open(`https://wa.me/${x.whats.replace(/\\D/g, "")}`, '_blank')}
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
            </div>
          ))}
        </div>
	{/* Disclaimer link */}
        <div className="pt-4 text-xs text-gray-500">
          <a href="/disclaimer" className="underline hover:text-emerald-700">
            Disclaimer
          </a>
        </div>
      </div>
    </div>
  );
}
