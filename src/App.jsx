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
         <button onClick={() => setShowDisclaimer(true)} className="underline hover:text-emerald-700">
          Disclaimer
        </button>
      </div>

      {showDisclaimer && (
        <div
          onClick={() => setShowDisclaimer(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', padding: '20px', borderRadius: '8px', maxWidth: '600px', textAlign: 'left' }}
          >
            <h2 className="text-xl font-bold mb-2">Disclaimer</h2>
            <p className="text-sm text-gray-700">
              This website is for informational purposes only. All listings are provided by third parties. We do not guarantee the accuracy, reliability, or quality of services listed. Users are encouraged to verify details directly with the service providers.
            </p>
            <div className="mt-4 text-right">
              <button
                onClick={() => setShowDisclaimer(false)}
                className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

