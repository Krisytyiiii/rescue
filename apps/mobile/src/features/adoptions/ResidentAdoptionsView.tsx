import { useFocusEffect } from "expo-router";
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

import { CheckIcon, PawIcon } from "@/components/icons";
import { Skeleton } from "@/components/skeleton";
import { Brand, FontFamily } from "@/constants/theme";
import type { AdoptableAnimal } from "@/domain/adoption-applications";

import { AdoptionApplySheet } from "./AdoptionApplySheet";
import {
  adoptableAge,
  adoptableName,
  adoptablePhoto,
  APPLICATION_STATUS_LABEL,
  sexLabel,
  speciesLabel,
} from "./resident-presentation";
import { useResidentAdoptionsViewModel } from "./useResidentAdoptionsViewModel";

/**
 * Resident Animals screen: animals the City Vet has listed for adoption.
 * Staff animal records and the community feed stay on their own screens.
 */
export function ResidentAdoptionsView() {
  const {
    animals,
    loading,
    error,
    reload,
    submitting,
    submitError,
    notice,
    clearNotice,
    uploadValidId,
    apply,
  } = useResidentAdoptionsViewModel();
  const [selected, setSelected] = useState<AdoptableAnimal | null>(null);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const openApplication = (animal: AdoptableAnimal) => {
    clearNotice();
    setSelected(animal);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <View style={styles.headerWrap}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Adopt</Text>
              {loading ? (
                <Skeleton
                  width={128}
                  height={9}
                  borderRadius={4}
                  style={styles.headerMetaSkeleton}
                />
              ) : (
                <Text style={styles.headerMeta}>
                  {`${animals.length} animal${animals.length === 1 ? "" : "s"} looking for a home`}
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
            <Text style={styles.introEyebrow}>City Vet listings</Text>
            <Text style={styles.introBody}>
              These animals are in the City Vet&apos;s care and ready for a
              family. Open one to apply — every application is reviewed by the
              team.
            </Text>
          </View>

          {notice ? (
            <View style={styles.notice}>
              <CheckIcon size={14} color={Brand.forest} />
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          ) : null}

          {error && animals.length === 0 ? (
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

          {loading && animals.length === 0 ? (
            <View style={styles.list}>
              {Array.from({ length: 3 }).map((_, index) => (
                <View key={index} style={styles.cardSkeleton}>
                  <Skeleton width={104} height={104} borderRadius={16} />
                  <View style={styles.cardSkeletonBody}>
                    <Skeleton width="62%" height={15} borderRadius={7} />
                    <Skeleton width="44%" height={10} borderRadius={5} />
                    <Skeleton width="88%" height={10} borderRadius={5} />
                    <Skeleton width={108} height={30} borderRadius={15} />
                  </View>
                </View>
              ))}
            </View>
          ) : !loading && animals.length === 0 && !error ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No animals listed yet</Text>
              <Text style={styles.emptyBody}>
                When the City Vet has an animal ready for adoption, it will show
                up here.
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {animals.map((animal) => (
                <AdoptableCard
                  key={animal.id}
                  animal={animal}
                  onApply={() => openApplication(animal)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <AdoptionApplySheet
        visible={selected !== null}
        animal={selected}
        submitting={submitting}
        error={submitError}
        onClose={() => setSelected(null)}
        onSubmit={apply}
        onUpload={uploadValidId}
      />
    </View>
  );
}

function AdoptableCard({
  animal,
  onApply,
}: {
  animal: AdoptableAnimal;
  onApply: () => void;
}) {
  const photo = adoptablePhoto(animal);
  const facts = [
    speciesLabel(animal.species),
    animal.breedType,
    sexLabel(animal.sex),
    adoptableAge(animal.estimatedAgeMonths),
  ].filter(Boolean);

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={[styles.photo, styles.photoEmpty]}>
            <PawIcon size={26} color={Brand.ink55} />
          </View>
        )}

        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={1}>
            {adoptableName(animal)}
          </Text>
          <Text style={styles.cardFacts}>{facts.join(" · ")}</Text>
          {animal.size ? (
            <Text style={styles.cardSize}>{animal.size} size</Text>
          ) : null}
          {animal.temperament ? (
            <Text style={styles.cardTemperament} numberOfLines={2}>
              {animal.temperament}
            </Text>
          ) : null}
        </View>
      </View>

      {animal.description ? (
        <Text style={styles.cardDescription} numberOfLines={3}>
          {animal.description}
        </Text>
      ) : null}

      {animal.application ? (
        <View style={styles.applied}>
          <CheckIcon size={13} color={Brand.forest} />
          <Text style={styles.appliedText}>
            {APPLICATION_STATUS_LABEL[animal.application.status]} ·{" "}
            {animal.application.requestCode}
          </Text>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Apply to adopt ${adoptableName(animal)}`}
          onPress={onApply}
          style={({ pressed }) => [styles.apply, pressed && styles.pressed]}
        >
          <Text style={styles.applyText}>Apply to adopt</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.paper2 },
  flex: { flex: 1 },
  headerWrap: { paddingBottom: 4 },
  header: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  headerText: { flex: 1 },
  headerTitle: {
    fontFamily: FontFamily.display,
    fontSize: 32,
    lineHeight: 35,
    letterSpacing: -0.8,
    color: Brand.ink,
  },
  headerMetaSkeleton: { marginTop: 5 },
  headerMeta: {
    marginTop: 3,
    fontFamily: FontFamily.sans,
    fontSize: 11.5,
    color: Brand.ink55,
  },
  headerBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(107,79,194,0.12)",
  },
  content: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 140,
  },
  intro: { marginBottom: 16 },
  introEyebrow: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: Brand.clay,
  },
  introBody: {
    marginTop: 5,
    fontFamily: FontFamily.sans,
    fontSize: 13,
    lineHeight: 20,
    color: Brand.ink70,
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 16,
    borderRadius: 14,
    backgroundColor: "rgba(31,122,77,0.10)",
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  noticeText: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    lineHeight: 17,
    color: Brand.forest,
  },
  list: { gap: 14 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    padding: 12,
    gap: 11,
  },
  cardTop: { flexDirection: "row", gap: 12 },
  photo: { width: 104, height: 104, borderRadius: 16, backgroundColor: Brand.sand },
  photoEmpty: { alignItems: "center", justifyContent: "center" },
  cardBody: { flex: 1, paddingTop: 2 },
  cardName: {
    fontFamily: FontFamily.display,
    fontSize: 22,
    lineHeight: 25,
    letterSpacing: -0.4,
    color: Brand.ink,
  },
  cardFacts: {
    marginTop: 3,
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: Brand.ink55,
  },
  cardSize: {
    marginTop: 4,
    fontFamily: FontFamily.sans,
    fontSize: 10.5,
    color: Brand.ink55,
  },
  cardTemperament: {
    marginTop: 5,
    fontFamily: FontFamily.sans,
    fontSize: 11.5,
    lineHeight: 16,
    color: Brand.ink70,
  },
  cardDescription: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    lineHeight: 18,
    color: Brand.ink70,
  },
  apply: {
    height: 38,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.forest,
  },
  applyText: { fontFamily: FontFamily.medium, fontSize: 12, color: Brand.paper },
  applied: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 38,
    borderRadius: 999,
    backgroundColor: "rgba(31,122,77,0.10)",
  },
  appliedText: { fontFamily: FontFamily.medium, fontSize: 11, color: Brand.forest },
  cardSkeleton: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    padding: 12,
  },
  cardSkeletonBody: { flex: 1, gap: 8, paddingTop: 4 },
  emptyCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    padding: 18,
    gap: 6,
    marginTop: 4,
  },
  emptyTitle: { fontFamily: FontFamily.medium, fontSize: 14, color: Brand.ink },
  emptyBody: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    lineHeight: 18,
    color: Brand.ink70,
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
  retryText: { fontFamily: FontFamily.medium, fontSize: 11.5, color: Brand.forest },
  pressed: { opacity: 0.7 },
});
