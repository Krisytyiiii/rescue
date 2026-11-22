import type {
  AdoptableAnimal,
  AdoptionApplicationInput,
  AdoptionIdUpload,
  CreatedAdoptionApplication,
} from "@/domain/adoption-applications";

/** Port for the resident adoption listing and application flow. */
export interface AdoptionApplicationDataSource {
  /** Animals currently published and open for adoption. */
  loadAvailableAnimals(): Promise<AdoptableAnimal[]>;
  /** Submits the resident's application for one animal. */
  apply(input: AdoptionApplicationInput): Promise<CreatedAdoptionApplication>;
  /** Uploads the resident's valid ID and returns its public URL. */
  uploadValidId(photo: AdoptionIdUpload): Promise<string>;
}
