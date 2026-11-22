import type {
  CommunityPost,
  NewCommunityPost,
} from "@/domain/community";

/** Port for the resident community adoption feed. */
export interface CommunityDataSource {
  loadFeed(): Promise<CommunityPost[]>;
  createPost(input: NewCommunityPost): Promise<CommunityPost>;
}
