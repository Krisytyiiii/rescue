import { useFocusEffect, useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ArrowUpRightIcon,
  ChevronDownIcon,
  PawIcon,
  PersonIcon,
} from "@/components/icons";
import { Skeleton } from "@/components/skeleton";
import { Brand, FontFamily } from "@/constants/theme";
import type { AssignmentStatus, RescuerAssignment } from "@/domain/rescuer";
import {
  formatShortDate,
  historyThread,
  speciesLabel,
  STATUS_LABEL,
  URGENCY_LABEL,
  type HistoryThreadEntry,
} from "@/features/rescuer/presentation";
import { useRescuerHistoryViewModel } from "@/features/rescuer/useRescuerHistoryViewModel";

const STATUS_TONE: Record<AssignmentStatus, { background: string; ink: string }> =
  {
    pending: { background: "rgba(242,178,100,0.18)", ink: "#A46412" },
    accepted: { background: "rgba(96,124,255,0.18)", ink: "#3E50B4" },
    declined: { background: "rgba(16,36,26,0.07)", ink: Brand.ink55 },
    en_route: { background: "rgba(31,122,77,0.16)", ink: Brand.forest },
    on_site: { background: "rgba(122,79,201,0.16)", ink: "#5B3AA6" },
    completed: { background: "rgba(22,96,59,0.16)", ink: Brand.moss },
    failed: { background: "rgba(180,70,47,0.14)", ink: "#B4462F" },
  };

