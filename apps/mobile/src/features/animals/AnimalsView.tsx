import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CalendarIcon, CloseIcon, PawIcon } from "@/components/icons";
import { Skeleton } from "@/components/skeleton";
import { Brand, FontFamily } from "@/constants/theme";
import type { Animal } from "@/domain/animals";

import {
  ageLabel,
  animalName,
  capitalize,
  formatDate,
  formatMonthDay,
  HEALTH_RECORD_LABEL,
  humanize,
  LIFECYCLE_LABEL,
  LIFECYCLE_TONE,
  ORIGIN_LABEL,
  photoUrl,
  sexLabel,
  SPECIES_LABEL,
  weightLabel,
} from "./presentation";
import { useAnimalsViewModel } from "./useAnimalsViewModel";

const GUTTER = 16;

export function AnimalsView({
  showBack = true,
}: {
  showBack?: boolean;
} = {}) {
  const router = useRouter();
  const { animals, loading, error, reload } = useAnimalsViewModel();
  const [selected, setSelected] = useState<Animal | null>(null);
  const { width } = useWindowDimensions();

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const contentWidth = Math.min(width, 560) - 44;
  const cardWidth = Math.max(120, Math.floor((contentWidth - GUTTER) / 2));

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <View style={styles.headerWrap}>
          <View style={styles.header}>
            {showBack ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                onPress={() => router.back()}
                style={({ pressed }) => [styles.back, pressed && styles.pressed]}
              >
                <Text style={styles.backGlyph}>←</Text>
              </Pressable>
            ) : null}

            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Animals</Text>
              {loading ? (
                <Skeleton
                  width={112}
                  height={9}
                  borderRadius={4}
                  style={styles.headerMetaSkeleton}
                />
              ) : (
                <Text style={styles.headerMeta}>
                  {`${animals.length} animal${animals.length === 1 ? "" : "s"} in care`}
                </Text>
              )}
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
          <View style={styles.intro}>
            <Text style={styles.introEyebrow}>Read-only</Text>
            <Text style={styles.introBody}>
              Every rescued animal, their health records, and rescue history.
              Care records are maintained by the City Vet team.
            </Text>
          </View>

          {error && animals.length === 0 ? (
            <Text style={styles.error}>{error}</Text>
          ) : null}

          {loading && animals.length === 0 ? (
            <>
              <View style={styles.gridHeader}>
                <Skeleton width={128} height={14} borderRadius={7} />
                <Skeleton width={68} height={9} borderRadius={4} />
              </View>
              <View style={styles.grid}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton
                    key={index}
                    width={cardWidth}
                    height={cardWidth}
                    borderRadius={22}
                  />
                ))}
              </View>
            </>
          ) : animals.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No animals yet</Text>
              <Text style={styles.emptyBody}>
                Rescued animals will appear here once the City Vet team adds
                them to the registry.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.gridHeader}>
                <Text style={styles.gridLabel}>Rescued animals</Text>
                <Text style={styles.gridMeta}>{animals.length} records</Text>
              </View>
              <View style={styles.grid}>
                {animals.map((animal) => (
                  <AnimalCard
                    key={animal.id}
                    animal={animal}
                    width={cardWidth}
                    onOpen={() => setSelected(animal)}
                  />
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <AnimalDetailsOverlay
        animal={selected}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}

function AnimalCard({
  animal,
  width,
  onOpen,
}: {
  animal: Animal;
  width: number;
  onOpen: () => void;
}) {
  const uri = photoUrl(animal);
  const tone = LIFECYCLE_TONE[animal.lifecycleStatus];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${animalName(animal)}, ${LIFECYCLE_LABEL[animal.lifecycleStatus]}. View records.`}
      onPress={onOpen}
      style={({ pressed }) => [styles.cardWrap, { width }, pressed && styles.pressed]}
    >
      <View style={styles.card}>
        {uri ? (
          <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={["#244A35", "#0F3A24"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}

        <LinearGradient
          colors={["rgba(8,20,14,0)", "rgba(8,20,14,0.18)", "rgba(8,20,14,0.86)"]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />

        {uri ? null : (
          <View style={styles.cardFallback} pointerEvents="none">
            <PawIcon size={34} color="rgba(255,255,255,0.34)" />
          </View>
        )}

        <View style={styles.cardTop}>
          <View style={styles.statusChip}>
            <View style={[styles.statusDot, { backgroundColor: tone.ink }]} />
            <Text style={styles.statusText} numberOfLines={1}>
              {LIFECYCLE_LABEL[animal.lifecycleStatus]}
            </Text>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <Text style={styles.cardCode}>{animal.animalCode}</Text>
          <Text style={styles.cardName} numberOfLines={1}>
            {animalName(animal)}
          </Text>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {SPECIES_LABEL[animal.species]} · {ageLabel(animal.estimatedAgeMonths)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function AnimalDetailsOverlay({
  animal,
  onClose,
}: {
  animal: Animal | null;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={animal !== null}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.sheetBackdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Close animal records"
          onPress={onClose}
        />

        {animal ? (
          <View style={styles.sheet}>
            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetContent}
              showsVerticalScrollIndicator={false}
            >
              <AnimalHero animal={animal} onClose={onClose} />

              <View style={styles.sheetBody}>
                <AnimalFacts animal={animal} />

                {animal.description ? (
                  <Text style={styles.description}>{animal.description}</Text>
                ) : null}

                <RescueHistory animal={animal} />
                <HealthRecords animal={animal} />
                <Vaccinations animal={animal} />
                <HeartRate animal={animal} />
              </View>
            </ScrollView>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function AnimalHero({ animal, onClose }: { animal: Animal; onClose: () => void }) {
  const uri = photoUrl(animal);
  const tone = LIFECYCLE_TONE[animal.lifecycleStatus];

  return (
    <View style={styles.hero}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <LinearGradient
          colors={["#244A35", "#0F3A24"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      <LinearGradient
        colors={["rgba(8,20,14,0.10)", "rgba(8,20,14,0.20)", "rgba(8,20,14,0.88)"]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={onClose}
        style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
      >
        <CloseIcon size={18} color={Brand.ink} />
      </Pressable>

      <View style={styles.heroBottom}>
        <View style={styles.statusChip}>
          <View style={[styles.statusDot, { backgroundColor: tone.ink }]} />
          <Text style={styles.statusText}>
            {LIFECYCLE_LABEL[animal.lifecycleStatus]}
          </Text>
        </View>

        <Text style={styles.heroName} numberOfLines={2}>
          {animalName(animal)}
        </Text>
        <Text style={styles.heroMeta}>
          {animal.animalCode} · {SPECIES_LABEL[animal.species]} ·{" "}
          {capitalize(animal.breedType)}
        </Text>
      </View>
    </View>
  );
}

function AnimalFacts({ animal }: { animal: Animal }) {
  return (
    <View style={styles.section}>
      <SectionHeader label="Profile" meta="Read-only" />
      <View style={styles.factGrid}>
        <Fact label="Sex" value={sexLabel(animal.sex)} />
        <Fact label="Age" value={ageLabel(animal.estimatedAgeMonths)} />
        <Fact label="Size" value={animal.size ? capitalize(animal.size) : "Not recorded"} />
        <Fact label="Weight" value={weightLabel(animal.weightKg)} />
        <Fact label="Spay / neuter" value={animal.isNeutered ? "Yes" : "No"} />
        <Fact label="Microchip" value={animal.microchipNo ?? "Not recorded"} />
        <Fact label="Intake" value={formatDate(animal.intakeDate)} />
        <Fact label="Origin" value={ORIGIN_LABEL[animal.originType]} />
      </View>

      {animal.temperament ? (
        <Text style={styles.note}>Temperament · {animal.temperament}</Text>
      ) : null}
      {animal.colorMarkings ? (
        <Text style={styles.note}>Markings · {animal.colorMarkings}</Text>
      ) : null}
    </View>
  );
}

function RescueHistory({ animal }: { animal: Animal }) {
  const report = animal.sourceReport;

  return (
    <View style={styles.section}>
      <SectionHeader
        label="Rescue history"
        meta={report ? `${report.statusHistory.length} events` : "No report"}
      />

      {report ? (
        <>
          <View style={styles.reportRow}>
            <View style={styles.reportIdentity}>
              <Text style={styles.reportCode}>{report.reportCode}</Text>
              <Text style={styles.reportStatus}>
                {humanize(report.status)}
              </Text>
            </View>
            <CalendarIcon size={14} color={Brand.ink55} />
          </View>

          {report.statusHistory.length > 0 ? (
            <View style={styles.timeline}>
              {report.statusHistory.map((entry, index) => (
                <View key={entry.id} style={styles.timelineRow}>
                  <View style={styles.timelineRail}>
                    <View style={styles.timelineDot} />
                    {index < report.statusHistory.length - 1 ? (
                      <View style={styles.timelineLine} />
                    ) : null}
                  </View>
                  <View style={styles.timelineBody}>
                    <View style={styles.timelineTop}>
                      <Text style={styles.timelineTitle}>
                        {humanize(entry.newStatus)}
                      </Text>
                      <Text style={styles.timelineDate}>
                        {formatMonthDay(entry.changedAt)}
                      </Text>
                    </View>
                    {entry.remarks ? (
                      <Text style={styles.timelineNote}>{entry.remarks}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.recordEmpty}>
              No report updates have been recorded yet.
            </Text>
          )}
        </>
      ) : (
        <Text style={styles.recordEmpty}>
          This animal was not added from a community rescue report.
        </Text>
      )}
    </View>
  );
}

function HealthRecords({ animal }: { animal: Animal }) {
  return (
    <View style={styles.section}>
      <SectionHeader
        label="Health records"
        meta={`${animal.healthRecords.length} entries`}
      />

      {animal.healthRecords.length === 0 ? (
        <Text style={styles.recordEmpty}>No health records yet.</Text>
      ) : (
        <View style={styles.recordList}>
          {animal.healthRecords.map((record) => (
            <View key={record.id} style={styles.recordCard}>
              <View style={styles.recordHead}>
                <View style={styles.recordTypeChip}>
                  <Text style={styles.recordTypeText}>
                    {HEALTH_RECORD_LABEL[record.recordType] ?? humanize(record.recordType)}
                  </Text>
                </View>
                <Text style={styles.recordDate}>
                  {formatDate(record.recordDate)}
                </Text>
              </View>

              {record.diagnosis ? (
                <RecordLine label="Diagnosis" value={record.diagnosis} />
              ) : null}
              {record.treatment ? (
                <RecordLine label="Treatment" value={record.treatment} />
              ) : null}
              {record.medication ? (
                <RecordLine label="Medication" value={record.medication} />
              ) : null}
              {record.weightKg ? (
                <RecordLine label="Weight at visit" value={`${record.weightKg} kg`} />
              ) : null}
              {record.followUpDate ? (
                <RecordLine
                  label="Follow-up"
                  value={formatDate(record.followUpDate)}
                />
              ) : null}
              {record.remarks ? (
                <Text style={styles.recordRemarks}>{record.remarks}</Text>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function Vaccinations({ animal }: { animal: Animal }) {
  return (
    <View style={styles.section}>
      <SectionHeader
        label="Vaccinations"
        meta={`${animal.vaccinations.length} doses`}
      />

      {animal.vaccinations.length === 0 ? (
        <Text style={styles.recordEmpty}>No vaccinations recorded yet.</Text>
      ) : (
        <View style={styles.recordList}>
          {animal.vaccinations.map((vaccination) => (
            <View key={vaccination.id} style={styles.recordCard}>
              <View style={styles.recordHead}>
                <Text style={styles.vaccineName}>
                  {vaccination.vaccineName}
                </Text>
                <Text style={styles.recordDate}>
                  {formatDate(vaccination.dateGiven)}
                </Text>
              </View>

              <View style={styles.vaccineMeta}>
                {vaccination.doseNumber ? (
                  <Text style={styles.vaccineMetaText}>
                    Dose {vaccination.doseNumber}
                  </Text>
                ) : null}
                {vaccination.status ? (
                  <Text style={styles.vaccineMetaText}>
                    {humanize(vaccination.status)}
                  </Text>
                ) : null}
                {vaccination.nextDueDate ? (
                  <Text style={styles.vaccineMetaText}>
                    Next due {formatDate(vaccination.nextDueDate)}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function HeartRate({ animal }: { animal: Animal }) {
  const latest = animal.heartRateLogs[0];

  return (
    <View style={styles.section}>
      <SectionHeader label="Heart rate" meta={latest ? "Latest" : "No reading"} />

      {latest ? (
        <View style={styles.heartCard}>
          <View>
            <Text style={styles.heartValue}>{latest.heartRateBpm}</Text>
            <Text style={styles.heartUnit}>beats per minute</Text>
          </View>
          <View style={styles.heartMeta}>
            <Text style={styles.heartMetaText}>
              {formatDate(latest.measuredAt)}
            </Text>
            {latest.measurementContext ? (
              <Text style={styles.heartMetaText}>
                {humanize(latest.measurementContext)}
              </Text>
            ) : null}
            {latest.isFlagged ? (
              <Text style={styles.heartFlag}>Flagged for review</Text>
            ) : null}
          </View>
        </View>
      ) : (
        <Text style={styles.recordEmpty}>No heart rate reading yet.</Text>
      )}
    </View>
  );
}

function SectionHeader({ label, meta }: { label: string; meta: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{label}</Text>
      <Text style={styles.sectionMeta}>{meta}</Text>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function RecordLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.recordLine}>
      <Text style={styles.recordLabel}>{label}</Text>
      <Text style={styles.recordValue}>{value}</Text>
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
  backGlyph: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    color: Brand.ink,
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
    marginBottom: 20,
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
  error: {
    marginBottom: 14,
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: "#B4462F",
  },
  gridHeader: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  gridLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Brand.ink,
  },
  gridMeta: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GUTTER,
  },
  cardWrap: {
    borderRadius: 22,
  },
  card: {
    aspectRatio: 1,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: Brand.forest,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    shadowColor: "#10231A",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  cardFallback: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 48,
  },
  cardTop: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    alignItems: "flex-start",
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    maxWidth: "100%",
    height: 24,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.94)",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    flexShrink: 1,
    fontFamily: FontFamily.medium,
    fontSize: 9,
    letterSpacing: 0.55,
    textTransform: "uppercase",
    color: Brand.ink,
  },
  cardBottom: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
  },
  cardCode: {
    fontFamily: FontFamily.medium,
    fontSize: 8.5,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.62)",
  },
  cardName: {
    marginTop: 3,
    fontFamily: FontFamily.display,
    fontSize: 22,
    lineHeight: 24,
    letterSpacing: -0.4,
    color: Brand.paper,
  },
  cardMeta: {
    marginTop: 3,
    fontFamily: FontFamily.sans,
    fontSize: 10.5,
    color: "rgba(255,255,255,0.72)",
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
  sheetBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(8,20,14,0.5)",
  },
  sheet: {
    maxHeight: "92%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: Brand.paper,
    overflow: "hidden",
  },
  sheetScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  sheetContent: {
    paddingBottom: 40,
  },
  hero: {
    height: 230,
    justifyContent: "flex-end",
    overflow: "hidden",
    backgroundColor: Brand.forest,
  },
  closeButton: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  heroBottom: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    alignItems: "flex-start",
  },
  heroName: {
    marginTop: 10,
    fontFamily: FontFamily.display,
    fontSize: 38,
    lineHeight: 40,
    letterSpacing: -1,
    color: Brand.paper,
  },
  heroMeta: {
    marginTop: 4,
    fontFamily: FontFamily.medium,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.72)",
  },
  sheetBody: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  description: {
    marginTop: 16,
    fontFamily: FontFamily.sans,
    fontSize: 14,
    lineHeight: 22,
    color: Brand.ink70,
  },
  section: {
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: Brand.line,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Brand.ink,
  },
  sectionMeta: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  factGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 12,
    columnGap: 12,
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
    color: Brand.ink55,
  },
  factValue: {
    marginTop: 3,
    fontFamily: FontFamily.medium,
    fontSize: 12.5,
    lineHeight: 17,
    color: Brand.ink,
  },
  note: {
    marginTop: 12,
    fontFamily: FontFamily.sans,
    fontSize: 12,
    lineHeight: 18,
    color: Brand.ink55,
  },
  reportRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper2,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  reportIdentity: {
    flex: 1,
  },
  reportCode: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: Brand.ink,
  },
  reportStatus: {
    marginTop: 2,
    fontFamily: FontFamily.medium,
    fontSize: 9,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: Brand.moss,
  },
  timeline: {
    marginTop: 12,
    gap: 2,
  },
  timelineRow: {
    flexDirection: "row",
    gap: 10,
  },
  timelineRail: {
    width: 12,
    alignItems: "center",
  },
  timelineDot: {
    marginTop: 5,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Brand.moss,
  },
  timelineLine: {
    flex: 1,
    width: 1,
    marginVertical: 3,
    backgroundColor: Brand.line,
  },
  timelineBody: {
    flex: 1,
    paddingBottom: 12,
  },
  timelineTop: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 10,
  },
  timelineTitle: {
    flexShrink: 1,
    fontFamily: FontFamily.medium,
    fontSize: 12.5,
    color: Brand.ink,
  },
  timelineDate: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: Brand.ink55,
  },
  timelineNote: {
    marginTop: 3,
    fontFamily: FontFamily.sans,
    fontSize: 11.5,
    lineHeight: 16,
    color: Brand.ink55,
  },
  recordList: {
    gap: 10,
  },
  recordCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    padding: 13,
  },
  recordHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  recordTypeChip: {
    borderRadius: 999,
    backgroundColor: Brand.sand,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  recordTypeText: {
    fontFamily: FontFamily.medium,
    fontSize: 8.5,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: Brand.moss,
  },
  recordDate: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: Brand.ink55,
  },
  recordLine: {
    marginTop: 8,
  },
  recordLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 8.5,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  recordValue: {
    marginTop: 2,
    fontFamily: FontFamily.sans,
    fontSize: 12.5,
    lineHeight: 18,
    color: Brand.ink,
  },
  recordRemarks: {
    marginTop: 9,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: Brand.line,
    fontFamily: FontFamily.sans,
    fontSize: 12,
    lineHeight: 18,
    color: Brand.ink55,
  },
  recordEmpty: {
    fontFamily: FontFamily.sans,
    fontSize: 12.5,
    lineHeight: 19,
    color: Brand.ink55,
  },
  vaccineName: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: Brand.ink,
  },
  vaccineMeta: {
    marginTop: 7,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  vaccineMetaText: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 0.5,
    color: Brand.ink55,
    borderRadius: 999,
    backgroundColor: "rgba(16,36,26,0.05)",
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  heartCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.forest,
    padding: 16,
  },
  heartValue: {
    fontFamily: FontFamily.display,
    fontSize: 40,
    lineHeight: 42,
    color: Brand.paper,
  },
  heartUnit: {
    marginTop: 1,
    fontFamily: FontFamily.medium,
    fontSize: 8.5,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.6)",
  },
  heartMeta: {
    alignItems: "flex-end",
    gap: 3,
  },
  heartMetaText: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: "rgba(255,255,255,0.72)",
  },
  heartFlag: {
    marginTop: 2,
    fontFamily: FontFamily.medium,
    fontSize: 8.5,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: "#FFB59E",
  },
});
