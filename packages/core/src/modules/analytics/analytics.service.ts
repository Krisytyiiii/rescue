import type { Actor } from "../../shared/types.ts";
import { requireRole } from "../../shared/authz.ts";
import {
  analyticsRepository,
  type AnalyticsRepository,
} from "./analytics.repository.ts";
import type {
  AnalyticsDashboardDto,
  AnalyticsDelta,
  AnalyticsFilters,
  AnalyticsRange,
  AnalyticsSlice,
  AnalyticsSpeciesFilter,
  CreateGeneratedReportInput,
  GeneratedReportDto,
} from "./analytics.types.ts";

const DAY = 24 * 60 * 60 * 1000;
const ADOPTED = new Set(["approved", "completed"]);
const REJECTED = new Set(["rejected", "withdrawn"]);
const OPEN_REPORTS = new Set(["submitted", "verified", "assigned", "in_progress"]);
const RESOLVED_RESCUE = new Set(["rescued"]);

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function resolveRange(range: AnalyticsRange, now = new Date()) {
  const to = new Date(now);
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);

  if (range === "7d") from.setDate(from.getDate() - 6);
  else if (range === "30d") from.setDate(from.getDate() - 29);
  else if (range === "90d") from.setDate(from.getDate() - 89);
  else if (range === "12m") {
    from.setMonth(from.getMonth() - 11);
    from.setDate(1);
  } else {
    from.setFullYear(2020, 0, 1);
  }

  return { from, to };
}

