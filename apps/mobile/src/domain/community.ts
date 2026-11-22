import type { Animal } from "./animals";

/** Resident who submitted a community adoption post. */
export interface CommunityAuthor {
  id: string;
  firstName: string;
  lastName: string;
}

/**
 * An animal posted for adoption by a resident. Posts stay `pending_review`
 * until the City Vet team publishes them.
 */
export interface CommunityPost extends Animal {
  postedBy: CommunityAuthor | null;
}

export interface CommunityFeed {
  items: CommunityPost[];
}

export type CommunitySpecies = "dog" | "cat";
export type CommunityBreed = "aspin" | "puspin" | "mixed" | "other";
export type CommunitySex = "male" | "female" | "unknown";
export type CommunitySize = "small" | "medium" | "large";

/** What a resident can submit from the app. */
export interface NewCommunityPost {
  name: string;
  species: CommunitySpecies;
  breedType: CommunityBreed;
  sex: CommunitySex;
  estimatedAgeMonths?: number;
  size?: CommunitySize;
  colorMarkings?: string;
  temperament?: string;
  description: string;
  /** Uploaded photo URLs, in display order. At most 4 per post. */
  photoUrls?: string[];
}

/** Maximum number of photos a resident can attach to one adoption post. */
export const MAX_COMMUNITY_PHOTOS = 4;

/** A local photo selected on the device, before it is uploaded. */
export interface CommunityPhotoUpload {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}
