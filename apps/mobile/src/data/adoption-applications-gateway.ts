import type {
  AdoptableAnimal,
  AdoptionApplicationInput,
  AdoptionIdUpload,
  CreatedAdoptionApplication,
} from "@/domain/adoption-applications";
import type { AdoptionRequest, AdoptionsPage } from "@/domain/adoptions";
import type { SessionStorage } from "@/domain/ports";

import type { AdoptionApplicationDataSource } from "./adoption-applications";
import type { CommunityDataSource } from "./community";
import { webUrl } from "./config";
import { requestJson } from "./http";

function absoluteUrl(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("/") ? webUrl(url) : url;
}

function normalize(animal: AdoptableAnimal): AdoptableAnimal {
  return {
    ...animal,
    primaryPhotoUrl: absoluteUrl(animal.primaryPhotoUrl),
    media: animal.media.map((item) => ({
      ...item,
      fileUrl: absoluteUrl(item.fileUrl) ?? item.fileUrl,
    })),
  };
}

function normalizeApplication(request: AdoptionRequest): AdoptionRequest {
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

/** HTTP implementation of the resident adoption port. */
export class HttpAdoptionApplicationsGateway
  implements AdoptionApplicationDataSource
{
  constructor(
    private readonly session: SessionStorage,
    private readonly uploads: CommunityDataSource,
  ) {}

  async loadAvailableAnimals(): Promise<AdoptableAnimal[]> {
    const token = (await this.session.read())?.token;

    const payload = await requestJson<{ animals: AdoptableAnimal[] }>(
      "/api/adoptions/available",
      {
        token,
        networkMessage: "Can't load the adoption animals. Check your connection.",
        fallbackMessage: "We couldn't load the adoption animals.",
      },
    );

    return payload.animals.map(normalize);
  }

  async loadMyApplications(): Promise<AdoptionRequest[]> {
    const token = (await this.session.read())?.token;

    const page = await requestJson<AdoptionsPage>(
      "/api/adoptions/mine?pageSize=100",
      {
        token,
        networkMessage: "Can't reach FuRescue. Check your connection.",
        fallbackMessage: "We couldn't load your adoption applications.",
      },
    );

    return page.items.map(normalizeApplication);
  }

  async apply(
    input: AdoptionApplicationInput,
  ): Promise<CreatedAdoptionApplication> {
    const token = (await this.session.read())?.token;

    return requestJson<CreatedAdoptionApplication>("/api/adoptions", {
      method: "POST",
      token,
      body: input,
      networkMessage: "Can't reach FuRescue. Check your connection.",
      fallbackMessage: "We couldn't submit your adoption application.",
    });
  }

  async uploadValidId(photo: AdoptionIdUpload): Promise<string> {
    return this.uploads.uploadPhoto(photo);
  }
}
