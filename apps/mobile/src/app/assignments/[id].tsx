import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Fragment } from "react";
import type { ReactNode } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ArrowUpRightIcon,
  CheckIcon,
  ChevronDownIcon,
  MapPinIcon,
  PawIcon,
} from "@/components/icons";
import { BackButton } from "@/components/back-button";
import { UserAvatar } from "@/components/user-avatar";
import { Brand, FontFamily } from "@/constants/theme";
import type {
  AssignmentStatus,
  AssignmentTransition,
  RescuerAssignment,
  UrgencyLevel,
} from "@/domain/rescuer";

import {
  ACTION_LABEL,
  capitalize,
  formatElapsed,
  REPORT_STATUS_LABEL,
  REPORT_TYPE_LABEL,
  SPECIES_LABEL,
  STATUS_LABEL,
  URGENCY_LABEL,
} from "@/features/rescuer/presentation";
import { useRescuerAssignmentViewModel } from "@/features/rescuer/useRescuerAssignmentViewModel";
import { ReportLocationMap } from "@/features/rescuer/ReportLocationMap";
import { ConfirmOverlay } from "@/features/rescuer/ConfirmOverlay";

const FLOW: AssignmentStatus[] = [
  "pending",
  "accepted",
  "en_route",
  "on_site",
  "completed",
];

const STEP_LABEL = ["Offered", "Accepted", "En route", "On site", "Done"];

const PRIMARY_MESSAGE: Record<string, string> = {
  accept: "This will mark the offer as accepted and start the rescue.",
  decline: "The dispatch team will look for another rescuer.",
  start_en_route: "Let the team know you're on the way.",
  mark_on_site: "This records that you've arrived at the location.",
  complete: "This closes the rescue and notifies the reporter.",
  fail: "This closes the assignment as a problem and notifies the team.",
};

const URGENCY_ACCENT: Record<UrgencyLevel, string> = {
  critical: "#FF7664",
  high: "#F2B264",
  medium: "#7CC79A",
  low: "#93A9FF",
};

const URGENCY_INK: Record<UrgencyLevel, string> = {
  critical: "#C24530",
  high: "#A46412",
  medium: "#2F7D55",
  low: "#4C5FC7",
};

