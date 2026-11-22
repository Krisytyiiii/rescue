import type { Animal } from "@/domain/animals";

/** Port for the read-only animal records (`GET /api/animals`). */
export interface AnimalsDataSource {
  loadAnimals(): Promise<Animal[]>;
}
