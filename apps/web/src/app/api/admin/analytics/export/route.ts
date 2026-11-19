import { NextResponse } from "next/server";

import {
  analyticsService,
  type AnalyticsRange,
  type AnalyticsSpeciesFilter,
} from "@furescue/core";

import { apiError, requireAdminActor } from "@/lib/admin/api";

const RANGES: AnalyticsRange[] = ["7d", "30d", "90d", "12m", "all"];
const SPECIES: AnalyticsSpeciesFilter[] = ["all", "dog", "cat", "unknown"];

export async function GET(request: Request) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const params = new URL(request.url).searchParams;
  const range = params.get("range");
  const species = params.get("species");
  const barangay = params.get("barangay");
  const tab = params.get("tab");
  const barangayId = barangay ? Number(barangay) : undefined;

  try {
    const { filename, content } = await analyticsService.exportCsv(
      tab === "rescues" ? "rescues" : tab === "geography" ? "geography" : "adoptions",
      {
        range: RANGES.includes(range as AnalyticsRange)
          ? (range as AnalyticsRange)
          : "30d",
        species: SPECIES.includes(species as AnalyticsSpeciesFilter)
          ? (species as AnalyticsSpeciesFilter)
          : "all",
        barangayId: Number.isFinite(barangayId) ? barangayId : undefined,
      },
      auth.actor,
    );

    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return apiError(error, "Could not export this dataset");
  }
}
