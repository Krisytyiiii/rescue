import type {
  CommunityFeed,
  CommunityPost,
  NewCommunityPost,
} from "@/domain/community";
import type { SessionStorage } from "@/domain/ports";

import { webUrl, API_BASE_URL } from "./config";
import type { CommunityDataSource } from "./community";
import { ApiError, requestJson } from "./http";

function absoluteUrl(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("/") ? webUrl(url) : url;
}

function photoFile(uri: string): { name: string; type: string } {
  const rawName = uri.split("?")[0].split("/").pop() || `photo-${Date.now()}.jpg`;
  const extension = rawName.split(".").pop()?.toLowerCase();
  const type =
    extension === "png"
      ? "image/png"
      : extension === "webp"
        ? "image/webp"
        : "image/jpeg";
  const name = /\.[a-z0-9]+$/i.test(rawName) ? rawName : `${rawName}.jpg`;
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

  async uploadPhoto(uri: string): Promise<string> {
    const token = (await this.session.read())?.token;
    const file = photoFile(uri);

    const form = new FormData();
    form.append("file", {
      uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/api/community/uploads`, {
        method: "POST",
        headers: token ? { authorization: `Bearer ${token}` } : undefined,
        body: form,
      });
    } catch {
      throw new ApiError(
        __DEV__
          ? `Can't reach FuRescue. Check your connection. [${API_BASE_URL}/api/community/uploads]`
          : "Can't reach FuRescue. Check your connection.",
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
