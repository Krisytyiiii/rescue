import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  ChatIcon,
  CloseIcon,
  PawIcon,
  PlusCircleIcon,
} from "@/components/icons";
import { Skeleton } from "@/components/skeleton";
import { Brand, FontFamily } from "@/constants/theme";
import type {
  CommunityBreed,
  CommunityPost,
  CommunitySex,
  CommunitySize,
  CommunitySpecies,
  NewCommunityPost,
} from "@/domain/community";

import {
  ageLabel,
  BREED_LABEL,
  formatDate,
  postAuthor,
  postPhoto,
  postStatus,
  postTitle,
  SEX_LABEL,
  SIZE_LABEL,
  SPECIES_LABEL,
} from "./presentation";
import { useCommunityViewModel } from "./useCommunityViewModel";

interface PostForm {
  name: string;
  species: CommunitySpecies;
  breedType: CommunityBreed;
  sex: CommunitySex;
  age: string;
  size: CommunitySize;
  colorMarkings: string;
  temperament: string;
  description: string;
  photoUrl: string;
}

const EMPTY_FORM: PostForm = {
  name: "",
  species: "dog",
  breedType: "aspin",
  sex: "unknown",
  age: "",
  size: "medium",
  colorMarkings: "",
  temperament: "",
  description: "",
  photoUrl: "",
};

const SPECIES_OPTIONS: CommunitySpecies[] = ["dog", "cat"];
const BREED_OPTIONS: CommunityBreed[] = ["aspin", "puspin", "mixed", "other"];
const SEX_OPTIONS: CommunitySex[] = ["male", "female", "unknown"];
const SIZE_OPTIONS: CommunitySize[] = ["small", "medium", "large"];

