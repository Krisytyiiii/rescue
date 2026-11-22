import { useRouter } from "expo-router";
import type { ReactNode } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "@/components/back-button";
import { ChatIcon, PersonIcon } from "@/components/icons";
import { Skeleton } from "@/components/skeleton";
import { Brand, FontFamily } from "@/constants/theme";
import { REPORT_STATUS_META } from "@/domain/report-map";
import type {
  MyReport,
  ReportAssignmentInfo,
  ReportTimelineEvent,
} from "@/domain/report-submission";

import {
  ASSIGNMENT_STATUS_LABEL,
  formatReportDate,
  formatReportDateTime,
  REPORT_TYPE_LABEL,
  reportTimeline,
  SPECIES_LABEL,
  URGENCY_LABEL,
} from "./presentation";
import { useReportDetailViewModel } from "./useReportDetailViewModel";

/** Full case file for one resident report, with live status and contact. */
export function ReportDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { report, loading, error, reload } = useReportDetailViewModel(id);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/report");
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <View style={styles.header}>
          <BackButton onPress={goBack} label="Back to my reports" />
          <View style={styles.headerTitles}>
            <Text style={styles.headerLabel}>Case file</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {report?.reportCode ?? "Report"}
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {loading && !report ? (
            <DetailSkeleton />
          ) : error && !report ? (
            <View style={styles.statusCard}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void reload()}
                style={({ pressed }) => [
                  styles.retry,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : report ? (
            <ReportBody
              report={report}
              onMessage={(rescuerId, rescuerName) =>
                router.push({
                  pathname: "/chat/[userId]",
                  params: {
                    userId: rescuerId,
                    name: rescuerName,
                    role: "rescuer",
                  },
                })
              }
            />
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ReportBody({
  report,
  onMessage,
}: {
  report: MyReport;
  onMessage: (rescuerId: string, rescuerName: string) => void;
}) {
  const status = REPORT_STATUS_META[report.status];
  const timeline = reportTimeline(report);
  const place = [report.barangay, report.locationLandmark]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <View style={[styles.statusBanner, { backgroundColor: `${status.pin}14` }]}>
        <View style={[styles.statusDot, { backgroundColor: status.pin }]} />
        <View style={styles.statusBody}>
          <Text style={[styles.statusLabel, { color: status.pin }]}>
            {status.label}
          </Text>
          <Text style={styles.statusMeta}>
            {report.latestUpdate
              ? `Updated ${formatReportDate(report.latestUpdate.changedAt)}`
              : `Submitted ${formatReportDate(report.submittedAt)}`}
          </Text>
        </View>
      </View>

      {report.media.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photoRow}
        >
          {report.media.map((item) => (
            <Image
              key={item.fileUrl}
              source={{ uri: item.fileUrl }}
              style={styles.photo}
            />
          ))}
        </ScrollView>
      ) : null}

      <Section title="What you reported">
        <Text style={styles.description}>{report.description}</Text>
        <View style={styles.factGrid}>
          <Fact label="Type" value={REPORT_TYPE_LABEL[report.reportType]} />
          <Fact label="Species" value={SPECIES_LABEL[report.species]} />
          <Fact label="Urgency" value={URGENCY_LABEL[report.urgencyLevel]} />
          <Fact
            label="Animals"
            value={`${report.animalCount} ${report.animalCount === 1 ? "animal" : "animals"}`}
          />
        </View>
      </Section>

      <Section title="Location">
        <Text style={styles.bodyText}>{place || "No location recorded"}</Text>
        <Text style={styles.coords}>
          {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
        </Text>
      </Section>

      <Section title="Verification">
        {report.verifier ? (
          <View style={styles.personRow}>
            <View style={styles.personIcon}>
              <PersonIcon size={15} color={Brand.moss} />
            </View>
            <View style={styles.personBody}>
              <Text style={styles.personName}>{report.verifier.name}</Text>
              <Text style={styles.personMeta}>
                Verified{" "}
                {report.verifiedAt
                  ? formatReportDateTime(report.verifiedAt)
                  : "by the City Vet team"}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.bodyText}>
            Waiting for the City Vet team to verify this report.
          </Text>
        )}
      </Section>

      <AssignmentCard assignment={report.assignment} onMessage={onMessage} />

      <Section title="Case timeline" meta={`${timeline.length} updates`}>
        <View style={styles.timeline}>
          {timeline.map((event, index) => (
            <TimelineRow
              key={`${event.status}-${event.changedAt}`}
              event={event}
              last={index === timeline.length - 1}
            />
          ))}
        </View>
      </Section>
    </>
  );
}

function AssignmentCard({
  assignment,
  onMessage,
}: {
  assignment: ReportAssignmentInfo | null;
  onMessage: (rescuerId: string, rescuerName: string) => void;
}) {
  if (!assignment) {
    return (
      <Section title="Rescue team">
        <Text style={styles.bodyText}>
          No rescuer assigned yet. You'll see their name and updates here once
          the City Vet dispatches someone.
        </Text>
      </Section>
    );
  }

  const rescuer = assignment.rescuer;

  return (
    <Section title="Rescue team">
      <View style={styles.assignment}>
        <View style={styles.personRow}>
          <View style={styles.personIcon}>
            <PersonIcon size={15} color={Brand.moss} />
          </View>
          <View style={styles.personBody}>
            <Text style={styles.personName}>
              {rescuer?.name ?? "Rescuer assigned"}
            </Text>
            <Text style={styles.personMeta}>
              {ASSIGNMENT_STATUS_LABEL[assignment.status]} · Assigned{" "}
              {formatReportDate(assignment.assignedAt)}
            </Text>
          </View>
        </View>

        {rescuer ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Message ${rescuer.name}`}
            onPress={() => onMessage(rescuer.id, rescuer.name)}
            style={({ pressed }) => [
              styles.messageButton,
              pressed && styles.pressed,
            ]}
          >
            <ChatIcon size={15} color={Brand.paper} />
            <Text style={styles.messageText}>Message {rescuer.name}</Text>
          </Pressable>
        ) : null}

        <View style={styles.assignmentTimes}>
          {assignment.acceptedAt ? (
            <Fact
              label="Accepted"
              value={formatReportDate(assignment.acceptedAt)}
            />
          ) : null}
          {assignment.arrivedAt ? (
            <Fact label="On site" value={formatReportDate(assignment.arrivedAt)} />
          ) : null}
          {assignment.completedAt ? (
            <Fact
              label="Completed"
              value={formatReportDate(assignment.completedAt)}
            />
          ) : null}
          {assignment.animalsRescued != null ? (
            <Fact
              label="Animals rescued"
              value={`${assignment.animalsRescued}`}
            />
          ) : null}
        </View>

        {assignment.outcomeNotes ? (
          <View style={styles.outcome}>
            <Text style={styles.outcomeLabel}>Rescuer notes</Text>
            <Text style={styles.outcomeBody}>{assignment.outcomeNotes}</Text>
          </View>
        ) : null}
      </View>
    </Section>
  );
}

function TimelineRow({
  event,
  last,
}: {
  event: ReportTimelineEvent;
  last: boolean;
}) {
  const meta = REPORT_STATUS_META[event.status];

  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineRail}>
        <View style={[styles.timelineDot, { backgroundColor: meta.pin }]} />
        {!last ? <View style={styles.timelineLine} /> : null}
      </View>
      <View style={styles.timelineBody}>
        <Text style={styles.timelineTitle}>{meta.label}</Text>
        <Text style={styles.timelineMeta}>
          {formatReportDateTime(event.changedAt)}
          {event.changedBy ? ` · ${event.changedBy.name}` : ""}
        </Text>
        {event.remarks ? (
          <Text style={styles.timelineRemarks}>{event.remarks}</Text>
        ) : null}
      </View>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

function Section({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: ReactNode;
}) {  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {meta ? <Text style={styles.sectionMeta}>{meta}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function DetailSkeleton() {
  return (
    <>
      <Skeleton height={64} borderRadius={18} />
      <Skeleton height={132} borderRadius={16} style={styles.skeletonSection} />
      <View style={styles.skeletonSection}>
        <Skeleton width={104} height={10} borderRadius={5} />
        <Skeleton height={58} borderRadius={14} style={styles.skeletonBlock} />
      </View>
      <View style={styles.skeletonSection}>
        <Skeleton width={78} height={10} borderRadius={5} />
        <Skeleton height={64} borderRadius={14} style={styles.skeletonBlock} />
      </View>
      <View style={styles.skeletonSection}>
        <Skeleton width={96} height={10} borderRadius={5} />
        <Skeleton height={150} borderRadius={14} style={styles.skeletonBlock} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.paper2 },
  flex: { flex: 1 },
  header: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTitles: { flex: 1 },
  headerLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: Brand.clay,
  },
  headerTitle: {
    marginTop: 1,
    fontFamily: FontFamily.display,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.6,
    color: Brand.ink,
  },
  content: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 120,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  statusDot: { width: 9, height: 9, borderRadius: 5 },
  statusBody: { flex: 1 },
  statusLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
  },
  statusMeta: {
    marginTop: 2,
    fontFamily: FontFamily.sans,
    fontSize: 11,
    color: Brand.ink55,
  },
  photoRow: { gap: 8, marginTop: 12 },
  photo: {
    width: 116,
    height: 89,
    borderRadius: 14,
    backgroundColor: Brand.sand,
  },
  section: { marginTop: 22 },
  sectionHead: {
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: Brand.ink,
  },
  sectionMeta: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  description: {
    fontFamily: FontFamily.medium,
    fontSize: 14.5,
    lineHeight: 21,
    color: Brand.ink,
  },
  factGrid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  fact: {
    minWidth: 108,
    flexGrow: 1,
    borderRadius: 12,
    backgroundColor: Brand.paper,
    borderWidth: 1,
    borderColor: Brand.line,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  factLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  factValue: {
    marginTop: 3,
    fontFamily: FontFamily.medium,
    fontSize: 12.5,
    color: Brand.ink,
  },
  bodyText: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    lineHeight: 19,
    color: Brand.ink70,
  },
  coords: {
    marginTop: 4,
    fontFamily: FontFamily.sans,
    fontSize: 10.5,
    color: Brand.ink55,
  },
  personRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  personIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(31,122,77,0.10)",
  },
  personBody: { flex: 1 },
  personName: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: Brand.ink,
  },
  personMeta: {
    marginTop: 2,
    fontFamily: FontFamily.sans,
    fontSize: 11,
    color: Brand.ink55,
  },
  assignment: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    padding: 14,
    gap: 12,
  },
  messageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    height: 42,
    borderRadius: 999,
    backgroundColor: Brand.forest,
  },
  messageText: {
    fontFamily: FontFamily.medium,
    fontSize: 12.5,
    color: Brand.paper,
  },
  assignmentTimes: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  outcome: {
    borderRadius: 12,
    backgroundColor: Brand.paper2,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  outcomeLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  outcomeBody: {
    marginTop: 3,
    fontFamily: FontFamily.sans,
    fontSize: 12,
    lineHeight: 17,
    color: Brand.ink70,
  },
  timeline: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    padding: 14,
  },
  timelineRow: { flexDirection: "row", gap: 11 },
  timelineRail: { width: 10, alignItems: "center" },
  timelineDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginTop: 3,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 3,
    backgroundColor: "rgba(16,36,26,0.10)",
  },
  timelineBody: { flex: 1, paddingBottom: 14 },
  timelineTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 12.5,
    color: Brand.ink,
  },
  timelineMeta: {
    marginTop: 2,
    fontFamily: FontFamily.sans,
    fontSize: 10.5,
    color: Brand.ink55,
  },
  timelineRemarks: {
    marginTop: 5,
    fontFamily: FontFamily.sans,
    fontSize: 12,
    lineHeight: 17,
    color: Brand.ink70,
  },
  statusCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    padding: 14,
    gap: 10,
  },
  errorText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: "#B4462F",
  },
  retry: {
    alignSelf: "flex-start",
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
  skeletonSection: { marginTop: 22 },
  skeletonBlock: { marginTop: 10 },
  pressed: { opacity: 0.7 },
});
