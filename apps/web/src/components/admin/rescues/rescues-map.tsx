"use client";

import "leaflet/dist/leaflet.css";

import { Crosshair, Loader2 } from "lucide-react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import { useEffect, useRef, useState } from "react";

import type { ReportMarkerRow, ReportStatusCounts } from "@furescue/core";

import { Button } from "@/components/ui/button";
import { TOOLTIP_BUBBLE } from "@/components/ui/tooltip";

import {
  REPORT_STATUS_ORDER,
  formatClock,
  humanize,
  reportStatusMeta,
} from "./rescues-utils";

interface RescuesMapProps {
  reports: ReportMarkerRow[];
  counts?: ReportStatusCounts | null;
  mode: "map" | "heat";
  selectedId: string | null;
  onSelect: (reportId: string) => void;
}

/**
 * Every report on one canvas. Pins are keyed by report status so unverified
 * submissions stay visible; heat mode aggregates the same geotagged points
 * into case density.
 */
export function RescuesMap({
  reports,
  counts,
  mode,
  selectedId,
  onSelect,
}: RescuesMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const heatCanvasRef = useRef<HTMLCanvasElement>(null);
  const densityCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const colorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerLayerRef = useRef<LayerGroup | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const didFitRef = useRef(false);
  const onSelectRef = useRef(onSelect);
  const reportsRef = useRef(reports);
  const [ready, setReady] = useState(false);
  const [hovered, setHovered] = useState<{ id: string; x: number; y: number } | null>(null);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    reportsRef.current = reports;
  }, [reports]);

  useEffect(() => {
    let disposed = false;
    let map: LeafletMap | null = null;

    void import("leaflet").then((L) => {
      if (disposed || !containerRef.current) return;

      map = L.map(containerRef.current, {
        center: [7.0731, 125.6128],
        zoom: 12,
        maxZoom: 19,
        zoomControl: false,
        scrollWheelZoom: true,
        attributionControl: true,
      });
      mapRef.current = map;
      leafletRef.current = L;

      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 19,
          attribution:
            'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, HERE, Garmin, OpenStreetMap contributors',
        },
      ).addTo(map);

      L.control.zoom({ position: "bottomleft" }).addTo(map);
      L.control.scale({ position: "topleft", imperial: false }).addTo(map);

      markerLayerRef.current = L.layerGroup().addTo(map);
      setReady(true);
      requestAnimationFrame(() => map?.invalidateSize());
    });

    return () => {
      disposed = true;
      map?.remove();
      map = null;
      mapRef.current = null;
      markerLayerRef.current = null;
    };
  }, []);

  // Rebuild pins when the visible set changes.
  useEffect(() => {
    const map = mapRef.current;
    const layer = markerLayerRef.current;
    const L = leafletRef.current;
    if (!map || !layer || !L || !ready) return;

    layer.clearLayers();
    setHovered(null);

    if (!didFitRef.current && reports.length > 0) {
      didFitRef.current = true;
      const points = reports.map(
        (report) => [report.latitude, report.longitude] as [number, number],
      );
      map.fitBounds(L.latLngBounds(points).pad(0.25), { maxZoom: 15 });
    }

    if (mode !== "map") return;

    for (const report of reports) {
      const meta = reportStatusMeta(report.reportStatus);
      const selected = report.reportId === selectedId;
      const size = selected ? 20 : 13;

      const icon = L.divIcon({
        className: "",
        html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;background:${meta.pin};border:2.5px solid #fff;box-shadow:0 0 0 ${
          selected ? 7 : 3
        }px ${meta.pin}${selected ? "3d" : "26"},0 4px 10px rgba(6,32,20,0.4)"></span>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([report.latitude, report.longitude], {
        icon,
        zIndexOffset: selected ? 1000 : 0,
        alt: report.reportCode,
      }).addTo(layer);

      marker.on("mouseover", () => {
        const point = map.latLngToContainerPoint(marker.getLatLng());
        setHovered({ id: report.reportId, x: point.x, y: point.y });
      });
      marker.on("mouseout", () => {
        setHovered((current) => (current?.id === report.reportId ? null : current));
      });

      marker.on("click", () => onSelectRef.current(report.reportId));
    }
  }, [reports, selectedId, ready, mode]);

  // Hide the hover card as soon as the view moves so it never detaches from its pin.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const clear = () => setHovered(null);
    map.on("dragstart zoomstart", clear);
    return () => {
      map.off("dragstart zoomstart", clear);
    };
  }, [ready]);

  // Render a density heat layer from the same geotagged report points.
  useEffect(() => {
    if (!ready || mode !== "heat") return;
    const map = mapRef.current;
    const canvas = heatCanvasRef.current;
    if (!map || !canvas) return;

    // Render at half resolution and upscale with smoothing: cheaper per frame and
    // gives the soft bloom a density map needs instead of hard little discs.
    const SCALE = 2;
    // Density at which the palette reaches its hottest colour.
    const HOT = 0.75;

    let frame = 0;

    function render() {
      const size = map!.getSize();
      if (size.x === 0 || size.y === 0) return;

      const width = Math.max(1, Math.ceil(size.x / SCALE));
      const height = Math.max(1, Math.ceil(size.y / SCALE));

      const off = (densityCanvasRef.current ??= document.createElement("canvas"));
      if (off.width !== width || off.height !== height) {
        off.width = width;
        off.height = height;
      }
      const octx = off.getContext("2d");
      if (!octx) return;

      octx.clearRect(0, 0, width, height);
      // Additive blobs: overlapping reports brighten into a real hotspot.
      octx.globalCompositeOperation = "lighter";

      const radius = Math.max(30, 20 + (map!.getZoom() - 10) * 9) / SCALE;

      for (const report of reportsRef.current) {
        const point = map!.latLngToContainerPoint([report.latitude, report.longitude]);
        const x = point.x / SCALE;
        const y = point.y / SCALE;

        const gradient = octx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, "rgba(0,0,0,0.22)");
        gradient.addColorStop(0.4, "rgba(0,0,0,0.1)");
        gradient.addColorStop(0.75, "rgba(0,0,0,0.03)");
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        octx.fillStyle = gradient;
        octx.beginPath();
        octx.arc(x, y, radius, 0, Math.PI * 2);
        octx.fill();
      }

      octx.globalCompositeOperation = "source-over";

      // Colourise the accumulated alpha channel through the heat ramp.
      const image = octx.getImageData(0, 0, width, height);
      const data = image.data;
      for (let index = 0; index < data.length; index += 4) {
        const density = data[index + 3] / 255;
        if (density <= 0.004) {
          data[index + 3] = 0;
          continue;
        }
        const [red, green, blue, alpha] = heatColor(density / HOT);
        data[index] = red;
        data[index + 1] = green;
        data[index + 2] = blue;
        data[index + 3] = Math.round(alpha * 255);
      }

      const color = (colorCanvasRef.current ??= document.createElement("canvas"));
      if (color.width !== width || color.height !== height) {
        color.width = width;
        color.height = height;
      }
      const cctx = color.getContext("2d");
      const context = canvas!.getContext("2d");
      if (!cctx || !context) return;

      cctx.clearRect(0, 0, width, height);
      cctx.putImageData(image, 0, 0);

      if (canvas!.width !== size.x || canvas!.height !== size.y) {
        canvas!.width = size.x;
        canvas!.height = size.y;
      }
      context.clearRect(0, 0, size.x, size.y);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(color, 0, 0, size.x, size.y);
    }

    function draw() {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        render();
      });
    }

    draw();
    map.on("move zoom resize", draw);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      map.off("move zoom resize", draw);
    };
  }, [ready, mode, reports]);

  // Heat mode has no pins, so clicking a hotspot selects the nearest case.
  useEffect(() => {
    if (!ready || mode !== "heat") return;
    const map = mapRef.current;
    if (!map) return;

    function onClick(event: import("leaflet").LeafletMouseEvent) {
      let nearestId: string | null = null;
      let nearestDistance = 30;
      for (const report of reports) {
        const point = map!.latLngToContainerPoint([report.latitude, report.longitude]);
        const distance = Math.hypot(
          point.x - event.containerPoint.x,
          point.y - event.containerPoint.y,
        );
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestId = report.reportId;
        }
      }
      if (nearestId) onSelectRef.current(nearestId);
    }

    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
    };
  }, [ready, mode, reports]);

  // Focus the selected pin without resetting the user's zoom level. Reads reports
  // from a ref and depends only on selectedId so live data refreshes never make
  // the map fly around on its own.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const report = reportsRef.current.find((item) => item.reportId === selectedId);
    if (!report) return;
    const target: [number, number] = [report.latitude, report.longitude];
    // Only pan when the selected pin is actually off-screen, and keep the user's
    // current zoom. Flying on every selection is what made the map feel shaky.
    if (map.getBounds().pad(-0.12).contains(target)) return;
    map.stop();
    map.flyTo(target, map.getZoom(), { duration: 0.45 });
  }, [selectedId]);

  function fitAll() {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L || reports.length === 0) return;
    const points = reports.map(
      (report) => [report.latitude, report.longitude] as [number, number],
    );
    map.fitBounds(L.latLngBounds(points).pad(0.25), { maxZoom: 15 });
  }

  const hoveredReport = hovered
    ? (reports.find((report) => report.reportId === hovered.id) ?? null)
    : null;
  const hoveredMeta = hoveredReport ? reportStatusMeta(hoveredReport.reportStatus) : null;

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        role="application"
        aria-label="Map of rescue reports"
        className="report-map h-full w-full bg-[#eef6ef]"
      />

      <canvas
        ref={heatCanvasRef}
        aria-hidden
        className={`pointer-events-none absolute inset-0 z-[450] h-full w-full ${
          mode === "heat" ? "opacity-100" : "opacity-0"
        } transition-opacity duration-300`}
      />

      {hoveredReport && hoveredMeta && hovered && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-[800] -translate-x-1/2 -translate-y-full"
          style={{ left: hovered.x, top: hovered.y - 12 }}
        >
          <div className={`relative w-56 text-left ${TOOLTIP_BUBBLE}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-[0.625rem] font-semibold tracking-wide text-white">
                {hoveredReport.reportCode}
              </p>
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full ring-2 ring-white/20"
                style={{ backgroundColor: hoveredMeta.pin }}
              />
            </div>
            <p className="mt-0.5 whitespace-nowrap text-[0.5625rem] text-white/70">
              {hoveredMeta.label} · {humanize(hoveredReport.species)} ·{" "}
              {humanize(hoveredReport.urgencyLevel)} urgency
            </p>

            <dl className="mt-2 space-y-1 border-t border-white/10 pt-1.5">
              <TooltipField label="Reporter" value={hoveredReport.reporter} />
              <TooltipField
                label="Rescuer"
                value={hoveredReport.rescuer?.fullName ?? "Unassigned"}
              />
              <TooltipField
                label="Rescue"
                value={
                  hoveredReport.assignmentStatus
                    ? humanize(hoveredReport.assignmentStatus)
                    : "Not dispatched"
                }
              />
              <TooltipField
                label="Barangay"
                value={hoveredReport.barangay ?? "Unmatched"}
              />
            </dl>

            <p className="mt-1.5 whitespace-nowrap border-t border-white/10 pt-1.5 text-[0.5rem] text-white/45">
              Submitted {formatClock(hoveredReport.submittedAt)}
            </p>
            <span className="absolute left-1/2 top-full h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-ink" />
          </div>
        </div>
      )}

      <div
        className={`pointer-events-none absolute inset-0 grid place-items-center bg-[#edf5ee] text-[0.6875rem] font-medium text-ink/40 transition-opacity duration-300 ${
          ready ? "opacity-0" : "opacity-100"
        }`}
      >
        <span className="flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading report map
        </span>
      </div>

      {ready && reports.length === 0 && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <p className="rounded-lg border border-ink/[0.08] bg-white/90 px-3 py-2 text-[0.6875rem] text-ink/50 backdrop-blur-sm">
            No reports match this view
          </p>
        </div>
      )}

      <Button
        variant="secondary"
        size="icon"
        onClick={fitAll}
        className="absolute right-3 top-3 z-[500] border-ink/10 bg-white shadow-[0_1px_2px_rgba(20,30,25,0.06)]"
        title="Fit all reports"
      >
        <Crosshair className="h-3.5 w-3.5" strokeWidth={1.9} />
        <span className="sr-only">Fit all reports</span>
      </Button>

      <div className="pointer-events-none absolute bottom-3 right-3 z-[500] rounded-lg border border-ink/[0.08] bg-white/95 p-2.5 shadow-[0_10px_30px_-18px_rgba(6,32,20,0.45)] backdrop-blur-sm">
        {mode === "heat" ? (
          <>
            <p className="text-[0.5rem] font-semibold uppercase tracking-[0.12em] text-ink/40">
              Case density
            </p>
            <div
              className="mt-1.5 h-1.5 w-36 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, #1f7a4d 0%, #06b6d4 20%, #22c55e 38%, #facc15 58%, #f97316 78%, #dc2626 100%)",
              }}
            />
            <div className="mt-1 flex justify-between text-[0.5rem] text-ink/35">
              <span>Low</span>
              <span>High</span>
            </div>
            <p className="mt-1 text-[0.5rem] text-ink/30">
              {reports.length} geotagged reports
            </p>
          </>
        ) : (
          <>
            <p className="text-[0.5rem] font-semibold uppercase tracking-[0.12em] text-ink/40">
              Report status
            </p>
            <ul className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1">
              {REPORT_STATUS_ORDER.map((status) => {
                const meta = reportStatusMeta(status);
                const count = counts?.[status];
                return (
                  <li key={status} className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full ring-2 ring-white"
                      style={{ backgroundColor: meta.pin }}
                    />
                    <span className="text-[0.5625rem] text-ink/60">{meta.label}</span>
                    {count !== undefined && (
                      <span className="font-mono text-[0.5rem] tabular-nums text-ink/30">
                        {count}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function TooltipField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="shrink-0 text-[0.5rem] uppercase tracking-[0.08em] text-white/40">
        {label}
      </dt>
      <dd className="min-w-0 truncate text-[0.5625rem] font-medium text-white/80">
        {value}
      </dd>
    </div>
  );
}

// Classic density ramp: cool blue for sparse cases, through green/yellow,
// up to red for concentrated hotspots.
const HEAT_STOPS = [
  { at: 0, color: [37, 99, 235], alpha: 0.06 },
  { at: 0.18, color: [6, 182, 212], alpha: 0.22 },
  { at: 0.36, color: [34, 197, 94], alpha: 0.38 },
  { at: 0.55, color: [250, 204, 21], alpha: 0.54 },
  { at: 0.76, color: [249, 115, 22], alpha: 0.66 },
  { at: 1, color: [220, 38, 38], alpha: 0.78 },
] as const;

function heatColor(intensity: number): [number, number, number, number] {
  const value = Math.min(1, Math.max(0, intensity));
  for (let index = 1; index < HEAT_STOPS.length; index += 1) {
    const previous = HEAT_STOPS[index - 1];
    const next = HEAT_STOPS[index];
    if (value <= next.at) {
      const span = next.at - previous.at || 1;
      const mix = (value - previous.at) / span;
      return [
        Math.round(previous.color[0] + (next.color[0] - previous.color[0]) * mix),
        Math.round(previous.color[1] + (next.color[1] - previous.color[1]) * mix),
        Math.round(previous.color[2] + (next.color[2] - previous.color[2]) * mix),
        previous.alpha + (next.alpha - previous.alpha) * mix,
      ];
    }
  }
  const last = HEAT_STOPS[HEAT_STOPS.length - 1];
  return [last.color[0], last.color[1], last.color[2], last.alpha];
}
