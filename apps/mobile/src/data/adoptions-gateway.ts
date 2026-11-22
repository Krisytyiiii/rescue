import type { AdoptionRequest, AdoptionsPage } from "@/domain/adoptions";
import type { SessionStorage } from "@/domain/ports";

import type { AdoptionsDataSource } from "./adoptions";
import { webUrl } from "./config";
import { requestJson } from "./http";

function absoluteUrl(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("/") ? webUrl(url) : url;
}

function normalize(request: AdoptionRequest): AdoptionRequest {
  return {
    ...request,
    homePhotoUrl: absoluteUrl(request.homePhotoUrl),
    animal: {
      ...request.animal,
      primaryPhotoUrl: absoluteUrl(request.animal.primaryPhotoUrl),
      media: request.animal.media.map((item) => ({
        ...item,
        fileUrl: absoluteUrl(item.fileUrl) ?? item.fileUrl,
      })),
    },
  };
}

/** HTTP implementation of the read-only adoptions port. */
export class HttpAdoptionsGateway implements AdoptionsDataSource {
  constructor(private readonly session: SessionStorage) {}

  async loadAdoptions(): Promise<AdoptionRequest[]> {
    const token = (await this.session.read())?.token;

    const page = await requestJson<AdoptionsPage>(
      "/api/adoptions?pageSize=100",
      {
        token,
        networkMessage: "Can't reach FuRescue. Check your connection.",
        fallbackMessage: "We couldn't load the adoptions.",
      },
    );

    return page.items.map(normalize);
  }
}
