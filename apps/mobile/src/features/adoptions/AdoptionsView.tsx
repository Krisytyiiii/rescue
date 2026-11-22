import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
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
import { ChevronDownIcon, HomeIcon, PawIcon } from "@/components/icons";
import { Skeleton } from "@/components/skeleton";
import { Brand, FontFamily } from "@/constants/theme";
import type { AdoptionRequest, AdoptionStatus } from "@/domain/adoptions";

import {
  ADOPTION_STATUS_LABEL,
  ADOPTION_STATUS_ORDER,
  ADOPTION_STATUS_TONE,
  adopterContact,
  animalName,
  animalPhoto,
  FOLLOWUP_METHOD_LABEL,
  formatDate,
  formatDateTime,
  HOUSING_LABEL,
  INTERVIEW_VENUE,
  personName,
  yesNo,
} from "./presentation";
import { useAdoptionsViewModel } from "./useAdoptionsViewModel";

type Filter = "all" | AdoptionStatus;

export function AdoptionsView() {
  const router = useRouter();
  const { adoptions, loading, error, reload } = useAdoptionsViewModel();
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const counts = useMemo(() => {
    const base = { all: adoptions.length } as Record<Filter, number>;
    for (const status of ADOPTION_STATUS_ORDER) {
      base[status] = adoptions.filter((item) => item.status === status).length;
    }
    return base;
  }, [adoptions]);

  const visible = useMemo(
    () =>
      filter === "all"
        ? adoptions
        : adoptions.filter((item) => item.status === filter),
    [adoptions, filter],
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <View style={styles.headerWrap}>
          <View style={styles.header}>
            <BackButton onPress={() => router.back()} />

            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Adoptions</Text>
              {loading ? (
                <Skeleton
                  width={124}
                  height={9}
                  borderRadius={4}
                  style={styles.headerMetaSkeleton}
                />
              ) : (
                <Text style={styles.headerMeta}>
                  {`${adoptions.length} application${adoptions.length === 1 ? "" : "s"}`}
                </Text>
              )}
            </View>

            <View style={styles.headerBadge}>
              <HomeIcon size={17} color="#C4791B" />
            </View>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.intro}>
            <Text style={styles.introEyebrow}>Read-only</Text>
            <Text style={styles.introBody}>
              Every adoption application and where it stands — from submitted
              and interview to approved, completed, or closed. Actions stay with
              the admin team.
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
          >
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <Skeleton
                  key={index}
                  width={index === 0 ? 62 : 84}
                  height={34}
                  borderRadius={999}
                />
              ))
            ) : (
              <>
                <FilterChip
                  label="All"
                  count={counts.all}
                  active={filter === "all"}
                  onPress={() => setFilter("all")}
                />
                {ADOPTION_STATUS_ORDER.map((status) => (
                  <FilterChip
                    key={status}
                    label={ADOPTION_STATUS_LABEL[status]}
                    count={counts[status]}
                    active={filter === status}
                    onPress={() => setFilter(status)}
                  />
                ))}
              </>
            )}
          </ScrollView>

          {error && adoptions.length === 0 ? (
            <Text style={styles.error}>{error}</Text>
          ) : null}

          {loading && adoptions.length === 0 ? (
            <View style={styles.list}>
              {Array.from({ length: 3 }).map((_, index) => (
                <ApplicationSkeleton key={index} />
              ))}
            </View>
          ) : visible.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                {adoptions.length === 0
                  ? "No applications yet"
                  : "No applications in this status"}
              </Text>
              <Text style={styles.emptyBody}>
                {adoptions.length === 0
                  ? "Adoption applications will appear here as residents apply."
                  : "Choose another status filter to see the rest of the list."}
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {visible.map((request) => (
                <AdoptionCard
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
          <Skeleton width="78%" height={9} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

function FilterChip({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
      <Text style={[styles.chipCount, active && styles.chipCountActive]}>
        {count}
      </Text>
    </Pressable>
  );
}

function AdoptionCard({
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
            <Text style={styles.applicant} numberOfLines={1}>
              {personName(request.adopter)}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {HOUSING_LABEL[request.housingType]} · Submitted{" "}
              {formatDate(request.createdAt)}
            </Text>
          </View>

          <View
            style={[
              styles.chevron,
              expanded && styles.chevronExpanded,
            ]}
          >
            <ChevronDownIcon size={16} color={Brand.ink55} />
          </View>
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.detail}>
          <DetailSection label="Applicant">
            <Fact label="Name" value={personName(request.adopter)} />
            <Fact label="Contact" value={adopterContact(request)} />
          </DetailSection>

          <DetailSection label="Home">
            <Fact label="Housing" value={HOUSING_LABEL[request.housingType]} />
            <Fact label="Owns property" value={yesNo(request.isOwnedProperty)} />
            <Fact label="Fenced area" value={yesNo(request.hasFencedArea)} />
            <Fact
              label="Household"
              value={
                request.householdMembers === null
                  ? "Not answered"
                  : `${request.householdMembers} member${request.householdMembers === 1 ? "" : "s"}`
              }
            />
            <Fact label="Other pets" value={yesNo(request.hasOtherPets)} />
            <Fact
              label="Prior experience"
              value={request.priorPetExperience ?? "Not answered"}
            />
          </DetailSection>

          <Text style={styles.blockLabel}>Reason for adopting</Text>
          <Text style={styles.blockBody}>{request.reasonForAdopting}</Text>

          {request.otherPetsDetails ? (
            <>
              <Text style={styles.blockLabel}>Other pets at home</Text>
              <Text style={styles.blockBody}>{request.otherPetsDetails}</Text>
            </>
          ) : null}

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
            <Fact label="Interview venue" value={INTERVIEW_VENUE} />
            <Fact
              label="Reviewer"
              value={request.reviewer ? personName(request.reviewer) : "Not assigned"}
            />
            <Fact label="Reviewed" value={formatDate(request.reviewedAt)} />
            {request.releaseDate ? (
              <Fact label="Release date" value={formatDate(request.releaseDate)} />
            ) : null}
          </DetailSection>

          {request.decisionRemarks ? (
            <>
              <Text style={styles.blockLabel}>Decision notes</Text>
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
  headerMeta: {
    marginTop: 2,
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  headerMetaSkeleton: {
    marginTop: 5,
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
  intro: {
    marginTop: 6,
    marginBottom: 16,
  },
  introEyebrow: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    letterSpacing: 1.3,
    textTransform: "uppercase",
    color: Brand.moss,
  },
  introBody: {
    marginTop: 6,
    fontFamily: FontFamily.sans,
    fontSize: 13,
    lineHeight: 20,
    color: Brand.ink70,
  },
  filters: {
    gap: 8,
    paddingRight: 22,
    paddingBottom: 16,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 34,
    paddingHorizontal: 13,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
  },
  chipActive: {
    backgroundColor: Brand.forest,
    borderColor: Brand.forest,
  },
  chipText: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: Brand.ink70,
  },
  chipTextActive: {
    color: Brand.paper,
  },
  chipCount: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    color: Brand.ink55,
  },
  chipCountActive: {
    color: "rgba(255,255,255,0.6)",
  },
  error: {
    marginBottom: 14,
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: "#B4462F",
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
  applicant: {
    marginTop: 2,
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: Brand.ink70,
  },
  meta: {
    marginTop: 3,
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
  pressed: {
    opacity: 0.82,
  },
});
