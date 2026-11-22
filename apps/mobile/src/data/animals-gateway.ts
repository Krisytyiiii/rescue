import type { Animal, AnimalsPage } from "@/domain/animals";
import type { SessionStorage } from "@/domain/ports";

import type { AnimalsDataSource } from "./animals";
import { webUrl } from "./config";
import { requestJson } from "./http";

/** Turns stored media paths into URLs the phone can load. */
function absoluteUrl(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("/") ? webUrl(url) : url;
}

function normalize(animal: Animal): Animal {
  return {
    ...animal,
    primaryPhotoUrl: absoluteUrl(animal.primaryPhotoUrl),
    media: animal.media.map((item) => ({
      ...item,
      fileUrl: absoluteUrl(item.fileUrl) ?? item.fileUrl,
    })),
  };
}

/** HTTP implementation of the read-only animals port. */
export class HttpAnimalsGateway implements AnimalsDataSource {
  constructor(private readonly session: SessionStorage) {}

  async loadAnimals(): Promise<Animal[]> {
    const token = (await this.session.read())?.token;

    const page = await requestJson<AnimalsPage>("/api/animals?pageSize=100", {
      token,
      networkMessage: "Can't reach FuRescue. Check your connection.",
      fallbackMessage: "We couldn't load the animals.",
    });

    return page.items.map(normalize);
  }
}
