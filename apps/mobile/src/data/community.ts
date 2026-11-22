import type {
  CommunityPhotoUpload,
  CommunityPost,
  NewCommunityPost,
} from "@/domain/community";

/** Port for the resident community adoption feed. */
export interface CommunityDataSource {
  loadFeed(): Promise<CommunityPost[]>;
  createPost(input: NewCommunityPost): Promise<CommunityPost>;
  /** Uploads one local photo and returns its public URL. */
  uploadPhoto(photo: CommunityPhotoUpload): Promise<string>;
  /** The signed-in user, so the feed can mark their own submissions. */
  getCurrentUserId(): Promise<string | null>;
}
