export interface AdminModuleMeta {
  slug: string;
  title: string;
  group: string;
  description: string;
  features: string[];
}

/** Sidebar order and placeholder content for modules still being built out. */
export const ADMIN_MODULES: Record<string, AdminModuleMeta> = {
  reports: {
    slug: "reports",
    title: "Community reports",
    group: "Operations",
    description:
      "Verify incoming stray, injured, and abandoned animal reports, flag duplicates, and assign them to field rescuers.",
    features: [
      "Map and table views of new reports",
      "Duplicate detection within 50 m / 24 h",
      "Verification, rejection, and rescuer assignment",
      "Status history for every report",
    ],
  },
  rescues: {
    slug: "rescues",
    title: "Rescue operations",
    group: "Operations",
    description:
      "Track assignments on the ground, from dispatch to intake, with field notes and outcome records.",
    features: [
      "Rescuer workload and availability",
      "Assignment timeline and field updates",
      "Intake hand-off into animal profiles",
      "Overdue and unassigned case alerts",
    ],
  },
  animals: {
    slug: "animals",
    title: "Animals",
    group: "Operations",
    description:
      "Manage animal profiles, media, lifecycle state, and public listing moderation.",
    features: [
      "Intake records and human-readable animal codes",
      "Photo and video management",
      "Listing review and publish controls",
      "Lifecycle transitions from rescued to adopted",
    ],
  },
  health: {
    slug: "health",
    title: "Health records",
    group: "Welfare",
    description:
      "Medical visits, vaccinations, and heart-rate logs for every animal under care.",
    features: [
      "Checkups, illness, injury, and surgery records",
      "Vaccination schedules with due reminders",
      "Abnormal heart-rate flagging",
      "Veterinarian notes and attachments",
    ],
  },
  adoptions: {
    slug: "adoptions",
    title: "Adoptions",
    group: "Welfare",
    description:
      "Review applications, conduct interviews, approve one adopter per animal, and schedule follow-ups.",
    features: [
      "Application review and interview notes",
      "One approved adopter per animal",
      "Automatic closure of other applications",
      "Post-adoption welfare checks",
    ],
  },
  users: {
    slug: "users",
    title: "Users & access",
    group: "Community",
    description:
      "Approve rescuer applications, manage roles, and handle account status and suspensions.",
    features: [
      "Pending rescuer approval queue",
      "Role and account status management",
      "Duplicate-email and audit checks",
      "Access history per account",
    ],
  },
  messaging: {
    slug: "messaging",
    title: "Messaging",
    group: "Community",
    description:
      "Coordinate with residents and rescuers through report and adoption-linked conversations.",
    features: [
      "Conversations linked to reports or applications",
      "Participant read receipts",
      "Admin moderation controls",
      "Notification fan-out",
    ],
  },
  learning: {
    slug: "learning",
    title: "E-learning",
    group: "Community",
    description:
      "Publish responsible ownership and animal welfare modules with lesson files and thumbnails.",
    features: [
      "Module and lesson authoring",
      "File and thumbnail uploads",
      "Per-user progress tracking",
      "Learner completion reports",
    ],
  },
  community: {
    slug: "community",
    title: "Community feed",
    group: "Community",
    description:
      "Resident-posted adoption animals. Read-only moderation: hide posts that break community guidelines.",
    features: [
      "Resident adoption posts with photos",
      "Read-only review for admins",
      "Hide or restore harmful posts",
      "Report queue and moderation audit",
    ],
  },
  analytics: {
    slug: "analytics",
    title: "Analytics",
    group: "Insights",
    description:
      "Citywide and per-barangay trends for reports, rescues, adoptions, and health outcomes.",
    features: [
      "Nightly aggregate snapshots",
      "Barangay comparisons and maps",
      "Exportable PDF, Excel, and CSV reports",
      "Adoption and rescue conversion rates",
    ],
  },
  audit: {
    slug: "audit",
    title: "Audit logs",
    group: "Insights",
    description:
      "Read-only trail of every administrative action, who performed it, and what changed.",
    features: [
      "Append-only action history",
      "Before and after values",
      "Filter by actor, entity, or date",
      "Export for compliance reviews",
    ],
  },
  settings: {
    slug: "settings",
    title: "Settings",
    group: "System",
    description:
      "Barangay reference data, notification defaults, upload limits, and system configuration.",
    features: [
      "Barangay reference management",
      "Notification and reminder defaults",
      "Media upload limits",
      "Environment and integration status",
    ],
  },
};
