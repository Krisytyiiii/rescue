import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "@/components/back-button";
import {
  BookIcon,
  DocumentIcon,
  PlayIcon,
} from "@/components/icons";
import { Skeleton } from "@/components/skeleton";
import { Brand, FontFamily } from "@/constants/theme";
import type { LearningLesson } from "@/domain/learning";

import {
  CATEGORY_LABEL,
  CONTENT_LABEL,
  formatMinutes,
  lessonMeta,
} from "./presentation";
import { useModuleDetailViewModel } from "./useModuleDetailViewModel";

/** One published course with every lesson's full content. */
export function ModuleDetailView({ id }: { id: number }) {
  const router = useRouter();
  const { module, loading, error, reload } = useModuleDetailViewModel(id);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <View style={styles.header}>
          <BackButton onPress={() => router.back()} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Course</Text>
            <Text style={styles.headerSubtitle}>
              {module ? CATEGORY_LABEL[module.category] : "City Vet learning"}
            </Text>
          </View>
          <View style={styles.headerBadge}>
            <BookIcon size={17} color={Brand.forest} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {loading && !module ? <DetailSkeleton /> : null}

          {error && !module ? (
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

          {module ? (
            <>
              <View style={styles.cover}>
                {module.coverImageUrl ? (
                  <Image
                    source={{ uri: module.coverImageUrl }}
                    style={styles.coverImage}
                  />
                ) : (
                  <LinearGradient
                    colors={["rgba(15,58,36,0.96)", "rgba(31,122,77,0.82)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.coverFallback}
                  >
                    <BookIcon size={44} color="rgba(255,255,255,0.85)" />
                  </LinearGradient>
                )}
              </View>

              <Text style={styles.eyebrow}>
                {CATEGORY_LABEL[module.category]}
              </Text>
              <Text style={styles.title}>{module.title}</Text>
              <Text style={styles.meta}>
                {lessonMeta(module.lessonCount, module.totalMinutes)}
              </Text>
              {module.description ? (
                <Text style={styles.description}>{module.description}</Text>
              ) : null}

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Lessons</Text>
              <View style={styles.lessons}>
                {module.lessons.map((lesson, index) => (
                  <LessonCard
                    key={lesson.id}
                    index={index + 1}
                    lesson={lesson}
                  />
                ))}
              </View>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function LessonCard({
  index,
  lesson,
}: {
  index: number;
  lesson: LearningLesson;
}) {
  const openMedia = () => {
    if (lesson.mediaUrl) void Linking.openURL(lesson.mediaUrl);
  };

  return (
    <View style={styles.lessonCard}>
      <View style={styles.lessonHead}>
        <View style={styles.lessonIndex}>
          <Text style={styles.lessonIndexText}>{index}</Text>
        </View>
        <View style={styles.lessonHeadText}>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          <Text style={styles.lessonMeta}>
            {CONTENT_LABEL[lesson.contentType]}
            {lesson.durationMinutes
              ? ` · ${formatMinutes(lesson.durationMinutes)}`
              : ""}
          </Text>
        </View>
      </View>

      {lesson.contentBody ? (
        <Text style={styles.lessonBody}>{lesson.contentBody}</Text>
      ) : null}

      {lesson.contentType === "image" && lesson.mediaUrl ? (
        <Image
          source={{ uri: lesson.mediaUrl }}
          style={styles.lessonImage}
          resizeMode="contain"
        />
      ) : null}

      {(lesson.contentType === "video" ||
        lesson.contentType === "pdf") &&
      lesson.mediaUrl ? (
        <Pressable
          accessibilityRole="link"
          onPress={openMedia}
          style={({ pressed }) => [
            styles.mediaLink,
            pressed && styles.pressed,
          ]}
        >
          {lesson.contentType === "video" ? (
            <PlayIcon size={18} color={Brand.forest} />
          ) : (
            <DocumentIcon size={18} color={Brand.forest} />
          )}
          <Text style={styles.mediaLinkText}>
            {lesson.contentType === "video" ? "Watch video" : "Open PDF"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function DetailSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      <Skeleton width="100%" height={188} borderRadius={24} />
      <Skeleton width="38%" height={10} borderRadius={5} />
      <Skeleton width="80%" height={28} borderRadius={9} />
      <Skeleton width="46%" height={11} borderRadius={5} />
      <Skeleton width="100%" height={72} borderRadius={14} />
    </View>
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
  cover: {
    height: 190,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: Brand.sand,
    marginBottom: 18,
  },
  coverImage: { width: "100%", height: "100%" },
  coverFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: Brand.clay,
  },
  title: {
    marginTop: 6,
    fontFamily: FontFamily.display,
    fontSize: 32,
    lineHeight: 35,
    letterSpacing: -0.7,
    color: Brand.ink,
  },
  meta: {
    marginTop: 7,
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: Brand.ink55,
  },
  description: {
    marginTop: 12,
    fontFamily: FontFamily.sans,
    fontSize: 13.5,
    lineHeight: 21,
    color: Brand.ink70,
  },
  divider: {
    height: 1,
    backgroundColor: Brand.line,
    marginVertical: 20,
  },
  sectionTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    letterSpacing: 1.3,
    textTransform: "uppercase",
    color: Brand.ink55,
    marginBottom: 12,
  },
  lessons: { gap: 14 },
  lessonCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    padding: 15,
    gap: 11,
  },
  lessonHead: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  lessonIndex: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(31,122,77,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  lessonIndexText: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    color: Brand.forest,
  },
  lessonHeadText: { flex: 1, paddingTop: 1 },
  lessonTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 14.5,
    lineHeight: 20,
    color: Brand.ink,
  },
  lessonMeta: {
    marginTop: 2,
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  lessonBody: {
    fontFamily: FontFamily.sans,
    fontSize: 12.5,
    lineHeight: 20,
    color: Brand.ink70,
  },
  lessonImage: {
    width: "100%",
    height: 240,
    borderRadius: 14,
    backgroundColor: Brand.sand,
  },
  mediaLink: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(31,122,77,0.10)",
  },
  mediaLinkText: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: Brand.forest,
  },
  skeletonWrap: { gap: 12 },
  errorCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    padding: 16,
    gap: 10,
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
