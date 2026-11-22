import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";

import { authRepository, reportSubmissionDataSource } from "@/data";
import type { ReportSubmissionDataSource } from "@/data";
import type { Barangay } from "@/domain/auth";
import type { AuthRepository } from "@/domain/ports";
import { MAX_REPORT_PHOTOS } from "@/domain/report-submission";
import type {
  Coordinates,
  CreatedReport,
  NewReportInput,
  ReportPhotoUpload,
} from "@/domain/report-submission";

type ReportDraft = Omit<NewReportInput, "latitude" | "longitude" | "media">;

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
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

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

  const addPhotos = useCallback(
    async (uploads: ReportPhotoUpload[]) => {
      if (uploads.length === 0) return;

      setPhotoError(null);
      setUploadingPhotos(true);

      try {
        const remaining = MAX_REPORT_PHOTOS - photos.length;
        for (const upload of uploads.slice(0, remaining)) {
          const url = await data.uploadPhoto(upload);
          setPhotos((current) =>
            current.length >= MAX_REPORT_PHOTOS || current.includes(url)
              ? current
              : [...current, url],
          );
        }
      } catch (cause) {
        setPhotoError(
          cause instanceof Error
            ? cause.message
            : "We couldn't upload that photo.",
        );
      } finally {
        setUploadingPhotos(false);
      }
    },
    [data, photos.length],
  );

  const removePhoto = useCallback((url: string) => {
    setPhotos((current) => current.filter((item) => item !== url));
  }, []);

  const submit = useCallback(
    async (draft: ReportDraft) => {
      if (!coordinates) {
        setError("We need your location before sending the report.");
        return null;
      }
      if (uploadingPhotos) {
        setError("Please wait for your photos to finish uploading.");
        return null;
      }

      setSubmitting(true);
      setError(null);

      try {
        const result = await data.createReport({
          ...draft,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          media: photos.map((url) => ({ mediaType: "photo", fileUrl: url })),
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
    [coordinates, data, photos, uploadingPhotos],
  );

  const reset = useCallback(() => {
    setCreated(null);
    setError(null);
    setPhotos([]);
    setPhotoError(null);
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
    photos,
    uploadingPhotos,
    photoError,
    addPhotos,
    removePhoto,
    submit,
    reset,
  };
}
