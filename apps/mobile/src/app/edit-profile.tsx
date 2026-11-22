import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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
import { SafeAreaView } from "react-native-safe-area-context";

import { CheckIcon, ChevronDownIcon, LockIcon } from "@/components/icons";
import { Skeleton } from "@/components/skeleton";
import { UserAvatar } from "@/components/user-avatar";
import { Brand, FontFamily } from "@/constants/theme";
import { RescuerScreenHeader } from "@/features/rescuer/RescuerScreenHeader";
import { useEditProfileViewModel } from "@/features/rescuer/useEditProfileViewModel";

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, form, barangays, loading, saving, uploadingPhoto, error, update, uploadPhoto, save } =
    useEditProfileViewModel();
  const [barangayOpen, setBarangayOpen] = useState(false);
  const [barangayQuery, setBarangayQuery] = useState("");

  const selectedBarangay = barangays.find((item) => item.id === form?.barangayId);
  const filteredBarangays = barangayQuery.trim()
    ? barangays.filter((item) =>
        item.name.toLowerCase().includes(barangayQuery.trim().toLowerCase()),
      )
    : barangays;

  const selectBarangay = (id: number | null) => {
    update("barangayId", id);
    setBarangayOpen(false);
    setBarangayQuery("");
  };

  const handleSave = async () => {
    const saved = await save();
    if (saved) router.back();
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    await uploadPhoto({
      uri: asset.uri,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
    });
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <RescuerScreenHeader
          title="Edit profile"
          subtitle="Account details"
          onBack={() => router.back()}
        />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {loading || !form ? (
              <View style={styles.skeleton}>
                <View style={styles.photoSkeleton}>
                  <Skeleton width={76} height={76} borderRadius={38} />
                  <View style={styles.photoSkeletonBody}>
                    <Skeleton width={112} height={13} borderRadius={6} />
                    <Skeleton width="88%" height={10} borderRadius={5} />
                    <Skeleton width="62%" height={10} borderRadius={5} />
                  </View>
                </View>
                <Skeleton height={62} borderRadius={16} />
                {[0, 1, 2, 3].map((index) => (
                  <Skeleton key={index} height={64} borderRadius={16} />
                ))}
                <Skeleton width={96} height={12} borderRadius={6} />
                <Skeleton height={50} borderRadius={16} />
                <Skeleton height={54} borderRadius={27} />
              </View>
            ) : (
              <>
                <View style={styles.photoCard}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Change profile photo"
                    onPress={() => void pickPhoto()}
                    disabled={uploadingPhoto}
                    style={({ pressed }) => [
                      styles.photoAvatar,
                      pressed && styles.pressed,
                    ]}
                  >
                    <UserAvatar uri={form.profilePhotoUrl} size={76} />
                    {uploadingPhoto ? (
                      <View style={styles.photoOverlay}>
                        <ActivityIndicator color={Brand.paper} />
                      </View>
                    ) : null}
                  </Pressable>

                  <View style={styles.photoBody}>
                    <Text style={styles.photoTitle}>Profile photo</Text>
                    <Text style={styles.photoHint}>
                      This is shown on your profile and to people you message.
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      disabled={uploadingPhoto}
                      onPress={() => void pickPhoto()}
                      style={({ pressed }) => [
                        styles.photoAction,
                        pressed && styles.pressed,
                        uploadingPhoto && styles.disabled,
                      ]}
                    >
                      <Text style={styles.photoActionText}>
                        {uploadingPhoto
                          ? "Uploading…"
                          : form.profilePhotoUrl
                            ? "Change photo"
                            : "Add photo"}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.lockedCard}>
                  <View style={styles.lockedIcon}>
                    <LockIcon size={15} color={Brand.moss} />
                  </View>
                  <View style={styles.lockedBody}>
                    <Text style={styles.lockedLabel}>Email address</Text>
                    <Text style={styles.lockedValue}>{user?.email ?? "—"}</Text>
                  </View>
                  <Text style={styles.lockedTag}>Read only</Text>
                </View>

                <View style={styles.group}>
                  <Field
                    label="First name"
                    value={form.firstName}
                    onChangeText={(value) => update("firstName", value)}
                    autoCapitalize="words"
                  />
                  <Field
                    label="Middle name"
                    value={form.middleName}
                    onChangeText={(value) => update("middleName", value)}
                    autoCapitalize="words"
                    placeholder="Optional"
                  />
                  <Field
                    label="Last name"
                    value={form.lastName}
                    onChangeText={(value) => update("lastName", value)}
                    autoCapitalize="words"
                  />
                  <Field
                    label="Phone number"
                    value={form.phoneNumber}
                    onChangeText={(value) => update("phoneNumber", value)}
                    keyboardType="phone-pad"
                    placeholder="+639XXXXXXXXX"
                  />
                </View>

                <View style={styles.section}>
                  <Text style={styles.fieldLabel}>
                    Barangay <Text style={styles.optional}>(optional)</Text>
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Select barangay"
                    onPress={() => setBarangayOpen(true)}
                    style={({ pressed }) => [
                      styles.select,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.selectValue,
                        selectedBarangay ? null : styles.selectPlaceholder,
                      ]}
                    >
                      {selectedBarangay?.name ?? "Select barangay"}
                    </Text>
                    <ChevronDownIcon size={16} color={Brand.ink55} />
                  </Pressable>
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Pressable
                  accessibilityRole="button"
                  disabled={saving}
                  onPress={() => void handleSave()}
                  style={({ pressed }) => [
                    styles.save,
                    pressed && styles.pressed,
                    saving && styles.disabled,
                  ]}
                >
                  {saving ? (
                    <ActivityIndicator color={Brand.paper} />
                  ) : (
                    <>
                      <Text style={styles.saveText}>Save changes</Text>
                      <View style={styles.saveIcon}>
                        <CheckIcon size={14} color={Brand.forest} />
                      </View>
                    </>
                  )}
                </Pressable>

                <Text style={styles.note}>
                  Your email is tied to your sign-in and can only be changed by
                  a FuRescue administrator.
                </Text>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal
        visible={barangayOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setBarangayOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.backdrop}
            onPress={() => setBarangayOpen(false)}
            accessibilityLabel="Close barangay picker"
          />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Barangay</Text>
              <Pressable
                onPress={() => setBarangayOpen(false)}
                hitSlop={10}
                accessibilityRole="button"
              >
                <Text style={styles.sheetDone}>Done</Text>
              </Pressable>
            </View>
            <TextInput
              value={barangayQuery}
              onChangeText={setBarangayQuery}
              placeholder="Search barangay"
              placeholderTextColor="rgba(16, 36, 26, 0.35)"
              autoCapitalize="none"
              autoCorrect={false}
              selectionColor={Brand.clay}
              style={styles.search}
            />
            <FlatList
              data={filteredBarangays}
              keyExtractor={(item) => String(item.id)}
              keyboardShouldPersistTaps="handled"
              style={styles.sheetList}
              ListHeaderComponent={
                <Pressable
                  onPress={() => selectBarangay(null)}
                  style={({ pressed }) => [
                    styles.optionRow,
                    pressed && styles.optionPressed,
                  ]}
                >
                  <Text style={styles.optionText}>Not sure yet</Text>
                  {form?.barangayId == null ? (
                    <CheckIcon size={16} color={Brand.clay} />
                  ) : null}
                </Pressable>
              }
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  No barangay matches that name.
                </Text>
              }
              renderItem={({ item }) => {
                const selected = form?.barangayId === item.id;
                return (
                  <Pressable
                    onPress={() => selectBarangay(item.id)}
                    style={({ pressed }) => [
                      styles.optionRow,
                      pressed && styles.optionPressed,
                    ]}
                  >
                    <Text style={styles.optionText}>{item.name}</Text>
                    {selected ? (
                      <CheckIcon size={16} color={Brand.clay} />
                    ) : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  autoCapitalize,
  keyboardType,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "phone-pad";
  placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor="rgba(16,36,26,0.32)"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Brand.paper2 },
  flex: { flex: 1 },
  content: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 48,
    gap: 18,
  },
  skeleton: { gap: 10 },
  photoSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    padding: 14,
  },
  photoSkeletonBody: { flex: 1, gap: 7 },
  photoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    padding: 14,
  },
  photoAvatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(31,122,77,0.12)",
  },
  photoImage: { width: "100%", height: "100%" },
  photoInitials: {
    fontFamily: FontFamily.display,
    fontSize: 26,
    color: Brand.forest,
  },
  photoOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(9,24,16,0.45)",
  },
  photoBody: { flex: 1, gap: 4 },
  photoTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: Brand.ink,
  },
  photoHint: {
    fontFamily: FontFamily.sans,
    fontSize: 11,
    lineHeight: 15,
    color: Brand.ink55,
  },
  photoAction: {
    alignSelf: "flex-start",
    marginTop: 4,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(31,122,77,0.24)",
    backgroundColor: "rgba(31,122,77,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoActionText: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: Brand.moss,
  },
  lockedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    padding: 14,
  },
  lockedIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(31,122,77,0.10)",
  },
  lockedBody: { flex: 1 },
  lockedLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  lockedValue: {
    marginTop: 3,
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: Brand.ink,
  },
  lockedTag: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  group: { gap: 10 },
  field: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
  },
  fieldLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  input: {
    marginTop: 2,
    paddingVertical: 6,
    fontFamily: FontFamily.medium,
    fontSize: 14.5,
    color: Brand.ink,
  },
  section: { gap: 9 },
  optional: {
    fontFamily: FontFamily.sans,
    textTransform: "none",
    letterSpacing: 0,
    color: Brand.ink55,
  },
  select: {
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  selectValue: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 13.5,
    color: Brand.ink,
  },
  selectPlaceholder: { color: "rgba(16, 36, 26, 0.42)" },
  error: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: "#B4462F",
  },
  save: {
    height: 54,
    marginTop: 4,
    borderRadius: 999,
    backgroundColor: Brand.forest,
    paddingLeft: 22,
    paddingRight: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  disabled: { opacity: 0.6 },
  saveText: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    color: Brand.paper,
  },
  saveIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.sage,
  },
  note: {
    fontFamily: FontFamily.sans,
    fontSize: 11.5,
    lineHeight: 17,
    color: Brand.ink55,
    textAlign: "center",
  },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(9, 24, 16, 0.42)",
  },
  sheet: {
    maxHeight: "78%",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: Brand.paper,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(16, 36, 26, 0.18)",
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sheetTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 17,
    color: Brand.ink,
  },
  sheetDone: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: Brand.clay,
  },
  search: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper2,
    paddingHorizontal: 14,
    fontFamily: FontFamily.medium,
    fontSize: 13.5,
    color: Brand.ink,
  },
  sheetList: { marginTop: 8 },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(16, 36, 26, 0.07)",
  },
  optionPressed: { opacity: 0.6 },
  optionText: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Brand.ink,
  },
  emptyText: {
    paddingVertical: 22,
    textAlign: "center",
    fontFamily: FontFamily.sans,
    fontSize: 12.5,
    color: Brand.ink55,
  },
  pressed: { opacity: 0.7 },
});
