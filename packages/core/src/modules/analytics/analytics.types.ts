import type {
  GeneratedReportFormat,
  GeneratedReportKind,
} from "../../generated/prisma/enums.ts";

export type AnalyticsRange = "7d" | "30d" | "90d" | "12m" | "all";
export type AnalyticsSpeciesFilter = "all" | "dog" | "cat" | "unknown";

export interface AnalyticsFilters {
  range: AnalyticsRange;
  from: Date;
  to: Date;
  barangayId?: number;
  species: AnalyticsSpeciesFilter;
}

export interface AnalyticsSlice {
  label: string;
  value: number;
  tone?: string;
}

export interface AnalyticsSeriesPoint {
  label: string;
  fullLabel: string;
  reports: number;
  adoptions: number;
}

export interface AnalyticsDelta {
  current: number;
  previous: number;
  change: number;
}

export interface OverviewDto {
  reportsReceived: number;
  rescueSuccessRate: number;
  animalsAdopted: number;
  medianAdoptionDays: number;
  avgResponseHours: number;
  activeBarangays: number;
  deltas: {
    reportsReceived: AnalyticsDelta;
    rescueSuccessRate: AnalyticsDelta;
    animalsAdopted: AnalyticsDelta;
    medianAdoptionDays: AnalyticsDelta;
    avgResponseHours: AnalyticsDelta;
    activeBarangays: AnalyticsDelta;
  };
  activity: AnalyticsSeriesPoint[];
}

export interface AdoptionTrendsDto {
  series: Array<{
    label: string;
    fullLabel: string;
    submitted: number;
    approved: number;
    rejected: number;
  }>;
  funnel: AnalyticsSlice[];
  timeToAdoption: AnalyticsSlice[];
  bySpecies: AnalyticsSlice[];
  followups: {
    released: number;
    withFollowup: number;
    avgFollowups: number;
  };
  barangayTable: Array<{
    barangay: string;
    applications: number;
    approved: number;
    approvalRate: number;
    medianDays: number;
  }>;
}

export interface RescueEfficiencyDto {
  funnel: AnalyticsSlice[];
  durations: Array<{
    label: string;
    meanHours: number;
    medianHours: number;
  }>;
  throughput: Array<{
    label: string;
    fullLabel: string;
    resolved: number;
    completed: number;
  }>;
  outcomes: AnalyticsSlice[];
  workload: Array<{
    label: string;
    assignments: number;
    completed: number;
    completionRate: number;
  }>;
  barangayTable: Array<{
    barangay: string;
    received: number;
    rescued: number;
    avgResponseHours: number;
    open: number;
  }>;
}

export interface GeographyDto {
  barangays: Array<{
    id: number;
    name: string;
    reports: number;
    open: number;
    rescued: number;
    adopted: number;
    avgResponseHours: number;
    lastActivity: string | null;
  }>;
  points: Array<{
    lat: number;
    lng: number;
    urgency: string;
    status: string;
  }>;
  urgency: AnalyticsSlice[];
}

export interface GeneratedReportDto {
  id: string;
  kind: GeneratedReportKind;
  dateFrom: string;
  dateTo: string;
  format: GeneratedReportFormat | null;
  generatedBy: string | null;
  fileUrl: string | null;
  createdAt: string;
}

export interface AnalyticsDashboardDto {
  filters: {
    range: AnalyticsRange;
    from: string;
    to: string;
    barangayId: number | null;
    species: AnalyticsSpeciesFilter;
  };
  overview: OverviewDto;
  adoptions: AdoptionTrendsDto;
  rescues: RescueEfficiencyDto;
  geography: GeographyDto;
  generatedReports: GeneratedReportDto[];
  barangays: Array<{ id: number; name: string }>;
}

export interface CreateGeneratedReportInput {
  kind: GeneratedReportKind;
  format: GeneratedReportFormat;
  from: Date;
  to: Date;
}
