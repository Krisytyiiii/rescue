import type {
  CommunityFeed,
  CommunityPhotoUpload,
  CommunityPost,
  NewCommunityPost,
} from "@/domain/community";
import type { SessionStorage } from "@/domain/ports";
import { File as ExpoFile } from "expo-file-system";
import { Platform } from "react-native";

import { webUrl, API_BASE_URL } from "./config";
import type { CommunityDataSource } from "./community";
import { ApiError, requestJson } from "./http";

function absoluteUrl(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("/") ? webUrl(url) : url;
}

function photoFile(photo: CommunityPhotoUpload): { name: string; type: string } {
  const supported = ["image/jpeg", "image/png", "image/webp"] as const;
  const type = supported.includes(photo.mimeType as (typeof supported)[number])
    ? (photo.mimeType as string)
    : "image/jpeg";
  const extension = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";

  const base = photo.fileName?.replace(/[^a-zA-Z0-9._-]/g, "_") || `photo.${extension}`;
  const name = /\.[a-z0-9]+$/i.test(base) ? base : `${base}.${extension}`;
  return { name, type };
}

function normalize(post: CommunityPost): CommunityPost {
  return {
    ...post,
    primaryPhotoUrl: absoluteUrl(post.primaryPhotoUrl),
    media: post.media.map((item) => ({
      ...item,
      fileUrl: absoluteUrl(item.fileUrl) ?? item.fileUrl,
    })),
  };
}

/** HTTP implementation of the community adoption feed. */
export class HttpCommunityGateway implements CommunityDataSource {
  constructor(private readonly session: SessionStorage) {}

  async loadFeed(): Promise<CommunityPost[]> {
    const token = (await this.session.read())?.token;

    const feed = await requestJson<CommunityFeed>("/api/community/posts", {
      token,
      networkMessage: "Can't reach FuRescue. Check your connection.",
      fallbackMessage: "We couldn't load the community feed.",
    });

    return feed.items.map(normalize);
  }

  async createPost(input: NewCommunityPost): Promise<CommunityPost> {
    const token = (await this.session.read())?.token;

    const post = await requestJson<CommunityPost>("/api/community/posts", {
      method: "POST",
      token,
      body: {
        name: input.name,
        species: input.species,
        breedType: input.breedType,
        sex: input.sex,
        estimatedAgeMonths: input.estimatedAgeMonths,
        size: input.size,
        colorMarkings: input.colorMarkings,
        temperament: input.temperament,
        description: input.description,
        media: input.photoUrls?.length
          ? input.photoUrls.map((fileUrl, sortOrder) => ({
              mediaType: "photo" as const,
              fileUrl,
              sortOrder,
            }))
          : undefined,
      },
      networkMessage: "Can't reach FuRescue. Check your connection.",
      fallbackMessage: "We couldn't submit your adoption post.",
    });

    return normalize(post);
  }

  async uploadPhoto(photo: CommunityPhotoUpload): Promise<string> {
    const token = (await this.session.read())?.token;
    const file = photoFile(photo);

    const form = new FormData();

    if (Platform.OS === "web") {
      const blob = await fetch(photo.uri)
        .then((response) => {
          if (!response.ok) throw new Error("Could not read the selected photo.");
          return response.blob();
        })
        .catch(() => {
          throw new ApiError("We couldn't read that photo. Try choosing it again.", "UPLOAD_FAILED");
        });
      form.append("file", blob, file.name);
    } else {
      const blob = await Promise.resolve()
        .then(() => {
          const nativeFile = new ExpoFile(photo.uri);
          return nativeFile.slice(0, nativeFile.size, file.type);
        })
        .catch(() => {
          throw new ApiError("We couldn't read that photo. Try choosing it again.", "UPLOAD_FAILED");
        });
      form.append("file", blob, file.name);
    }

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/api/community/uploads`, {
        method: "POST",
        headers: token ? { authorization: `Bearer ${token}` } : undefined,
        body: form,
      });
    } catch (cause) {
      if (__DEV__) {
        console.warn("[api] POST /api/community/uploads failed", cause);
      }
      const detail =
        __DEV__ && cause instanceof Error ? ` (${cause.message})` : "";
      throw new ApiError(
        `${__DEV__ ? `Can't reach FuRescue. Check your connection. [${API_BASE_URL}/api/community/uploads]` : "Can't reach FuRescue. Check your connection."}${detail}`,
        "NETWORK_ERROR",
      );
    }

    const envelope = (await response.json().catch(() => null)) as
      | { ok: boolean; data?: { url?: string }; error?: { message?: string } }
      | null;

    if (!response.ok || !envelope?.ok || !envelope.data?.url) {
      throw new ApiError(
        envelope?.error?.message ?? "We couldn't upload that photo.",
        "UPLOAD_FAILED",
        response.status,
      );
    }

    return envelope.data.url;
  }
}
