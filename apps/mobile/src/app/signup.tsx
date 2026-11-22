import { useRouter } from "expo-router";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
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

import { PawMark, Wordmark } from "@/components/brand";
import { ArrowUpRightIcon, CheckIcon, ChevronDownIcon, EyeIcon, GoogleMark } from "@/components/icons";
import { Brand, FontFamily } from "@/constants/theme";
import type { Role } from "@/domain/auth";
import { useSignupViewModel } from "@/features/auth/useSignupViewModel";

const ROLES: Array<{ id: Role; label: string; note: string }> = [
  { id: "community_user", label: "Resident", note: "Report, adopt, learn · active now" },
  { id: "rescuer", label: "Rescuer", note: "Respond to dispatches · needs approval" },
];

const STEPS = [
  {
    eyebrow: "About you",
    title: "Create your",
    accent: "account.",
    body: "Your name and email are how the team reaches you about rescues and adoptions.",
  },
  {
    eyebrow: "Secure it",
    title: "Protect your",
    accent: "account.",
    body: "At least 8 characters with upper and lowercase letters, a number, and a symbol.",
  },
  {
    eyebrow: "Your role",
    title: "One last",
    accent: "step.",
    body: "Choose how you want to help. Rescuer accounts are approved by an admin.",
  },
];

