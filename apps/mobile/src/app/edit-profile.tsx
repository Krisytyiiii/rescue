import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CheckIcon, LockIcon } from "@/components/icons";
import { Brand, FontFamily } from "@/constants/theme";
import { RescuerScreenHeader } from "@/features/rescuer/RescuerScreenHeader";
import { useEditProfileViewModel } from "@/features/rescuer/useEditProfileViewModel";

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, form, barangays, loading, saving, error, update, save } =
    useEditProfileViewModel();
  const [showBarangays, setShowBarangays] = useState(false);

  const handleSave = async () => {
    const saved = await save();
    if (saved) router.back();
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
              <View style={styles.loading}>
                <ActivityIndicator color={Brand.clay} />
              </View>
            ) : (
              <>
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
                  <Text style={styles.sectionTitle}>Barangay</Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setShowBarangays((current) => !current)}
                    style={({ pressed }) => [
                      styles.select,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.selectValue}>
                      {form.barangayId == null
                        ? "Not set"
                        : barangays.find((item) => item.id === form.barangayId)
                            ?.name ?? `Barangay ${form.barangayId}`}
                    </Text>
                    <Text style={styles.selectAction}>
                      {showBarangays ? "Close" : "Change"}
                    </Text>
                  </Pressable>

                  {showBarangays ? (
                    <View style={styles.chips}>
                      <BarangayChip
                        label="Not set"
                        selected={form.barangayId == null}
                        onPress={() => {
                          update("barangayId", null);
                          setShowBarangays(false);
                        }}
                      />
                      {barangays.map((barangay) => (
                        <BarangayChip
                          key={barangay.id}
                          label={barangay.name}
                          selected={form.barangayId === barangay.id}
                          onPress={() => {
                            update("barangayId", barangay.id);
                            setShowBarangays(false);
                          }}
                        />
                      ))}
                    </View>
                  ) : null}
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

function BarangayChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
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
  loading: { paddingVertical: 60, alignItems: "center" },
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
  sectionTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: "uppercase",
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
  selectAction: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: Brand.clay,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingTop: 4,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipSelected: {
    borderColor: Brand.moss,
    backgroundColor: Brand.moss,
  },
  chipText: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: Brand.ink70,
  },
  chipTextSelected: { color: Brand.paper },
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
  pressed: { opacity: 0.7 },
});
