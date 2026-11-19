import { NextResponse } from "next/server";

import {
  createHealthRecordSchema,
  createHeartRateSchema,
  createVaccinationSchema,
  healthService,
  updateHealthRecordSchema,
  updateHeartRateSchema,
  updateVaccinationSchema,
} from "@furescue/core";

import { apiError, requireAdminActor, validationError } from "@/lib/admin/api";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const { id } = await context.params;

  try {
    const health = await healthService.getAnimalHealth(id);
    return NextResponse.json({ ok: true, data: health });
  } catch (error) {
    return apiError(error, "Could not load the health record");
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const body = (await request.json().catch(() => null)) as
    | (Record<string, unknown> & { kind?: string })
    | null;
  if (!body?.kind) return validationError("Choose a health entry type");

  const { id } = await context.params;
  const payload = { ...body, animalId: id };

  try {
    if (body.kind === "record") {
      const parsed = createHealthRecordSchema.safeParse(payload);
      if (!parsed.success) {
        return validationError(parsed.error.issues[0]?.message ?? "Invalid health record");
      }
      const record = await healthService.addRecord(parsed.data, auth.actor);
      return NextResponse.json({ ok: true, data: record });
    }

    if (body.kind === "vaccination") {
      const parsed = createVaccinationSchema.safeParse(payload);
      if (!parsed.success) {
        return validationError(parsed.error.issues[0]?.message ?? "Invalid vaccination");
      }
      const vaccination = await healthService.addVaccination(parsed.data, auth.actor);
      return NextResponse.json({ ok: true, data: vaccination });
    }

    if (body.kind === "heart_rate") {
      const parsed = createHeartRateSchema.safeParse(payload);
      if (!parsed.success) {
        return validationError(parsed.error.issues[0]?.message ?? "Invalid heart rate");
      }
      const log = await healthService.logHeartRate(parsed.data, auth.actor);
      return NextResponse.json({ ok: true, data: log });
    }

    return validationError("Choose a health entry type");
  } catch (error) {
    return apiError(error, "Could not save the health entry");
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const body = (await request.json().catch(() => null)) as
    | (Record<string, unknown> & { kind?: string; entryId?: string })
    | null;
  if (!body?.kind) return validationError("Choose a health entry type");
  if (!body.entryId) return validationError("Choose the entry to update");

  const { id } = await context.params;

  try {
    if (body.kind === "record") {
      const parsed = updateHealthRecordSchema.safeParse(body);
      if (!parsed.success) {
        return validationError(parsed.error.issues[0]?.message ?? "Invalid health record");
      }
      const record = await healthService.updateRecord(id, body.entryId, parsed.data, auth.actor);
      return NextResponse.json({ ok: true, data: record });
    }

    if (body.kind === "vaccination") {
      const parsed = updateVaccinationSchema.safeParse(body);
      if (!parsed.success) {
        return validationError(parsed.error.issues[0]?.message ?? "Invalid vaccination");
      }
      const vaccination = await healthService.updateVaccination(
        id,
        body.entryId,
        parsed.data,
        auth.actor,
      );
      return NextResponse.json({ ok: true, data: vaccination });
    }

    if (body.kind === "heart_rate") {
      const parsed = updateHeartRateSchema.safeParse(body);
      if (!parsed.success) {
        return validationError(parsed.error.issues[0]?.message ?? "Invalid heart rate");
      }
      const log = await healthService.updateHeartRate(id, body.entryId, parsed.data, auth.actor);
      return NextResponse.json({ ok: true, data: log });
    }

    return validationError("Choose a health entry type");
  } catch (error) {
    return apiError(error, "Could not update the health entry");
  }
}
