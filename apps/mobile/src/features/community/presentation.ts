import type {
  CommunityAuthor,
  CommunityPost,
} from "@/domain/community";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const SPECIES_LABEL: Record<CommunityPost["species"], string> = {
  dog: "Dog",
  cat: "Cat",
};

export const BREED_LABEL: Record<string, string> = {
  aspin: "Aspin",
  puspin: "Puspin",
  mixed: "Mixed breed",
  other: "Other",
};

export const SEX_LABEL: Record<string, string> = {
  male: "Male",
  female: "Female",
  unknown: "Sex unknown",
};

export const SIZE_LABEL: Record<string, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

export function postAuthor(author: CommunityAuthor | null): string {
  if (!author) return "Community member";
  return `${author.firstName} ${author.lastName}`.trim() || "Community member";
}

export function postTitle(post: CommunityPost): string {
  return post.name?.trim() || `${SPECIES_LABEL[post.species]} looking for a home`;
}

export function postPhoto(post: CommunityPost): string | null {
  if (post.primaryPhotoUrl) return post.primaryPhotoUrl;
  return post.media.find((item) => item.mediaType === "photo")?.fileUrl ?? null;
}

/** Every photo attached to a post, in the order the resident uploaded them. */
export function postPhotos(post: CommunityPost): string[] {
  const photos = post.media
    .filter((item) => item.mediaType === "photo" && item.fileUrl)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((item) => item.fileUrl);

  if (photos.length > 0) return photos;
  return post.primaryPhotoUrl ? [post.primaryPhotoUrl] : [];
}

export function ageLabel(months: number | null): string {
  if (months === null || months < 0) return "Age unknown";
  if (months < 1) return "Newborn";
  if (months < 12) return `${months} months old`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (rest === 0) return `${years} ${years === 1 ? "year" : "years"} old`;
  return `${years} yr ${rest} mo old`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/** Badge shown on a feed card. Own pending posts are labelled for the author. */
export function postStatus(post: CommunityPost): {
  label: string;
  background: string;
  ink: string;
} {
  switch (post.listingStatus) {
    case "published":
      return {
        label: "Posted",
        background: "rgba(255,255,255,0.94)",
        ink: "#16603B",
      };
    case "rejected":
      return {
        label: "Not approved",
        background: "rgba(255,255,255,0.94)",
        ink: "#B4462F",
      };
    case "draft":
      return {
        label: "Draft",
        background: "rgba(255,255,255,0.94)",
        ink: "#5C5C5C",
      };
    case "archived":
      return {
        label: "Archived",
        background: "rgba(255,255,255,0.94)",
        ink: "#5C5C5C",
      };
    default:
      return {
        label: "Pending review",
        background: "rgba(255,255,255,0.94)",
        ink: "#9A4A0D",
      };
  }
}
