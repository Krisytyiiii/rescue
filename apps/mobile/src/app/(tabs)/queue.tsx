import { useFocusEffect, useRouter, type Href } from "expo-router";
import { useCallback } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ArrowUpRightIcon,
  CloseIcon,
  SearchIcon,
} from "@/components/icons";
import { UserAvatar } from "@/components/user-avatar";
import { Brand, FontFamily } from "@/constants/theme";
import type {
  AssignmentBoardFilter,
  AssignmentStatus,
  RescuerAssignment,
} from "@/domain/rescuer";
import {
  ACTION_LABEL,
  formatElapsed,
  speciesLabel,
  STATUS_LABEL,
  URGENCY_LABEL,
} from "@/features/rescuer/presentation";
import { useRescuerAssignmentsViewModel } from "@/features/rescuer/useRescuerAssignmentsViewModel";

const FILTERS: { key: AssignmentBoardFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Offers" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "declined", label: "Declined" },
];

const STATUS_TONE: Record<AssignmentStatus, { background: string; ink: string }> =
  {
    pending: { background: "rgba(242,178,100,0.18)", ink: "#A46412" },
    accepted: { background: "rgba(96,124,255,0.14)", ink: "#3E50B4" },
    declined: { background: "rgba(16,36,26,0.07)", ink: Brand.ink55 },
    en_route: { background: "rgba(31,122,77,0.14)", ink: Brand.forest },
    on_site: { background: "rgba(122,79,201,0.14)", ink: "#5B3AA6" },
    completed: { background: "rgba(22,96,59,0.16)", ink: Brand.moss },
    failed: { background: "rgba(180,70,47,0.14)", ink: "#B4462F" },
  };

/** Readable urgency colors on the light card surface. */
const URGENCY_INK: Record<RescuerAssignment["urgency"], string> = {
  critical: "#C24530",
  high: "#A46412",
  medium: "#2F7D55",
  low: "#4C5FC7",
};