function previousRange(from: Date, to: Date) {
  const span = to.getTime() - from.getTime();
  return { from: new Date(from.getTime() - span - 1), to: new Date(from.getTime() - 1) };
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function round(value: number, digits = 0): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function hoursBetween(start: Date | null, end: Date | null): number | null {
  if (!start || !end) return null;
  const diff = end.getTime() - start.getTime();
  if (diff < 0) return null;
  return diff / (60 * 60 * 1000);
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

const dayFormatter = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" });
const monthFormatter = new Intl.DateTimeFormat("en-PH", { month: "short", year: "2-digit" });

function buildBuckets(from: Date, to: Date, monthly: boolean) {
  const buckets: Array<{ key: string; label: string; fullLabel: string; date: Date }> = [];
  if (monthly) {
    const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
    while (cursor <= to) {
      buckets.push({
        key: monthKey(cursor),
        label: monthFormatter.format(cursor),
        fullLabel: monthFormatter.format(cursor),
        date: new Date(cursor),
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  } else {
    const cursor = new Date(from);
    while (cursor <= to) {
      buckets.push({
        key: dayKey(cursor),
        label: dayFormatter.format(cursor),
        fullLabel: dayFormatter.format(cursor),
        date: new Date(cursor),
      });
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  return buckets;
}

function delta(current: number, previous: number): AnalyticsDelta {
  return { current: round(current, 1), previous: round(previous, 1), change: round(current - previous, 1) };
}

function nameOf(person: { firstName: string; lastName: string }): string {
  return `${person.firstName} ${person.lastName}`.trim();
}

function slicesFromCounts(counts: Record<string, number>, labels: Record<string, string>): AnalyticsSlice[] {
  return Object.entries(counts).map(([key, value]) => ({
    label: labels[key] ?? key,
    value,
  }));
}

interface Computed {
  reports: Awaited<ReturnType<AnalyticsRepository["reports"]>>;
  rescues: Awaited<ReturnType<AnalyticsRepository["rescues"]>>;
  adoptions: Awaited<ReturnType<AnalyticsRepository["adoptions"]>>;
  followups: Awaited<ReturnType<AnalyticsRepository["followups"]>>;
}

export class AnalyticsService {
  constructor(private readonly repo: AnalyticsRepository = analyticsRepository) {}

  private async fetchData(filters: AnalyticsFilters): Promise<Computed> {
    const [reports, rescues, adoptions, followups] = await Promise.all([
      this.repo.reports(filters),
      this.repo.rescues(filters),
      this.repo.adoptions(filters),
      this.repo.followups(filters),
    ]);
    return { reports, rescues, adoptions, followups };
  }

  private overview(data: Computed, filters: AnalyticsFilters) {
    const { reports, rescues, adoptions } = data;
    const adopted = adoptions.filter(
      (row) => ADOPTED.has(row.status) || row.releaseDate != null,
    );
    const adoptionDays = adopted
      .map((row) => {
        const end = row.releaseDate ?? row.reviewedAt;
        if (!end) return null;
        return (end.getTime() - row.createdAt.getTime()) / DAY;
      })
      .filter((value): value is number => value != null && value >= 0);

    const responses = rescues
      .map((row) => hoursBetween(row.report.submittedAt, row.arrivedAt))
      .filter((value): value is number => value != null);

    const completed = rescues.filter(
      (row) => row.assignmentStatus === "completed" || row.completedAt != null,
    ).length;

    return {
      reportsReceived: reports.length,
      rescueSuccessRate: rescues.length > 0 ? round((completed / rescues.length) * 100) : 0,
      animalsAdopted: adopted.length,
      medianAdoptionDays: round(median(adoptionDays), 1),
      avgResponseHours: round(mean(responses), 1),
      activeBarangays: new Set(
        reports.map((row) => row.barangayId).filter((id): id is number => id != null),
      ).size,
      activity: this.activitySeries(data, filters),
    };
  }

  private activitySeries(data: Computed, filters: AnalyticsFilters) {
    const monthly = filters.to.getTime() - filters.from.getTime() > 120 * DAY;
    const buckets = buildBuckets(filters.from, filters.to, monthly);
    const index = new Map(buckets.map((bucket, position) => [bucket.key, position]));
    const reports = buckets.map(() => 0);
    const adoptions = buckets.map(() => 0);

    for (const report of data.reports) {
      const key = monthly ? monthKey(report.submittedAt) : dayKey(report.submittedAt);
      const position = index.get(key);
      if (position !== undefined) reports[position] += 1;
    }
    for (const request of data.adoptions) {
      if (!ADOPTED.has(request.status) && request.releaseDate == null) continue;
      const when = request.releaseDate ?? request.reviewedAt ?? request.createdAt;
      const key = monthly ? monthKey(when) : dayKey(when);
      const position = index.get(key);
      if (position !== undefined) adoptions[position] += 1;
    }

    return buckets.map((bucket, position) => ({
      label: bucket.label,
      fullLabel: bucket.fullLabel,
      reports: reports[position],
      adoptions: adoptions[position],
    }));
  }

  private adoptionTrends(data: Computed, filters: AnalyticsFilters) {
    const monthly = filters.to.getTime() - filters.from.getTime() > 120 * DAY;
    const buckets = buildBuckets(filters.from, filters.to, monthly);
    const index = new Map(buckets.map((bucket, position) => [bucket.key, position]));
    const submitted = buckets.map(() => 0);
    const approved = buckets.map(() => 0);
    const rejected = buckets.map(() => 0);

    for (const request of data.adoptions) {
      const key = monthly ? monthKey(request.createdAt) : dayKey(request.createdAt);
      const position = index.get(key);
      if (position === undefined) continue;
      submitted[position] += 1;
      if (ADOPTED.has(request.status) || request.releaseDate != null) approved[position] += 1;
      if (REJECTED.has(request.status)) rejected[position] += 1;
    }

    const ranks = ["submitted", "under_review", "interview_scheduled", "approved", "completed"];
    const funnel = ranks.map((status, position) => ({
      label: status.replace(/_/g, " "),
      value: data.adoptions.filter((row) => {
        if (REJECTED.has(row.status)) return false;
        return ranks.indexOf(row.status) >= position || row.releaseDate != null;
      }).length,
    }));

    const bucketsDays = [
      { label: "0–7d", min: 0, max: 7 },
      { label: "8–14d", min: 7, max: 14 },
      { label: "15–30d", min: 14, max: 30 },
      { label: "31–60d", min: 30, max: 60 },
      { label: "60d+", min: 60, max: Infinity },
    ];
    const adoptionDays = data.adoptions
      .filter((row) => ADOPTED.has(row.status) || row.releaseDate != null)
      .map((row) => {
        const end = row.releaseDate ?? row.reviewedAt;
        return end ? (end.getTime() - row.createdAt.getTime()) / DAY : null;
      })
      .filter((value): value is number => value != null && value >= 0);

    const bySpeciesCount = { dog: 0, cat: 0 };
    for (const request of data.adoptions) {
      if (!ADOPTED.has(request.status) && request.releaseDate == null) continue;
      bySpeciesCount[request.animal.species] += 1;
    }

    const released = data.adoptions.filter(
      (row) => ADOPTED.has(row.status) || row.releaseDate != null,
    );
    const releasedIds = new Set(released.map((row) => row.id));
    const followupRequests = new Set(
      data.followups
        .map((row) => row.requestId)
        .filter((id) => releasedIds.has(id)),
    );

    const byBarangay = new Map<
      string,
      { applications: number; approved: number; days: number[] }
    >();
    for (const request of data.adoptions) {
      const name = request.adopter.barangay?.name ?? "Unspecified";
      const entry = byBarangay.get(name) ?? { applications: 0, approved: 0, days: [] };
      entry.applications += 1;
      if (ADOPTED.has(request.status) || request.releaseDate != null) {
        entry.approved += 1;
        const end = request.releaseDate ?? request.reviewedAt;
        if (end) entry.days.push((end.getTime() - request.createdAt.getTime()) / DAY);
      }
      byBarangay.set(name, entry);
    }

    return {
      series: buckets.map((bucket, position) => ({
        label: bucket.label,
        fullLabel: bucket.fullLabel,
        submitted: submitted[position],
        approved: approved[position],
        rejected: rejected[position],
      })),
      funnel,
      timeToAdoption: bucketsDays.map((bucket) => ({
        label: bucket.label,
        value: adoptionDays.filter((days) => days >= bucket.min && days < bucket.max).length,
      })),
      bySpecies: [
        { label: "Dogs", value: bySpeciesCount.dog },
        { label: "Cats", value: bySpeciesCount.cat },
      ],
      followups: {
        released: released.length,
        withFollowup: followupRequests.size,
        avgFollowups: released.length > 0 ? round(data.followups.length / released.length, 1) : 0,
      },
      barangayTable: Array.from(byBarangay.entries())
        .map(([barangay, entry]) => ({
          barangay,
          applications: entry.applications,
          approved: entry.approved,
          approvalRate:
            entry.applications > 0 ? round((entry.approved / entry.applications) * 100) : 0,
          medianDays: round(median(entry.days), 1),
        }))
        .sort((a, b) => b.applications - a.applications),
    };
  }

  private rescueEfficiency(data: Computed, filters: AnalyticsFilters) {
    const { reports, rescues } = data;

    const countStatus = (statuses: string[]) =>
      reports.filter((row) => statuses.includes(row.status)).length;
    const funnel = [
      { label: "Submitted", value: reports.length },
      { label: "Verified", value: countStatus(["verified", "assigned", "in_progress", "rescued"]) },
      { label: "Assigned", value: countStatus(["assigned", "in_progress", "rescued"]) },
      { label: "In progress", value: countStatus(["in_progress", "rescued"]) },
      { label: "Rescued", value: countStatus(["rescued"]) },
    ];

    const durationRows = [
      {
        label: "Verification",
        values: reports
          .map((row) => hoursBetween(row.submittedAt, row.verifiedAt))
          .filter((value): value is number => value != null),
      },
      {
        label: "Dispatch",
        values: rescues
          .map((row) => hoursBetween(row.report.verifiedAt, row.assignedAt))
          .filter((value): value is number => value != null),
      },
      {
        label: "Travel",
        values: rescues
          .map((row) => hoursBetween(row.assignedAt, row.arrivedAt))
          .filter((value): value is number => value != null),
      },
      {
        label: "Field time",
        values: rescues
          .map((row) => hoursBetween(row.arrivedAt, row.completedAt))
          .filter((value): value is number => value != null),
      },
      {
        label: "Total resolution",
        values: rescues
          .map((row) => hoursBetween(row.report.submittedAt, row.completedAt))
          .filter((value): value is number => value != null),
      },
    ].map((row) => ({
      label: row.label,
      meanHours: round(mean(row.values), 1),
      medianHours: round(median(row.values), 1),
    }));

    const monthly = filters.to.getTime() - filters.from.getTime() > 120 * DAY;
    const buckets = buildBuckets(filters.from, filters.to, monthly);
    const index = new Map(buckets.map((bucket, position) => [bucket.key, position]));
    const resolved = buckets.map(() => 0);
    const completed = buckets.map(() => 0);

    for (const report of reports) {
      if (!RESOLVED_RESCUE.has(report.status)) continue;
      const key = monthly ? monthKey(report.submittedAt) : dayKey(report.submittedAt);
      const position = index.get(key);
      if (position !== undefined) resolved[position] += 1;
    }
    for (const rescue of rescues) {
      if (rescue.completedAt == null) continue;
      const key = monthly ? monthKey(rescue.completedAt) : dayKey(rescue.completedAt);
      const position = index.get(key);
      if (position !== undefined) completed[position] += 1;
    }

    const outcomes = slicesFromCounts(
      {
        rescued: countStatus(["rescued"]),
        unable_to_locate: countStatus(["unable_to_locate"]),
        rejected: countStatus(["rejected"]),
        open: countStatus(["submitted", "verified", "assigned", "in_progress"]),
      },
      {
        rescued: "Rescued",
        unable_to_locate: "Unable to locate",
        rejected: "Rejected",
        open: "Still open",
      },
    ).filter((slice) => slice.value > 0);

    const workload = new Map<string, { assignments: number; completed: number }>();
    for (const rescue of rescues) {
      const name = nameOf(rescue.rescuer) || "Unassigned";
      const entry = workload.get(name) ?? { assignments: 0, completed: 0 };
      entry.assignments += 1;
      if (rescue.assignmentStatus === "completed" || rescue.completedAt != null) {
        entry.completed += 1;
      }
      workload.set(name, entry);
    }

    const byBarangay = new Map<
      string,
      { received: number; rescued: number; open: number; responses: number[] }
    >();
    for (const report of reports) {
      const name = report.barangay?.name ?? "Unspecified";
      const entry = byBarangay.get(name) ?? { received: 0, rescued: 0, open: 0, responses: [] };
      entry.received += 1;
      if (report.status === "rescued") entry.rescued += 1;
      if (OPEN_REPORTS.has(report.status)) entry.open += 1;
      byBarangay.set(name, entry);
    }
    for (const rescue of rescues) {
      const name = rescue.report.barangay?.name ?? "Unspecified";
      const entry = byBarangay.get(name) ?? { received: 0, rescued: 0, open: 0, responses: [] };
      const hours = hoursBetween(rescue.report.submittedAt, rescue.arrivedAt);
      if (hours != null) entry.responses.push(hours);
      byBarangay.set(name, entry);
    }

    return {
      funnel,
      durations: durationRows,
      throughput: buckets.map((bucket, position) => ({
        label: bucket.label,
        fullLabel: bucket.fullLabel,
        resolved: resolved[position],
        completed: completed[position],
      })),
      outcomes,
      workload: Array.from(workload.entries())
        .map(([label, entry]) => ({
          label,
          assignments: entry.assignments,
          completed: entry.completed,
          completionRate:
            entry.assignments > 0
              ? round((entry.completed / entry.assignments) * 100)
              : 0,
        }))
        .sort((a, b) => b.assignments - a.assignments),
      barangayTable: Array.from(byBarangay.entries())
        .map(([barangay, entry]) => ({
          barangay,
          received: entry.received,
          rescued: entry.rescued,
          avgResponseHours: round(mean(entry.responses), 1),
          open: entry.open,
        }))
        .sort((a, b) => b.received - a.received),
    };
  }

  private geography(data: Computed) {
    const byBarangay = new Map<
      number,
      {
        name: string;
        reports: number;
        open: number;
        rescued: number;
        responses: number[];
        lastActivity: Date | null;
      }
    >();

    for (const report of data.reports) {
      if (report.barangayId == null) continue;
      const entry = byBarangay.get(report.barangayId) ?? {
        name: report.barangay?.name ?? "Unspecified",
        reports: 0,
        open: 0,
        rescued: 0,
        responses: [],
        lastActivity: null,
      };
      entry.reports += 1;
      if (OPEN_REPORTS.has(report.status)) entry.open += 1;
      if (report.status === "rescued") entry.rescued += 1;
      if (!entry.lastActivity || report.submittedAt > entry.lastActivity) {
        entry.lastActivity = report.submittedAt;
      }
      byBarangay.set(report.barangayId, entry);
    }

    for (const rescue of data.rescues) {
      const id = rescue.report.barangayId;
      if (id == null) continue;
      const entry = byBarangay.get(id);
      if (!entry) continue;
      const hours = hoursBetween(rescue.report.submittedAt, rescue.arrivedAt);
      if (hours != null) entry.responses.push(hours);
    }

    const adoptedByBarangay = new Map<number, number>();
    for (const request of data.adoptions) {
      if (!ADOPTED.has(request.status) && request.releaseDate == null) continue;
      const id = request.adopter.barangayId;
      if (id == null) continue;
      adoptedByBarangay.set(id, (adoptedByBarangay.get(id) ?? 0) + 1);
    }

    const urgencyCounts: Record<string, number> = {};
    for (const report of data.reports) {
      urgencyCounts[report.urgencyLevel] = (urgencyCounts[report.urgencyLevel] ?? 0) + 1;
    }

    return {
      barangays: Array.from(byBarangay.entries())
        .map(([id, entry]) => ({
          id,
          name: entry.name,
          reports: entry.reports,
          open: entry.open,
          rescued: entry.rescued,
          adopted: adoptedByBarangay.get(id) ?? 0,
          avgResponseHours: round(mean(entry.responses), 1),
          lastActivity: entry.lastActivity ? entry.lastActivity.toISOString() : null,
        }))
        .sort((a, b) => b.reports - a.reports),
      points: data.reports.slice(0, 400).map((report) => ({
        lat: Number(report.latitude),
        lng: Number(report.longitude),
        urgency: report.urgencyLevel,
        status: report.status,
      })),
      urgency: slicesFromCounts(urgencyCounts, {
        low: "Low",
        medium: "Medium",
        high: "High",
        critical: "Critical",
      }),
    };
  }

  private toGeneratedReport(
    row: Awaited<ReturnType<AnalyticsRepository["generatedReports"]>>[number],
  ): GeneratedReportDto {
    return {
      id: row.id,
      kind: row.reportKind,
      dateFrom: row.dateFrom.toISOString(),
      dateTo: row.dateTo.toISOString(),
      format: row.format,
      generatedBy: row.author ? nameOf(row.author) : null,
      fileUrl: row.fileUrl,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async getDashboard(
    input: { range: AnalyticsRange; barangayId?: number; species?: AnalyticsSpeciesFilter },
    actor?: Actor,
  ): Promise<AnalyticsDashboardDto> {
    requireRole(actor, "admin");

    const { from, to } = resolveRange(input.range);
    const species = input.species ?? "all";
    const filters: AnalyticsFilters = {
      range: input.range,
      from,
      to,
      barangayId: input.barangayId,
      species,
    };

    const previous = previousRange(from, to);
    const previousFilters: AnalyticsFilters = { ...filters, from: previous.from, to: previous.to };

    const [current, prior, barangays, generated] = await Promise.all([
      this.fetchData(filters),
      this.fetchData(previousFilters),
      this.repo.listBarangays(),
      this.repo.generatedReports(),
    ]);

    const overview = this.overview(current, filters);
    const priorOverview = this.overview(prior, previousFilters);

    return {
      filters: {
        range: input.range,
        from: from.toISOString(),
        to: to.toISOString(),
        barangayId: input.barangayId ?? null,
        species,
      },
      overview: {
        ...overview,
        deltas: {
          reportsReceived: delta(overview.reportsReceived, priorOverview.reportsReceived),
          rescueSuccessRate: delta(overview.rescueSuccessRate, priorOverview.rescueSuccessRate),
          animalsAdopted: delta(overview.animalsAdopted, priorOverview.animalsAdopted),
          medianAdoptionDays: delta(overview.medianAdoptionDays, priorOverview.medianAdoptionDays),
          avgResponseHours: delta(overview.avgResponseHours, priorOverview.avgResponseHours),
          activeBarangays: delta(overview.activeBarangays, priorOverview.activeBarangays),
        },
      },
      adoptions: this.adoptionTrends(current, filters),
      rescues: this.rescueEfficiency(current, filters),
      geography: this.geography(current),
      generatedReports: generated.map((row) => this.toGeneratedReport(row)),
      barangays,
    };
  }

  async createGeneratedReport(
    input: CreateGeneratedReportInput,
    actor?: Actor,
  ): Promise<GeneratedReportDto> {
    const admin = requireRole(actor, "admin");
    const row = await this.repo.createGeneratedReport({
      reportKind: input.kind,
      dateFrom: input.from,
      dateTo: input.to,
      format: input.format,
      generatedBy: admin.userId,
    });
    return {
      id: row.id,
      kind: row.reportKind,
      dateFrom: row.dateFrom.toISOString(),
      dateTo: row.dateTo.toISOString(),
      format: row.format,
      generatedBy: null,
      fileUrl: row.fileUrl,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async exportCsv(
    tab: "adoptions" | "rescues" | "geography",
    input: { range: AnalyticsRange; barangayId?: number; species?: AnalyticsSpeciesFilter },
    actor?: Actor,
  ): Promise<{ filename: string; content: string }> {
    const dashboard = await this.getDashboard(input, actor);
    const rows: string[][] = [];

    if (tab === "adoptions") {
      rows.push(["Barangay", "Applications", "Approved", "Approval rate %", "Median days"]);
      for (const row of dashboard.adoptions.barangayTable) {
        rows.push([
          row.barangay,
          String(row.applications),
          String(row.approved),
          String(row.approvalRate),
          String(row.medianDays),
        ]);
      }
    } else if (tab === "rescues") {
      rows.push(["Barangay", "Received", "Rescued", "Open", "Avg response hours"]);
      for (const row of dashboard.rescues.barangayTable) {
        rows.push([
          row.barangay,
          String(row.received),
          String(row.rescued),
          String(row.open),
          String(row.avgResponseHours),
        ]);
      }
    } else {
      rows.push(["Barangay", "Reports", "Open", "Rescued", "Adopted", "Avg response hours"]);
      for (const row of dashboard.geography.barangays) {
        rows.push([
          row.name,
          String(row.reports),
          String(row.open),
          String(row.rescued),
          String(row.adopted),
          String(row.avgResponseHours),
        ]);
      }
    }

    const content = rows
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    return { filename: `${tab}-${input.range}.csv`, content };
  }
}

export const analyticsService = new AnalyticsService();
