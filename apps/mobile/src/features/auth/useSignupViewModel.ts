import { useCallback, useEffect, useState } from "react";

import { authRepository } from "@/data";
import type { Barangay, Role } from "@/domain/auth";
import {
  evaluatePassword,
  normalizePhone,
  SIGNUP_STEPS,
  validateGoogleSignup,
  validateSignupStep,
  type SignupDraft,
} from "@/domain/auth-validation";
import type { AuthRepository } from "@/domain/ports";

export interface SignupViewModelOptions {
  repository?: AuthRepository;
  onAuthenticated?: () => void;
  /** Called when Google reports the account already exists (message shown on login). */
  onExistingAccount?: (message: string) => void;
}

/** Presentation logic for the multi-step signup screen. */
export function useSignupViewModel({
  repository = authRepository,
  onAuthenticated,
  onExistingAccount,
}: SignupViewModelOptions = {}) {
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [barangay, setBarangay] = useState<Barangay | null>(null);
  const [role, setRole] = useState<Role>("community_user");
  const [terms, setTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [barangayOpen, setBarangayOpen] = useState(false);
  const [barangayQuery, setBarangayQuery] = useState("");
  const [barangayError, setBarangayError] = useState("");

  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [awaitingApproval, setAwaitingApproval] = useState(false);

  // Email verification (OTP) phase after a manual signup.
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [verificationNotice, setVerificationNotice] = useState("");

  // Google onboarding: the email is verified, so only profile fields remain.
  const [googleMode, setGoogleMode] = useState(false);
  const [googleOnboardingToken, setGoogleOnboardingToken] = useState("");
  const [googlePending, setGooglePending] = useState(false);

  const strength = evaluatePassword(password);
  const confirmTouched = confirmPassword.length > 0;
  const passwordsMatch = confirmTouched && password === confirmPassword;
  const isLast = step === SIGNUP_STEPS - 1;

  const draft: SignupDraft = {
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
    phone,
    barangayId: barangay?.id,
    role,
    terms,
  };

  const loadBarangays = useCallback(() => {
    setBarangayError("");
    repository
      .loadBarangays()
      .then(setBarangays)
      .catch((error: unknown) => {
        setBarangays([]);
        setBarangayError(
          error instanceof Error
            ? error.message
            : "Couldn't load the barangay list.",
        );
      });
  }, [repository]);

  useEffect(() => {
    loadBarangays();
  }, [loadBarangays]);

  const submit = async () => {
    const validationError = validateSignupStep(SIGNUP_STEPS - 1, draft);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError("");
    setPending(true);

    try {
      const result = await repository.signup({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        phoneNumber: phone.trim() ? normalizePhone(phone) : undefined,
        barangayId: barangay?.id,
        role,
      });

      if (result.status === "verification_required") {
        setVerificationRequired(true);
        setCode("");
        setVerificationError("");
        setVerificationNotice(
          `We sent a 6-digit code to ${email.trim()}. Check your inbox.`,
        );
        return;
      }

      if (result.status === "pending") {
        setAwaitingApproval(true);
        return;
      }

      onAuthenticated?.();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We couldn't create your account. Please try again.";

      if (/already exists/i.test(message)) {
        const friendly =
          "This email already has a FuRescue account. Please log in instead.";
        setFormError(friendly);
        onExistingAccount?.(friendly);
        return;
      }

      setFormError(message);
    } finally {
      setPending(false);
    }
  };

  const verifyCode = async () => {
    if (verifying) return;

    const normalized = code.replace(/\D/g, "");
    if (normalized.length !== 6) {
      setVerificationError("Enter the 6-digit code from your email.");
      return;
    }

    setVerificationError("");
    setVerificationNotice("");
    setVerifying(true);

    try {
      const result = await repository.verifyEmail({
        email: email.trim(),
        code: normalized,
      });

      if (result.status === "active") {
        onAuthenticated?.();
        return;
      }

      setVerificationRequired(false);
      setAwaitingApproval(true);
    } catch (error) {
      setVerificationError(
        error instanceof Error
          ? error.message
          : "We couldn't verify that code. Please try again.",
      );
    } finally {
      setVerifying(false);
    }
  };

  const resendCode = async () => {
    if (resending || verifying) return;

    setVerificationError("");
    setVerificationNotice("");
    setResending(true);

    try {
      await repository.resendVerification(email.trim());
      setVerificationNotice("A new code is on its way. Check your inbox.");
    } catch (error) {
      setVerificationError(
        error instanceof Error
          ? error.message
          : "We couldn't send a new code. Please try again.",
      );
    } finally {
      setResending(false);
    }
  };

  const editDetails = () => {
    if (verifying) return;
    setVerificationRequired(false);
    setCode("");
    setVerificationError("");
    setVerificationNotice("");
  };

  const handleContinue = async () => {
    if (pending) return;

    const validationError = validateSignupStep(step, draft);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError("");
    setNotice("");

    if (step < SIGNUP_STEPS - 1) {
      setStep(step + 1);
      return;
    }

    await submit();
  };

  const goBack = () => {
    setFormError("");
    setNotice("");
    if (googleMode) {
      cancelGoogle();
      return;
    }
    setStep((current) => Math.max(0, current - 1));
  };

  const cancelGoogle = () => {
    if (googlePending) return;
    setGoogleMode(false);
    setGoogleOnboardingToken("");
    setFormError("");
    setNotice("");
    setStep(0);
  };

  const selectBarangay = (value: Barangay | null) => {
    setBarangay(value);
    setBarangayOpen(false);
  };

  const submitGoogle = async () => {
    if (pending) return;

    const validationError = validateGoogleSignup({
      firstName,
      lastName,
      phone,
      terms,
    });
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError("");
    setNotice("");
    setPending(true);

    try {
      const result = await repository.completeGoogleSignup({
        onboardingToken: googleOnboardingToken,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phone.trim() ? normalizePhone(phone) : undefined,
        barangayId: barangay?.id,
        role,
      });

      if (result.status === "pending") {
        setAwaitingApproval(true);
        return;
      }

      onAuthenticated?.();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "We couldn't finish creating your account. Please try again.",
      );
    } finally {
      setPending(false);
    }
  };

  const handleGoogle = async () => {
    if (googlePending || pending) return;

    setGooglePending(true);
    setFormError("");
    setNotice("");

    try {
      const outcome = await repository.startGoogleAuth("signup");

      switch (outcome.status) {
        case "active":
          onAuthenticated?.();
          break;
        case "existing_account": {
          const message =
            "This Google account already has a FuRescue account. Please log in instead.";
          setFormError(message);
          onExistingAccount?.(message);
          break;
        }
        case "pending":
          setAwaitingApproval(true);
          break;
        case "complete_profile":
          setGoogleOnboardingToken(outcome.onboardingToken);
          setFirstName(outcome.firstName);
          setLastName(outcome.lastName);
          setEmail(outcome.email);
          setGoogleMode(true);
          setStep(SIGNUP_STEPS - 1);
          break;
        case "not_registered":
          setFormError(
            "We couldn't find that Google account. Please try again.",
          );
          break;
        case "cancelled":
          break;
        case "error":
          setFormError(outcome.message);
          break;
      }
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "We couldn't sign you up with Google. Please try again.",
      );
    } finally {
      setGooglePending(false);
    }
  };

  const filteredBarangays = barangayQuery.trim()
    ? barangays.filter((entry) =>
        entry.name.toLowerCase().includes(barangayQuery.trim().toLowerCase()),
      )
    : barangays;

  return {
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
    handleGoogle,
    handleContinue,
    submitGoogle,
    cancelGoogle,
    goBack,
    verifyCode,
  };
}