export function CommunityFeedView() {
  const router = useRouter();
  const {
    posts,
    loading,
    error,
    reload,
    submitting,
    submitError,
    notice,
    clearNotice,
    submit,
  } = useCommunityViewModel();

  const [composerOpen, setComposerOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (input: NewCommunityPost) => {
      const created = await submit(input);
      if (created) {
        setComposerOpen(false);
      }
      return created;
    },
    [submit],
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              style={({ pressed }) => [styles.back, pressed && styles.pressed]}
            >
              <Text style={styles.backGlyph}>←</Text>
            </Pressable>

            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Community</Text>
              {loading ? (
                <Skeleton
                  width={112}
                  height={9}
                  borderRadius={4}
                  style={styles.headerMetaSkeleton}
                />
              ) : (
                <Text style={styles.headerMeta}>
                  {`${posts.length} adoption post${posts.length === 1 ? "" : "s"}`}
                </Text>
              )}
            </View>

            <View style={styles.headerBadge}>
              <ChatIcon size={17} color="#3D7E9A" />
            </View>
          </View>

          <View style={styles.intro}>
            <Text style={styles.introEyebrow}>Adoption feed</Text>
            <Text style={styles.introBody}>
              Animals posted by residents looking for a home. Every post is
              reviewed by the City Vet team before it goes live.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setFormError(null);
              clearNotice();
              setComposerOpen(true);
            }}
            style={({ pressed }) => [
              styles.composeCard,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.composeIcon}>
              <PlusCircleIcon size={22} color={Brand.paper} />
            </View>
            <View style={styles.composeText}>
              <Text style={styles.composeTitle}>Post an animal for adoption</Text>
              <Text style={styles.composeHint}>
                A rescued stray, a foster, or a pet you can no longer keep.
              </Text>
            </View>
            <Text style={styles.composeArrow}>→</Text>
          </Pressable>

          {notice ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss message"
              onPress={clearNotice}
              style={styles.notice}
            >
              <Text style={styles.noticeText}>{notice}</Text>
              <CloseIcon size={14} color={Brand.moss} />
            </Pressable>
          ) : null}

          {error && posts.length === 0 ? (
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

          {loading && posts.length === 0 ? (
            <View style={styles.feed}>
              {Array.from({ length: 3 }).map((_, index) => (
                <FeedSkeleton key={index} />
              ))}
            </View>
          ) : posts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No adoption posts yet</Text>
              <Text style={styles.emptyBody}>
                Be the first to help an animal find a home. Post one above and
                the City Vet team will review it.
              </Text>
            </View>
          ) : (
            <View style={styles.feed}>
              {posts.map((post) => (
                <FeedCard key={post.id} post={post} />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <ComposerSheet
        visible={composerOpen}
        submitting={submitting}
        error={formError ?? submitError}
        onDismissError={() => setFormError(null)}
        onClose={() => setComposerOpen(false)}
        onSubmit={handleSubmit}
        onInvalid={setFormError}
      />
    </View>
  );
}

function FeedSkeleton() {
  return (
    <View style={styles.cardSkeleton}>
      <Skeleton height={176} borderRadius={0} />
      <View style={styles.cardSkeletonBody}>
        <Skeleton width="58%" height={16} borderRadius={7} />
        <Skeleton width="42%" height={10} borderRadius={5} />
        <Skeleton width="94%" height={10} borderRadius={5} />
        <Skeleton width="80%" height={10} borderRadius={5} />
      </View>
    </View>
  );
}

function FeedCard({ post }: { post: CommunityPost }) {
  const photo = postPhoto(post);
  const status = postStatus(post);

  return (
    <View style={styles.card}>
      <View style={styles.cardMedia}>
        {photo ? (
          <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={["#2C5A46", "#123A28"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}

        {photo ? null : (
          <View style={styles.mediaFallback}>
            <PawIcon size={34} color="rgba(255,255,255,0.35)" />
          </View>
        )}

        <View style={[styles.statusChip, { backgroundColor: status.background }]}>
          <View style={[styles.statusDot, { backgroundColor: status.ink }]} />
          <Text style={[styles.statusText, { color: status.ink }]}>
            {status.label}
          </Text>
        </View>

        <View style={styles.mediaMeta}>
          <Text style={styles.mediaCode}>{post.animalCode}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{postTitle(post)}</Text>

        <Text style={styles.cardMeta}>
          {SPECIES_LABEL[post.species]} · {BREED_LABEL[post.breedType] ?? post.breedType} ·{" "}
          {SEX_LABEL[post.sex] ?? post.sex} · {ageLabel(post.estimatedAgeMonths)}
        </Text>

        {post.description ? (
          <Text style={styles.cardDescription} numberOfLines={3}>
            {post.description}
          </Text>
        ) : null}

        {post.colorMarkings || post.size ? (
          <View style={styles.tags}>
            {post.size ? (
              <Text style={styles.tag}>{SIZE_LABEL[post.size] ?? post.size}</Text>
            ) : null}
            {post.colorMarkings ? (
              <Text style={styles.tag} numberOfLines={1}>
                {post.colorMarkings}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <Text style={styles.cardAuthor} numberOfLines={1}>
            Posted by {postAuthor(post.postedBy)}
          </Text>
          <Text style={styles.cardDate}>{formatDate(post.createdAt)}</Text>
        </View>
      </View>
    </View>
  );
}

function ComposerSheet({
  visible,
  submitting,
  error,
  onClose,
  onSubmit,
  onInvalid,
  onDismissError,
}: {
  visible: boolean;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (input: NewCommunityPost) => Promise<boolean>;
  onInvalid: (message: string) => void;
  onDismissError: () => void;
}) {
  const [form, setForm] = useState<PostForm>(EMPTY_FORM);

  const update = <K extends keyof PostForm,>(key: K, value: PostForm[K]) => {
    onDismissError();
    setForm((current) => ({ ...current, [key]: value }));
  };

  const close = () => {
    if (submitting) return;
    onClose();
  };

  const handleFormSubmit = async () => {
    const name = form.name.trim();
    const description = form.description.trim();
    const photoUrl = form.photoUrl.trim();

    if (!name) {
      onInvalid("Give the animal a name or a short nickname.");
      return;
    }
    if (description.length < 20) {
      onInvalid("Tell adopters at least a couple of sentences about the animal.");
      return;
    }
    if (photoUrl && !/^https?:\/\//i.test(photoUrl)) {
      onInvalid("The photo link must start with http:// or https://.");
      return;
    }
    if (photoUrl.length > 255) {
      onInvalid("That photo link is too long. Use a shorter one.");
      return;
    }

    const age = form.age.trim() === "" ? undefined : Number(form.age);
    if (age !== undefined && (!Number.isInteger(age) || age < 0 || age > 600)) {
      onInvalid("Enter the age in whole months, or leave it blank.");
      return;
    }

    const created = await onSubmit({
      name,
      species: form.species,
      breedType: form.breedType,
      sex: form.sex,
      estimatedAgeMonths: age,
      size: form.size,
      colorMarkings: form.colorMarkings.trim() || undefined,
      temperament: form.temperament.trim() || undefined,
      description,
      photoUrl: photoUrl || undefined,
    });

    if (created) setForm(EMPTY_FORM);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={close}
    >
      <View style={styles.sheetBackdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Close the adoption post form"
          onPress={close}
        />

        <View style={styles.sheet}>
          <View style={styles.sheetHead}>
            <View>
              <Text style={styles.sheetEyebrow}>Community post</Text>
              <Text style={styles.sheetTitle}>Post an animal</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={close}
              style={({ pressed }) => [styles.sheetClose, pressed && styles.pressed]}
            >
              <CloseIcon size={18} color={Brand.ink} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.form}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Field label="Name">
              <TextInput
                value={form.name}
                onChangeText={(value) => update("name", value)}
                placeholder="e.g. Bantay"
                placeholderTextColor={Brand.ink55}
                style={styles.input}
                maxLength={60}
              />
            </Field>

            <ChipGroup
              label="Species"
              options={SPECIES_OPTIONS}
              selected={form.species}
              labelFor={(value) => SPECIES_LABEL[value]}
              onSelect={(value) => update("species", value)}
            />

            <ChipGroup
              label="Breed"
              options={BREED_OPTIONS}
              selected={form.breedType}
              labelFor={(value) => BREED_LABEL[value] ?? value}
              onSelect={(value) => update("breedType", value)}
            />

            <ChipGroup
              label="Sex"
              options={SEX_OPTIONS}
              selected={form.sex}
              labelFor={(value) => SEX_LABEL[value] ?? value}
              onSelect={(value) => update("sex", value)}
            />

            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Field label="Age (months)">
                  <TextInput
                    value={form.age}
                    onChangeText={(value) => update("age", value.replace(/[^0-9]/g, ""))}
                    placeholder="e.g. 14"
                    placeholderTextColor={Brand.ink55}
                    keyboardType="number-pad"
                    style={styles.input}
                    maxLength={3}
                  />
                </Field>
              </View>
              <View style={styles.fieldHalf}>
                <ChipGroup
                  label="Size"
                  options={SIZE_OPTIONS}
                  selected={form.size}
                  labelFor={(value) => SIZE_LABEL[value] ?? value}
                  onSelect={(value) => update("size", value)}
                />
              </View>
            </View>

            <Field label="Color and markings">
              <TextInput
                value={form.colorMarkings}
                onChangeText={(value) => update("colorMarkings", value)}
                placeholder="e.g. Brown with a white chest"
                placeholderTextColor={Brand.ink55}
                style={styles.input}
                maxLength={150}
              />
            </Field>

            <Field label="Temperament">
              <TextInput
                value={form.temperament}
                onChangeText={(value) => update("temperament", value)}
                placeholder="e.g. Friendly, good with children"
                placeholderTextColor={Brand.ink55}
                style={styles.input}
                maxLength={255}
              />
            </Field>

            <Field label="Story for adopters">
              <TextInput
                value={form.description}
                onChangeText={(value) => update("description", value)}
                placeholder="Where you found the animal, how it behaves, and what kind of home would suit it."
                placeholderTextColor={Brand.ink55}
                style={[styles.input, styles.textarea]}
                multiline
                textAlignVertical="top"
                maxLength={2000}
              />
            </Field>

            <Field label="Photo link (optional)">
              <TextInput
                value={form.photoUrl}
                onChangeText={(value) => update("photoUrl", value)}
                placeholder="https://…"
                placeholderTextColor={Brand.ink55}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={255}
              />
              <Text style={styles.fieldHint}>
                Paste a public photo link so adopters can see the animal.
              </Text>
            </Field>

            {error ? <Text style={styles.formError}>{error}</Text> : null}

            <Pressable
              accessibilityRole="button"
              onPress={() => void handleFormSubmit()}
              disabled={submitting}
              style={({ pressed }) => [
                styles.submit,
                submitting && styles.submitDisabled,
                pressed && styles.pressed,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={Brand.paper} />
              ) : (
                <Text style={styles.submitText}>Submit for review</Text>
              )}
            </Pressable>

            <Text style={styles.formFootnote}>
              Posts are reviewed by the City Vet team before they appear on the
              public feed.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ChipGroup<T extends string>({
  label,
  options,
  selected,
  labelFor,
  onSelect,
}: {
  label: string;
  options: readonly T[];
  selected: T;
  labelFor: (value: T) => string;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.chips}>
        {options.map((option) => {
          const active = option === selected;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onSelect(option)}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {labelFor(option)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
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
  composeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 20,
    backgroundColor: Brand.forest,
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  composeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  composeText: {
    flex: 1,
  },
  composeTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Brand.paper,
  },
  composeHint: {
    marginTop: 3,
    fontFamily: FontFamily.sans,
    fontSize: 11,
    lineHeight: 15,
    color: "rgba(255,255,255,0.62)",
  },
  composeArrow: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
  },
  notice: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(47,143,99,0.32)",
    backgroundColor: "rgba(47,143,99,0.10)",
    padding: 12,
  },
  noticeText: {
    flex: 1,
    fontFamily: FontFamily.sans,
    fontSize: 12,
    lineHeight: 17,
    color: Brand.moss,
  },
  errorCard: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(180,70,47,0.3)",
    backgroundColor: "rgba(180,70,47,0.07)",
    padding: 14,
    gap: 10,
  },
  errorText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 17,
    color: "#B4462F",
  },
  retry: {
    alignSelf: "flex-start",
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(180,70,47,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  retryText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: "#B4462F",
  },
  feed: {
    marginTop: 16,
    gap: 14,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    overflow: "hidden",
  },
  cardSkeleton: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    overflow: "hidden",
  },
  cardSkeletonBody: {
    padding: 14,
    gap: 8,
  },
  cardMedia: {
    height: 176,
    backgroundColor: Brand.forest,
    justifyContent: "flex-start",
  },
  mediaFallback: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  statusChip: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 24,
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
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  mediaMeta: {
    position: "absolute",
    left: 14,
    bottom: 12,
  },
  mediaCode: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.76)",
  },
  cardBody: {
    padding: 14,
  },
  cardTitle: {
    fontFamily: FontFamily.display,
    fontSize: 25,
    lineHeight: 27,
    letterSpacing: -0.5,
    color: Brand.ink,
  },
  cardMeta: {
    marginTop: 4,
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  cardDescription: {
    marginTop: 9,
    fontFamily: FontFamily.sans,
    fontSize: 12.5,
    lineHeight: 19,
    color: Brand.ink70,
  },
  tags: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    maxWidth: "100%",
    borderRadius: 999,
    backgroundColor: "rgba(16,36,26,0.05)",
    paddingVertical: 4,
    paddingHorizontal: 9,
    fontFamily: FontFamily.medium,
    fontSize: 9,
    letterSpacing: 0.5,
    color: Brand.ink55,
  },
  cardFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Brand.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  cardAuthor: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: Brand.ink70,
  },
  cardDate: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: Brand.ink55,
  },
  emptyCard: {
    marginTop: 16,
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
  sheetHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Brand.line,
  },
  sheetEyebrow: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: Brand.moss,
  },
  sheetTitle: {
    marginTop: 3,
    fontFamily: FontFamily.display,
    fontSize: 26,
    lineHeight: 28,
    letterSpacing: -0.6,
    color: Brand.ink,
  },
  sheetClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper2,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 14,
  },
  field: {
    gap: 7,
  },
  fieldRow: {
    flexDirection: "row",
    gap: 12,
  },
  fieldHalf: {
    flex: 1,
  },
  fieldLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  fieldHint: {
    fontFamily: FontFamily.sans,
    fontSize: 10.5,
    lineHeight: 15,
    color: Brand.ink55,
  },
  input: {
    minHeight: 44,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FontFamily.sans,
    fontSize: 13,
    color: Brand.ink,
  },
  textarea: {
    minHeight: 110,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  chip: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: Brand.forest,
    borderColor: Brand.forest,
  },
  chipText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: Brand.ink70,
  },
  chipTextActive: {
    color: Brand.paper,
  },
  formError: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    lineHeight: 16,
    color: "#B4462F",
  },
  submit: {
    height: 50,
    borderRadius: 999,
    backgroundColor: Brand.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitText: {
    fontFamily: FontFamily.medium,
    fontSize: 13.5,
    color: Brand.paper,
  },
  formFootnote: {
    fontFamily: FontFamily.sans,
    fontSize: 10.5,
    lineHeight: 15,
    textAlign: "center",
    color: Brand.ink55,
  },
});