export default function SignupScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();

  const lastNameRef = useRef<ComponentRef<typeof TextInput>>(null);
  const emailRef = useRef<ComponentRef<typeof TextInput>>(null);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);
  const confirmRef = useRef<ComponentRef<typeof TextInput>>(null);
  const phoneRef = useRef<ComponentRef<typeof TextInput>>(null);
  const contentRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const {
    step,
    isLast,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    phone,
    setPhone,
    barangay,
    role,
    setRole,
    terms,
    setTerms,
    showPassword,
    setShowPassword,
    showConfirm,
    setShowConfirm,
    strength,
    confirmTouched,
    passwordsMatch,
    barangays,
    barangayOpen,
    setBarangayOpen,
    barangayQuery,
    setBarangayQuery,
    barangayError,
    filteredBarangays,
    loadBarangays,
    selectBarangay,
    pending,
    formError,
    notice,
    awaitingApproval,
    verificationRequired,
    code,
    setCode,
    verifying,
    resending,
    verificationError,
    verificationNotice,
    resendCode,
    editDetails,
    googleMode,
    googlePending,
    verifyCode,
    handleGoogle,
    handleContinue,
    submitGoogle,
    goBack,
  } = useSignupViewModel({
    onAuthenticated: () => router.replace("/"),
    onExistingAccount: (message) =>
      router.replace({ pathname: "/login", params: { notice: message } }),
  });

  // UI-only state: focus ring and keyboard-driven layout.
  const [focused, setFocused] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const short = height < 720;
  const titleSize = short ? 29 : 34;

  const header = verificationRequired
    ? {
        eyebrow: "Verify email",
        title: "Check your",
        accent: "inbox.",
        body: `We sent a 6-digit code to ${email.trim()}. It expires in 10 minutes.`,
      }
    : googleMode
      ? {
          eyebrow: "Google confirmed",
          title: "Finish your",
          accent: "profile.",
          body: "Tell us who you are and how you want to help. Rescuer accounts need admin approval.",
        }
      : STEPS[step];

  const activeError = verificationRequired ? verificationError : formError;
  const activeNotice = verificationRequired ? verificationNotice : notice;
  const primaryPending = verificationRequired ? verifying : pending;
  const primaryLabel = verificationRequired
    ? "Verify email"
    : isLast
      ? "Create account"
      : "Continue";

  const handlePrimary = () => {
    Keyboard.dismiss();
    setFocused(null);
    if (verificationRequired) {
      verifyCode();
      return;
    }
    if (googleMode) {
      submitGoogle();
      return;
    }
    handleContinue();
  };

  // Lift the layout when the keyboard opens so fields never sit under it.
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
      contentRef.current?.scrollTo({ y: 0, animated: false });
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (awaitingApproval) {
    return (
      <View style={styles.root}>
        <View pointerEvents="none" style={styles.glow} />
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.topBar}>
            <View style={styles.brand}>
              <PawMark size={32} />
              <Wordmark size={18} />
            </View>
          </View>

          <View style={styles.approvalWrap}>
            <View style={styles.approvalCard}>
              <Text style={styles.eyebrow}>Email verified</Text>
              <Text style={styles.approvalTitle}>
                Thanks,{"\n"}
                <Text style={styles.titleAccent}>{firstName.trim()}.</Text>
              </Text>
              <Text style={styles.approvalBody}>
                Your rescuer account is now pending approval from the FuRescue
                admin team. We'll review your application and activate your
                account once it's approved.
              </Text>
              <View style={styles.rule} />
              <Text style={styles.approvalMeta}>
                Status: Pending admin approval. After approval, sign in with
                your email and password to start receiving dispatches.
              </Text>
            </View>

            <Pressable
              onPress={() => router.replace("/login")}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.cta,
                styles.approvalCta,
                pressed && styles.ctaPressed,
              ]}
            >
              <Text style={styles.ctaText}>Back to log in</Text>
              <View style={styles.ctaIcon}>
                <ArrowUpRightIcon />
              </View>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={styles.glow} />

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            ref={contentRef}
            style={styles.flex}
            contentContainerStyle={styles.screen}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.topBar}>
              <View style={styles.brand}>
                <PawMark size={32} />
                <Wordmark size={18} />
              </View>
              <Pressable
                onPress={() => router.replace("/login")}
                hitSlop={12}
                style={({ pressed }) => pressed && styles.pressed}
                accessibilityRole="button"
              >
                <Text style={styles.topLink}>Log in</Text>
              </Pressable>
            </View>

            <View
              style={[
                styles.header,
                short && styles.headerShort,
                keyboardVisible && styles.headerKeyboard,
              ]}
            >
              {!googleMode ? (
                <View style={styles.progressRow}>
                  <View style={styles.progressBars}>
                    {STEPS.map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.progressBar,
                          index <= step && styles.progressBarActive,
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={styles.progressLabel}>
                    {step + 1} / {STEPS.length}
                  </Text>
                </View>
              ) : null}

              <Text style={styles.eyebrow}>{header.eyebrow}</Text>
              <Text
                maxFontSizeMultiplier={1.1}
                style={[
                  styles.title,
                  {
                    fontSize: keyboardVisible ? 24 : titleSize,
                    lineHeight: (keyboardVisible ? 24 : titleSize) * 0.98,
                  },
                ]}
              >
                {header.title}
                {"\n"}
                <Text style={styles.titleAccent}>{header.accent}</Text>
              </Text>
              {!keyboardVisible ? (
                <Text style={[styles.body, short && styles.bodyShort]}>
                  {header.body}
                </Text>
              ) : null}
            </View>

            <View style={styles.content}>
              {googleMode ? (
                <>
                  <View style={styles.googleVerified}>
                    <CheckIcon size={14} color={Brand.moss} strokeWidth={3} />
                    <Text style={styles.googleVerifiedText}>
                      {email.trim()} confirmed with Google
                    </Text>
                  </View>

                  <View style={styles.nameRow}>
                    <View style={styles.nameField}>
                      <Text style={styles.label}>First name</Text>
                      <TextInput
                        value={firstName}
                        onChangeText={setFirstName}
                        onFocus={() => setFocused("firstName")}
                        onBlur={() => setFocused(null)}
                        onSubmitEditing={() => lastNameRef.current?.focus()}
                        placeholder="Juan"
                        placeholderTextColor="rgba(16, 36, 26, 0.35)"
                        autoCapitalize="words"
                        returnKeyType="next"
                        editable={!pending}
                        selectionColor={Brand.clay}
                        style={[
                          styles.input,
                          focused === "firstName" && styles.inputFocused,
                        ]}
                      />
                    </View>

                    <View style={styles.nameField}>
                      <Text style={styles.label}>Last name</Text>
                      <TextInput
                        ref={lastNameRef}
                        value={lastName}
                        onChangeText={setLastName}
                        onFocus={() => setFocused("lastName")}
                        onBlur={() => setFocused(null)}
                        onSubmitEditing={() => phoneRef.current?.focus()}
                        placeholder="Dela Cruz"
                        placeholderTextColor="rgba(16, 36, 26, 0.35)"
                        autoCapitalize="words"
                        returnKeyType="next"
                        editable={!pending}
                        selectionColor={Brand.clay}
                        style={[
                          styles.input,
                          focused === "lastName" && styles.inputFocused,
                        ]}
                      />
                    </View>
                  </View>
                </>
              ) : null}

              {verificationRequired ? (
                <>
                  <View style={styles.field}>
                    <Text style={styles.label}>6-digit code</Text>
                    <TextInput
                      value={code}
                      onChangeText={(value) =>
                        setCode(value.replace(/\D/g, "").slice(0, 6))
                      }
                      onSubmitEditing={verifyCode}
                      placeholder="000000"
                      placeholderTextColor="rgba(16, 36, 26, 0.30)"
                      keyboardType="number-pad"
                      autoComplete="one-time-code"
                      textContentType="oneTimeCode"
                      maxLength={6}
                      returnKeyType="done"
                      editable={!verifying}
                      selectionColor={Brand.clay}
                      autoFocus
                      style={[styles.input, styles.codeInput]}
                    />
                    <Text style={styles.codeHelp}>
                      Sent to {email.trim()}
                    </Text>
                  </View>

                  <Pressable
                    onPress={resendCode}
                    disabled={resending || verifying}
                    hitSlop={8}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.resendRow,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.resendText}>
                      {resending ? "Sending a new code…" : "Resend code"}
                    </Text>
                  </Pressable>
                </>
              ) : step === 0 ? (
                <>
                  <Pressable
                    onPress={handleGoogle}
                    disabled={googlePending || pending}
                    accessibilityRole="button"
                    accessibilityLabel="Sign up with Google"
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
                    <Text style={styles.googleText}>Sign up with Google</Text>
                  </Pressable>

                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or use email</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <View style={styles.nameRow}>
                    <View style={styles.nameField}>
                      <Text style={styles.label}>First name</Text>
                      <TextInput
                        value={firstName}
                        onChangeText={setFirstName}
                        onFocus={() => setFocused("firstName")}
                        onBlur={() => setFocused(null)}
                        onSubmitEditing={() => lastNameRef.current?.focus()}
                        placeholder="Juan"
                        placeholderTextColor="rgba(16, 36, 26, 0.35)"
                        autoCapitalize="words"
                        autoComplete="given-name"
                        textContentType="givenName"
                        returnKeyType="next"
                        editable={!pending}
                        selectionColor={Brand.clay}
                        style={[
                          styles.input,
                          focused === "firstName" && styles.inputFocused,
                        ]}
                      />
                    </View>

                    <View style={styles.nameField}>
                      <Text style={styles.label}>Last name</Text>
                      <TextInput
                        ref={lastNameRef}
                        value={lastName}
                        onChangeText={setLastName}
                        onFocus={() => setFocused("lastName")}
                        onBlur={() => setFocused(null)}
                        onSubmitEditing={() => emailRef.current?.focus()}
                        placeholder="Dela Cruz"
                        placeholderTextColor="rgba(16, 36, 26, 0.35)"
                        autoCapitalize="words"
                        autoComplete="family-name"
                        textContentType="familyName"
                        returnKeyType="next"
                        editable={!pending}
                        selectionColor={Brand.clay}
                        style={[
                          styles.input,
                          focused === "lastName" && styles.inputFocused,
                        ]}
                      />
                    </View>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      ref={emailRef}
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setFocused("email")}
                      onBlur={() => setFocused(null)}
                      onSubmitEditing={handleContinue}
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
                      style={[
                        styles.input,
                        focused === "email" && styles.inputFocused,
                      ]}
                    />
                  </View>
                </>
              ) : null}

              {step === 1 ? (
                <>
                  <View style={styles.field}>
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.passwordWrap}>
                      <TextInput
                        ref={passwordRef}
                        value={password}
                        onChangeText={setPassword}
                        onFocus={() => setFocused("password")}
                        onBlur={() => setFocused(null)}
                        onSubmitEditing={() => confirmRef.current?.focus()}
                        placeholder="Create a strong password"
                        placeholderTextColor="rgba(16, 36, 26, 0.35)"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="new-password"
                        textContentType="newPassword"
                        returnKeyType="next"
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

                  <View style={styles.field}>
                    <Text style={styles.label}>Confirm password</Text>
                    <View style={styles.passwordWrap}>
                      <TextInput
                        ref={confirmRef}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        onFocus={() => setFocused("confirm")}
                        onBlur={() => setFocused(null)}
                        onSubmitEditing={handleContinue}
                        placeholder="Re-enter your password"
                        placeholderTextColor="rgba(16, 36, 26, 0.35)"
                        secureTextEntry={!showConfirm}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="new-password"
                        textContentType="newPassword"
                        returnKeyType="done"
                        editable={!pending}
                        selectionColor={Brand.clay}
                        style={[
                          styles.input,
                          styles.passwordInput,
                          focused === "confirm" && styles.inputFocused,
                          confirmTouched &&
                            (passwordsMatch
                              ? styles.inputValid
                              : styles.inputInvalid),
                        ]}
                      />
                      <Pressable
                        onPress={() => setShowConfirm((value) => !value)}
                        hitSlop={8}
                        style={({ pressed }) => [
                          styles.reveal,
                          pressed && styles.pressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={
                          showConfirm ? "Hide password" : "Show password"
                        }
                      >
                        <EyeIcon hidden={showConfirm} />
                      </Pressable>
                    </View>
                    <Text
                      style={[
                        styles.matchNote,
                        !passwordsMatch && styles.matchNoteError,
                      ]}
                    >
                      {confirmTouched
                        ? passwordsMatch
                          ? "Passwords match"
                          : "Passwords do not match"
                        : " "}
                    </Text>
                  </View>

                  <View style={styles.strengthCard}>
                    <View style={styles.strengthTop}>
                      <View style={styles.strengthBars}>
                        {[0, 1, 2, 3, 4].map((index) => (
                          <View
                            key={index}
                            style={[
                              styles.strengthBar,
                              index < strength.score && styles.strengthBarOn,
                              index < strength.score &&
                                strength.level === "moderate" &&
                                styles.strengthBarModerate,
                            ]}
                          />
                        ))}
                      </View>
                      <Text
                        style={[
                          styles.strengthLabel,
                          strength.level === "strong" && styles.strengthLabelStrong,
                        ]}
                      >
                        {strength.level === "empty" ? "Strength" : strength.level}
                      </Text>
                    </View>
                    <Text style={styles.strengthRules}>
                      8+ characters · uppercase and lowercase · number · symbol
                    </Text>
                  </View>
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <View style={styles.field}>
                    <Text style={styles.label}>I am joining as</Text>
                    <View style={styles.roleRow}>
                      {ROLES.map((option) => {
                        const active = role === option.id;
                        return (
                          <Pressable
                            key={option.id}
                            onPress={() => setRole(option.id)}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: active }}
                            style={[
                              styles.roleCard,
                              active && styles.roleCardActive,
                            ]}
                          >
                            <View
                              style={[styles.radio, active && styles.radioActive]}
                            >
                              {active ? <View style={styles.radioDot} /> : null}
                            </View>
                            <View style={styles.roleText}>
                              <Text style={styles.roleLabel}>{option.label}</Text>
                              <Text style={styles.roleNote}>{option.note}</Text>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>
                      Barangay <Text style={styles.optional}>(optional)</Text>
                    </Text>
                    <Pressable
                      onPress={() => setBarangayOpen(true)}
                      accessibilityRole="button"
                      accessibilityLabel="Select barangay"
                      style={({ pressed }) => [
                        styles.select,
                        pressed && styles.googlePressed,
                      ]}
                    >
                      <Text
                        style={
                          barangay ? styles.selectValue : styles.selectPlaceholder
                        }
                      >
                        {barangay?.name ?? "Select barangay"}
                      </Text>
                      <ChevronDownIcon />
                    </Pressable>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>
                      Mobile <Text style={styles.optional}>(optional)</Text>
                    </Text>
                    <TextInput
                      ref={phoneRef}
                      value={phone}
                      onChangeText={setPhone}
                      onFocus={() => setFocused("phone")}
                      onBlur={() => setFocused(null)}
                      placeholder="0917 123 4567"
                      placeholderTextColor="rgba(16, 36, 26, 0.35)"
                      keyboardType="phone-pad"
                      autoComplete="tel"
                      textContentType="telephoneNumber"
                      returnKeyType="done"
                      editable={!pending}
                      selectionColor={Brand.clay}
                      style={[
                        styles.input,
                        focused === "phone" && styles.inputFocused,
                      ]}
                    />
                  </View>

                  <Pressable
                    onPress={() => setTerms((value) => !value)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: terms }}
                    style={({ pressed }) => [
                      styles.termsRow,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View
                      style={[styles.checkbox, terms && styles.checkboxChecked]}
                    >
                      {terms ? (
                        <CheckIcon size={12} color={Brand.paper} strokeWidth={3} />
                      ) : null}
                    </View>
                    <Text style={styles.termsText}>
                      I agree to the volunteer code of conduct and adoption
                      guidelines.
                    </Text>
                  </Pressable>
                </>
              ) : null}
            </View>

            <View style={[styles.footer, keyboardVisible && styles.footerKeyboard]}>
              {activeError ? (
                <View style={styles.alert} accessibilityRole="alert">
                  <Text style={styles.alertText}>{activeError}</Text>
                </View>
              ) : null}

              {activeNotice ? (
                <View style={styles.notice} accessibilityRole="alert">
                  <Text style={styles.noticeText}>{activeNotice}</Text>
                </View>
              ) : null}

              <View style={styles.navRow}>
                {googleMode ? (
                  <Pressable
                    onPress={() => {
                      Keyboard.dismiss();
                      setFocused(null);
                      goBack();
                    }}
                    disabled={pending}
                    accessibilityRole="button"
                    accessibilityLabel="Back"
                    style={({ pressed }) => [
                      styles.backButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.backText}>Back</Text>
                  </Pressable>
                ) : verificationRequired ? (
                  <Pressable
                    onPress={() => {
                      Keyboard.dismiss();
                      setFocused(null);
                      editDetails();
                    }}
                    disabled={verifying}
                    accessibilityRole="button"
                    accessibilityLabel="Edit details"
                    style={({ pressed }) => [
                      styles.backButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.backText}>Edit</Text>
                  </Pressable>
                ) : step > 0 ? (
                  <Pressable
                    onPress={() => {
                      Keyboard.dismiss();
                      setFocused(null);
                      goBack();
                    }}
                    disabled={pending}
                    accessibilityRole="button"
                    accessibilityLabel="Back"
                    style={({ pressed }) => [
                      styles.backButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.backText}>Back</Text>
                  </Pressable>
                ) : null}

                <Pressable
                  onPress={handlePrimary}
                  disabled={primaryPending}
                  accessibilityRole="button"
                  accessibilityLabel={primaryLabel}
                  style={({ pressed }) => [
                    styles.cta,
                    pressed && styles.ctaPressed,
                    primaryPending && styles.ctaDisabled,
                  ]}
                >
                  {primaryPending ? (
                    <ActivityIndicator color={Brand.paper} />
                  ) : (
                    <>
                      <Text style={styles.ctaText}>{primaryLabel}</Text>
                      <View style={styles.ctaIcon}>
                        <ArrowUpRightIcon />
                      </View>
                    </>
                  )}
                </Pressable>
              </View>

              {!keyboardVisible ? (
                <Text style={styles.footNote}>
                  Already have an account?{" "}
                  <Text
                    style={styles.footLink}
                    onPress={() => router.replace("/login")}
                    accessibilityRole="link"
                  >
                    Log in
                  </Text>
                </Text>
              ) : null}
            </View>
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
                  {!barangay ? <CheckIcon size={16} color={Brand.clay} /> : null}
                </Pressable>
              }
              ListEmptyComponent={
                barangayError ? (
                  <View style={styles.emptyWrap}>
                    <Text style={styles.emptyText}>{barangayError}</Text>
                    <Pressable
                      onPress={loadBarangays}
                      accessibilityRole="button"
                      style={({ pressed }) => [
                        styles.retry,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.retryText}>Try again</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Text style={styles.emptyText}>
                    No barangay matches that name.
                  </Text>
                )
              }
              renderItem={({ item }) => {
                const selected = barangay?.id === item.id;
                return (
                  <Pressable
                    onPress={() => selectBarangay(item)}
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
  topLink: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: Brand.ink55,
  },
  pressed: {
    opacity: 0.55,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 10,
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
  },
  headerShort: {
    paddingTop: 4,
  },
  headerKeyboard: {
    paddingTop: 2,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressBars: {
    flex: 1,
    flexDirection: "row",
    gap: 5,
  },
  progressBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(16, 36, 26, 0.14)",
  },
  progressBarActive: {
    backgroundColor: Brand.clay,
  },
  progressLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  eyebrow: {
    marginTop: 18,
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    letterSpacing: 1.45,
    textTransform: "uppercase",
    color: Brand.clay,
  },
  title: {
    marginTop: 12,
    fontFamily: FontFamily.display,
    letterSpacing: -1.4,
    color: Brand.ink,
  },
  titleAccent: {
    fontFamily: FontFamily.displayItalic,
    color: Brand.clay,
  },
  body: {
    marginTop: 12,
    maxWidth: 400,
    fontFamily: FontFamily.sans,
    fontSize: 14,
    lineHeight: 21,
    color: Brand.ink70,
  },
  bodyShort: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
  },
  screen: {
    flexGrow: 1,
  },
  content: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  google: {
    height: 50,
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
    fontSize: 14,
    color: Brand.ink,
  },
  googleVerified: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(31, 122, 77, 0.25)",
    backgroundColor: "rgba(31, 122, 77, 0.06)",
  },
  googleVerifiedText: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: Brand.moss,
  },
  divider: {
    marginVertical: 16,
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
  nameRow: {
    flexDirection: "row",
    gap: 12,
  },
  nameField: {
    flex: 1,
  },
  field: {
    marginTop: 16,
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    letterSpacing: 1.35,
    textTransform: "uppercase",
    color: Brand.ink55,
  },
  optional: {
    fontFamily: FontFamily.sans,
    fontSize: 10,
    letterSpacing: 0,
    textTransform: "none",
    color: Brand.ink55,
  },
  input: {
    marginTop: 7,
    height: 50,
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
  codeInput: {
    fontSize: 26,
    fontFamily: FontFamily.medium,
    letterSpacing: 10,
    textAlign: "center",
    paddingLeft: 26,
  },
  codeHelp: {
    marginTop: 8,
    fontFamily: FontFamily.sans,
    fontSize: 12,
    color: Brand.ink55,
  },
  resendRow: {
    marginTop: 16,
    alignSelf: "flex-start",
  },
  resendText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: Brand.clay,
  },
  inputValid: {
    borderColor: "rgba(31, 122, 77, 0.55)",
  },
  inputInvalid: {
    borderColor: "rgba(192, 84, 63, 0.55)",
  },
  passwordWrap: {
    position: "relative",
    justifyContent: "center",
  },
  passwordInput: {
    paddingRight: 52,
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
  matchNote: {
    marginTop: 6,
    fontFamily: FontFamily.sans,
    fontSize: 11.5,
    color: Brand.moss,
  },
  matchNoteError: {
    color: "#c0543f",
  },
  strengthCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: "#fbfdfb",
  },
  strengthTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  strengthBars: {
    flex: 1,
    flexDirection: "row",
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(16, 36, 26, 0.12)",
  },
  strengthBarOn: {
    backgroundColor: Brand.moss,
  },
  strengthBarModerate: {
    backgroundColor: "#b98b2e",
  },
  strengthLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Brand.ink55,
    minWidth: 52,
    textAlign: "right",
  },
  strengthLabelStrong: {
    color: Brand.moss,
  },
  strengthRules: {
    marginTop: 9,
    fontFamily: FontFamily.sans,
    fontSize: 11,
    lineHeight: 16,
    color: Brand.ink55,
  },
  select: {
    marginTop: 7,
    height: 50,
    width: "100%",
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectValue: {
    fontFamily: FontFamily.sans,
    fontSize: 15,
    color: Brand.ink,
  },
  selectPlaceholder: {
    fontFamily: FontFamily.sans,
    fontSize: 15,
    color: "rgba(16, 36, 26, 0.35)",
  },
  roleRow: {
    marginTop: 8,
    flexDirection: "row",
    gap: 10,
  },
  roleCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Brand.line,
    backgroundColor: Brand.paper,
  },
  roleCardActive: {
    borderColor: "rgba(31, 122, 77, 0.55)",
    backgroundColor: "rgba(31, 122, 77, 0.04)",
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Brand.lineStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: {
    borderColor: Brand.clay,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Brand.clay,
  },
  roleText: {
    flex: 1,
  },
  roleLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: Brand.ink,
  },
  roleNote: {
    marginTop: 2,
    fontFamily: FontFamily.sans,
    fontSize: 10,
    color: Brand.ink55,
  },
  termsRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  checkbox: {
    marginTop: 1,
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: Brand.lineStrong,
    backgroundColor: Brand.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: Brand.moss,
    borderColor: Brand.moss,
  },
  termsText: {
    flex: 1,
    fontFamily: FontFamily.sans,
    fontSize: 12,
    lineHeight: 17,
    color: Brand.ink70,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 8,
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
  },
  footerKeyboard: {
    paddingTop: 6,
    paddingBottom: 4,
  },
  alert: {
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(180, 35, 24, 0.28)",
    backgroundColor: "rgba(180, 35, 24, 0.07)",
  },
  alertText: {
    fontFamily: FontFamily.sans,
    fontSize: 12.5,
    lineHeight: 18,
    color: "#8f2318",
  },
  notice: {
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(31, 122, 77, 0.25)",
    backgroundColor: "rgba(31, 122, 77, 0.06)",
  },
  noticeText: {
    fontFamily: FontFamily.sans,
    fontSize: 12.5,
    lineHeight: 18,
    color: Brand.moss,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backButton: {
    height: 50,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.line,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: Brand.ink,
  },
  cta: {
    flex: 1,
    height: 52,
    borderRadius: 999,
    paddingLeft: 22,
    paddingRight: 7,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Brand.paper10,
    alignItems: "center",
    justifyContent: "center",
  },
  footNote: {
    marginTop: 10,
    textAlign: "center",
    fontFamily: FontFamily.sans,
    fontSize: 12.5,
    color: Brand.ink55,
  },
  footLink: {
    fontFamily: FontFamily.medium,
    color: Brand.ink,
  },

  /* Approval state */
  approvalWrap: {
    flex: 1,
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 16,
  },
  approvalCta: {
    flex: 0,
    marginTop: 20,
    width: "100%",
  },
  approvalCard: {
    borderWidth: 1,
    borderColor: Brand.line,
    borderRadius: 16,
    backgroundColor: Brand.paper,
    padding: 22,
    shadowColor: "#10241a",
    shadowOpacity: 0.12,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 5,
  },
  approvalTitle: {
    marginTop: 14,
    fontFamily: FontFamily.display,
    fontSize: 34,
    lineHeight: 34,
    letterSpacing: -1.1,
    color: Brand.ink,
  },
  approvalBody: {
    marginTop: 12,
    fontFamily: FontFamily.sans,
    fontSize: 14,
    lineHeight: 22,
    color: Brand.ink70,
  },
  rule: {
    height: 1,
    backgroundColor: Brand.line,
    marginVertical: 18,
  },
  approvalMeta: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    letterSpacing: 0.4,
    color: Brand.ink55,
  },

  /* Barangay modal */
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(16, 36, 26, 0.32)",
  },
  sheet: {
    maxHeight: "72%",
    backgroundColor: Brand.paper,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Brand.lineStrong,
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: {
    fontFamily: FontFamily.display,
    fontSize: 26,
    letterSpacing: -0.6,
    color: Brand.ink,
  },
  sheetDone: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: Brand.clay,
  },
  search: {
    marginTop: 14,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Brand.line,
    paddingHorizontal: 14,
    fontFamily: FontFamily.sans,
    fontSize: 14,
    color: Brand.ink,
  },
  sheetList: {
    marginTop: 10,
    flexShrink: 1,
  },
  optionRow: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: Brand.line,
    paddingHorizontal: 4,
  },
  optionPressed: {
    backgroundColor: "#f7fbf8",
  },
  optionText: {
    fontFamily: FontFamily.sans,
    fontSize: 14.5,
    color: Brand.ink,
  },
  emptyText: {
    marginTop: 18,
    textAlign: "center",
    fontFamily: FontFamily.sans,
    fontSize: 13,
    color: Brand.ink55,
  },
  emptyWrap: {
    alignItems: "center",
    paddingBottom: 12,
  },
  retry: {
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Brand.lineStrong,
  },
  retryText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: Brand.ink,
  },
});
