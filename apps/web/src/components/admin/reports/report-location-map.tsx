"use client";

import "leaflet/dist/leaflet.css";

import {
  Crosshair,
  ExternalLink,
  Loader2,
  LocateFixed,
  MapPin,
  Maximize2,
  Minimize2,
} from "lucide-react";
import type { Circle, Map as LeafletMap, Marker } from "leaflet";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface ReportLocationMapProps {
  latitude: number;
  longitude: number;
  label?: string | null;
}

const controlButton =
  "grid h-7 w-7 place-items-center rounded-md border border-ink/10 bg-white text-ink/55 shadow-[0_1px_2px_rgba(20,30,25,0.06)] transition-colors hover:border-ink/20 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40";

/** Leaflet map pinned to the exact reported coordinates. */
export function ReportLocationMap({ latitude, longitude, label }: ReportLocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const userLayersRef = useRef<{ marker: Marker; circle: Circle } | null>(null);
  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [locating, setLocating] = useState(false);

  const coordinates = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  const locateUser = useCallback((fly = false) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setUserLocation(next);
        setLocating(false);
        if (fly) {
          mapRef.current?.flyTo([next.latitude, next.longitude], 17, { duration: 0.8 });
        }
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  // Ask for the viewer's position when the map opens.
  useEffect(() => {
    locateUser();
  }, [locateUser]);

  useEffect(() => {
    let disposed = false;
    let map: LeafletMap | null = null;
    setReady(false);

    void import("leaflet").then((L) => {
      if (disposed || !containerRef.current) return;

      map = L.map(containerRef.current, {
        center: [latitude, longitude],
        zoom: 17,
        maxZoom: 19,
        zoomControl: false,
        scrollWheelZoom: true,
      });
      mapRef.current = map;
      leafletRef.current = L;

      // Open street-style basemap (Google Maps-like), no API key required.
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 19,
          attribution:
            'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, HERE, Garmin, OpenStreetMap contributors',
        },
      ).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.control.scale({ position: "bottomleft", imperial: false }).addTo(map);

      const pin = L.divIcon({
        className: "",
        html: '<span style="display:block;width:26px;height:26px;border-radius:9999px 9999px 9999px 2px;transform:rotate(45deg);background:#c2704a;border:3px solid #fff;box-shadow:0 0 0 6px rgba(194,112,74,0.22),0 10px 20px -6px rgba(0,0,0,0.7)"></span>',
        iconSize: [26, 26],
        iconAnchor: [13, 26],
        popupAnchor: [0, -24],
      });

      const popup = document.createElement("div");
      popup.textContent = label?.trim() || "Reported location";

      L.marker([latitude, longitude], { icon: pin, title: popup.textContent ?? undefined })
        .addTo(map)
        .bindPopup(popup)
        .openPopup();

      setReady(true);
      requestAnimationFrame(() => map?.invalidateSize());
    });

    return () => {
      disposed = true;
      map?.remove();
      map = null;
      mapRef.current = null;
    };
  }, [latitude, longitude, label, expanded]);

  // Draw the viewer's position as a blue dot with an accuracy ring + label.
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L || !ready) return;

    userLayersRef.current?.marker.remove();
    userLayersRef.current?.circle.remove();
    userLayersRef.current = null;

    if (!userLocation) return;

    const circle = L.circle([userLocation.latitude, userLocation.longitude], {
      radius: Math.min(userLocation.accuracy, 300),
      color: "#2563eb",
      weight: 1,
      fillColor: "#2563eb",
      fillOpacity: 0.1,
    }).addTo(map);

    const marker = L.marker([userLocation.latitude, userLocation.longitude], {
      icon: L.divIcon({
        className: "",
        html: '<span style="display:block;width:16px;height:16px;border-radius:9999px;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 5px rgba(37,99,235,0.22),0 2px 8px rgba(6,24,43,0.4)"></span>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      }),
      zIndexOffset: -100,
      title: "Your location",
    })
      .addTo(map)
      .bindTooltip("Your location", {
        permanent: true,
        direction: "top",
        offset: [0, -10],
        className: "user-location-label",
      });

    userLayersRef.current = { marker, circle };

    return () => {
      marker.remove();
      circle.remove();
      userLayersRef.current = null;
    };
  }, [ready, userLocation, expanded]);

  // Escape exits full screen without closing the report dialog behind it.
  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setExpanded(false);
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [expanded]);

  const shell = (
    <div
      className={
        expanded
          ? "report-map fixed inset-0 z-[70] flex flex-col bg-[#f4f2ed] p-3 sm:p-5"
          : "report-map relative isolate z-0 mt-3 flex flex-col overflow-hidden rounded-xl border border-ink/[0.08] bg-white shadow-[0_14px_34px_-22px_rgba(6,24,43,0.3)]"
      }
    >
      <div
        className={`flex items-center justify-between gap-3 bg-white px-3.5 py-2.5 ${
          expanded ? "rounded-xl border border-ink/[0.08]" : "border-b border-ink/[0.07]"
        }`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-clay/10 text-clay">
            <MapPin className="h-3.5 w-3.5" strokeWidth={1.9} />
          </span>
          <div className="min-w-0">
            <p className="text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-ink/35">
              Incident location
            </p>
            <p className="truncate text-[0.75rem] font-medium text-ink/80">
              {label?.trim() || "Pinned coordinates"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <span className="hidden rounded-md border border-ink/[0.08] bg-ink/[0.02] px-2 py-1 font-mono text-[0.625rem] text-ink/45 md:inline">
            {coordinates}
          </span>
          <button
            type="button"
            onClick={() => locateUser(true)}
            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-ink/10 bg-white px-2.5 text-[0.625rem] font-semibold text-ink/65 shadow-[0_1px_2px_rgba(20,30,25,0.06)] transition-colors hover:border-ink/20 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay/40"
            title="My location"
          >
            {locating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#2563eb]" strokeWidth={1.9} />
            ) : (
              <LocateFixed className="h-3.5 w-3.5 text-[#2563eb]" strokeWidth={1.9} />
            )}
            {locating ? "Locating…" : "My location"}
          </button>
          <button
            type="button"
            onClick={() => mapRef.current?.flyTo([latitude, longitude], 17, { duration: 0.6 })}
            className={controlButton}
            title="Recenter on reported location"
          >
            <Crosshair className="h-3.5 w-3.5" strokeWidth={1.9} />
            <span className="sr-only">Recenter on reported location</span>
          </button>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-pressed={expanded}
            className={controlButton}
            title={expanded ? "Exit full screen" : "View map full screen"}
          >
            {expanded ? (
              <Minimize2 className="h-3.5 w-3.5" strokeWidth={1.9} />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.9} />
            )}
            <span className="sr-only">{expanded ? "Exit full screen" : "View map full screen"}</span>
          </button>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className={controlButton}
            title="Open in Google Maps"
          >
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.9} />
            <span className="sr-only">Open in Google Maps</span>
          </a>
        </div>
      </div>

      <div
        className={
          expanded
            ? "relative mt-2.5 min-h-0 flex-1 overflow-hidden rounded-xl border border-ink/[0.08]"
            : "relative h-56 w-full overflow-hidden"
        }
      >
        <div
          ref={containerRef}
          role="application"
          aria-label={`Map showing reported location at ${coordinates}`}
          className="report-map h-full w-full bg-[#e9edf0]"
        />

        <div
          className={`pointer-events-none absolute inset-0 grid place-items-center bg-[#eef1f3] text-[0.6875rem] font-medium text-ink/40 transition-opacity duration-300 ${
            ready ? "opacity-0" : "opacity-100"
          }`}
        >
          <span className="flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading map
          </span>
        </div>

      </div>

      {expanded && (
        <div className="mt-2.5 flex items-center justify-between px-1 text-[0.625rem] text-ink/40">
          <span className="font-mono">{coordinates}</span>
          <span>Drag to pan · Scroll to zoom</span>
        </div>
      )}
    </div>
  );

  if (expanded && typeof document !== "undefined") {
    return createPortal(shell, document.body);
  }

  return shell;
}
