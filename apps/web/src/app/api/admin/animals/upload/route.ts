import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { apiError, requireAdminActor, validationError } from "@/lib/admin/api";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_BYTES = 5 * 1024 * 1024;

/** Stores a single animal photo and returns its public URL. */
export async function POST(request: Request) {
  const auth = await requireAdminActor();
  if (auth.response) return auth.response;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return validationError("Choose an image to upload");

  const extension = ALLOWED_TYPES[file.type];
  if (!extension) return validationError("Only JPG, PNG, or WebP images are supported");
  if (file.size === 0) return validationError("The selected image is empty");
  if (file.size > MAX_BYTES) return validationError("Images must be 5 MB or smaller");

  try {
    const fileName = `${randomUUID()}.${extension}`;
    const directory = path.join(process.cwd(), "public", "uploads", "animals");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, fileName), Buffer.from(await file.arrayBuffer()));

    const origin = new URL(request.url).origin;
    return NextResponse.json({
      ok: true,
      data: { url: `${origin}/uploads/animals/${fileName}` },
    });
  } catch (error) {
    return apiError(error, "Could not save the image");
  }
}