export default function HistoryScreen() {
  const router = useRouter();
  const { history, loading, error, reload } = useRescuerHistoryViewModel();
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
            <Text style={styles.headerTitle}>History</Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {loading ? (
            <View style={styles.skeletonList}>
              <View style={styles.skeletonGroup}>
                <Skeleton width={94} height={13} borderRadius={6} />
                <Skeleton width={56} height={9} borderRadius={4} />
              </View>
              {[0, 1, 2].map((index) => (
                <HistoryCardSkeleton key={index} />
              ))}
            </View>
          ) : history && history.total > 0 ? (
            <>
              {history.groups.map((group) => (
                <View key={group.key}>
                  <View style={styles.groupHeader}>
                    <Text style={styles.groupLabel}>{group.label}</Text>
                    <Text style={styles.groupMeta}>
                      {group.entries.length} reports
                    </Text>
                  </View>
                  <View style={styles.list}>
                    {group.entries.map((entry) => (
                      <HistoryCard
                        key={entry.id}
                        entry={entry}
                        expanded={expandedId === entry.id}
                        onToggle={() =>
                          setExpandedId((current) =>
                            current === entry.id ? null : entry.id,
                          )
                        }
                        onOpen={openAssignment}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No history yet</Text>
              <Text style={styles.emptyBody}>
                Accepted, in-progress, completed, failed, and declined rescues
                will appear here as collapsible report records.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function HistoryCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Skeleton width={92} height={10} borderRadius={4} />
            <Skeleton width={68} height={22} borderRadius={999} />
          </View>
          <Skeleton
            width="94%"
            height={13}
            borderRadius={6}
            style={styles.skeletonDescription}
          />
          <Skeleton width="62%" height={11} borderRadius={5} style={styles.skeletonMeta} />
          <Skeleton width="48%" height={10} borderRadius={4} style={styles.skeletonReporter} />
        </View>
        <Skeleton width={16} height={16} borderRadius={8} />
      </View>
    </View>
  );
}

function HistoryCard({
  entry,
  expanded,
  onToggle,
  onOpen,
}: {
  entry: RescuerAssignment;
  expanded: boolean;
  onToggle: () => void;
  onOpen: (id: string) => void;
}) {
  const tone = STATUS_TONE[entry.status];
  const rotation = useSharedValue(expanded ? 1 : 0);

  useEffect(() => {
    rotation.value = withTiming(expanded ? 1 : 0, { duration: 220 });
  }, [expanded, rotation]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 180}deg` }],
  }));

  return (
    <Animated.View
      style={[styles.card, expanded && styles.cardExpanded]}
      layout={LinearTransition.springify().damping(18).stiffness(180)}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={({ pressed }) => [styles.cardHead, pressed && styles.pressed]}
      >
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={styles.code}>{entry.reportCode}</Text>
            <View
              style={[styles.statusChip, { backgroundColor: tone.background }]}
            >
              <View style={[styles.statusDot, { backgroundColor: tone.ink }]} />
              <Text style={[styles.statusText, { color: tone.ink }]}>
                {STATUS_LABEL[entry.status]}
              </Text>
            </View>
          </View>

          <Text style={styles.description} numberOfLines={expanded ? 3 : 2}>
            {entry.description}
          </Text>

          <Text style={styles.meta} numberOfLines={1}>
            {speciesLabel(entry)} · {entry.barangay ?? "Unmapped"} ·{" "}
            {formatShortDate(entry.completedAt ?? entry.assignedAt)}
          </Text>

          <View style={styles.reporterRow}>
            <PersonIcon size={12} color={Brand.ink55} />
            <Text style={styles.reporter} numberOfLines={1}>
              Reported by {entry.reporter || "Anonymous"}
              {entry.assignedBy ? ` · Assigned by ${entry.assignedBy}` : ""}
            </Text>
          </View>
        </View>

        <Animated.View style={[styles.chevron, chevronStyle]}>
          <ChevronDownIcon size={16} color={Brand.ink55} />
        </Animated.View>
      </Pressable>

      {expanded ? (
        <Animated.View
          entering={FadeIn.duration(220)}
          exiting={FadeOut.duration(140)}
        >
          <ExpandedReport entry={entry} onOpen={onOpen} />
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

function ExpandedReport({
  entry,
  onOpen,
}: {
  entry: RescuerAssignment;
  onOpen: (id: string) => void;
}) {
  const thread = historyThread(entry);

  return (
    <View style={styles.detailPanel}>
      <View style={styles.detailHeader}>
        <Text style={styles.detailEyebrow}>Report record</Text>
        <Text style={styles.detailMeta}>{thread.length} events</Text>
      </View>

      <View style={styles.factGrid}>
        <Fact label="Urgency" value={URGENCY_LABEL[entry.urgency]} />
        <Fact label="Species" value={speciesLabel(entry)} />
        <Fact label="Barangay" value={entry.barangay ?? "Unmapped"} />
        <Fact
          label={entry.completedAt ? "Closed" : "Assigned"}
          value={formatShortDate(entry.completedAt ?? entry.assignedAt)}
        />
      </View>

      <View style={styles.messages}>
        {thread.map((item, index) => (
          <MessageRow
            key={`${entry.id}-${index}`}
            item={item}
            isLast={index === thread.length - 1}
          />
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => onOpen(entry.id)}
        style={({ pressed }) => [styles.openButton, pressed && styles.pressed]}
      >
        <Text style={styles.openText}>Open full report</Text>
        <ArrowUpRightIcon size={13} color={Brand.sage} />
      </Pressable>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function MessageRow({
  item,
  isLast,
}: {
  item: HistoryThreadEntry;
  isLast: boolean;
}) {
  const fromRescuer = item.actor === "rescuer";

  return (
    <View
      style={[
        styles.messageRow,
        fromRescuer ? styles.messageRowRescuer : styles.messageRowSystem,
        isLast && styles.messageRowLast,
      ]}
    >
      {!fromRescuer ? (
        <View style={styles.avatarSystem}>
          <PawIcon size={13} color={Brand.sage} />
        </View>
      ) : null}

      <View
        style={[
          styles.bubble,
          fromRescuer ? styles.bubbleRescuer : styles.bubbleSystem,
        ]}
      >
        <Text
          style={[
            styles.actorTag,
            fromRescuer ? styles.actorTagRescuer : styles.actorTagSystem,
          ]}
        >
          {fromRescuer ? "You" : "System"}
        </Text>
        <Text style={styles.bubbleLabel}>{item.label}</Text>
        {item.detail ? (
          <Text style={styles.bubbleDetail}>{item.detail}</Text>
        ) : null}
      </View>

      {fromRescuer ? (
        <View style={styles.avatarRescuer}>
          <PersonIcon size={13} color={Brand.forest} />
        </View>
      ) : null}
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
    paddingTop: 18,
    paddingBottom: 140,
  },
  header: {
    alignItems: "flex-start",
  },
  headerTitle: {
    fontFamily: FontFamily.display,
    fontSize: 38,
    lineHeight: 40,
    letterSpacing: -1,
    color: Brand.ink,
  },
  error: {
    marginTop: 14,
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: "#B4462F",
  },
  groupHeader: {
    marginTop: 26,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  groupLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Brand.ink,
  },
  groupMeta: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  list: {
    gap: 10,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    overflow: "hidden",
  },
  cardExpanded: {
    borderColor: "rgba(15,58,36,0.28)",
    shadowColor: "#10231A",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 15,
  },
  cardBody: {
    flex: 1,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  code: {
    flexShrink: 1,
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    letterSpacing: 0.7,
    color: Brand.ink55,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 22,
    paddingHorizontal: 9,
    borderRadius: 999,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  description: {
    marginTop: 8,
    fontFamily: FontFamily.medium,
    fontSize: 14.5,
    lineHeight: 20,
    letterSpacing: -0.2,
    color: Brand.ink,
  },
  meta: {
    marginTop: 6,
    fontFamily: FontFamily.sans,
    fontSize: 11.5,
    color: Brand.ink55,
  },
  reporterRow: {
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  reporter: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: Brand.ink55,
  },
  chevron: {
    marginTop: 3,
  },
  detailPanel: {
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: Brand.forest,
    padding: 15,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.10)",
  },
  detailEyebrow: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Brand.sage,
  },
  detailMeta: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.45)",
  },
  factGrid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 10,
    columnGap: 10,
  },
  fact: {
    width: "47%",
    minWidth: 105,
  },
  factLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 8.5,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.40)",
  },
  factValue: {
    marginTop: 3,
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: Brand.paper,
  },
  messages: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.10)",
    gap: 9,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    maxWidth: "100%",
  },
  messageRowSystem: {
    justifyContent: "flex-start",
  },
  messageRowRescuer: {
    justifyContent: "flex-end",
  },
  messageRowLast: {
    marginBottom: 0,
  },
  avatarSystem: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(185,220,196,0.12)",
    borderWidth: 1,
    borderColor: "rgba(185,220,196,0.20)",
  },
  avatarRescuer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.sage,
  },
  bubble: {
    maxWidth: "82%",
    borderRadius: 15,
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderWidth: 1,
  },
  bubbleSystem: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.10)",
    borderBottomLeftRadius: 5,
  },
  bubbleRescuer: {
    backgroundColor: "rgba(185,220,196,0.13)",
    borderColor: "rgba(185,220,196,0.26)",
    borderBottomRightRadius: 5,
  },
  actorTag: {
    fontFamily: FontFamily.medium,
    fontSize: 8,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  actorTagSystem: {
    color: Brand.sage,
  },
  actorTagRescuer: {
    color: "#d8f3e1",
    textAlign: "right",
  },
  bubbleLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 17,
    color: Brand.paper,
  },
  bubbleDetail: {
    marginTop: 3,
    fontFamily: FontFamily.sans,
    fontSize: 11,
    lineHeight: 15,
    color: "rgba(255,255,255,0.58)",
  },
  openButton: {
    marginTop: 14,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(185,220,196,0.24)",
    backgroundColor: "rgba(185,220,196,0.10)",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  openText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: Brand.sage,
  },
  pressed: {
    opacity: 0.7,
  },
  emptyCard: {
    marginTop: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    padding: 24,
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
  skeletonList: {
    marginTop: 0,
    gap: 10,
  },
  skeletonGroup: {
    marginTop: 26,
    marginBottom: 2,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  skeletonDescription: {
    marginTop: 10,
  },
  skeletonMeta: {
    marginTop: 8,
  },
  skeletonReporter: {
    marginTop: 8,
  },
});
