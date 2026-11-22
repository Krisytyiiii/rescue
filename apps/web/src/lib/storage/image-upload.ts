import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

let storageClient: SupabaseClient | null | undefined;
let bucketReady: Promise<void> | null = null;

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

/** Maps an uploaded image's MIME type to its file extension. */
export function imageExtension(type: string): string | null {
  return ALLOWED_TYPES[type] ?? null;
}

/**
 * Stores an uploaded image and returns its public URL. Uses Supabase Storage
 * when configured, with a local `public/uploads` fallback for development.
 */
export async function storeImage(
  file: File,
  folder: string,
  extension: string,
  origin: string,
): Promise<string> {
  const client = getStorageClient();

  if (client) {
    const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "furescue-media";
    await ensureBucket(client, bucket);

    const fileName = `${folder}/${randomUUID()}.${extension}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    const { error } = await client.storage.from(bucket).upload(fileName, bytes, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });

    if (error) throw new Error(error.message);

    return client.storage.from(bucket).getPublicUrl(fileName).data.publicUrl;
  }

  const fileName = `${randomUUID()}.${extension}`;
  const directory = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(directory, { recursive: true });
  await writeFile(
    path.join(directory, fileName),
    Buffer.from(await file.arrayBuffer()),
  );

  return `${origin}/uploads/${folder}/${fileName}`;
}
