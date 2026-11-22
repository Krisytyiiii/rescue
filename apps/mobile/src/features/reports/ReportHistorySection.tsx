import { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Skeleton } from "@/components/skeleton";
import { Brand, FontFamily } from "@/constants/theme";
import { REPORT_STATUS_META } from "@/domain/report-map";
import type { MyReport } from "@/domain/report-submission";

import {
  formatReportDate,
  REPORT_TYPE_LABEL,
  SPECIES_LABEL,
  URGENCY_LABEL,
} from "./presentation";

const COLLAPSED_COUNT = 3;

interface ReportHistorySectionProps {
  reports: MyReport[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  /** Hide the inline heading when the parent screen already has a title. */
  showHeading?: boolean;
  /** Start with every report visible instead of the three most recent. */
  defaultExpanded?: boolean;
}

/**
 * Read-only history of the resident's own reports with their live status.
 * Purely presentational: the view-model owns loading and refreshing.
 */
export function ReportHistorySection({
  reports,
  loading,
  error,
  onRetry,
  showHeading = true,
  defaultExpanded = false,
}: ReportHistorySectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const visible = expanded ? reports : reports.slice(0, COLLAPSED_COUNT);

  return (
    <View style={showHeading ? styles.section : styles.sectionPlain}>
      {showHeading ? (
        <View style={styles.header}>
          <Text style={styles.heading}>Your reports</Text>
          {reports.length > 0 ? (
            <Text style={styles.count}>{reports.length}</Text>
          ) : null}
        </View>
      ) : null}

      {loading && reports.length === 0
        ? [0, 1, 2].map((index) => <ReportCardSkeleton key={index} />)
        : null}

      {error ? (
        <View style={styles.statusCard}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onRetry}
            style={({ pressed }) => [
              styles.retry,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {!loading && !error && reports.length === 0 ? (
        <View style={styles.statusCard}>
          <Text style={styles.emptyTitle}>No reports yet</Text>
          <Text style={styles.statusText}>
            Reports you send will appear here with their status, from submission
            to rescue.
          </Text>
        </View>
      ) : null}

      {visible.map((report) => (
        <ReportCard key={report.id} report={report} />
      ))}

      {reports.length > COLLAPSED_COUNT ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setExpanded((current) => !current)}
          style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
        >
          <Text style={styles.toggleText}>
            {expanded
              ? "Show less"
              : `Show all ${reports.length} reports`}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ReportCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Skeleton width={42} height={42} borderRadius={11} />
        <View style={styles.cardIdentity}>
          <Skeleton width="52%" height={12} borderRadius={6} />
          <Skeleton
            width="74%"
            height={9}
            borderRadius={4}
            style={styles.skeletonGap}
          />
        </View>
        <Skeleton width={72} height={22} borderRadius={999} />
      </View>
      <Skeleton
        width="56%"
        height={9}
        borderRadius={4}
        style={styles.skeletonDate}
      />
      <Skeleton
        width="40%"
        height={9}
        borderRadius={4}
        style={styles.skeletonGap}
      />
    </View>
  );
}

function ReportCard({ report }: { report: MyReport }) {
  const status = REPORT_STATUS_META[report.status];
  const thumbnail = report.media[0]?.fileUrl ?? null;
  const place = report.barangay ?? report.locationLandmark;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
        ) : null}
        <View style={styles.cardIdentity}>
          <Text style={styles.cardCode}>{report.reportCode}</Text>
          <Text style={styles.cardMeta}>
            {REPORT_TYPE_LABEL[report.reportType]} ·{" "}
            {SPECIES_LABEL[report.species]} ·{" "}
            {URGENCY_LABEL[report.urgencyLevel]} urgency
          </Text>
        </View>
        <View
          style={[styles.pill, { backgroundColor: `${status.pin}1A` }]}
        >
          <View style={[styles.dot, { backgroundColor: status.pin }]} />
          <Text style={[styles.pillText, { color: status.pin }]}>
            {status.label}
          </Text>
        </View>
      </View>

      <Text style={styles.cardDate}>
        Submitted {formatReportDate(report.submittedAt)}
      </Text>

      {place ? <Text style={styles.cardPlace}>{place}</Text> : null}

      {report.latestUpdate ? (
        <View style={styles.update}>
          <Text style={styles.updateTitle}>
            Latest update ·{" "}
            {REPORT_STATUS_META[report.latestUpdate.status].label} ·{" "}
            {formatReportDate(report.latestUpdate.changedAt)}
          </Text>
          {report.latestUpdate.remarks ? (
            <Text style={styles.updateBody}>
              {report.latestUpdate.remarks}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 24 },
  sectionPlain: { marginTop: 12 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 9,
  },
  heading: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  count: {
    minWidth: 22,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    textAlign: "center",
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: Brand.forest,
    backgroundColor: "rgba(31,122,77,0.10)",
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  statusText: {
    flexShrink: 1,
    fontFamily: FontFamily.sans,
    fontSize: 12,
    lineHeight: 17,
    color: Brand.ink55,
  },
  emptyTitle: {
    width: "100%",
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: Brand.ink,
  },
  errorText: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: "#B4462F",
  },
  retry: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(31,122,77,0.10)",
  },
  retryText: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: Brand.forest,
  },
  card: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    padding: 13,
  },
  skeletonGap: { marginTop: 6 },
  skeletonDate: { marginTop: 10 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  thumbnail: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: Brand.sand,
  },
  cardIdentity: { flex: 1 },
  cardCode: {
    fontFamily: FontFamily.medium,
    fontSize: 13.5,
    color: Brand.ink,
  },
  cardMeta: {
    marginTop: 2,
    fontFamily: FontFamily.sans,
    fontSize: 11.5,
    color: Brand.ink55,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  dot: { width: 5, height: 5, borderRadius: 3 },
  pillText: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
  },
  cardDate: {
    marginTop: 9,
    fontFamily: FontFamily.sans,
    fontSize: 11,
    color: Brand.ink55,
  },
  cardPlace: {
    marginTop: 3,
    fontFamily: FontFamily.sans,
    fontSize: 11.5,
    color: Brand.ink70,
  },
  update: {
    marginTop: 9,
    borderRadius: 11,
    backgroundColor: Brand.paper2,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  updateTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: Brand.ink70,
  },
  updateBody: {
    marginTop: 3,
    fontFamily: FontFamily.sans,
    fontSize: 11.5,
    lineHeight: 16,
    color: Brand.ink55,
  },
  toggle: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(31,122,77,0.10)",
  },
  toggleText: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: Brand.forest,
  },
  pressed: { opacity: 0.7 },
});
