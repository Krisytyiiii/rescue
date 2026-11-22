import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import type { ReactNode } from "react";
import { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ArrowUpRightIcon,
  BellIcon,
  ChatIcon,
  CompassIcon,
  CheckIcon,
  MapPinIcon,
} from "@/components/icons";
import { Brand, FontFamily } from "@/constants/theme";
import type {
  RescuerAssignment,
  RescuerHomeState,
  UrgencyLevel,
} from "@/domain/rescuer";

import {
  ACTION_LABEL,
  formatElapsed,
  formatToday,
  speciesLabel,
  STATUS_LABEL,
  URGENCY_COLOR,
  URGENCY_LABEL,
} from "./presentation";
import { useRescuerHomeViewModel } from "./useRescuerHomeViewModel";

export function RescuerHomeView() {
  const router = useRouter();
  const { home, loading, error, reload } = useRescuerHomeViewModel();

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const openAssignment = (id: string) => {
    router.push(`/assignments/${id}` as Href);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.headerLabel}>Today</Text>
              <Text style={styles.headerDate}>{formatToday()}</Text>
            </View>

            <View style={styles.headerActions}>
              <IconPill
                count={home?.unreadNotifications ?? 0}
                accessibilityLabel="Notifications"
              >
                <BellIcon size={17} color={Brand.ink} />
              </IconPill>
              <IconPill
                count={home?.unreadMessages ?? 0}
                accessibilityLabel="Messages"
              >
                <ChatIcon size={17} color={Brand.ink} />
              </IconPill>
            </View>
          </View>

          {home ? (
            <>
              <ShiftBanner home={home} onOpen={openAssignment} />

              <AssignmentSection
                title="Pending offers"
                meta="Needs a response"
                assignments={home.pendingOffers}
                onOpen={openAssignment}
                glass
              />
              <AssignmentSection
                title="En route"
                meta={`${home.enRoute.length} active`}
                assignments={home.enRoute}
                onOpen={openAssignment}
              />
              <AssignmentSection
                title="On site"
                meta={`${home.onSite.length} active`}
                assignments={home.onSite}
                onOpen={openAssignment}
              />
              <AssignmentSection
                title="Completed today"
                meta={`${home.stats.completedToday} done`}
                assignments={home.completedToday}
                onOpen={openAssignment}
                onMetaPress={() => router.navigate("/history" as Href)}
                done
              />

              {home.stats.assigned === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>No assignments yet</Text>
                  <Text style={styles.emptyBody}>
                    The dispatch team will send rescues here. Verified reports
                    waiting for dispatch: {home.queueCount}.
                  </Text>
                </View>
              ) : null}

              <SectionHeader label="Quick actions" meta="Field tools" />
              <View style={styles.actionsRow}>
                <QuickActionCard
                  label="Map"
                  hint="Nearby reports"
                  icon={<CompassIcon size={16} color={Brand.clay} />}
                />
                <QuickActionCard
                  label="Assign"
                  hint={`${home.stats.assigned} assigned`}
                  icon={<MapPinIcon size={16} color={Brand.clay} />}
                  onPress={() => router.navigate("/queue" as Href)}
                />
                <QuickActionCard
                  label="History"
                  hint="Past rescues"
                  icon={<CheckIcon size={16} color={Brand.clay} />}
                  onPress={() => router.navigate("/history" as Href)}
                />
              </View>
            </>
          ) : (
            <LoadingState loading={loading} error={error} />
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function IconPill({
  count,
  accessibilityLabel,
  children,
}: {
  count: number;
  accessibilityLabel: string;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        count > 0 ? `${accessibilityLabel}, ${count} unread` : accessibilityLabel
      }
      style={({ pressed }) => [styles.iconPill, pressed && styles.pressed]}
    >
      {children}
      {count > 0 ? <View style={styles.iconDot} /> : null}
    </Pressable>
  );
}

function ShiftBanner({
  home,
  onOpen,
}: {
  home: RescuerHomeState;
  onOpen: (id: string) => void;
}) {
  return (
    <View style={styles.banner}>
      <View style={styles.statsRow}>
        <StatCard
          label="Assigned"
          value={home.stats.assigned}
          gradient={["rgba(96,124,255,0.38)", "rgba(64,86,180,0.12)", "rgba(96,124,255,0.62)"]}
        />
        <StatCard
          label="In progress"
          value={home.stats.inProgress}
          gradient={["rgba(232,120,96,0.36)", "rgba(190,70,110,0.12)", "rgba(232,120,96,0.60)"]}
        />
        <StatCard
          label="Completed"
          value={home.stats.completedToday}
          gradient={["rgba(233,176,64,0.34)", "rgba(180,120,40,0.10)", "rgba(233,176,64,0.58)"]}
        />
      </View>

      {home.activeAssignment ? (
        <ActiveAssignmentStrip
          assignment={home.activeAssignment}
          onOpen={onOpen}
        />
      ) : (
        <Text style={styles.bannerEmpty}>
          You're all caught up. New offers will appear here.
        </Text>
      )}
    </View>
  );
}

function StatCard({
  label,
  value,
  gradient,
}: {
  label: string;
  value: number;
  gradient: readonly [string, string, string];
}) {
  return (
    <View style={styles.statCard}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.45, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActiveAssignmentStrip({
  assignment,
  onOpen,
}: {
  assignment: RescuerAssignment;
  onOpen: (id: string) => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onOpen(assignment.id)}
      style={({ pressed }) => [styles.activeStrip, pressed && styles.pressed]}
    >
      <View style={styles.activeTop}>
        <Text style={styles.activeEyebrow}>Up next</Text>
        <UrgencyChip urgency={assignment.urgency} />
      </View>

      <Text style={styles.activeTitle}>{assignment.reportCode}</Text>
      <Text style={styles.activeMeta}>
        {speciesLabel(assignment)} · {assignment.barangay ?? "Unmapped"}
      </Text>

      <View style={styles.activeBottom}>
        <View style={styles.activeCta}>
          <Text style={styles.activeCtaText}>
            {assignment.nextAction
              ? ACTION_LABEL[assignment.nextAction]
              : "Open"}
          </Text>
          <ArrowUpRightIcon size={14} color={Brand.forest} />
        </View>
        <Text style={styles.activeElapsed}>
          {formatElapsed(assignment.assignedAt)}
        </Text>
      </View>
    </Pressable>
  );
}

function UrgencyChip({ urgency }: { urgency: UrgencyLevel }) {
  return (
    <View style={styles.urgencyChip}>
      <View
        style={[styles.urgencyDot, { backgroundColor: URGENCY_COLOR[urgency] }]}
      />
      <Text style={styles.urgencyText}>{URGENCY_LABEL[urgency]}</Text>
    </View>
  );
}

function AssignmentSection({
  title,
  meta,
  assignments,
  onOpen,
  onMetaPress,
  glass = false,
  done = false,
}: {
  title: string;
  meta: string;
  assignments: RescuerAssignment[];
  onOpen: (id: string) => void;
  onMetaPress?: () => void;
  glass?: boolean;
  done?: boolean;
}) {
  if (assignments.length === 0) return null;

  return (
    <>
      <SectionHeader label={title} meta={meta} onMetaPress={onMetaPress} />
      <View style={glass ? styles.offerList : styles.assignmentList}>
        {assignments.map((assignment) =>
          glass ? (
            <GlassOfferCard
              key={assignment.id}
              assignment={assignment}
              onOpen={onOpen}
            />
          ) : (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              done={done}
              onOpen={onOpen}
            />
          ),
        )}
      </View>
    </>
  );
}

const OFFER_ACCENT: Record<UrgencyLevel, string> = {
  critical: "#FF7664",
  high: "#F2B264",
  medium: "#7CC79A",
  low: "#93A9FF",
};

const OFFER_ACCENT_INK: Record<UrgencyLevel, string> = {
  critical: "#C24530",
  high: "#A46412",
  medium: "#2F7D55",
  low: "#4C5FC7",
};

function GlassOfferCard({
  assignment,
  onOpen,
}: {
  assignment: RescuerAssignment;
  onOpen: (id: string) => void;
}) {
  const accent = OFFER_ACCENT[assignment.urgency];
  const ink = OFFER_ACCENT_INK[assignment.urgency];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onOpen(assignment.id)}
      style={({ pressed }) => [styles.offerCard, pressed && styles.offerPressed]}
    >
      <LinearGradient
        colors={[`${accent}2A`, "rgba(255,255,255,0.55)", `${accent}14`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.offerGlow}
      />
      <View
        pointerEvents="none"
        style={[styles.offerHighlight, { backgroundColor: `${accent}1F` }]}
      />

      <View style={styles.offerTop}>
        <View
          style={[
            styles.offerIcon,
            {
              borderColor: `${accent}5A`,
              backgroundColor: `${accent}1A`,
            },
          ]}
        >
          <BellIcon size={17} color={ink} />
        </View>

        <View style={styles.offerIdentity}>
          <Text style={styles.offerCode}>{assignment.reportCode}</Text>
          <View style={styles.offerUrgencyRow}>
            <View style={[styles.offerDot, { backgroundColor: accent }]} />
            <Text style={styles.offerUrgencyText}>
              {URGENCY_LABEL[assignment.urgency]} priority
            </Text>
          </View>
        </View>

        <Text style={styles.offerTime}>
          {formatElapsed(assignment.assignedAt)}
        </Text>
      </View>

      <Text style={styles.offerTitle} numberOfLines={2}>
        {assignment.description}
      </Text>

      <Text style={styles.offerMeta} numberOfLines={1}>
        {speciesLabel(assignment)} · {assignment.barangay ?? "Unmapped"}
        {assignment.distanceKm !== null ? ` · ${assignment.distanceKm} km` : ""}
      </Text>

      <View style={styles.offerFooter}>
        <View
          style={[
            styles.offerCta,
            { borderColor: `${accent}66`, backgroundColor: `${accent}18` },
          ]}
        >
          <Text style={[styles.offerCtaText, { color: ink }]}>
            Review offer
          </Text>
          <ArrowUpRightIcon size={13} color={ink} />
        </View>

        <Text style={styles.offerStatus}>Awaiting response</Text>
      </View>
    </Pressable>
  );
}

function AssignmentCard({
  assignment,
  done,
  onOpen,
}: {
  assignment: RescuerAssignment;
  done: boolean;
  onOpen: (id: string) => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onOpen(assignment.id)}
      style={({ pressed }) => [styles.assignmentCard, pressed && styles.pressed]}
    >
      <View style={styles.assignmentTop}>
        <View style={styles.assignmentIdentity}>
          <Text style={styles.assignmentCode}>{assignment.reportCode}</Text>
          <Text style={styles.assignmentStatus}>
            {STATUS_LABEL[assignment.status]}
          </Text>
        </View>
        {done ? (
          <View style={styles.doneChip}>
            <CheckIcon size={9} color={Brand.paper} strokeWidth={3} />
            <Text style={styles.doneText}>Done</Text>
          </View>
        ) : (
          <UrgencyChipDark urgency={assignment.urgency} />
        )}
      </View>

      <Text style={styles.assignmentTitle} numberOfLines={2}>
        {assignment.description}
      </Text>

      <View style={styles.assignmentMetaRow}>
        <Text style={styles.assignmentMeta} numberOfLines={1}>
          {assignment.barangay ?? "Unmapped"}
          {assignment.distanceKm !== null
            ? ` · ${assignment.distanceKm} km`
            : ""}
        </Text>
        <Text style={styles.assignmentTime}>
          {formatElapsed(assignment.assignedAt)}
        </Text>
      </View>

      {done ? null : (
        <View style={styles.assignmentAction}>
          <Text style={styles.assignmentActionText}>
            {assignment.nextAction
              ? ACTION_LABEL[assignment.nextAction]
              : "Open"}
          </Text>
          <ArrowUpRightIcon size={13} color={Brand.clay} />
        </View>
      )}
    </Pressable>
  );
}

