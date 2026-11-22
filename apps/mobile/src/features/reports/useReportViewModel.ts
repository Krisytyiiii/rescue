import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";

import { authRepository, reportSubmissionDataSource } from "@/data";
import type { ReportSubmissionDataSource } from "@/data";
import type { Barangay } from "@/domain/auth";
import type { AuthRepository } from "@/domain/ports";
import type {
  Coordinates,
  CreatedReport,
  NewReportInput,
} from "@/domain/report-submission";

type ReportDraft = Omit<NewReportInput, "latitude" | "longitude">;

/**
 * Owns the report form's async concerns: current coordinates, the public
 * barangay list, and the real submission. The screen only renders this state.
 */
export function useReportViewModel(
  data: ReportSubmissionDataSource = reportSubmissionDataSource,
  auth: AuthRepository = authRepository,
) {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [locating, setLocating] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedReport | null>(null);

  const locate = useCallback(async () => {
    setLocating(true);
    setLocationError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setLocationError(
          "Location access is off. Turn it on so rescuers can find the animal.",
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoordinates({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch {
      setLocationError("We couldn't get your location. Try again.");
    } finally {
      setLocating(false);
    }
  }, []);

  useEffect(() => {
    void locate();
  }, [locate]);

  useEffect(() => {
    let active = true;

    auth
      .loadBarangays()
      .then((list) => {
        if (active) setBarangays(list);
      })
      .catch(() => {
        // Barangay is optional; the server falls back to the account's barangay.
      });

    return () => {
      active = false;
    };
  }, [auth]);

  const submit = useCallback(
    async (draft: ReportDraft) => {
      if (!coordinates) {
        setError("We need your location before sending the report.");
        return null;
      }

      setSubmitting(true);
      setError(null);

      try {
        const result = await data.createReport({
          ...draft,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        });
        setCreated(result);
        return result;
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "We couldn't submit your report.",
        );
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [coordinates, data],
  );

  const reset = useCallback(() => {
    setCreated(null);
    setError(null);
    void locate();
  }, [locate]);

  return {
    coordinates,
    setCoordinates,
    locating,
    locationError,
    retryLocation: locate,
    barangays,
    submitting,
    error,
    created,
    submit,
    reset,
  };
}