export default function AssignmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { assignment, loading, pending, error, run } =
    useRescuerAssignmentViewModel(id);
  const [notes, setNotes] = useState("");
  const [animalsRescued, setAnimalsRescued] = useState(0);
  const [confirmation, setConfirmation] = useState<{
    transition: AssignmentTransition;
    label: string;
  } | null>(null);

  const confirmTransition = (transition: AssignmentTransition, label: string) => {
    setConfirmation({ transition, label });
  };

  const handleConfirm = () => {
    if (!confirmation) return;
    const transition = confirmation.transition;
    setConfirmation(null);
    void run(transition);
  };

  const confirmPrimary = (assignment: RescuerAssignment) => {
    const action = assignment.nextAction;
    if (!action) return;

    if (action === "complete") {
      confirmTransition(
        {
          action,
          outcomeNotes: notes.trim() || undefined,
          animalsRescued: animalsRescued > 0 ? animalsRescued : undefined,
        },
        ACTION_LABEL[action],
      );
      return;
    }

    confirmTransition({ action }, ACTION_LABEL[action]);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <BackButton onPress={() => router.back()} />
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Assignment</Text>
            {assignment ? (
              <Text style={styles.headerCode}>{assignment.reportCode}</Text>
            ) : null}
          </View>
          <View style={styles.back} />
        </View>

        {assignment ? (
          <>
            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
            >
              <HeroCard assignment={assignment} />

              <SectionHeader
                label="Report details"
                hint="What the reporter saw"
              />
              <View style={styles.detailGrid}>
                <InfoTile
                  icon={<PawIcon size={15} color={Brand.moss} />}
                  label="Animal"
                  value={SPECIES_LABEL[assignment.species]}
                />
                <InfoTile
                  label="Report type"
                  value={REPORT_TYPE_LABEL[assignment.reportType]}
                />
                <InfoTile
                  label="Urgency"
                  value={URGENCY_LABEL[assignment.urgency]}
                  accent={URGENCY_INK[assignment.urgency]}
                  dot={URGENCY_ACCENT[assignment.urgency]}
                />
                <InfoTile
                  label="Report status"
                  value={REPORT_STATUS_LABEL[assignment.reportStatus]}
                />
                <InfoTile
                  icon={
                    <UserAvatar
                      uri={assignment.reporterProfilePhotoUrl}
                      size={16}
                    />
                  }
                  label="Reported by"
                  value={assignment.reporter || "Anonymous"}
                />
                {assignment.assignedBy ? (
                  <InfoTile
                    label="Assigned by"
                    value={assignment.assignedBy}
                  />
                ) : null}
              </View>

              <LocationCard assignment={assignment} />

              <Timeline status={assignment.status} />

              {assignment.nextAction === "complete" ? (
                <OutcomeCard
                  notes={notes}
                  onNotesChange={setNotes}
                  animalsRescued={animalsRescued}
                  onIncrement={() => setAnimalsRescued((count) => count + 1)}
                  onDecrement={() =>
                    setAnimalsRescued((count) => Math.max(0, count - 1))
                  }
                />
              ) : null}

              {error ? <Text style={styles.error}>{error}</Text> : null}
            </ScrollView>

            <ActionBar
              assignment={assignment}
              pending={pending}
              onPrimary={confirmPrimary}
              onDecline={() =>
                confirmTransition({ action: "decline" }, "Decline offer")
              }
              onFail={() =>
                confirmTransition({ action: "fail" }, "Report problem")
              }
            />
          </>
        ) : loading ? (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <AssignmentSkeleton />
          </ScrollView>
        ) : (
          <View style={styles.stateWrap}>
            <Text style={styles.stateTitle}>Assignment not found</Text>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Text style={styles.stateLink}>Back to Today</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>

      <ConfirmOverlay
        visible={confirmation !== null}
        title={confirmation?.label ?? "Confirm action"}
        message={
          confirmation
            ? (PRIMARY_MESSAGE[confirmation.transition.action] ??
              "This updates the rescue assignment.")
            : ""
        }
        confirmLabel={confirmation?.label ?? "Confirm"}
        destructive={confirmation?.transition.action === "fail"}
        pending={pending}
        onCancel={() => setConfirmation(null)}
        onConfirm={handleConfirm}
      />
    </View>
  );
}

function HeroCard({ assignment }: { assignment: RescuerAssignment }) {
  const accent = URGENCY_ACCENT[assignment.urgency];
  const ink = URGENCY_INK[assignment.urgency];
  const done = assignment.status === "completed";
  const [expanded, setExpanded] = useState(false);
  const collapsible = assignment.description.length > 110;

  return (
    <View style={styles.hero}>
      <LinearGradient
        colors={[`${accent}2A`, "rgba(255,255,255,0.02)", `${accent}12`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroGlow}
      />
      <View
        pointerEvents="none"
        style={[styles.heroHighlight, { backgroundColor: `${accent}1F` }]}
      />

      <View style={styles.heroTop}>
        <View style={[styles.heroChip, { backgroundColor: `${accent}1F` }]}>
          <View style={[styles.heroChipDot, { backgroundColor: accent }]} />
          <Text style={[styles.heroChipText, { color: ink }]}>
            {URGENCY_LABEL[assignment.urgency]} priority
          </Text>
        </View>
        <Text style={styles.heroTime}>
          {done
            ? `Completed ${formatElapsed(assignment.completedAt ?? assignment.assignedAt)}`
            : `Assigned ${formatElapsed(assignment.assignedAt)}`}
        </Text>
      </View>

      {assignment.photoUrl ? (
        <View style={styles.photoWrap}>
          <Image
            source={{ uri: assignment.photoUrl }}
            style={styles.photo}
            contentFit="cover"
            transition={180}
          />
          <View pointerEvents="none" style={styles.photoTag}>
            <Text style={styles.photoTagText}>Reported photo</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.heroIdentity}>
        <View style={[styles.heroIcon, { borderColor: `${accent}5A` }]}>
          <PawIcon size={24} color={ink} />
        </View>
        <View style={styles.heroIdentityText}>
          <Text style={styles.heroAnimal}>
            {SPECIES_LABEL[assignment.species]}
          </Text>
          <Text style={styles.heroSub}>
            {REPORT_TYPE_LABEL[assignment.reportType]} ·{" "}
            {STATUS_LABEL[assignment.status]}
          </Text>
        </View>
      </View>

      <Text
        style={styles.heroDescription}
        numberOfLines={collapsible && !expanded ? 3 : undefined}
      >
        {assignment.description}
      </Text>

      {collapsible ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            expanded ? "Show less of the report description" : "Show full report description"
          }
          onPress={() => setExpanded((value) => !value)}
          style={({ pressed }) => [
            styles.descriptionToggle,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.descriptionToggleText}>
            {expanded ? "Show less" : "Read full description"}
          </Text>
          <View
            style={expanded ? styles.descriptionChevronOpen : undefined}
          >
            <ChevronDownIcon size={13} color={Brand.moss} />
          </View>
        </Pressable>
      ) : null}

      <View style={styles.heroDivider} />

      <View style={styles.heroFooter}>
        <View style={styles.heroLocation}>
          <MapPinIcon size={14} color={Brand.ink55} />
          <Text style={styles.heroLocationText} numberOfLines={1}>
            {assignment.barangay ?? "Unmapped location"}
          </Text>
        </View>
        {assignment.distanceKm !== null ? (
          <View style={styles.distancePill}>
            <Text style={styles.distanceText}>
              {assignment.distanceKm} km away
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function SectionHeader({ label, hint }: { label: string; hint?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
    </View>
  );
}

function InfoTile({
  icon,
  label,
  value,
  accent,
  dot,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
  accent?: string;
  dot?: string;
}) {
  return (
    <View style={styles.infoTile}>
      <View style={styles.infoLabelRow}>
        {icon ?? null}
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <View style={styles.infoValueRow}>
        {dot ? (
          <View style={[styles.infoDot, { backgroundColor: dot }]} />
        ) : null}
        <Text style={[styles.infoValue, accent ? { color: accent } : null]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function LocationCard({ assignment }: { assignment: RescuerAssignment }) {
  const latitude =
    typeof assignment.latitude === "number" ? assignment.latitude : null;
  const longitude =
    typeof assignment.longitude === "number" ? assignment.longitude : null;
  const hasLocation = latitude !== null && longitude !== null;

  return (
    <View style={styles.locationCard}>
      <View style={styles.locationHead}>
        <View style={styles.locationIcon}>
          <MapPinIcon size={16} color={Brand.moss} />
        </View>
        <Text style={styles.locationLabel}>Location</Text>
      </View>

      <View style={styles.locationMap}>
        {hasLocation ? (
          <ReportLocationMap
            latitude={latitude}
            longitude={longitude}
            label={assignment.barangay ?? "Report location"}
            detail={assignment.landmark ?? assignment.description}
            pinColor={URGENCY_ACCENT[assignment.urgency]}
          />
        ) : (
          <View style={styles.mapFallback}>
            <MapPinIcon size={22} color={Brand.ink55} />
            <Text style={styles.mapFallbackTitle}>Map point unavailable</Text>
            <Text style={styles.mapFallbackBody}>
              This report has no coordinates yet. Pull to refresh or check the
              landmark below.
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.locationTitle}>
        {assignment.barangay ?? "Unmapped location"}
      </Text>
      <Text style={styles.locationBody}>
        {assignment.landmark ?? "No landmark was provided for this report."}
      </Text>
      <View style={styles.locationFooter}>
        <Text style={styles.locationMeta}>
          {hasLocation
            ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
            : "Coordinates unavailable"}
        </Text>
        <Text style={styles.locationMeta}>
          {assignment.distanceKm !== null
            ? `${assignment.distanceKm} km away`
            : capitalize(assignment.reportType)}
        </Text>
      </View>
    </View>
  );
}

function DashedConnector({ active }: { active: boolean }) {
  return (
    <View style={styles.connector}>
      {[0, 1].map((segment) => (
        <View
          key={segment}
          style={[styles.connectorDash, active && styles.connectorDashActive]}
        />
      ))}
    </View>
  );
}

function Timeline({ status }: { status: AssignmentStatus }) {
  const current = FLOW.indexOf(status);
  const terminal = status === "declined" || status === "failed";

  if (terminal) {
    return (
      <View style={styles.terminalCard}>
        <View style={styles.flowHead}>
          <Text style={styles.flowEyebrow}>Progress</Text>
          <View style={styles.terminalChip}>
            <View style={styles.terminalDot} />
            <Text style={styles.terminalChipText}>{STATUS_LABEL[status]}</Text>
          </View>
        </View>
        <Text style={styles.terminalTitle}>{STATUS_LABEL[status]}</Text>
        <Text style={styles.terminalBody}>
          This assignment is closed. No further field actions are available.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.flowCard}>
      <View style={styles.flowHead}>
        <Text style={styles.flowEyebrow}>Progress</Text>
        <View style={styles.flowCurrentChip}>
          <View style={styles.flowCurrentDot} />
          <Text style={styles.flowCurrentText}>{STATUS_LABEL[status]}</Text>
        </View>
      </View>

      <View style={styles.flowTrack}>
        {FLOW.map((step, index) => {
          const done = index <= current;
          const isCurrent = index === current;

          return (
            <Fragment key={step}>
              {index > 0 ? (
                <DashedConnector active={index <= current} />
              ) : null}
              <View style={styles.flowStep}>
                <View
                  style={[
                    styles.flowNode,
                    done && styles.flowNodeDone,
                    isCurrent && styles.flowNodeCurrent,
                  ]}
                >
                  {index < current ? (
                    <CheckIcon
                      size={14}
                      color={Brand.forest}
                      strokeWidth={3}
                    />
                  ) : (
                    <Text
                      style={[
                        styles.flowNodeText,
                        done && styles.flowNodeTextDone,
                        isCurrent && styles.flowNodeTextCurrent,
                      ]}
                    >
                      {index + 1}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.flowLabel,
                    done && styles.flowLabelDone,
                    isCurrent && styles.flowLabelCurrent,
                  ]}
                  numberOfLines={1}
                >
                  {STEP_LABEL[index]}
                </Text>
              </View>
            </Fragment>
          );
        })}
      </View>

      <View style={styles.loopTrack}>
        {Array.from({ length: 24 }, (_, index) => (
          <View key={index} style={styles.loopDash} />
        ))}
        <View pointerEvents="none" style={styles.loopMarkerWrap}>
          <View style={styles.loopDiamond} />
        </View>
      </View>
      <Text style={styles.loopHint}>
        Rescue loop · closes once the case is completed
      </Text>
    </View>
  );
}

function OutcomeCard({
  notes,
  onNotesChange,
  animalsRescued,
  onIncrement,
  onDecrement,
}: {
  notes: string;
  onNotesChange: (value: string) => void;
  animalsRescued: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <View style={styles.outcomeCard}>
      <View style={styles.outcomeHead}>
        <Text style={styles.outcomeEyebrow}>Close out</Text>
        <Text style={styles.outcomeTitle}>Capture the outcome</Text>
        <Text style={styles.outcomeHint}>
          Notes and rescued animals are shared with the dispatch team and the
          reporter.
        </Text>
      </View>

      <Text style={styles.fieldLabel}>Outcome notes</Text>
      <TextInput
        value={notes}
        onChangeText={onNotesChange}
        placeholder="What did you find? Any animals rescued?"
        placeholderTextColor={Brand.ink55}
        multiline
        style={styles.notesInput}
      />

      <View style={styles.stepperRow}>
        <View style={styles.stepperCopy}>
          <Text style={styles.fieldLabel}>Animals rescued</Text>
          <Text style={styles.stepperHint}>Brought to safety on this call</Text>
        </View>
        <View style={styles.stepper}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remove a rescued animal"
            disabled={animalsRescued === 0}
            onPress={onDecrement}
            style={({ pressed }) => [
              styles.stepperButton,
              animalsRescued === 0 && styles.stepperButtonDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.stepperSymbol}>−</Text>
          </Pressable>
          <Text style={styles.stepperValue}>{animalsRescued}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add a rescued animal"
            onPress={onIncrement}
            style={({ pressed }) => [
              styles.stepperButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.stepperSymbol}>+</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function ActionBar({
  assignment,
  pending,
  onPrimary,
  onDecline,
  onFail,
}: {
  assignment: RescuerAssignment;
  pending: boolean;
  onPrimary: (assignment: RescuerAssignment) => void;
  onDecline: () => void;
  onFail: () => void;
}) {
  const action = assignment.nextAction;
  const isPending = assignment.status === "pending";
  const canFail =
    assignment.status === "accepted" ||
    assignment.status === "en_route" ||
    assignment.status === "on_site";
  const onSecondary = isPending ? onDecline : canFail ? onFail : null;

  if (!action && !onSecondary) return null;

  return (
    <View style={styles.actionBar}>
      {onSecondary ? (
        <Pressable
          accessibilityRole="button"
          disabled={pending}
          onPress={onSecondary}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed,
            pending && styles.disabled,
          ]}
        >
          <Text style={styles.secondaryText}>
            {isPending ? "Decline" : "Report problem"}
          </Text>
        </Pressable>
      ) : null}

      {action ? (
        <Pressable
          accessibilityRole="button"
          disabled={pending}
          onPress={() => onPrimary(assignment)}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryPressed,
            pending && styles.disabled,
          ]}
        >
          <Text style={styles.primaryText}>
            {pending ? "Saving…" : ACTION_LABEL[action]}
          </Text>
          <ArrowUpRightIcon size={15} color={Brand.paper} />
        </Pressable>
      ) : null}
    </View>
  );
}

function SkeletonBlock({
  shimmer,
  style,
  dark = false,
}: {
  shimmer: Animated.Value;
  style?: StyleProp<ViewStyle>;
  dark?: boolean;
}) {
  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 400],
  });

  return (
    <View style={[styles.skelBlock, dark && styles.skelBlockDark, style]}>
      <Animated.View
        pointerEvents="none"
        style={[styles.skelShimmer, { transform: [{ translateX }] }]}
      >
        <LinearGradient
          colors={[
            "rgba(255,255,255,0)",
            dark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.7)",
            "rgba(255,255,255,0)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.skelGradient}
        />
      </Animated.View>
    </View>
  );
}

function AssignmentSkeleton() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [shimmer]);

  return (
    <>
      <View style={styles.hero}>
        <View style={styles.skelRowBetween}>
          <SkeletonBlock shimmer={shimmer} style={styles.skelChip} />
          <SkeletonBlock shimmer={shimmer} style={styles.skelTime} />
        </View>

        <SkeletonBlock shimmer={shimmer} style={styles.skelPhoto} />

        <View style={styles.skelIdentity}>
          <SkeletonBlock shimmer={shimmer} style={styles.skelIcon} />
          <View style={styles.skelIdentityText}>
            <SkeletonBlock shimmer={shimmer} style={styles.skelAnimal} />
            <SkeletonBlock shimmer={shimmer} style={styles.skelSub} />
          </View>
        </View>

        <SkeletonBlock shimmer={shimmer} style={styles.skelLineWide} />
        <SkeletonBlock shimmer={shimmer} style={styles.skelLineWide} />
        <SkeletonBlock shimmer={shimmer} style={styles.skelLineShort} />

        <View style={styles.skelDivider} />

        <View style={styles.skelRowBetween}>
          <SkeletonBlock shimmer={shimmer} style={styles.skelFooter} />
          <SkeletonBlock shimmer={shimmer} style={styles.skelPill} />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <SkeletonBlock shimmer={shimmer} style={styles.skelSectionTitle} />
      </View>

      <View style={styles.detailGrid}>
        {[0, 1, 2, 3].map((tile) => (
          <View key={tile} style={[styles.infoTile, styles.skelInfoTile]}>
            <SkeletonBlock shimmer={shimmer} style={styles.skelInfoLabel} />
            <SkeletonBlock shimmer={shimmer} style={styles.skelInfoValue} />
          </View>
        ))}
      </View>

      <View style={styles.locationCard}>
        <View style={styles.skelRow}>
          <SkeletonBlock shimmer={shimmer} style={styles.skelIconSmall} />
          <SkeletonBlock shimmer={shimmer} style={styles.skelLabel} />
        </View>
        <SkeletonBlock shimmer={shimmer} style={styles.skelMap} />
        <SkeletonBlock shimmer={shimmer} style={styles.skelLocationTitle} />
        <SkeletonBlock shimmer={shimmer} style={styles.skelLineWide} />
        <SkeletonBlock shimmer={shimmer} style={styles.skelLineShort} />
      </View>

      <View style={styles.flowCard}>
        <View style={styles.skelRowBetween}>
          <SkeletonBlock shimmer={shimmer} dark style={styles.skelLabel} />
          <SkeletonBlock shimmer={shimmer} dark style={styles.skelChip} />
        </View>
        <View style={styles.flowTrack}>
          {[0, 1, 2, 3, 4].map((step) => (
            <Fragment key={step}>
              {step > 0 ? (
                <View style={styles.connector}>
                  <View style={styles.connectorDash} />
                  <View style={styles.connectorDash} />
                </View>
              ) : null}
              <View style={styles.flowStep}>
                <SkeletonBlock
                  shimmer={shimmer}
                  dark
                  style={styles.skelFlowNode}
                />
                <SkeletonBlock
                  shimmer={shimmer}
                  dark
                  style={styles.skelFlowLabel}
                />
              </View>
            </Fragment>
          ))}
        </View>
        <View style={styles.loopTrack}>
          {Array.from({ length: 24 }, (_, index) => (
            <View key={index} style={styles.loopDash} />
          ))}
        </View>
      </View>

      <SkeletonBlock shimmer={shimmer} style={styles.skelActionButton} />
    </>
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
  header: {
    height: 62,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    gap: 1,
  },
  back: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    letterSpacing: 0.4,
    color: Brand.ink55,
  },
  headerCode: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    letterSpacing: 0.7,
    color: Brand.ink,
  },
  pressed: {
    opacity: 0.6,
  },
  content: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingBottom: 24,
  },
  hero: {
    borderRadius: 26,
    backgroundColor: Brand.paper,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
    padding: 18,
    overflow: "hidden",
    shadowColor: "#10231A",
    shadowOpacity: 0.08,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  heroGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroHighlight: {
    position: "absolute",
    top: -50,
    right: -36,
    width: 170,
    height: 130,
    borderRadius: 999,
    opacity: 0.5,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  heroChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  heroChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  heroChipText: {
    fontFamily: FontFamily.semibold,
    fontSize: 9.5,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  heroTime: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: Brand.ink55,
  },
  heroIdentity: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  photoWrap: {
    marginTop: 14,
    height: 168,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: Brand.sand,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoTag: {
    position: "absolute",
    left: 10,
    bottom: 10,
    height: 24,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoTagText: {
    fontFamily: FontFamily.semibold,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: Brand.ink70,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.72)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroIdentityText: {
    flex: 1,
    gap: 3,
  },
  heroAnimal: {
    fontFamily: FontFamily.semibold,
    fontSize: 21,
    letterSpacing: -0.4,
    color: Brand.ink,
  },
  heroSub: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: Brand.ink55,
  },
  heroDescription: {
    marginTop: 14,
    fontFamily: FontFamily.semibold,
    fontSize: 17,
    lineHeight: 24,
    letterSpacing: -0.2,
    color: Brand.ink,
  },
  descriptionToggle: {
    marginTop: 8,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: Brand.sand,
  },
  descriptionToggleText: {
    fontFamily: FontFamily.semibold,
    fontSize: 10.5,
    color: Brand.moss,
  },
  descriptionChevronOpen: {
    transform: [{ rotate: "180deg" }],
  },
  heroDivider: {
    marginTop: 16,
    height: 1,
    backgroundColor: "rgba(16,36,26,0.08)",
  },
  heroFooter: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  heroLocation: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroLocationText: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: Brand.ink55,
  },
  distancePill: {
    height: 24,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: Brand.sand,
    alignItems: "center",
    justifyContent: "center",
  },
  distanceText: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: Brand.moss,
  },
  sectionHeader: {
    marginTop: 22,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 10,
  },
  sectionLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 15,
    letterSpacing: -0.2,
    color: Brand.ink,
  },
  sectionHint: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    letterSpacing: 0.4,
    color: Brand.ink55,
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  infoTile: {
    flexGrow: 1,
    flexBasis: "46%",
    minHeight: 74,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    paddingVertical: 13,
    paddingHorizontal: 14,
    gap: 10,
    justifyContent: "space-between",
  },
  infoLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  infoValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  infoDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  infoValue: {
    flexShrink: 1,
    fontFamily: FontFamily.semibold,
    fontSize: 15,
    letterSpacing: -0.2,
    color: Brand.ink,
  },
  locationCard: {
    marginTop: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    padding: 17,
  },
  locationHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  locationIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: Brand.sand,
    alignItems: "center",
    justifyContent: "center",
  },
  locationLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  locationMap: {
    marginTop: 12,
  },
  mapFallback: {
    height: 172,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.sand,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    gap: 6,
  },
  mapFallbackTitle: {
    marginTop: 2,
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    color: Brand.ink,
  },
  mapFallbackBody: {
    textAlign: "center",
    fontFamily: FontFamily.sans,
    fontSize: 11,
    lineHeight: 16,
    color: Brand.ink55,
  },
  locationTitle: {
    marginTop: 12,
    fontFamily: FontFamily.semibold,
    fontSize: 17,
    letterSpacing: -0.2,
    color: Brand.ink,
  },
  locationBody: {
    marginTop: 5,
    fontFamily: FontFamily.sans,
    fontSize: 13,
    lineHeight: 19,
    color: Brand.ink70,
  },
  locationFooter: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  locationMeta: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: Brand.ink55,
  },
  flowCard: {
    marginTop: 12,
    borderRadius: 24,
    backgroundColor: "#0F1B14",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 18,
    overflow: "hidden",
  },
  flowHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 10,
  },
  flowEyebrow: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.45)",
  },
  flowCurrentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 24,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: "rgba(198,232,123,0.14)",
  },
  flowCurrentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#C6E87B",
  },
  flowCurrentText: {
    fontFamily: FontFamily.semibold,
    fontSize: 9.5,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#C6E87B",
  },
  flowTrack: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  connector: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 3,
    minWidth: 6,
    marginTop: 19,
    marginHorizontal: 2,
  },
  connectorDash: {
    width: 4,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  connectorDashActive: {
    backgroundColor: "rgba(198,232,123,0.55)",
  },
  flowStep: {
    width: 44,
    alignItems: "center",
  },
  flowNode: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  flowNodeDone: {
    borderColor: "rgba(198,232,123,0.4)",
    backgroundColor: "rgba(198,232,123,0.14)",
  },
  flowNodeCurrent: {
    borderColor: "#C6E87B",
    backgroundColor: "#C6E87B",
    shadowColor: "#C6E87B",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  flowNodeText: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
  },
  flowNodeTextDone: {
    color: "#C6E87B",
  },
  flowNodeTextCurrent: {
    color: Brand.forest,
  },
  flowLabel: {
    marginTop: 8,
    fontFamily: FontFamily.medium,
    fontSize: 8.5,
    letterSpacing: 0.3,
    color: "rgba(255,255,255,0.4)",
  },
  flowLabelDone: {
    color: "rgba(255,255,255,0.72)",
  },
  flowLabelCurrent: {
    color: "#C6E87B",
  },
  loopTrack: {
    marginTop: 20,
    height: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  loopDash: {
    width: 4,
    height: 1,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  loopMarkerWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  loopDiamond: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: "#F2B264",
    transform: [{ rotate: "45deg" }],
  },
  loopHint: {
    marginTop: 8,
    textAlign: "center",
    fontFamily: FontFamily.medium,
    fontSize: 8.5,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.32)",
  },
  terminalCard: {
    marginTop: 12,
    borderRadius: 24,
    backgroundColor: "#0F1B14",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 18,
  },
  terminalChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 24,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: "rgba(255,118,100,0.14)",
  },
  terminalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF7664",
  },
  terminalChipText: {
    fontFamily: FontFamily.semibold,
    fontSize: 9.5,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#FF9A8B",
  },
  terminalTitle: {
    marginTop: 2,
    fontFamily: FontFamily.semibold,
    fontSize: 17,
    color: Brand.paper,
  },
  terminalBody: {
    marginTop: 6,
    fontFamily: FontFamily.sans,
    fontSize: 12.5,
    lineHeight: 19,
    color: "rgba(255,255,255,0.55)",
  },
  outcomeCard: {
    marginTop: 12,
    borderRadius: 22,
    backgroundColor: Brand.paper,
    borderWidth: 1,
    borderColor: Brand.line,
    padding: 18,
  },
  outcomeHead: {
    gap: 4,
  },
  outcomeEyebrow: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Brand.clay,
  },
  outcomeTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 17,
    letterSpacing: -0.2,
    color: Brand.ink,
  },
  outcomeHint: {
    fontFamily: FontFamily.sans,
    fontSize: 11.5,
    lineHeight: 17,
    color: Brand.ink55,
  },
  fieldLabel: {
    marginTop: 14,
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  notesInput: {
    marginTop: 8,
    minHeight: 82,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper2,
    padding: 12,
    fontFamily: FontFamily.sans,
    fontSize: 13.5,
    lineHeight: 20,
    color: Brand.ink,
    textAlignVertical: "top",
  },
  stepperRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  stepperCopy: {
    flex: 1,
  },
  stepperHint: {
    marginTop: 3,
    fontFamily: FontFamily.sans,
    fontSize: 11,
    color: Brand.ink55,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 40,
    paddingHorizontal: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper2,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Brand.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButtonDisabled: {
    opacity: 0.4,
  },
  stepperSymbol: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    color: Brand.ink,
  },
  stepperValue: {
    minWidth: 22,
    textAlign: "center",
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    color: Brand.ink,
  },
  error: {
    marginTop: 16,
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: "#B4462F",
  },
  actionBar: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: Brand.line,
    backgroundColor: Brand.paper2,
    gap: 10,
  },
  primaryButton: {
    height: 52,
    borderRadius: 999,
    backgroundColor: Brand.forest,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  primaryPressed: {
    opacity: 0.88,
  },
  primaryText: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Brand.paper,
  },
  secondaryButton: {
    height: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.line,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: Brand.ink70,
  },
  disabled: {
    opacity: 0.5,
  },
  stateWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 22,
  },
  stateTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
    color: Brand.ink,
  },
  stateLink: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: Brand.clay,
  },
  skelBlock: {
    backgroundColor: "rgba(16,36,26,0.06)",
    borderRadius: 7,
    overflow: "hidden",
  },
  skelBlockDark: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  skelShimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 180,
  },
  skelGradient: {
    flex: 1,
  },
  skelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  skelRowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  skelChip: {
    width: 96,
    height: 26,
    borderRadius: 999,
  },
  skelTime: {
    width: 72,
    height: 11,
  },
  skelPhoto: {
    marginTop: 14,
    width: "100%",
    height: 168,
    borderRadius: 18,
  },
  skelIdentity: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  skelIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
  },
  skelIdentityText: {
    flex: 1,
    gap: 8,
  },
  skelAnimal: {
    width: "52%",
    height: 18,
  },
  skelSub: {
    width: "38%",
    height: 11,
  },
  skelLineWide: {
    marginTop: 12,
    width: "100%",
    height: 13,
  },
  skelLineShort: {
    marginTop: 8,
    width: "66%",
    height: 13,
  },
  skelDivider: {
    marginTop: 16,
    height: 1,
    backgroundColor: "rgba(16,36,26,0.08)",
  },
  skelFooter: {
    width: 128,
    height: 11,
  },
  skelPill: {
    width: 62,
    height: 24,
    borderRadius: 999,
  },
  skelSectionTitle: {
    width: 116,
    height: 15,
  },
  skelInfoTile: {
    justifyContent: "space-between",
  },
  skelInfoLabel: {
    width: 52,
    height: 9,
  },
  skelInfoValue: {
    width: "68%",
    height: 15,
  },
  skelIconSmall: {
    width: 30,
    height: 30,
    borderRadius: 10,
  },
  skelLabel: {
    width: 64,
    height: 10,
  },
  skelMap: {
    marginTop: 12,
    width: "100%",
    height: 172,
    borderRadius: 18,
  },
  skelLocationTitle: {
    marginTop: 12,
    width: "46%",
    height: 16,
  },
  skelFlowNode: {
    width: 40,
    height: 40,
    borderRadius: 13,
  },
  skelFlowLabel: {
    marginTop: 8,
    width: 30,
    height: 8,
    borderRadius: 4,
  },
  skelActionButton: {
    marginTop: 20,
    width: "100%",
    height: 52,
    borderRadius: 999,
  },
});
