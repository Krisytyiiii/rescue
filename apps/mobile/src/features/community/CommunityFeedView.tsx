import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
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
import {
  MAX_COMMUNITY_PHOTOS,
  type CommunityBreed,
  type CommunityPost,
  type CommunitySex,
  type CommunitySize,
  type CommunitySpecies,
  type NewCommunityPost,
} from "@/domain/community";

import {
  ageLabel,
  BREED_LABEL,
  formatDate,
  postAuthor,
  postPhotos,
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
  photoUrls: string[];
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
  photoUrls: [],
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
    uploadPhoto,
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
        <View style={styles.headerWrap}>
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
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
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
        onUploadPhoto={uploadPhoto}
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
  const photos = postPhotos(post);
  const status = postStatus(post);
  const { width } = useWindowDimensions();
  const mediaWidth = Math.max(1, Math.min(width, 560) - 44 - 2);

  return (
    <View style={styles.card}>
      <View style={styles.cardMedia}>
        {photos.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={StyleSheet.absoluteFill}
          >
            {photos.map((photo) => (
              <Image
                key={photo}
                source={{ uri: photo }}
                style={[styles.cardMediaImage, { width: mediaWidth }]}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        ) : (
          <>
            <LinearGradient
              colors={["#2C5A46", "#123A28"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.mediaFallback}>
              <PawIcon size={34} color="rgba(255,255,255,0.35)" />
            </View>
          </>
        )}

        <View style={[styles.statusChip, { backgroundColor: status.background }]}>
          <View style={[styles.statusDot, { backgroundColor: status.ink }]} />
          <Text style={[styles.statusText, { color: status.ink }]}>
            {status.label}
          </Text>
        </View>

        {photos.length > 1 ? (
          <View style={styles.photoCount}>
            <Text style={styles.photoCountText}>{photos.length} photos</Text>
          </View>
        ) : null}

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

type FormErrors = Partial<Record<"name" | "age" | "description", string>>;

function ComposerSheet({
  visible,
  submitting,
  error,
  onClose,
  onSubmit,
  onInvalid,
  onDismissError,
  onUploadPhoto,
}: {
  visible: boolean;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (input: NewCommunityPost) => Promise<boolean>;
  onInvalid: (message: string) => void;
  onDismissError: () => void;
  onUploadPhoto: (uri: string) => Promise<string>;
}) {
  const [form, setForm] = useState<PostForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const remaining = MAX_COMMUNITY_PHOTOS - form.photoUrls.length;

  const update = <K extends keyof PostForm,>(key: K, value: PostForm[K]) => {
    onDismissError();
    if (key === "name" || key === "age" || key === "description") {
      const errorKey = key as "name" | "age" | "description";
      setErrors((current) => {
        if (!current[errorKey]) return current;
        const next = { ...current };
        delete next[errorKey];
        return next;
      });
    }
    setForm((current) => ({ ...current, [key]: value }));
  };

  const close = () => {
    if (submitting || uploading) return;
    onClose();
  };

  const removePhoto = (index: number) => {
    onDismissError();
    setPhotoError(null);
    setForm((current) => ({
      ...current,
      photoUrls: current.photoUrls.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handlePickPhotos = async () => {
    if (remaining <= 0 || uploading) return;

    onDismissError();
    setPhotoError(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPhotoError("Allow photo access in your device settings to add photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });

    if (result.canceled) return;

    setUploading(true);
    try {
      for (const asset of result.assets.slice(0, remaining)) {
        const url = await onUploadPhoto(asset.uri);
        setForm((current) =>
          current.photoUrls.length >= MAX_COMMUNITY_PHOTOS ||
          current.photoUrls.includes(url)
            ? current
            : { ...current, photoUrls: [...current.photoUrls, url] },
        );
      }
    } catch (cause) {
      setPhotoError(
        cause instanceof Error
          ? cause.message
          : "We couldn't upload that photo. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleFormSubmit = async () => {
    const name = form.name.trim();
    const description = form.description.trim();
    const age = form.age.trim() === "" ? undefined : Number(form.age);

    const nextErrors: FormErrors = {};
    if (!name) {
      nextErrors.name = "Give the animal a name or a short nickname.";
    }
    if (description.length < 20) {
      nextErrors.description =
        "Write at least a couple of sentences so adopters know the animal.";
    }
    if (age !== undefined && (!Number.isInteger(age) || age < 0 || age > 600)) {
      nextErrors.age = "Enter whole months between 0 and 600, or leave it blank.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    if (uploading) {
      onInvalid("Please wait for your photos to finish uploading.");
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
      photoUrls: form.photoUrls.length > 0 ? form.photoUrls : undefined,
    });

    if (created) {
      setForm(EMPTY_FORM);
      setErrors({});
      setPhotoError(null);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        style={styles.sheetBackdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Close the adoption post form"
          onPress={close}
        />

        <View style={styles.sheet}>
          <View style={styles.sheetHead}>
            <View style={styles.sheetHeadText}>
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
            <FormSection
              label="Photos"
              hint={`Add up to ${MAX_COMMUNITY_PHOTOS}. The first photo becomes the cover.`}
            >
              <View style={styles.photoGrid}>
                {form.photoUrls.map((uri, index) => (
                  <View key={`${uri}-${index}`} style={styles.photoTile}>
                    <Image
                      source={{ uri }}
                      style={StyleSheet.absoluteFill}
                      resizeMode="cover"
                    />
                    {index === 0 ? (
                      <View style={styles.photoCover}>
                        <Text style={styles.photoCoverText}>Cover</Text>
                      </View>
                    ) : null}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remove photo ${index + 1}`}
                      hitSlop={6}
                      onPress={() => removePhoto(index)}
                      style={({ pressed }) => [
                        styles.photoRemove,
                        pressed && styles.pressed,
                      ]}
                    >
                      <CloseIcon size={12} color={Brand.ink} />
                    </Pressable>
                  </View>
                ))}

                {remaining > 0 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Add photos"
                    disabled={uploading}
                    onPress={() => void handlePickPhotos()}
                    style={({ pressed }) => [
                      styles.photoAdd,
                      pressed && styles.pressed,
                    ]}
                  >
                    {uploading ? (
                      <ActivityIndicator color={Brand.moss} />
                    ) : (
                      <>
                        <PlusCircleIcon size={22} color={Brand.moss} />
                        <Text style={styles.photoAddText}>Add photo</Text>
                      </>
                    )}
                  </Pressable>
                ) : null}
              </View>

              <Text style={styles.photoCounter}>
                {form.photoUrls.length} of {MAX_COMMUNITY_PHOTOS} photos
              </Text>
              {photoError ? (
                <Text style={styles.fieldError}>{photoError}</Text>
              ) : null}
            </FormSection>

            <FormSection label="The basics">
              <Field label="Name" required error={errors.name}>
                <TextInput
                  value={form.name}
                  onChangeText={(value) => update("name", value)}
                  placeholder="e.g. Bantay"
                  placeholderTextColor={Brand.ink55}
                  style={[styles.input, errors.name ? styles.inputError : null]}
                  maxLength={60}
                />
              </Field>

              <SegmentedGroup
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
            </FormSection>

            <FormSection label="Details">
              <ChipGroup
                label="Sex"
                options={SEX_OPTIONS}
                selected={form.sex}
                labelFor={(value) => SEX_LABEL[value] ?? value}
                onSelect={(value) => update("sex", value)}
              />

              <Field
                label="Age"
                hint="Leave blank if you're not sure."
                error={errors.age}
              >
                <View style={styles.inputWithSuffix}>
                  <TextInput
                    value={form.age}
                    onChangeText={(value) =>
                      update("age", value.replace(/[^0-9]/g, ""))
                    }
                    placeholder="e.g. 14"
                    placeholderTextColor={Brand.ink55}
                    keyboardType="number-pad"
                    style={[
                      styles.input,
                      styles.inputFlex,
                      errors.age ? styles.inputError : null,
                    ]}
                    maxLength={3}
                  />
                  <View style={styles.inputSuffix}>
                    <Text style={styles.inputSuffixText}>months</Text>
                  </View>
                </View>
              </Field>

              <SegmentedGroup
                label="Size"
                options={SIZE_OPTIONS}
                selected={form.size}
                labelFor={(value) => SIZE_LABEL[value] ?? value}
                onSelect={(value) => update("size", value)}
              />
            </FormSection>

            <FormSection label="Story">
              <Field
                label="About this animal"
                required
                error={errors.description}
              >
                <TextInput
                  value={form.description}
                  onChangeText={(value) => update("description", value)}
                  placeholder="Where you found the animal, how it behaves, and what kind of home would suit it."
                  placeholderTextColor={Brand.ink55}
                  style={[
                    styles.input,
                    styles.textarea,
                    errors.description ? styles.inputError : null,
                  ]}
                  multiline
                  textAlignVertical="top"
                  maxLength={2000}
                />
                <Text style={styles.charCount}>
                  {form.description.length}/2000
                </Text>
              </Field>
            </FormSection>

            <FormSection label="Extra details">
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
            </FormSection>

            {error ? <Text style={styles.formError}>{error}</Text> : null}
          </ScrollView>

          <View style={styles.sheetFooter}>
            <Text style={styles.formFootnote}>
              Reviewed by the City Vet team before it appears publicly.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void handleFormSubmit()}
              disabled={submitting || uploading}
              style={({ pressed }) => [
                styles.submit,
                (submitting || uploading) && styles.submitDisabled,
                pressed && styles.pressed,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={Brand.paper} />
              ) : (
                <Text style={styles.submitText}>Submit for review</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function FormSection({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.formSection}>
      <View style={styles.formSectionHeading}>
        <Text style={styles.formSectionLabel}>{label}</Text>
        {hint ? <Text style={styles.formSectionHint}>{hint}</Text> : null}
      </View>
      <View style={styles.formSectionBody}>{children}</View>
    </View>
  );
}

function SegmentedGroup<T extends string>({
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
      <View style={styles.segmented}>
        {options.map((option) => {
          const active = option === selected;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onSelect(option)}
              style={({ pressed }) => [
                styles.segment,
                active && styles.segmentActive,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[styles.segmentText, active && styles.segmentTextActive]}
                numberOfLines={1}
              >
                {labelFor(option)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
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
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      {children}
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
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
  cardMediaImage: {
    height: 176,
  },
  photoCount: {
    position: "absolute",
    top: 12,
    right: 12,
    height: 24,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: "rgba(8,20,14,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoCountText: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.9)",
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
  sheetHeadText: {
    flex: 1,
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
    paddingTop: 18,
    paddingBottom: 26,
    gap: 22,
  },
  formSection: {
    gap: 12,
  },
  formSectionHeading: {
    gap: 3,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Brand.line,
  },
  formSectionLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    letterSpacing: 0.2,
    color: Brand.ink,
  },
  formSectionHint: {
    fontFamily: FontFamily.sans,
    fontSize: 11,
    lineHeight: 15,
    color: Brand.ink55,
  },
  formSectionBody: {
    gap: 14,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  photoTile: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: Brand.sand,
    borderWidth: 1,
    borderColor: Brand.line,
  },
  photoCover: {
    position: "absolute",
    left: 6,
    bottom: 6,
    borderRadius: 999,
    backgroundColor: "rgba(8,20,14,0.62)",
    paddingVertical: 2,
    paddingHorizontal: 7,
  },
  photoCoverText: {
    fontFamily: FontFamily.medium,
    fontSize: 8,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: Brand.paper,
  },
  photoRemove: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoAdd: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(31,122,77,0.4)",
    backgroundColor: "rgba(47,143,99,0.06)",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  photoAddText: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    color: Brand.moss,
  },
  photoCounter: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  field: {
    gap: 7,
  },
  fieldLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  required: {
    color: "#B4462F",
  },
  fieldHint: {
    fontFamily: FontFamily.sans,
    fontSize: 10.5,
    lineHeight: 15,
    color: Brand.ink55,
  },
  fieldError: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    lineHeight: 15,
    color: "#B4462F",
  },
  input: {
    minHeight: 46,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FontFamily.sans,
    fontSize: 13.5,
    color: Brand.ink,
  },
  inputError: {
    borderColor: "rgba(180,70,47,0.55)",
    backgroundColor: "rgba(180,70,47,0.04)",
  },
  inputFlex: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  inputWithSuffix: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  inputSuffix: {
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: Brand.line,
    borderTopRightRadius: 13,
    borderBottomRightRadius: 13,
    backgroundColor: Brand.paper2,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  inputSuffixText: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    letterSpacing: 0.4,
    color: Brand.ink55,
  },
  charCount: {
    alignSelf: "flex-end",
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    color: Brand.ink55,
  },
  textarea: {
    minHeight: 128,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  chip: {
    height: 34,
    paddingHorizontal: 13,
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
    fontSize: 11.5,
    color: Brand.ink70,
  },
  chipTextActive: {
    color: Brand.paper,
  },
  segmented: {
    flexDirection: "row",
    gap: 6,
    padding: 4,
    borderRadius: 14,
    backgroundColor: "rgba(16,36,26,0.05)",
  },
  segment: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  segmentActive: {
    backgroundColor: Brand.paper,
    shadowColor: "#10231A",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segmentText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: Brand.ink55,
  },
  segmentTextActive: {
    color: Brand.ink,
  },
  formError: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    lineHeight: 16,
    color: "#B4462F",
  },
  sheetFooter: {
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: Brand.line,
    backgroundColor: Brand.paper,
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
