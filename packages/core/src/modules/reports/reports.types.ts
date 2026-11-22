import type { Prisma } from "../../generated/prisma/client.ts";
import type { ReportStatus } from "../../generated/prisma/enums.ts";

/** Allowed lifecycle transitions — enforced by the lifecycle engine. */
export const REPORT_STATUS_TRANSITIONS: Record<ReportStatus, readonly ReportStatus[]> = {
  submitted: ["verified", "rejected"],
  verified: ["assigned", "rejected", "closed"],
  assigned: ["in_progress", "unable_to_locate", "rejected"],
  in_progress: ["rescued", "unable_to_locate"],
  rescued: ["closed"],
  unable_to_locate: ["closed"],
  rejected: [],
  closed: [],
};

/** Statuses that still need rescue work — used by duplicate detection. */
export const ACTIVE_REPORT_STATUSES = [
  "submitted",
  "verified",
  "assigned",
  "in_progress",
] as const satisfies readonly ReportStatus[];

export const reportDetailInclude = {
  reporter: { select: { id: true, firstName: true, lastName: true } },
  verifier: { select: { id: true, firstName: true, lastName: true } },
  barangay: { select: { id: true, name: true } },
  media: { orderBy: { createdAt: "asc" } },
  resultingAnimal: { select: { id: true, animalCode: true, name: true } },
  statusHistory: {
    orderBy: { changedAt: "desc" },
    include: { changer: { select: { id: true, firstName: true, lastName: true } } },
  },
  rescueOperations: {
    orderBy: { assignedAt: "desc" },
    include: { rescuer: { select: { id: true, firstName: true, lastName: true } } },
  },
} satisfies Prisma.ReportInclude;

export type ReportDetail = Prisma.ReportGetPayload<{ include: typeof reportDetailInclude }>;

export interface NearbyReport {
  id: string;
  reportCode: string;
  distanceMeters: number;
  submittedAt: Date;
}

export interface CreateReportInput {
  reportType: "stray" | "injured" | "abandoned";
  species: "dog" | "cat" | "unknown";
  description: string;
  urgencyLevel: "low" | "medium" | "high" | "critical";
  animalCount?: number;
  latitude: number;
  longitude: number;
  barangayId?: number;
  locationLandmark?: string;
  submittedAt?: Date;
  media?: Array<{ mediaType: "photo" | "video"; fileUrl: string; fileSizeKb?: number }>;
}

export interface ListReportsQuery {
  page?: number;
  pageSize?: number;
  status?: ReportStatus;
  reportType?: "stray" | "injured" | "abandoned";
  species?: "dog" | "cat" | "unknown";
  urgencyLevel?: "low" | "medium" | "high" | "critical";
  barangayId?: number;
  /** Internal scope: restrict the list to reports submitted by one user. */
  reporterUserId?: string;
  search?: string;
  from?: Date;
  to?: Date;
  includeDuplicates?: boolean;
}

export interface UpdateReportStatusInput {
  status: ReportStatus;
  remarks?: string;
  rejectionReason?: string;
}

export interface AssignRescuerInput {
  rescuerUserId: string;
  notes?: string;
}
