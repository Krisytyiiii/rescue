import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  PawIcon,
} from "@/components/icons";
import { Skeleton } from "@/components/skeleton";
import { Brand, FontFamily } from "@/constants/theme";
import type { AdoptionRequest, AdoptionStatus } from "@/domain/adoptions";

import {
  ADOPTION_STATUS_LABEL,
  ADOPTION_STATUS_TONE,
  animalName,
  animalPhoto,
  FOLLOWUP_METHOD_LABEL,
  formatDate,
  formatDateTime,
  HOUSING_LABEL,
} from "./presentation";
import { useMyAdoptionsViewModel } from "./useMyAdoptionsViewModel";

/** The normal path an application follows before it is finished. */
const STATUS_STEPS: AdoptionStatus[] = [
  "submitted",
  "under_review",
  "interview_scheduled",
  "approved",
  "completed",
];

/**
 * Resident adoption tracking: every application the signed-in resident has
 * submitted, with its current stage and the team's updates.
 */
export function ResidentApplicationsView() {
  const router = useRouter();
  const { adoptions, loading, error, reload } = useMyAdoptionsViewModel();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <View style={styles.headerWrap}>
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              style={({ pressed }) => [styles.back, pressed && styles.pressed]}
            >
              <ChevronLeftIcon size={20} color={Brand.ink} />
            </Pressable>

            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>My applications</Text>
            </View>

            <View style={styles.headerBadge}>
              <PawIcon size={17} color="#6B4FC2" />
            </View>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.intro}>
            Track every adoption request you have sent — from the first review
            to the interview and the final decision.
          </Text>

          {error && adoptions.length === 0 ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void reload()}
                style={({ pressed }) => [styles.retry, pressed && styles.pressed]}
              >
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : null}

          {loading && adoptions.length === 0 ? (
            <View style={styles.list}>
              {Array.from({ length: 2 }).map((_, index) => (
                <ApplicationSkeleton key={index} />
              ))}
            </View>
          ) : !loading && adoptions.length === 0 && !error ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No applications yet</Text>
              <Text style={styles.emptyBody}>
                Apply to adopt an animal and your request will show up here so
                you can follow its progress.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.back()}
                style={({ pressed }) => [
                  styles.emptyAction,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.emptyActionText}>Browse adoptable animals</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.list}>
              {adoptions.map((request) => (
                <ApplicationCard
                  key={request.id}
                  request={request}
                  expanded={expandedId === request.id}
                  onToggle={() =>
                    setExpandedId((current) =>
                      current === request.id ? null : request.id,
                    )
                  }
                />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ApplicationCard({
  request,
  expanded,
  onToggle,
}: {
  request: AdoptionRequest;
  expanded: boolean;
  onToggle: () => void;
}) {
  const tone = ADOPTION_STATUS_TONE[request.status];
  const photo = animalPhoto(request.animal);

  return (
    <View style={[styles.card, expanded && styles.cardExpanded]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={onToggle}
        style={({ pressed }) => [styles.cardHead, pressed && styles.pressed]}
      >
        <View style={styles.cardTop}>
          <Text style={styles.requestCode}>{request.requestCode}</Text>
          <View style={[styles.statusChip, { backgroundColor: tone.background }]}>
            <View style={[styles.statusDot, { backgroundColor: tone.ink }]} />
            <Text style={[styles.statusText, { color: tone.ink }]}>
              {ADOPTION_STATUS_LABEL[request.status]}
            </Text>
          </View>
        </View>

        <View style={styles.cardMain}>
          <View style={styles.thumb}>
            {photo ? (
              <Image
                source={{ uri: photo }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            ) : (
              <PawIcon size={20} color={Brand.sage} />
            )}
          </View>

          <View style={styles.cardIdentity}>
            <Text style={styles.animalName} numberOfLines={1}>
              {animalName(request.animal)}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              Submitted {formatDate(request.createdAt)}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {HOUSING_LABEL[request.housingType]} home
            </Text>
          </View>

          <View style={[styles.chevron, expanded && styles.chevronExpanded]}>
            <ChevronDownIcon size={16} color={Brand.ink55} />
          </View>
        </View>

        <StatusTrack status={request.status} />
      </Pressable>

      {expanded ? (
        <View style={styles.detail}>
          <DetailSection label="Progress">
            <Fact label="Submitted" value={formatDate(request.createdAt)} />
            <Fact
              label="Interview"
              value={
                request.interviewSchedule
                  ? formatDateTime(request.interviewSchedule)
                  : "Not scheduled"
              }
            />
            <Fact label="Reviewed" value={formatDate(request.reviewedAt)} />
            <Fact
              label="Release date"
              value={
                request.releaseDate
                  ? formatDate(request.releaseDate)
                  : "Not set"
              }
            />
          </DetailSection>

          {request.decisionRemarks ? (
            <>
              <Text style={styles.blockLabel}>Notes from the team</Text>
              <Text style={styles.blockBody}>{request.decisionRemarks}</Text>
            </>
          ) : null}

          <Text style={styles.blockLabel}>Follow-ups</Text>
          {request.followups.length === 0 ? (
            <Text style={styles.blockEmpty}>No follow-ups recorded yet.</Text>
          ) : (
            <View style={styles.followups}>
              {request.followups.map((followup) => (
                <View key={followup.id} style={styles.followup}>
                  <View style={styles.followupTop}>
                    <Text style={styles.followupDate}>
                      {formatDate(followup.followupDate)}
                    </Text>
                    {followup.method ? (
                      <Text style={styles.followupMethod}>
                        {FOLLOWUP_METHOD_LABEL[followup.method]}
                      </Text>
                    ) : null}
                  </View>
                  {followup.animalCondition ? (
                    <Text style={styles.followupCondition}>
                      Condition · {followup.animalCondition}
                    </Text>
                  ) : null}
                  {followup.remarks ? (
                    <Text style={styles.followupRemarks}>{followup.remarks}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}

function StatusTrack({ status }: { status: AdoptionStatus }) {
  const closed = status === "rejected" || status === "withdrawn";
  const current = STATUS_STEPS.indexOf(status);

  if (closed) {
    return (
      <Text style={styles.closedNote}>
        This application was {ADOPTION_STATUS_LABEL[status].toLowerCase()}.
      </Text>
    );
  }

  return (
    <View style={styles.steps}>
      {STATUS_STEPS.map((step, index) => {
        const done = index <= current;
        return (
          <View key={step} style={styles.step}>
            <View style={[styles.stepDot, done && styles.stepDotDone]}>
              {done ? <CheckIcon size={8} color={Brand.paper} /> : null}
            </View>
            <Text
              style={[
                styles.stepLabel,
                done && styles.stepLabelDone,
                index === current && styles.stepLabelCurrent,
              ]}
              numberOfLines={2}
            >
              {ADOPTION_STATUS_LABEL[step]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function DetailSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.detailSection}>
      <Text style={styles.detailSectionLabel}>{label}</Text>
      <View style={styles.factGrid}>{children}</View>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue} numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}

function ApplicationSkeleton() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonTop}>
        <Skeleton width={92} height={9} borderRadius={4} />
        <Skeleton width={68} height={22} borderRadius={999} />
      </View>
      <View style={styles.skeletonMain}>
        <Skeleton width={54} height={54} borderRadius={15} />
        <View style={styles.skeletonIdentity}>
          <Skeleton width="64%" height={13} borderRadius={6} />
          <Skeleton width="46%" height={10} borderRadius={5} />
          <Skeleton width="72%" height={9} borderRadius={4} />
        </View>
      </View>
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
  headerWrap: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 6,
  },
  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  back: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: FontFamily.display,
    fontSize: 26,
    lineHeight: 28,
    letterSpacing: -0.6,
    color: Brand.ink,
  },
  headerBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: "rgba(255,255,255,0.72)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 140,
  },
  intro: {
    marginTop: 4,
    marginBottom: 18,
    fontFamily: FontFamily.sans,
    fontSize: 13,
    lineHeight: 20,
    color: Brand.ink70,
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
    padding: 14,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  requestCode: {
    flexShrink: 1,
    fontFamily: FontFamily.medium,
    fontSize: 10,
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
  cardMain: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  thumb: {
    width: 54,
    height: 54,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: Brand.sand,
    alignItems: "center",
    justifyContent: "center",
  },
  cardIdentity: {
    flex: 1,
  },
  animalName: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    letterSpacing: -0.2,
    color: Brand.ink,
  },
  meta: {
    marginTop: 2,
    fontFamily: FontFamily.sans,
    fontSize: 10.5,
    color: Brand.ink55,
  },
  chevron: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  chevronExpanded: {
    transform: [{ rotate: "180deg" }],
  },
  steps: {
    marginTop: 14,
    flexDirection: "row",
    gap: 4,
  },
  step: {
    flex: 1,
    alignItems: "center",
    gap: 5,
  },
  stepDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Brand.line,
    backgroundColor: Brand.paper2,
  },
  stepDotDone: {
    borderColor: Brand.forest,
    backgroundColor: Brand.forest,
  },
  stepLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 8,
    lineHeight: 10,
    textAlign: "center",
    color: Brand.ink55,
  },
  stepLabelDone: {
    color: Brand.ink70,
  },
  stepLabelCurrent: {
    color: Brand.forest,
  },
  closedNote: {
    marginTop: 12,
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: Brand.ink55,
  },
  detail: {
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 18,
    backgroundColor: Brand.forest,
    padding: 15,
  },
  detailSection: {
    marginBottom: 14,
  },
  detailSectionLabel: {
    marginBottom: 8,
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: Brand.sage,
  },
  factGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 10,
    columnGap: 10,
  },
  fact: {
    width: "47%",
    minWidth: 110,
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
    fontSize: 11.5,
    lineHeight: 16,
    color: Brand.paper,
  },
  blockLabel: {
    marginBottom: 5,
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: Brand.sage,
  },
  blockBody: {
    marginBottom: 14,
    fontFamily: FontFamily.sans,
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.72)",
  },
  blockEmpty: {
    fontFamily: FontFamily.sans,
    fontSize: 11.5,
    color: "rgba(255,255,255,0.55)",
  },
  followups: {
    gap: 8,
  },
  followup: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 10,
  },
  followupTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  followupDate: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: Brand.paper,
  },
  followupMethod: {
    fontFamily: FontFamily.medium,
    fontSize: 8.5,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: Brand.sage,
  },
  followupCondition: {
    marginTop: 4,
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: "rgba(255,255,255,0.66)",
  },
  followupRemarks: {
    marginTop: 4,
    fontFamily: FontFamily.sans,
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.55)",
  },
  skeletonCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    padding: 14,
  },
  skeletonTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  skeletonMain: {
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  skeletonIdentity: {
    flex: 1,
    gap: 7,
  },
  emptyCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    padding: 24,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
    color: Brand.ink,
  },
  emptyBody: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    lineHeight: 20,
    color: Brand.ink55,
  },
  emptyAction: {
    marginTop: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: Brand.forest,
  },
  emptyActionText: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: Brand.paper,
  },
  errorCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    padding: 16,
    gap: 10,
    marginBottom: 14,
  },
  errorText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 18,
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
  pressed: {
    opacity: 0.78,
  },
});