export default function AssignmentsScreen() {
  const router = useRouter();
  const {
    assignments,
    visible,
    search,
    setSearch,
    filter,
    setFilter,
    resetFilters,
    loading,
    refreshing,
    error,
    reload,
    refresh,
  } = useRescuerAssignmentsViewModel();

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
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={Brand.clay}
              colors={[Brand.clay]}
            />
          }
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Assign</Text>
          </View>

          <View style={styles.searchBox}>
            <SearchIcon size={18} color={Brand.ink55} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search code, animal, barangay, landmark"
              placeholderTextColor={Brand.ink55}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              style={styles.searchInput}
            />
            {search.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                hitSlop={10}
                onPress={() => setSearch("")}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <CloseIcon size={14} color={Brand.ink55} />
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
            style={styles.filtersScroll}
          >
            {FILTERS.map((option) => {
              const active = option.key === filter;
              return (
                <Pressable
                  key={option.key}
                  accessibilityRole="button"
                  accessibilityState={active ? { selected: true } : {}}
                  onPress={() => setFilter(option.key)}
                  style={({ pressed }) => [
                    styles.filterChip,
                    active && styles.filterChipActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterLabel,
                      active && styles.filterLabelActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {error ? (
            <Pressable onPress={reload} style={styles.errorBanner}>
              <Text style={styles.errorText}>{error} Tap to retry.</Text>
            </Pressable>
          ) : null}

          {loading ? (
            <View style={styles.skeletonList}>
              <View style={styles.skeletonRow} />
              <View style={styles.skeletonRow} />
              <View style={styles.skeletonRow} />
            </View>
          ) : visible.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                {assignments.length === 0
                  ? "No assignments yet"
                  : "No matching assignments"}
              </Text>
              <Text style={styles.emptyBody}>
                {assignments.length === 0
                  ? "Dispatch will send reports here. Accepted, declined, and completed work stays on this board."
                  : "Try a different search term or switch back to all reports."}
              </Text>
              {assignments.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={resetFilters}
                  style={({ pressed }) => [
                    styles.resetButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.resetText}>Clear search & filters</Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <View style={styles.list}>
              {visible.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  onOpen={openAssignment}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function AssignmentCard({
  assignment,
  onOpen,
}: {
  assignment: RescuerAssignment;
  onOpen: (id: string) => void;
}) {
  const tone = STATUS_TONE[assignment.status];
  const urgencyInk = URGENCY_INK[assignment.urgency];
  const action = assignment.nextAction
    ? ACTION_LABEL[assignment.nextAction]
    : "View details";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${assignment.reportCode}, ${STATUS_LABEL[assignment.status]}, ${assignment.description}`}
      onPress={() => onOpen(assignment.id)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={[styles.cardAccent, { backgroundColor: urgencyInk }]} />

      <View style={styles.cardTop}>
        <Text style={styles.code}>{assignment.reportCode}</Text>
        <View
          style={[styles.statusChip, { backgroundColor: tone.background }]}
        >
          <View style={[styles.statusDot, { backgroundColor: tone.ink }]} />
          <Text style={[styles.statusText, { color: tone.ink }]}>
            {STATUS_LABEL[assignment.status]}
          </Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {assignment.description}
      </Text>

      <Text style={styles.meta} numberOfLines={1}>
        {speciesLabel(assignment)} · {assignment.barangay ?? "Unmapped"}
        {assignment.distanceKm !== null ? ` · ${assignment.distanceKm} km` : ""}
      </Text>

      {assignment.landmark ? (
        <Text style={styles.landmark} numberOfLines={1}>
          {assignment.landmark}
        </Text>
      ) : null}

      <View style={styles.reporterRow}>
        <UserAvatar uri={assignment.reporterProfilePhotoUrl} size={16} />
        <Text style={styles.reporter} numberOfLines={1}>
          Reported by {assignment.reporter || "Anonymous"}
          {assignment.assignedBy ? ` · Assigned by ${assignment.assignedBy}` : ""}
        </Text>
      </View>

      <View style={styles.cardBottom}>
        <View style={styles.urgencyRow}>
          <View
            style={[styles.urgencyDot, { backgroundColor: urgencyInk }]}
          />
          <Text style={[styles.urgencyText, { color: urgencyInk }]}>
            {URGENCY_LABEL[assignment.urgency]} priority
          </Text>
          <Text style={styles.time}>
            · {formatElapsed(assignment.assignedAt)}
          </Text>
        </View>

        <View style={styles.openCta}>
          <Text style={styles.openText}>{action}</Text>
          <ArrowUpRightIcon size={13} color={Brand.clay} />
        </View>
      </View>
    </Pressable>
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
  searchBox: {
    marginTop: 18,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
    fontFamily: FontFamily.sans,
    fontSize: 14,
    color: Brand.ink,
  },
  filtersScroll: {
    marginTop: 14,
    marginHorizontal: -22,
  },
  filters: {
    paddingHorizontal: 22,
    gap: 8,
  },
  filterChip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipActive: {
    borderColor: Brand.forest,
    backgroundColor: Brand.forest,
  },
  filterLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: Brand.ink70,
  },
  filterLabelActive: {
    color: Brand.paper,
  },
  errorBanner: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(180,70,47,0.25)",
    backgroundColor: "rgba(180,70,47,0.08)",
    padding: 12,
  },
  errorText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: "#B4462F",
  },
  list: {
    marginTop: 18,
    gap: 12,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    padding: 17,
    paddingLeft: 19,
    overflow: "hidden",
    shadowColor: "#10231A",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  cardPressed: {
    backgroundColor: "#fbfdfb",
    transform: [{ scale: 0.995 }],
  },
  cardAccent: {
    position: "absolute",
    left: 0,
    top: 14,
    bottom: 14,
    width: 3,
    borderRadius: 3,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  code: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    letterSpacing: 0.8,
    color: Brand.ink55,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 24,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  description: {
    marginTop: 11,
    fontFamily: FontFamily.semibold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
    color: Brand.ink,
  },
  meta: {
    marginTop: 8,
    fontFamily: FontFamily.sans,
    fontSize: 12,
    color: Brand.ink70,
  },
  landmark: {
    marginTop: 3,
    fontFamily: FontFamily.sans,
    fontSize: 11.5,
    color: Brand.ink55,
  },
  reporterRow: {
    marginTop: 8,
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
  cardBottom: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Brand.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  urgencyRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  urgencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  urgencyText: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  time: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: Brand.ink55,
  },
  openCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  openText: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: Brand.clay,
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
  resetButton: {
    alignSelf: "flex-start",
    marginTop: 14,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "rgba(31,122,77,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  resetText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: Brand.clay,
  },
  skeletonList: {
    marginTop: 18,
    gap: 12,
  },
  skeletonRow: {
    height: 128,
    borderRadius: 22,
    backgroundColor: "rgba(16,36,26,0.05)",
  },
  pressed: {
    opacity: 0.7,
  },
});
