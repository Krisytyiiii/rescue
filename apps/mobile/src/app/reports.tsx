import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { useCallback } from "react";
import type { ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ArrowUpRightIcon,
  CheckIcon,
  PawIcon,
  ShieldIcon,
} from "@/components/icons";
import { Brand, FontFamily } from "@/constants/theme";
import type { RescuerAssignment, UrgencyLevel } from "@/domain/rescuer";
import type { ReportSegment } from "@/domain/rescuer-reports";
import {
  formatShortDate,
  speciesLabel,
} from "@/features/rescuer/presentation";
import { RescuerScreenHeader } from "@/features/rescuer/RescuerScreenHeader";
import { useRescuerReportsViewModel } from "@/features/rescuer/useRescuerReportsViewModel";

const URGENCY_TONE: Record<UrgencyLevel, string> = {
  critical: "#B4462F",
  high: "#C4791B",
  medium: Brand.clay,
  low: Brand.ink55,
};

const SPECIES_TONE = [Brand.moss, "#6B4FC2", Brand.claySoft];

export default function ReportsScreen() {
  const router = useRouter();
  const { insights, loading, error, reload } = useRescuerReportsViewModel();

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const openAssignment = (id: string) => {
    router.push(`/assignments/${id}` as Href);
  };

  const chartMax = Math.max(
    1,
    ...(insights?.months.map((point) => point.completed + point.failed) ?? []),
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <RescuerScreenHeader
          title="Reports"
          subtitle="All-time performance"
          onBack={() => router.back()}
        />

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {loading && !insights ? (
            <ReportsSkeleton />
          ) : error && !insights ? (
            <Text style={styles.error}>{error}</Text>
          ) : insights ? (
            <>
              <LinearGradient
                colors={["#0B2E1C", "#165B37"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.hero}
              >
                <View style={styles.heroOrb} />
                <View style={styles.heroTop}>
                  <View>
                    <Text style={styles.heroEyebrow}>All-time rescues</Text>
                    <Text style={styles.heroValue}>
                      {insights.totalCompleted}
                    </Text>
                    <Text style={styles.heroCaption}>
                      completed field operations
                    </Text>
                  </View>
                  <View style={styles.heroBadge}>
                    <ShieldIcon size={15} color={Brand.sage} />
                    <Text style={styles.heroBadgeText}>
                      {insights.successRate}% success
                    </Text>
                  </View>
                </View>

                <View style={styles.heroRule} />

                <View style={styles.heroMeta}>
                  <HeroFact
                    label="This month"
                    value={`${insights.thisMonthCompleted}`}
                  />
                  <HeroFact
                    label="Avg. completion"
                    value={formatHours(insights.avgCompletionHours)}
                  />
                  <HeroFact label="Active now" value={`${insights.activeCount}`} />
                </View>
              </LinearGradient>

              <View style={styles.metricGrid}>
                <Metric
                  label="Failed"
                  value={insights.totalFailed}
                  tone="#B4462F"
                />
                <Metric
                  label="Declined"
                  value={insights.totalDeclined}
                  tone={Brand.ink55}
                />
                <Metric
                  label="Success rate"
                  value={`${insights.successRate}%`}
                  tone={Brand.moss}
                />
              </View>

              <Section
                title="Last 6 months"
                meta={`${insights.totalCompleted + insights.totalFailed} outcomes`}
              >
                <View style={styles.chart}>
                  {insights.months.map((month) => {
                    const total = month.completed + month.failed;
                    return (
                      <View key={month.key} style={styles.chartColumn}>
                        <Text style={styles.chartTotal}>
                          {total > 0 ? total : ""}
                        </Text>
                        <View style={styles.chartBarTrack}>
                          {month.failed > 0 ? (
                            <View
                              style={[
                                styles.chartBarFailed,
                                {
                                  height: Math.max(
                                    3,
                                    Math.round((month.failed / chartMax) * 62),
                                  ),
                                },
                              ]}
                            />
                          ) : null}
                          {month.completed > 0 ? (
                            <View
                              style={[
                                styles.chartBarCompleted,
                                {
                                  height: Math.max(
                                    3,
                                    Math.round((month.completed / chartMax) * 62),
                                  ),
                                },
                              ]}
                            />
                          ) : null}
                          {total === 0 ? (
                            <View style={styles.chartBarEmpty} />
                          ) : null}
                        </View>
                        <Text style={styles.chartLabel}>{month.label}</Text>
                      </View>
                    );
                  })}
                </View>
                <View style={styles.legend}>
                  <Legend color={Brand.moss} label="Completed" />
                  <Legend color="#B4462F" label="Failed" />
                </View>
              </Section>

              <Section title="Rescues by species" meta="Completed">
                <View style={styles.breakdown}>
                  {insights.species.map((segment, index) => (
                    <BreakdownRow
                      key={segment.key}
                      segment={segment}
                      tone={SPECIES_TONE[index % SPECIES_TONE.length] ?? Brand.moss}
                    />
                  ))}
                </View>
              </Section>

              <Section title="By urgency" meta="Completed">
                <View style={styles.breakdown}>
                  {insights.urgency.map((segment) => (
                    <BreakdownRow
                      key={segment.key}
                      segment={segment}
                      tone={
                        URGENCY_TONE[segment.key as UrgencyLevel] ?? Brand.clay
                      }
                    />
                  ))}
                </View>
              </Section>

              <Section title="Recent rescues" meta="Latest 5">
                {insights.recent.length > 0 ? (
                  <View style={styles.recentList}>
                    {insights.recent.map((entry) => (
                      <RecentRescue
                        key={entry.id}
                        entry={entry}
                        onOpen={openAssignment}
                      />
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyCard}>
                    <View style={styles.emptyIcon}>
                      <PawIcon size={18} color={Brand.moss} />
                    </View>
                    <Text style={styles.emptyTitle}>No completed rescues yet</Text>
                    <Text style={styles.emptyBody}>
                      Your first completed assignment will start building this
                      report.
                    </Text>
                  </View>
                )}
              </Section>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ReportsSkeleton() {
  return (
    <View style={styles.skeleton}>
      <View style={[styles.skel, styles.skelHero]} />

      <View style={styles.skelGrid}>
        <View style={[styles.skel, styles.skelMetric]} />
        <View style={[styles.skel, styles.skelMetric]} />
        <View style={[styles.skel, styles.skelMetric]} />
      </View>

      <View style={styles.skelSection}>
        <View style={[styles.skel, styles.skelHeading]} />
        <View style={[styles.skel, styles.skelChart]} />
      </View>

      <View style={styles.skelSection}>
        <View style={[styles.skel, styles.skelHeading]} />
        <View style={[styles.skel, styles.skelCard]} />
      </View>

      <View style={styles.skelSection}>
        <View style={[styles.skel, styles.skelHeading]} />
        <View style={[styles.skel, styles.skelCard]} />
      </View>

      <View style={styles.skelSection}>
        <View style={[styles.skel, styles.skelHeading]} />
        <View style={styles.skelList}>
          <View style={[styles.skel, styles.skelRow]} />
          <View style={[styles.skel, styles.skelRow]} />
          <View style={[styles.skel, styles.skelRow]} />
        </View>
      </View>
    </View>
  );
}

function HeroFact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.heroFact}>
      <Text style={styles.heroFactValue}>{value}</Text>
      <Text style={styles.heroFactLabel}>{label}</Text>
    </View>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: string;
}) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, { color: tone }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
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
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {meta ? <Text style={styles.sectionMeta}>{meta}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function BreakdownRow({
  segment,
  tone,
}: {
  segment: ReportSegment;
  tone: string;
}) {
  const filled = Math.max(0, Math.min(100, segment.share));
  return (
    <View style={styles.breakdownRow}>
      <View style={styles.breakdownHead}>
        <Text style={styles.breakdownLabel}>{segment.label}</Text>
        <Text style={styles.breakdownValue}>
          {segment.value}
          <Text style={styles.breakdownShare}> · {segment.share}%</Text>
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { flex: filled, backgroundColor: tone }]} />
        <View style={{ flex: Math.max(0, 100 - filled) }} />
      </View>
    </View>
  );
}

function RecentRescue({
  entry,
  onOpen,
}: {
  entry: RescuerAssignment;
  onOpen: (id: string) => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onOpen(entry.id)}
      style={({ pressed }) => [styles.recentRow, pressed && styles.pressed]}
    >
      <View style={styles.recentIcon}>
        <CheckIcon size={13} color={Brand.moss} />
      </View>
      <View style={styles.recentBody}>
        <View style={styles.recentTop}>
          <Text style={styles.recentCode}>{entry.reportCode}</Text>
          <Text style={styles.recentDate}>
            {formatShortDate(entry.completedAt ?? entry.assignedAt)}
          </Text>
        </View>
        <Text style={styles.recentDescription} numberOfLines={1}>
          {entry.description}
        </Text>
        <Text style={styles.recentMeta} numberOfLines={1}>
          {speciesLabel(entry)} · {entry.barangay ?? "Unmapped"}
        </Text>
      </View>
      <ArrowUpRightIcon size={13} color={Brand.ink55} />
    </Pressable>
  );
}

function formatHours(hours: number | null): string {
  if (hours == null) return "—";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.paper2 },
  flex: { flex: 1 },
  content: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 130,
  },
  skeleton: { gap: 10 },
  skel: {
    borderRadius: 18,
    backgroundColor: "rgba(16, 36, 26, 0.07)",
  },
  skelHero: {
    height: 196,
    borderRadius: 26,
    backgroundColor: "rgba(11, 46, 28, 0.16)",
  },
  skelGrid: { flexDirection: "row", gap: 10 },
  skelMetric: { flex: 1, height: 70 },
  skelSection: { marginTop: 18, gap: 10 },
  skelHeading: { width: 128, height: 14, borderRadius: 7 },
  skelChart: { height: 116, borderRadius: 20 },
  skelCard: { height: 148, borderRadius: 20 },
  skelList: { gap: 8 },
  skelRow: { height: 74, borderRadius: 18 },
  error: {
    marginTop: 16,
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: "#B4462F",
  },
  hero: {
    borderRadius: 26,
    padding: 20,
    overflow: "hidden",
  },
  heroOrb: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    right: -50,
    top: -60,
    backgroundColor: "rgba(124,199,154,0.13)",
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
  },
  heroEyebrow: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: Brand.sage,
  },
  heroValue: {
    marginTop: 4,
    fontFamily: FontFamily.display,
    fontSize: 52,
    lineHeight: 54,
    letterSpacing: -1.5,
    color: Brand.paper,
  },
  heroCaption: {
    fontFamily: FontFamily.sans,
    fontSize: 11.5,
    color: "rgba(255,255,255,0.62)",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(185,220,196,0.24)",
    backgroundColor: "rgba(185,220,196,0.10)",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  heroBadgeText: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 0.5,
    color: Brand.sage,
  },
  heroRule: {
    height: 1,
    marginTop: 18,
    marginBottom: 14,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  heroMeta: { flexDirection: "row", gap: 10 },
  heroFact: { flex: 1 },
  heroFactValue: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    color: Brand.paper,
  },
  heroFactLabel: {
    marginTop: 2,
    fontFamily: FontFamily.medium,
    fontSize: 8.5,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.45)",
  },
  metricGrid: {
    marginTop: 10,
    flexDirection: "row",
    gap: 10,
  },
  metric: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    paddingVertical: 13,
    paddingHorizontal: 12,
  },
  metricValue: {
    fontFamily: FontFamily.display,
    fontSize: 26,
    lineHeight: 28,
  },
  metricLabel: {
    marginTop: 2,
    fontFamily: FontFamily.medium,
    fontSize: 9,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  section: { marginTop: 24 },
  sectionHead: {
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Brand.ink,
  },
  sectionMeta: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  chart: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  chartColumn: { flex: 1, alignItems: "center" },
  chartTotal: {
    height: 14,
    fontFamily: FontFamily.medium,
    fontSize: 9,
    color: Brand.ink55,
  },
  chartBarTrack: {
    height: 64,
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 3,
  },
  chartBarCompleted: {
    width: "62%",
    borderRadius: 5,
    backgroundColor: Brand.moss,
  },
  chartBarFailed: {
    width: "62%",
    borderRadius: 5,
    backgroundColor: "rgba(180,70,47,0.55)",
  },
  chartBarEmpty: {
    width: "62%",
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(16,36,26,0.08)",
  },
  chartLabel: {
    marginTop: 7,
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    color: Brand.ink55,
  },
  legend: {
    marginTop: 10,
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 2,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: Brand.ink55,
  },
  breakdown: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    padding: 15,
    gap: 14,
  },
  breakdownRow: { gap: 7 },
  breakdownHead: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  breakdownLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: Brand.ink,
  },
  breakdownValue: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    color: Brand.ink,
  },
  breakdownShare: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: Brand.ink55,
  },
  track: {
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(16,36,26,0.06)",
    flexDirection: "row",
    overflow: "hidden",
  },
  fill: { borderRadius: 4 },
  recentList: { gap: 9 },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    padding: 13,
  },
  recentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(31,122,77,0.10)",
  },
  recentBody: { flex: 1 },
  recentTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  recentCode: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    letterSpacing: 0.6,
    color: Brand.ink55,
  },
  recentDate: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: Brand.ink55,
  },
  recentDescription: {
    marginTop: 3,
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: Brand.ink,
  },
  recentMeta: {
    marginTop: 3,
    fontFamily: FontFamily.sans,
    fontSize: 10.5,
    color: Brand.ink55,
  },
  emptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    padding: 20,
    alignItems: "flex-start",
  },
  emptyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(31,122,77,0.10)",
  },
  emptyTitle: {
    marginTop: 10,
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Brand.ink,
  },
  emptyBody: {
    marginTop: 4,
    fontFamily: FontFamily.sans,
    fontSize: 12,
    lineHeight: 18,
    color: Brand.ink55,
  },
  pressed: { opacity: 0.7 },
});
