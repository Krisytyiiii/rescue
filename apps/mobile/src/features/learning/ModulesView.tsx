import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { useCallback } from "react";
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
import { BookIcon } from "@/components/icons";
import { Skeleton } from "@/components/skeleton";
import { Brand, FontFamily } from "@/constants/theme";
import type { LearningModuleSummary } from "@/domain/learning";

import { CATEGORY_LABEL, lessonMeta } from "./presentation";
import { useModulesViewModel } from "./useModulesViewModel";

/**
 * Resident module library: every course the City Vet team has published, in
 * full. Opening a card shows the complete lesson content.
 */
export function ModulesView() {
  const router = useRouter();
  const { modules, loading, error, reload } = useModulesViewModel();

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <View style={styles.header}>
          <BackButton onPress={() => router.back()} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Modules</Text>
            <Text style={styles.headerSubtitle}>City Vet learning</Text>
          </View>
          <View style={styles.headerBadge}>
            <BookIcon size={17} color={Brand.forest} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={["rgba(15,58,36,0.96)", "rgba(31,122,77,0.88)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <Text style={styles.heroEyebrow}>Learn at your pace</Text>
            <Text style={styles.heroTitle}>
              Short courses for a happier, healthier pet.
            </Text>
            <Text style={styles.heroBody}>
              Written by the City Vet team. Read, watch, and keep everything
              you need in one place.
            </Text>
          </LinearGradient>

          {error && modules.length === 0 ? (
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

          {loading && modules.length === 0 ? (
            <View style={styles.list}>
              {Array.from({ length: 3 }).map((_, index) => (
                <View key={index} style={styles.skeletonCard}>
                  <Skeleton width="100%" height={148} borderRadius={18} />
                  <View style={styles.skeletonBody}>
                    <Skeleton width="34%" height={10} borderRadius={5} />
                    <Skeleton width="74%" height={20} borderRadius={8} />
                    <Skeleton width="90%" height={11} borderRadius={5} />
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {!loading && modules.length === 0 && !error ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No modules yet</Text>
              <Text style={styles.emptyBody}>
                When the City Vet publishes a course, it will appear here.
              </Text>
            </View>
          ) : null}

          {modules.length > 0 ? (
            <View style={styles.list}>
              {modules.map((module) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  onPress={() => router.push(`/modules/${module.id}` as Href)}
                />
              ))}
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ModuleCard({
  module,
  onPress,
}: {
  module: LearningModuleSummary;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${module.title}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.cover}>
        {module.coverImageUrl ? (
          <Image source={{ uri: module.coverImageUrl }} style={styles.coverImage} />
        ) : (
          <LinearGradient
            colors={["rgba(185,220,196,0.55)", "rgba(124,199,154,0.30)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.coverFallback}
          >
            <BookIcon size={34} color="rgba(15,58,36,0.55)" />
          </LinearGradient>
        )}
        <View style={styles.categoryChip}>
          <Text style={styles.categoryText}>
            {CATEGORY_LABEL[module.category]}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {module.title}
        </Text>
        {module.description ? (
          <Text style={styles.cardDescription} numberOfLines={3}>
            {module.description}
          </Text>
        ) : null}
        <View style={styles.cardFooter}>
          <Text style={styles.cardMeta}>
            {lessonMeta(module.lessonCount, module.totalMinutes)}
          </Text>
          <Text style={styles.openLabel}>Open course →</Text>
        </View>
      </View>
    </Pressable>
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
  headerSubtitle: {
    marginTop: 1,
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  headerBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 130,
  },
  hero: {
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 22,
    marginBottom: 18,
  },
  heroEyebrow: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.68)",
  },
  heroTitle: {
    marginTop: 8,
    fontFamily: FontFamily.display,
    fontSize: 27,
    lineHeight: 30,
    letterSpacing: -0.4,
    color: Brand.paper,
  },
  heroBody: {
    marginTop: 8,
    fontFamily: FontFamily.sans,
    fontSize: 12.5,
    lineHeight: 19,
    color: "rgba(255,255,255,0.78)",
  },
  list: { gap: 14 },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    overflow: "hidden",
  },
  cover: { height: 150, backgroundColor: Brand.sand },
  coverImage: { width: "100%", height: "100%" },
  coverFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryChip: {
    position: "absolute",
    left: 12,
    top: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  categoryText: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: Brand.forest,
  },
  cardBody: { padding: 15, gap: 6 },
  cardTitle: {
    fontFamily: FontFamily.display,
    fontSize: 23,
    lineHeight: 26,
    letterSpacing: -0.4,
    color: Brand.ink,
  },
  cardDescription: {
    fontFamily: FontFamily.sans,
    fontSize: 12.5,
    lineHeight: 19,
    color: Brand.ink70,
  },
  cardFooter: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardMeta: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: Brand.ink55,
  },
  openLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: Brand.clay,
  },
  skeletonCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    overflow: "hidden",
  },
  skeletonBody: { padding: 15, gap: 9 },
  emptyCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    padding: 18,
    gap: 6,
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
