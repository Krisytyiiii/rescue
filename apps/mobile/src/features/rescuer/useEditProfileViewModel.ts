import { useCallback, useEffect, useState } from "react";

import { authRepository } from "@/data";
import type { AuthUser, Barangay } from "@/domain/auth";
import type { AuthRepository } from "@/domain/ports";

interface Options {
  auth?: AuthRepository;
}

export interface ProfileForm {
  firstName: string;
  middleName: string;
  lastName: string;
  phoneNumber: string;
  barangayId: number | null;
}

const PHONE_PATTERN = /^\+639\d{9}$/;

function formFromUser(user: AuthUser): ProfileForm {
  return {
    firstName: user.firstName,
    middleName: user.middleName ?? "",
    lastName: user.lastName,
    phoneNumber: user.phoneNumber ?? "",
    barangayId: user.barangayId,
  };
}

/** Form state and persistence for the signed-in user's own profile. */
export function useEditProfileViewModel({ auth = authRepository }: Options = {}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const cached = await auth.getCachedUser();
    const list = await auth.loadBarangays().catch<Barangay[]>(() => []);
    if (cached) {
      setUser(cached);
      setForm(formFromUser(cached));
    }
    setBarangays(list);
  }, [auth]);

  useEffect(() => {
    let active = true;

    load()
      .catch(() => {
        if (active) setError("Couldn't load your profile.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [load]);

  const update = useCallback(<Key extends keyof ProfileForm>(
    key: Key,
    value: ProfileForm[Key],
  ) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }, []);

  const save = useCallback(async (): Promise<boolean> => {
    if (!form) return false;

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const phoneNumber = form.phoneNumber.trim();
    const middleName = form.middleName.trim();

    if (!firstName || !lastName) {
      setError("First name and last name are required.");
      return false;
    }
    if (phoneNumber && !PHONE_PATTERN.test(phoneNumber)) {
      setError("Use the phone format +639XXXXXXXXX.");
      return false;
    }

    setSaving(true);
    setError(null);

    try {
      const updated = await auth.updateProfile({
        firstName,
        middleName: middleName || null,
        lastName,
        phoneNumber: phoneNumber || null,
        barangayId: form.barangayId,
      });
      setUser(updated);
      setForm(formFromUser(updated));
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "We couldn't save your profile. Please try again.",
      );
      return false;
    } finally {
      setSaving(false);
    }
  }, [auth, form]);

  return {
    user,
    form,
    barangays,
    loading,
    saving,
    error,
    update,
    save,
    retry: load,
  };
}
