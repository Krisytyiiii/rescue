import type {
  CommunityFeed,
  CommunityPost,
  NewCommunityPost,
} from "@/domain/community";
import type { SessionStorage } from "@/domain/ports";

import { webUrl } from "./config";
import type { CommunityDataSource } from "./community";
import { requestJson } from "./http";

function absoluteUrl(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("/") ? webUrl(url) : url;
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
        media: input.photoUrl
          ? [
              {
                mediaType: "photo" as const,
                fileUrl: input.photoUrl,
                sortOrder: 0,
              },
            ]
          : undefined,
      },
      networkMessage: "Can't reach FuRescue. Check your connection.",
      fallbackMessage: "We couldn't submit your adoption post.",
    });

    return normalize(post);
  }
}
