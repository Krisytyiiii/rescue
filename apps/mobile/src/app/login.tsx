import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState, type ComponentRef } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PawMark, Wordmark } from "@/components/brand";
import { EyeIcon, GoogleMark } from "@/components/icons";
import { Brand, FontFamily } from "@/constants/theme";
import { webUrl } from "@/data";
import { useLoginViewModel } from "@/features/auth/useLoginViewModel";

export default function LoginScreen() {
  const router = useRouter();
  const { notice: noticeParam } = useLocalSearchParams<{ notice?: string }>();
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);

  const {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    pending,
    googlePending,
    formError,
    notice,
    submit,
    handleGoogle,
  } = useLoginViewModel({
    initialNotice: typeof noticeParam === "string" ? noticeParam : "",
    onAuthenticated: () => router.replace("/"),
  });

  // UI-only focus state, not form state.
  const [focused, setFocused] = useState<"email" | "password" | null>(null);

  const openWeb = (path: string) => {
    Linking.openURL(webUrl(path)).catch(() => undefined);
  };

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={styles.glow} />

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.topBar}>
              <View style={styles.brand}>
                <PawMark size={32} />
                <Wordmark size={18} />
              </View>
            </View>

            <View style={styles.form}>
              <Text style={styles.eyebrow}>Account access</Text>
              <Text style={styles.title} maxFontSizeMultiplier={1.15}>
                Welcome{"\n"}
                <Text style={styles.titleAccent}>back.</Text>
              </Text>
              <Text style={styles.body}>
                Sign in to follow your fosters, donations, and the animals
                waiting for a home in Mati City.
              </Text>

              <Pressable
                onPress={handleGoogle}
                disabled={pending || googlePending}
                accessibilityRole="button"
                accessibilityLabel="Sign in with Google"
                style={({ pressed }) => [
                  styles.google,
                  pressed && styles.googlePressed,
                ]}
              >
                {googlePending ? (
                  <ActivityIndicator color={Brand.ink} />
                ) : (
                  <GoogleMark />
                )}
                <Text style={styles.googleText}>Sign in with Google</Text>
              </Pressable>

              <View style={styles.divider} aria-hidden>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with email</Text>
                <View style={styles.dividerLine} />
              </View>

              {formError ? (
                <View style={styles.alert} accessibilityRole="alert">
                  <Text style={styles.alertText}>{formError}</Text>
                </View>
              ) : null}

              {notice ? (
                <View style={styles.notice} accessibilityRole="alert">
                  <Text style={styles.noticeText}>{notice}</Text>
                </View>
              ) : null}

              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  placeholder="you@example.com"
                  placeholderTextColor="rgba(16, 36, 26, 0.35)"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  editable={!pending}
                  selectionColor={Brand.clay}
                  style={[styles.input, focused === "email" && styles.inputFocused]}
                />
              </View>

              <View style={styles.field}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Password</Text>
                  <Pressable
                    onPress={() => openWeb("/forgot-password")}
                    hitSlop={8}
                    style={({ pressed }) => pressed && styles.pressed}
                  >
                    <Text style={styles.inlineLink}>Forgot password?</Text>
                  </Pressable>
                </View>
                <View style={styles.passwordWrap}>
                  <TextInput
                    ref={passwordRef}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused(null)}
                    onSubmitEditing={submit}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(16, 36, 26, 0.35)"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="current-password"
                    textContentType="password"
                    returnKeyType="go"
                    editable={!pending}
                    selectionColor={Brand.clay}
                    style={[
                      styles.input,
                      styles.passwordInput,
                      focused === "password" && styles.inputFocused,
                    ]}
                  />
                  <Pressable
                    onPress={() => setShowPassword((value) => !value)}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.reveal,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    <EyeIcon hidden={showPassword} />
                  </Pressable>
                </View>
              </View>

              <Pressable
                onPress={submit}
                disabled={pending}
                accessibilityRole="button"
                accessibilityLabel="Log in"
                style={({ pressed }) => [
                  styles.cta,
                  pressed && styles.ctaPressed,
                  pending && styles.ctaDisabled,
                ]}
              >
                {pending ? (
                  <ActivityIndicator color={Brand.paper} />
                ) : (
                  <>
                    <Text style={styles.ctaText}>Log in</Text>
                    <View style={styles.ctaIcon}>
                      <Text style={styles.ctaArrow}>↗</Text>
                    </View>
                  </>
                )}
              </Pressable>

              <Text style={styles.footNote}>
                New to FuRescue?{" "}
                <Text
                  style={styles.footLink}
                  onPress={() => router.push("/signup")}
                  accessibilityRole="link"
                >
                  Create an account
                </Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Brand.paper,
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    top: -120,
    right: -110,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(31, 122, 77, 0.06)",
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 28,
  },
  topBar: {
    height: 64,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pressed: {
    opacity: 0.55,
  },
  form: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  eyebrow: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    letterSpacing: 1.45,
    textTransform: "uppercase",
    color: Brand.clay,
  },
  title: {
    marginTop: 16,
    fontFamily: FontFamily.display,
    fontSize: 46,
    lineHeight: 44,
    letterSpacing: -1.6,
    color: Brand.ink,
  },
  titleAccent: {
    fontFamily: FontFamily.displayItalic,
    color: Brand.clay,
  },
  body: {
    marginTop: 14,
    maxWidth: 400,
    fontFamily: FontFamily.sans,
    fontSize: 15,
    lineHeight: 24,
    color: Brand.ink70,
  },
  alert: {
    marginTop: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(180, 35, 24, 0.28)",
    backgroundColor: "rgba(180, 35, 24, 0.07)",
  },
  alertText: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    lineHeight: 19,
    color: "#8f2318",
  },
  notice: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(31, 122, 77, 0.25)",
    backgroundColor: "rgba(31, 122, 77, 0.06)",
  },
  noticeText: {
    fontFamily: FontFamily.sans,
    fontSize: 13,
    lineHeight: 19,
    color: Brand.moss,
  },
  google: {
    marginTop: 24,
    height: 52,
    width: "100%",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.lineStrong,
    backgroundColor: Brand.paper,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  googlePressed: {
    backgroundColor: "#f7fbf8",
  },
  googleText: {
    fontFamily: FontFamily.medium,
    fontSize: 14.5,
    color: Brand.ink,
  },
  divider: {
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Brand.line,
  },
  dividerText: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    letterSpacing: 1.15,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  field: {
    marginTop: 20,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    letterSpacing: 1.35,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  inlineLink: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: Brand.clay,
  },
  input: {
    marginTop: 8,
    height: 52,
    width: "100%",
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    fontFamily: FontFamily.sans,
    fontSize: 15,
    color: Brand.ink,
  },
  inputFocused: {
    borderColor: Brand.clay,
    backgroundColor: "#fbfefc",
  },
  passwordWrap: {
    position: "relative",
    justifyContent: "center",
  },
  passwordInput: {
    paddingRight: 72,
  },
  reveal: {
    position: "absolute",
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cta: {
    marginTop: 26,
    height: 56,
    borderRadius: 999,
    paddingLeft: 22,
    paddingRight: 8,
    backgroundColor: Brand.ink,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ctaPressed: {
    backgroundColor: Brand.moss,
  },
  ctaDisabled: {
    opacity: 0.75,
  },
  ctaText: {
    fontFamily: FontFamily.medium,
    fontSize: 15,
    color: Brand.paper,
    letterSpacing: 0.1,
  },
  ctaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Brand.paper10,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaArrow: {
    fontSize: 17,
    color: Brand.paper,
    marginTop: -1,
  },
  footNote: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Brand.line,
    textAlign: "center",
    fontFamily: FontFamily.sans,
    fontSize: 13.5,
    color: Brand.ink55,
  },
  footLink: {
    fontFamily: FontFamily.medium,
    color: Brand.ink,
  },
});
