import { NextResponse } from "next/server";

import { readSession } from "@/lib/auth/session";
import {
  imageExtension,
  MAX_IMAGE_BYTES,
  storeImage,
} from "@/lib/storage/image-upload";

function error(message: string, status: number) {
  return NextResponse.json(
    { ok: false, error: { code: "VALIDATION_ERROR", message } },
    { status },
  );
}

/** Stores one adoption-post photo for any signed-in user. */
export async function POST(request: Request) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Sign in required" } },
      { status: 401 },
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return error("Choose an image to upload", 400);

  const extension = imageExtension(file.type);
  if (!extension) {
    return error("Only JPG, PNG, or WebP images are supported", 400);
  }
  if (file.size === 0) return error("The selected image is empty", 400);
  if (file.size > MAX_IMAGE_BYTES) {
    return error("Images must be 5 MB or smaller", 400);
  }

  try {
    const url = await storeImage(
      file,
      "community",
      extension,
      new URL(request.url).origin,
    );
    return NextResponse.json({ ok: true, data: { url } });
  } catch (cause) {
    console.error("[community/uploads]", cause);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "UPLOAD_FAILED",
          message:
            cause instanceof Error
              ? `Could not save the image: ${cause.message}`
              : "Could not save the image",
        },
      },
      { status: 500 },
    );
  }
}
