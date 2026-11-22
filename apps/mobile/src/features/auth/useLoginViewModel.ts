import { useState } from "react";

import { authRepository } from "@/data";
import { validateLogin } from "@/domain/auth-validation";
import type { AuthRepository } from "@/domain/ports";

export interface LoginViewModelOptions {
  repository?: AuthRepository;
  onAuthenticated?: () => void;
  /** Message carried over from another screen (for example Google signup). */
  initialNotice?: string;
}

/** Presentation logic for the login screen. No network or routing details. */
export function useLoginViewModel({
  repository = authRepository,
  onAuthenticated,
  initialNotice = "",
}: LoginViewModelOptions = {}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState(initialNotice);

  const submit = async () => {
    if (pending || googlePending) return;

    const validationError = validateLogin({ email, password });
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setPending(true);
    setFormError("");
    setNotice("");

    try {
      await repository.login({ email: email.trim(), password });
      onAuthenticated?.();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "We couldn't sign you in. Please try again.",
      );
    } finally {
      setPending(false);
    }
  };

  const handleGoogle = async () => {
    if (pending || googlePending) return;

    setGooglePending(true);
    setFormError("");
    setNotice("");

    try {
      const outcome = await repository.startGoogleAuth("login");

      switch (outcome.status) {
        case "active":
          onAuthenticated?.();
          break;
        case "not_registered":
          setFormError(
            "No FuRescue account is linked to that Google account. Create an account first, then sign in.",
          );
          break;
        case "pending":
          setNotice(
            "Your rescuer account is still waiting for admin approval. Try again once it's approved.",
          );
          break;
        case "existing_account":
          setNotice(
            "This Google account already has a FuRescue account. Please log in again.",
          );
          break;
        case "cancelled":
          break;
        case "error":
          setFormError(outcome.message);
          break;
        case "complete_profile":
          setFormError(
            "That Google account isn't registered yet. Create an account to finish setting it up.",
          );
          break;
      }
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "We couldn't sign you in with Google. Please try again.",
      );
    } finally {
      setGooglePending(false);
    }
  };

  return {
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
  };
}
