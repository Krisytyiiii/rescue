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

import { ChatIcon, CheckIcon, PawIcon } from "@/components/icons";
import { Skeleton } from "@/components/skeleton";
import { UserAvatar } from "@/components/user-avatar";
import { Brand, FontFamily } from "@/constants/theme";
import type { AdoptableAnimal } from "@/domain/adoption-applications";
import type { CommunityPost } from "@/domain/community";
import {
  ageLabel,
  BREED_LABEL,
  postAuthor,
  postPhoto,
  postTitle,
  SEX_LABEL,
  SPECIES_LABEL,
} from "@/features/community/presentation";
import { useCommunityViewModel } from "@/features/community/useCommunityViewModel";

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

type AdoptionSource = "vet" | "feed";

const SOURCES: ReadonlyArray<{ id: AdoptionSource; label: string }> = [
  { id: "vet", label: "City Vet" },
  { id: "feed", label: "Community feed" },
];

/**
 * Resident Animals screen: animals listed by the City Vet (apply to adopt) and
 * animals posted by other residents in the feed (message the poster instead).
 * Staff animal records stay on their own screen.
 */
export function ResidentAdoptionsView() {
  const router = useRouter();
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
  const {
    posts,
    currentUserId,
    loading: feedLoading,
    error: feedError,
    reload: reloadFeed,
  } = useCommunityViewModel();
  const [source, setSource] = useState<AdoptionSource>("vet");
  const [selected, setSelected] = useState<AdoptableAnimal | null>(null);

  useFocusEffect(
    useCallback(() => {
      void reload();
      void reloadFeed();
    }, [reload, reloadFeed]),
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
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Track my adoption applications"
              onPress={() => router.push("/adoption-applications")}
              style={({ pressed }) => [
                styles.applicationsButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.applicationsButtonText}>My applications</Text>
            </Pressable>
          </View>

          <View style={styles.segmentRow}>
            {SOURCES.map((option) => {
              const active = source === option.id;
              const count = option.id === "vet" ? animals.length : posts.length;
              const busy = option.id === "vet" ? loading : feedLoading;

              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setSource(option.id)}
                  style={({ pressed }) => [
                    styles.segment,
                    active && styles.segmentActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      active && styles.segmentTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {!busy ? (
                    <View
                      style={[
                        styles.segmentCount,
                        active && styles.segmentCountActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentCountText,
                          active && styles.segmentCountTextActive,
                        ]}
                      >
                        {count}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.intro}>
            <Text style={styles.introEyebrow}>
              {source === "vet" ? "City Vet listings" : "Community posts"}
            </Text>
            <Text style={styles.introBody}>
              {source === "vet"
                ? "These animals are in the City Vet's care and ready for a family. Open one to apply — every application is reviewed by the team."
                : "Animals posted by residents looking for a home. Message the poster to ask about the pet and arrange the adoption directly with them."}
            </Text>
          </View>

          {source === "vet" ? (
            <VetSection
              animals={animals}
              loading={loading}
              error={error}
              notice={notice}
              onReload={() => void reload()}
              onApply={openApplication}
            />
          ) : (
            <FeedSection
              posts={posts}
              currentUserId={currentUserId}
              loading={feedLoading}
              error={feedError}
              onReload={() => void reloadFeed()}
            />
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

function VetSection({
  animals,
  loading,
  error,
  notice,
  onReload,
  onApply,
}: {
  animals: AdoptableAnimal[];
  loading: boolean;
  error: string | null;
  notice: string | null;
  onReload: () => void;
  onApply: (animal: AdoptableAnimal) => void;
}) {
  return (
    <>
      {notice ? (
        <View style={styles.notice}>
          <CheckIcon size={14} color={Brand.forest} />
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}

      {error && animals.length === 0 ? (
        <ErrorCard message={error} onRetry={onReload} />
      ) : null}

      {loading && animals.length === 0 ? (
        <View style={styles.list}>
          {Array.from({ length: 3 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </View>
      ) : !loading && animals.length === 0 && !error ? (
        <EmptyCard
          title="No animals listed yet"
          body="When the City Vet has an animal ready for adoption, it will show up here."
        />
      ) : (
        <View style={styles.list}>
          {animals.map((animal) => (
            <AdoptableCard
              key={animal.id}
              animal={animal}
              onApply={() => onApply(animal)}
            />
          ))}
        </View>
      )}
    </>
  );
}

function FeedSection({
  posts,
  currentUserId,
  loading,
  error,
  onReload,
}: {
  posts: CommunityPost[];
  currentUserId: string | null;
  loading: boolean;
  error: string | null;
  onReload: () => void;
}) {
  return (
    <>
      {error && posts.length === 0 ? (
        <ErrorCard message={error} onRetry={onReload} />
      ) : null}

      {loading && posts.length === 0 ? (
        <View style={styles.list}>
          {Array.from({ length: 3 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </View>
      ) : !loading && posts.length === 0 && !error ? (
        <EmptyCard
          title="No community posts yet"
          body="When a resident posts an animal for adoption in the feed, it will show up here."
        />
      ) : (
        <View style={styles.list}>
          {posts.map((post) => (
            <FeedAdoptionCard
              key={post.id}
              post={post}
              isOwn={Boolean(currentUserId && post.postedBy?.id === currentUserId)}
            />
          ))}
        </View>
      )}
    </>
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

function FeedAdoptionCard({
  post,
  isOwn,
}: {
  post: CommunityPost;
  isOwn: boolean;
}) {
  const router = useRouter();
  const photo = postPhoto(post);
  const author = post.postedBy;
  const facts = [
    SPECIES_LABEL[post.species],
    BREED_LABEL[post.breedType] ?? post.breedType,
    SEX_LABEL[post.sex] ?? post.sex,
    ageLabel(post.estimatedAgeMonths),
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
            {postTitle(post)}
          </Text>
          <Text style={styles.cardFacts}>{facts.join(" · ")}</Text>
          {post.size ? (
            <Text style={styles.cardSize}>{post.size} size</Text>
          ) : null}
          <View style={styles.authorRow}>
            {author ? (
              <UserAvatar uri={author.profilePhotoUrl} size={19} />
            ) : null}
            <Text style={styles.authorText} numberOfLines={1}>
              {isOwn ? "Your post" : postAuthor(author)}
            </Text>
          </View>
        </View>
      </View>

      {post.description ? (
        <Text style={styles.cardDescription} numberOfLines={3}>
          {post.description}
        </Text>
      ) : null}

      {isOwn ? (
        <View style={styles.applied}>
          <Text style={styles.appliedText}>Posted by you</Text>
        </View>
      ) : author ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Chat with ${postAuthor(author)}`}
          onPress={() =>
            router.push({
              pathname: "/chat/[userId]",
              params: {
                userId: author.id,
                name: postAuthor(author),
                photo: author.profilePhotoUrl ?? undefined,
              },
            })
          }
          style={({ pressed }) => [styles.apply, pressed && styles.pressed]}
        >
          <ChatIcon size={15} color={Brand.paper} />
          <Text style={styles.applyText}>Chat with poster</Text>
        </Pressable>
      ) : (
        <View style={styles.applied}>
          <Text style={styles.appliedText}>Poster unavailable</Text>
        </View>
      )}
    </View>
  );
}

function CardSkeleton() {
  return (
    <View style={styles.cardSkeleton}>
      <Skeleton width={104} height={104} borderRadius={16} />
      <View style={styles.cardSkeletonBody}>
        <Skeleton width="62%" height={15} borderRadius={7} />
        <Skeleton width="44%" height={10} borderRadius={5} />
        <Skeleton width="88%" height={10} borderRadius={5} />
        <Skeleton width={108} height={30} borderRadius={15} />
      </View>
    </View>
  );
}

function ErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.errorCard}>
      <Text style={styles.errorText}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        style={({ pressed }) => [styles.retry, pressed && styles.pressed]}
      >
        <Text style={styles.retryText}>Try again</Text>
      </Pressable>
    </View>
  );
}

function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
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
  applicationsButton: {
    height: 38,
    paddingHorizontal: 15,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.forest,
  },
  applicationsButtonText: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: Brand.paper,
  },
  segmentRow: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 22,
    paddingTop: 2,
    paddingBottom: 6,
  },
  segment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
  },
  segmentActive: { backgroundColor: Brand.forest, borderColor: Brand.forest },
  segmentText: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: Brand.ink70,
  },
  segmentTextActive: { color: Brand.paper },
  segmentCount: {
    minWidth: 18,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.paper2,
  },
  segmentCountActive: { backgroundColor: "rgba(255,255,255,0.22)" },
  segmentCountText: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    color: Brand.ink55,
  },
  segmentCountTextActive: { color: Brand.paper },
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
  authorRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  authorText: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: Brand.ink55,
  },
  cardDescription: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    lineHeight: 18,
    color: Brand.ink70,
  },
  apply: {
    height: 38,
    flexDirection: "row",
    gap: 7,
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
