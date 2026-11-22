import type {
  CommunityPost,
  NewCommunityPost,
} from "@/domain/community";

/** Port for the resident community adoption feed. */
export interface CommunityDataSource {
  loadFeed(): Promise<CommunityPost[]>;
  createPost(input: NewCommunityPost): Promise<CommunityPost>;
  /** Uploads one local photo and returns its public URL. */
  uploadPhoto(uri: string): Promise<string>;
}
