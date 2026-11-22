import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
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
  View,
} from "react-native";

import { CloseIcon, PlusCircleIcon } from "@/components/icons";
import { Brand, FontFamily } from "@/constants/theme";
import {
  adoptionDraftError,
  adoptionDraftToInput,
  type AdoptableAnimal,
  type AdoptionDraft,
  type AdoptionHousingType,
  type AdoptionIdUpload,
} from "@/domain/adoption-applications";

import { adoptableName, HOUSING_TYPE_LABEL } from "./resident-presentation";
import { INTERVIEW_VENUE } from "./presentation";

const HOUSING_OPTIONS: AdoptionHousingType[] = [
  "house",
  "apartment",
  "boarding",
  "other",
];

const EMPTY_DRAFT: AdoptionDraft = {
  housingType: "house",
  isOwnedProperty: true,
  hasFencedArea: true,
  householdMembers: "",
  hasOtherPets: false,
  otherPetsDetails: "",
  priorPetExperience: "",
  reasonForAdopting: "",
  validIdUrl: null,
  homePhotoUrl: null,
};

/** Resident adoption application form for one listed animal. */
export function AdoptionApplySheet({
  visible,
  animal,
  submitting,
  error,
  onClose,
  onSubmit,
  onUpload,
}: {
  visible: boolean;
  animal: AdoptableAnimal | null;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (input: ReturnType<typeof adoptionDraftToInput>) => Promise<boolean>;
  onUpload: (photo: AdoptionIdUpload) => Promise<string>;
}) {
  const [draft, setDraft] = useState<AdoptionDraft>(EMPTY_DRAFT);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"validId" | "home" | null>(null);

  useEffect(() => {
    if (!visible) return;
    setDraft(EMPTY_DRAFT);
    setFormError(null);
    setUploading(null);
  }, [visible, animal?.id]);

  const update = <K extends keyof AdoptionDraft>(key: K, value: AdoptionDraft[K]) => {
    setFormError(null);
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const close = () => {
    if (submitting || uploading) return;
    onClose();
  };

  const pickImage = async (target: "validId" | "home") => {
    if (uploading) return;
    setFormError(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setFormError("Allow photo access in your device settings to attach a photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset) return;

    setUploading(target);
    try {
      const url = await onUpload({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      });
      update(target === "validId" ? "validIdUrl" : "homePhotoUrl", url);
    } catch (cause) {
      setFormError(
        cause instanceof Error
          ? cause.message
          : "We couldn't upload that photo. Please try again.",
      );
    } finally {
      setUploading(null);
    }
  };

  const submit = async () => {
    if (!animal) return;

    if (uploading) {
      setFormError("Please wait for your photo to finish uploading.");
      return;
    }

    const invalid = adoptionDraftError(draft);
    if (invalid) {
      setFormError(invalid);
      return;
    }

    const created = await onSubmit(adoptionDraftToInput(animal.id, draft));
    if (created) onClose();
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
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Close the adoption application"
          onPress={close}
        />

        <View style={styles.sheet}>
          <View style={styles.sheetHead}>
            <View style={styles.sheetHeadText}>
              <Text style={styles.eyebrow}>Adoption application</Text>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                {animal ? `Adopt ${adoptableName(animal)}` : "Apply to adopt"}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={close}
              style={({ pressed }) => [styles.close, pressed && styles.pressed]}
            >
              <CloseIcon size={18} color={Brand.ink} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.form}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Field label="Where will the animal live?" required>
              <View style={styles.chips}>
                {HOUSING_OPTIONS.map((option) => {
                  const active = draft.housingType === option;
                  return (
                    <Pressable
                      key={option}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => update("housingType", option)}
                      style={({ pressed }) => [
                        styles.chip,
                        active && styles.chipActive,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[styles.chipText, active && styles.chipTextActive]}
                      >
                        {HOUSING_TYPE_LABEL[option]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Field>

            <View style={styles.toggleRow}>
              <Toggle
                label="We own the property"
                value={draft.isOwnedProperty}
                onChange={(value) => update("isOwnedProperty", value)}
              />
              <Toggle
                label="Fenced area"
                value={draft.hasFencedArea}
                onChange={(value) => update("hasFencedArea", value)}
              />
            </View>

            <Field label="People in the household" hint="Optional">
              <TextInput
                value={draft.householdMembers}
                onChangeText={(value) =>
                  update("householdMembers", value.replace(/[^0-9]/g, ""))
                }
                placeholder="e.g. 4"
                placeholderTextColor={Brand.ink55}
                keyboardType="number-pad"
                maxLength={2}
                style={styles.input}
              />
            </Field>

            <View style={styles.toggleRow}>
              <Toggle
                label="Other pets at home"
                value={draft.hasOtherPets}
                onChange={(value) => update("hasOtherPets", value)}
              />
            </View>

            {draft.hasOtherPets ? (
              <Field label="Tell us about your other pets">
                <TextInput
                  value={draft.otherPetsDetails}
                  onChangeText={(value) => update("otherPetsDetails", value)}
                  placeholder="e.g. One senior dog, vaccinated"
                  placeholderTextColor={Brand.ink55}
                  maxLength={255}
                  style={styles.input}
                />
              </Field>
            ) : null}

            <Field label="Your experience with pets" hint="Optional">
              <TextInput
                value={draft.priorPetExperience}
                onChangeText={(value) => update("priorPetExperience", value)}
                placeholder="Have you cared for a dog or cat before?"
                placeholderTextColor={Brand.ink55}
                multiline
                maxLength={500}
                style={[styles.input, styles.inputMultiline]}
              />
            </Field>

            <Field label="Why do you want to adopt?" required>
              <TextInput
                value={draft.reasonForAdopting}
                onChangeText={(value) => update("reasonForAdopting", value)}
                placeholder="Tell the City Vet team about your home, routine, and why this animal is a good fit."
                placeholderTextColor={Brand.ink55}
                multiline
                maxLength={1000}
                style={[styles.input, styles.inputMultiline, styles.inputTall]}
              />
              <Text style={styles.counter}>
                {draft.reasonForAdopting.trim().length}/20 minimum
              </Text>
            </Field>

            <Field
              label="Valid ID"
              hint="Required · JPG, PNG, or WebP up to 5 MB"
              required
            >
              <PhotoPicker
                url={draft.validIdUrl}
                uploading={uploading === "validId"}
                onPick={() => void pickImage("validId")}
                onRemove={() => update("validIdUrl", null)}
              />
            </Field>

            <Field label="Photo of your home" hint="Optional">
              <PhotoPicker
                url={draft.homePhotoUrl}
                uploading={uploading === "home"}
                onPick={() => void pickImage("home")}
                onRemove={() => update("homePhotoUrl", null)}
              />
            </Field>

            {formError || error ? (
              <Text style={styles.error}>{formError ?? error}</Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Submit adoption application"
              disabled={submitting || uploading !== null}
              onPress={() => void submit()}
              style={({ pressed }) => [
                styles.submit,
                (submitting || uploading !== null) && styles.submitDisabled,
                pressed && styles.pressed,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={Brand.paper} />
              ) : (
                <Text style={styles.submitText}>Submit application</Text>
              )}
            </Pressable>

            <Text style={styles.footnote}>
              The City Vet team reviews every application. If they schedule an
              interview, it will be held at {INTERVIEW_VENUE}.
            </Text>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function PhotoPicker({
  url,
  uploading,
  onPick,
  onRemove,
}: {
  url: string | null;
  uploading: boolean;
  onPick: () => void;
  onRemove: () => void;
}) {
  if (url) {
    return (
      <View style={styles.photoTile}>
        <Image source={{ uri: url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Remove photo"
          onPress={onRemove}
          style={({ pressed }) => [styles.photoRemove, pressed && styles.pressed]}
        >
          <CloseIcon size={12} color={Brand.ink} />
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Attach a photo"
      disabled={uploading}
      onPress={onPick}
      style={({ pressed }) => [styles.photoAdd, pressed && styles.pressed]}
    >
      {uploading ? (
        <ActivityIndicator color={Brand.moss} />
      ) : (
        <>
          <PlusCircleIcon size={22} color={Brand.moss} />
          <Text style={styles.photoAddText}>Attach photo</Text>
        </>
      )}
    </Pressable>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={({ pressed }) => [
        styles.toggle,
        value && styles.toggleActive,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.toggleDot, value && styles.toggleDotActive]} />
      <Text style={[styles.toggleText, value && styles.toggleTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldHead}>
        <Text style={styles.fieldLabel}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
        {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(7,20,13,0.45)" },
  sheet: {
    maxHeight: "92%",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: Brand.paper,
    paddingBottom: 18,
  },
  sheetHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 12,
  },
  sheetHeadText: { flex: 1 },
  eyebrow: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: Brand.clay,
  },
  sheetTitle: {
    marginTop: 2,
    fontFamily: FontFamily.display,
    fontSize: 27,
    lineHeight: 31,
    letterSpacing: -0.6,
    color: Brand.ink,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.paper2,
  },
  scroll: { maxHeight: "100%" },
  form: { paddingHorizontal: 22, paddingBottom: 26, gap: 18 },
  field: { gap: 8 },
  fieldHead: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 8 },
  fieldLabel: { fontFamily: FontFamily.medium, fontSize: 12.5, color: Brand.ink },
  required: { color: "#B4462F" },
  fieldHint: { fontFamily: FontFamily.sans, fontSize: 10, color: Brand.ink55 },
  input: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FontFamily.sans,
    fontSize: 13,
    color: Brand.ink,
  },
  inputMultiline: { minHeight: 76, textAlignVertical: "top" },
  inputTall: { minHeight: 104 },
  counter: { alignSelf: "flex-end", fontFamily: FontFamily.sans, fontSize: 10, color: Brand.ink55 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
  },
  chipActive: { backgroundColor: Brand.forest, borderColor: Brand.forest },
  chipText: { fontFamily: FontFamily.medium, fontSize: 11.5, color: Brand.ink70 },
  chipTextActive: { color: Brand.paper },
  toggleRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
  },
  toggleActive: { borderColor: "rgba(31,122,77,0.4)", backgroundColor: "rgba(31,122,77,0.10)" },
  toggleDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Brand.line },
  toggleDotActive: { backgroundColor: Brand.forest },
  toggleText: { fontFamily: FontFamily.medium, fontSize: 11.5, color: Brand.ink70 },
  toggleTextActive: { color: Brand.forest },
  photoTile: {
    width: 120,
    height: 92,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: Brand.sand,
  },
  photoRemove: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  photoAdd: {
    width: 120,
    height: 92,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(31,122,77,0.35)",
    backgroundColor: "rgba(31,122,77,0.05)",
  },
  photoAddText: { fontFamily: FontFamily.medium, fontSize: 10.5, color: Brand.moss },
  error: {
    borderRadius: 12,
    backgroundColor: "rgba(180,70,47,0.10)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    lineHeight: 17,
    color: "#B4462F",
  },
  submit: {
    height: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.forest,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { fontFamily: FontFamily.medium, fontSize: 13.5, color: Brand.paper },
  footnote: {
    fontFamily: FontFamily.sans,
    fontSize: 10.5,
    lineHeight: 15,
    color: Brand.ink55,
    textAlign: "center",
  },
  pressed: { opacity: 0.7 },
});
