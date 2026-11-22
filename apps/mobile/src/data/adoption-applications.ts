import type {
  AdoptableAnimal,
  AdoptionApplicationInput,
  AdoptionIdUpload,
  CreatedAdoptionApplication,
} from "@/domain/adoption-applications";
import type { AdoptionRequest } from "@/domain/adoptions";

/** Port for the resident adoption listing and application flow. */
export interface AdoptionApplicationDataSource {
  /** Animals currently published and open for adoption. */
  loadAvailableAnimals(): Promise<AdoptableAnimal[]>;
  /** The signed-in resident's own applications, newest first. */
  loadMyApplications(): Promise<AdoptionRequest[]>;
  /** Submits the resident's application for one animal. */
  apply(input: AdoptionApplicationInput): Promise<CreatedAdoptionApplication>;
  /** Uploads the resident's valid ID and returns its public URL. */
  uploadValidId(photo: AdoptionIdUpload): Promise<string>;
}
