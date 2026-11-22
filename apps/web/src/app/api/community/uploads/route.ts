import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { readSession } from "@/lib/auth/session";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_BYTES = 5 * 1024 * 1024;

function error(message: string, status: number) {
  return NextResponse.json(
    { ok: false, error: { code: "VALIDATION_ERROR", message } },
    { status },
  );
}

/** Stores one adoption-post photo for a signed-in community member. */
export async function POST(request: Request) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in required" } },
      { status: 401 },
    );
  }

  if (session.role !== "community_user" && session.role !== "admin") {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "FORBIDDEN",
          message: "Only community members can upload adoption photos",
        },
      },
      { status: 403 },
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return error("Choose an image to upload", 400);

  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    return error("Only JPG, PNG, or WebP images are supported", 400);
  }
  if (file.size === 0) return error("The selected image is empty", 400);
  if (file.size > MAX_BYTES) return error("Images must be 5 MB or smaller", 400);

  try {
    const fileName = `${randomUUID()}.${extension}`;
    const directory = path.join(process.cwd(), "public", "uploads", "community");
    await mkdir(directory, { recursive: true });
    await writeFile(
      path.join(directory, fileName),
      Buffer.from(await file.arrayBuffer()),
    );

    const origin = new URL(request.url).origin;
    return NextResponse.json({
      ok: true,
      data: { url: `${origin}/uploads/community/${fileName}` },
    });
  } catch (cause) {
    console.error("[community/uploads]", cause);
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INTERNAL_ERROR", message: "Could not save the image" },
      },
      { status: 500 },
    );
  }
}
