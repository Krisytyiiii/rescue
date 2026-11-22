import type { SessionStorage } from "@/domain/ports";
import type {
  CreatedReport,
  MyReport,
  NewReportInput,
  ReportPhotoUpload,
} from "@/domain/report-submission";
import { File as ExpoFile, UploadType } from "expo-file-system";
import { Platform } from "react-native";

import { API_BASE_URL } from "./config";
import { ApiError, requestJson } from "./http";
import type {
  ReportHistoryDataSource,
  ReportSubmissionDataSource,
} from "./reports";

function photoFile(photo: ReportPhotoUpload): { name: string; type: string } {
  const supported = ["image/jpeg", "image/png", "image/webp"] as const;
  const type = supported.includes(photo.mimeType as (typeof supported)[number])
    ? (photo.mimeType as string)
    : "image/jpeg";
  const extension =
    type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";

  const base =
    photo.fileName?.replace(/[^a-zA-Z0-9._-]/g, "_") || `photo.${extension}`;
  const name = /\.[a-z0-9]+$/i.test(base) ? base : `${base}.${extension}`;
  return { name, type };
}

/** HTTP implementation of the resident report port. */
export class HttpReportsGateway
  implements ReportSubmissionDataSource, ReportHistoryDataSource
{
  constructor(private readonly session: SessionStorage) {}

  async listMyReports(): Promise<MyReport[]> {
    const token = (await this.session.read())?.token;
    const payload = await requestJson<{ reports: MyReport[] }>("/api/reports/mine", {
      token,
      networkMessage: "Can't load your reports. Check your connection.",
      fallbackMessage: "We couldn't load your reports.",
    });
    return payload.reports;
  }

  async createReport(input: NewReportInput): Promise<CreatedReport> {
    const token = (await this.session.read())?.token;

    return requestJson<CreatedReport>("/api/reports", {
      method: "POST",
      token,
      body: input,
      networkMessage: "Can't reach FuRescue. Check your connection.",
      fallbackMessage: "We couldn't submit your report.",
    });
  }

  async uploadPhoto(photo: ReportPhotoUpload): Promise<string> {
    const token = (await this.session.read())?.token;
    const file = photoFile(photo);
    const endpoint = `${API_BASE_URL}/api/community/uploads`;
    const headers = token ? { authorization: `Bearer ${token}` } : undefined;

    if (Platform.OS !== "web") {
      try {
        const nativeFile = new ExpoFile(photo.uri);
        if (!nativeFile.exists) {
          throw new ApiError(
            "That photo is no longer available. Please choose it again.",
            "UPLOAD_FAILED",
          );
        }

        const result = await nativeFile.upload(endpoint, {
          httpMethod: "POST",
          uploadType: UploadType.MULTIPART,
          fieldName: "file",
          mimeType: file.type,
          headers,
        });

        const envelope = (() => {
          try {
            return JSON.parse(result.body) as UploadEnvelope;
          } catch {
            return null;
          }
        })();

        if (
          result.status < 200 ||
          result.status >= 300 ||
          !envelope?.ok ||
          !envelope.data?.url
        ) {
          throw uploadError(envelope, result.status);
        }

        return envelope.data.url;
      } catch (cause) {
        if (cause instanceof ApiError) throw cause;
        throw new ApiError(
          "We couldn't upload that photo. Check your connection and try again.",
          "UPLOAD_FAILED",
        );
      }
    }

    const form = new FormData();
    const blob = await fetch(photo.uri)
      .then((response) => {
        if (!response.ok) throw new Error("Could not read the selected photo.");
        return response.blob();
      })
      .catch(() => {
        throw new ApiError(
          "We couldn't read that photo. Try choosing it again.",
          "UPLOAD_FAILED",
        );
      });
    form.append("file", blob, file.name);

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: form,
      });
    } catch {
      throw new ApiError(
        "Can't reach FuRescue. Check your connection.",
        "NETWORK_ERROR",
      );
    }

    const envelope = (await response
      .json()
      .catch(() => null)) as UploadEnvelope | null;

    if (!response.ok || !envelope?.ok || !envelope.data?.url) {
      throw uploadError(envelope, response.status);
    }

    return envelope.data.url;
  }
}

interface UploadEnvelope {
  ok: boolean;
  data?: { url?: string };
  error?: { message?: string };
}

function uploadError(envelope: UploadEnvelope | null, status: number) {
  return new ApiError(
    envelope?.error?.message ?? "We couldn't upload that photo.",
    "UPLOAD_FAILED",
    status,
  );
}
