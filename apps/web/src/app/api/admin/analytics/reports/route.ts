import { NextResponse } from "next/server";

import {
  analyticsService,
  type AnalyticsRange,
  type AnalyticsSpeciesFilter,
  type CreateGeneratedReportInput,
} from "@furescue/core";

import { apiError, requireAdminActor, validationError } from "@/lib/admin/api";
import { broadcastAdminChange } from "@/lib/admin/realtime-broadcast";

const RANGES: AnalyticsRange[] = ["7d", "30d", "90d", "12m", "all"];
const SPECIES: AnalyticsSpeciesFilter[] = ["all", "dog", "cat", "unknown"];
const KINDS = [
  "adoption_trends",
  "rescue_efficiency",
  "geographic_distribution",
  "health_summary",
] as const;
const FORMATS = ["pdf", "xlsx", "csv"] as const;

export async function GET(request: Request) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const params = new URL(request.url).searchParams;
  const range = params.get("range");
  const species = params.get("species");
  const barangay = params.get("barangay");
  const barangayId = barangay ? Number(barangay) : undefined;

  try {
    const dashboard = await analyticsService.getDashboard(
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
    return NextResponse.json({ ok: true, data: dashboard });
  } catch (error) {
    return apiError(error, "Could not load analytics");
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const body = (await request.json().catch(() => null)) as
    | Partial<CreateGeneratedReportInput>
    | null;
  if (!body) return validationError("A report payload is required");

  if (!KINDS.includes(body.kind as (typeof KINDS)[number])) {
    return validationError("Choose a valid report kind");
  }
  if (!FORMATS.includes(body.format as (typeof FORMATS)[number])) {
    return validationError("Choose a valid report format");
  }
  const from = body.from ? new Date(body.from) : null;
  const to = body.to ? new Date(body.to) : null;
  if (!from || !to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return validationError("A valid date range is required");
  }

  try {
    const report = await analyticsService.createGeneratedReport(
      {
        kind: body.kind as CreateGeneratedReportInput["kind"],
        format: body.format as CreateGeneratedReportInput["format"],
        from,
        to,
      },
      auth.actor,
    );
    await broadcastAdminChange("generated_reports");
    return NextResponse.json({ ok: true, data: report }, { status: 201 });
  } catch (error) {
    return apiError(error, "Could not generate this report");
  }
}
