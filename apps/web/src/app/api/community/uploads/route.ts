import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { readSession } from "@/lib/auth/session";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_BYTES = 5 * 1024 * 1024;

let storageClient: SupabaseClient | null | undefined;
let bucketReady: Promise<void> | null = null;

function error(message: string, status: number) {
  return NextResponse.json(
    { ok: false, error: { code: "VALIDATION_ERROR", message } },
    { status },
  );
}

function getStorageClient(): SupabaseClient | null {
  if (storageClient !== undefined) return storageClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  storageClient =
    url && key
      ? createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : null;
  return storageClient;
}

async function ensureBucket(client: SupabaseClient, bucket: string) {
  if (!bucketReady) {
    bucketReady = (async () => {
      const { error: lookupError } = await client.storage.getBucket(bucket);
      if (!lookupError) return;

      const { error: createError } = await client.storage.createBucket(bucket, {
        public: true,
      });
      if (createError && !/already exists/i.test(createError.message)) {
        throw new Error(createError.message);
      }
    })().catch((cause) => {
      bucketReady = null;
      throw cause;
    });
  }
  return bucketReady;
}

async function storeInSupabase(
  file: File,
  extension: string,
): Promise<string | null> {
  const client = getStorageClient();
  if (!client) return null;

  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "furescue-media";
  await ensureBucket(client, bucket);

  const fileName = `community/${randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await client.storage
    .from(bucket)
    .upload(fileName, bytes, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });

  if (uploadError) throw new Error(uploadError.message);

  return client.storage.from(bucket).getPublicUrl(fileName).data.publicUrl;
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

  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    return error("Only JPG, PNG, or WebP images are supported", 400);
  }
  if (file.size === 0) return error("The selected image is empty", 400);
  if (file.size > MAX_BYTES) return error("Images must be 5 MB or smaller", 400);

  try {
    const stored = await storeInSupabase(file, extension);
    if (stored) {
      return NextResponse.json({ ok: true, data: { url: stored } });
    }

    // Local development fallback when Supabase storage is not configured.
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