function UrgencyChipDark({ urgency }: { urgency: UrgencyLevel }) {
  return (
    <View style={styles.urgencyChipDark}>
      <View
        style={[styles.urgencyDot, { backgroundColor: URGENCY_COLOR[urgency] }]}
      />
      <Text style={styles.urgencyTextDark}>{URGENCY_LABEL[urgency]}</Text>
    </View>
  );
}

function SectionHeader({
  label,
  meta,
  onMetaPress,
}: {
  label: string;
  meta: string;
  onMetaPress?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{label}</Text>
      {onMetaPress ? (
        <Pressable onPress={onMetaPress} hitSlop={8}>
          <Text style={styles.sectionMetaAction}>{meta}</Text>
        </Pressable>
      ) : (
        <Text style={styles.sectionMeta}>{meta}</Text>
      )}
    </View>
  );
}

function QuickActionCard({
  label,
  hint,
  icon,
  onPress,
}: {
  label: string;
  hint: string;
  icon: ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard,
        pressed && styles.actionCardPressed,
      ]}
    >
      <View style={styles.actionGlyph}>{icon}</View>
      <Text style={styles.actionLabel}>{label}</Text>
      <Text style={styles.actionHint}>{hint}</Text>
    </Pressable>
  );
}

function LoadingState({
  loading,
  error,
}: {
  loading: boolean;
  error: string | null;
}) {
  if (!loading) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>Couldn't load your shift</Text>
        <Text style={styles.emptyBody}>
          {error ?? "Pull to refresh. If this keeps happening, sign out and back in."}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.skeleton}>
      <View style={styles.skeletonBanner} />
      <View style={styles.skeletonRow} />
      <View style={styles.skeletonRow} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.paper2,
  },
  flex: {
    flex: 1,
  },
  content: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 140,
  },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLabel: {
    fontFamily: FontFamily.display,
    fontSize: 26,
    lineHeight: 28,
    letterSpacing: -0.6,
    color: Brand.ink,
  },
  headerDate: {
    marginTop: 2,
    fontFamily: FontFamily.medium,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconDot: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Brand.clay,
  },
  pressed: {
    opacity: 0.6,
  },
  banner: {
    marginTop: 8,
    borderRadius: 26,
    backgroundColor: Brand.forest,
    padding: 12,
    overflow: "hidden",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    minHeight: 88,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingVertical: 14,
    paddingHorizontal: 12,
    overflow: "hidden",
  },
  statValue: {
    fontFamily: FontFamily.display,
    fontSize: 30,
    lineHeight: 32,
    color: Brand.paper,
  },
  statLabel: {
    marginTop: 2,
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.68)",
  },
  activeStrip: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 14,
  },
  activeTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activeEyebrow: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: Brand.sage,
  },
  activeTitle: {
    marginTop: 10,
    fontFamily: FontFamily.display,
    fontSize: 24,
    lineHeight: 26,
    letterSpacing: -0.4,
    color: Brand.paper,
  },
  activeMeta: {
    marginTop: 4,
    fontFamily: FontFamily.sans,
    fontSize: 12,
    color: "rgba(255,255,255,0.66)",
  },
  activeBottom: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activeCta: {
    height: 38,
    borderRadius: 999,
    paddingHorizontal: 14,
    backgroundColor: Brand.paper,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  activeCtaText: {
    fontFamily: FontFamily.medium,
    fontSize: 12.5,
    color: Brand.forest,
  },
  activeElapsed: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: "rgba(255,255,255,0.55)",
  },
  bannerEmpty: {
    marginTop: 12,
    marginBottom: 2,
    fontFamily: FontFamily.sans,
    fontSize: 12.5,
    lineHeight: 18,
    color: "rgba(255,255,255,0.6)",
  },
  urgencyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 24,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  urgencyChipDark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: "rgba(16,36,26,0.06)",
  },
  urgencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  urgencyText: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: Brand.paper,
  },
  urgencyTextDark: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  sectionHeader: {
    marginTop: 26,
    marginBottom: 12,
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
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  sectionMetaAction: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: Brand.clay,
  },
  assignmentList: {
    gap: 10,
  },
  offerList: {
    gap: 12,
  },
  offerCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
    backgroundColor: "rgba(255,255,255,0.78)",
    padding: 17,
    overflow: "hidden",
    shadowColor: "#10231A",
    shadowOpacity: 0.1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  offerPressed: {
    opacity: 0.9,
  },
  offerGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  offerHighlight: {
    position: "absolute",
    top: -46,
    right: -34,
    width: 160,
    height: 120,
    borderRadius: 999,
    opacity: 0.5,
  },
  offerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  offerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  offerIdentity: {
    flex: 1,
    gap: 4,
  },
  offerCode: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    letterSpacing: 0.7,
    color: Brand.ink55,
  },
  offerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  offerUrgencyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  offerUrgencyText: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: Brand.ink70,
  },
  offerTime: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: Brand.ink55,
  },
  offerTitle: {
    marginTop: 14,
    fontFamily: FontFamily.semibold,
    fontSize: 18,
    lineHeight: 23,
    letterSpacing: -0.2,
    color: Brand.ink,
  },
  offerMeta: {
    marginTop: 7,
    fontFamily: FontFamily.sans,
    fontSize: 11.5,
    color: Brand.ink55,
  },
  offerFooter: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  offerCta: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  offerCtaText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
  },
  offerStatus: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  assignmentCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    padding: 15,
  },
  assignmentTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  assignmentIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  assignmentCode: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    letterSpacing: 0.6,
    color: Brand.ink55,
  },
  assignmentStatus: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: Brand.clay,
  },
  assignmentTitle: {
    marginTop: 8,
    fontFamily: FontFamily.medium,
    fontSize: 14.5,
    lineHeight: 20,
    color: Brand.ink,
  },
  assignmentMetaRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  assignmentMeta: {
    flex: 1,
    fontFamily: FontFamily.sans,
    fontSize: 11.5,
    color: Brand.ink55,
  },
  assignmentTime: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: Brand.ink55,
  },
  assignmentAction: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Brand.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  assignmentActionText: {
    fontFamily: FontFamily.medium,
    fontSize: 12.5,
    color: Brand.clay,
  },
  doneChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: Brand.moss,
  },
  doneText: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: Brand.paper,
  },
  emptyCard: {
    marginTop: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    padding: 22,
  },
  emptyTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
    color: Brand.ink,
  },
  emptyBody: {
    marginTop: 6,
    fontFamily: FontFamily.sans,
    fontSize: 13,
    lineHeight: 20,
    color: Brand.ink55,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    padding: 14,
    minHeight: 104,
  },
  actionCardPressed: {
    backgroundColor: Brand.paper2,
  },
  actionGlyph: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(31,122,77,0.10)",
  },
  actionLabel: {
    marginTop: 12,
    fontFamily: FontFamily.medium,
    fontSize: 12.5,
    color: Brand.ink,
  },
  actionHint: {
    marginTop: 3,
    fontFamily: FontFamily.sans,
    fontSize: 10.5,
    lineHeight: 15,
    color: Brand.ink55,
  },
  skeleton: {
    marginTop: 8,
    gap: 12,
  },
  skeletonBanner: {
    height: 220,
    borderRadius: 26,
    backgroundColor: "rgba(16,36,26,0.06)",
  },
  skeletonRow: {
    height: 110,
    borderRadius: 18,
    backgroundColor: "rgba(16,36,26,0.05)",
  },
});
