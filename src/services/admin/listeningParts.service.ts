import type {AxiosProgressEvent} from "axios";

import {maybeCompressAudioFileForUpload} from "@/lib/audio-compression";

import {directAdminMultipartRequest, shouldBypassProxyUpload} from "./directAdminClient";
import {adminHttpClient, toAdminApiError, toListQuery} from "./httpClient";
import type {AdminListQuery, AdminPaginatedResponse, ListeningPartPayload, ListeningPartRecord} from "./types";

function normalizeListResponse<T>(data: AdminPaginatedResponse<T> | T[]): AdminPaginatedResponse<T> {
  if (Array.isArray(data)) {
    return {
      count: data.length,
      next: null,
      previous: null,
      results: data
    };
  }

  return {
    count: Number(data.count ?? 0),
    next: data.next ?? null,
    previous: data.previous ?? null,
    results: Array.isArray(data.results) ? data.results : []
  };
}

function appendListeningFormData(formData: FormData, payload: Partial<ListeningPartPayload>) {
  if (typeof payload.part_number === "string") formData.append("part_number", payload.part_number);
  if (typeof payload.title === "string") formData.append("title", payload.title);
  if (typeof payload.transcript_text === "string") formData.append("transcript_text", payload.transcript_text);
  if (typeof payload.max_questions === "number") formData.append("max_questions", String(payload.max_questions));
  if (typeof payload.time_limit_seconds === "number") formData.append("time_limit_seconds", String(payload.time_limit_seconds));
  if (payload.time_limit_seconds === null) formData.append("time_limit_seconds", "");
  if (typeof payload.is_active === "boolean") formData.append("is_active", String(payload.is_active));
  if (payload.audio_file instanceof File) formData.append("audio_file", payload.audio_file);
  if (payload.remove_audio) formData.append("remove_audio", "true");
}

export const listeningPartsService = {
  async listByPracticeTest(testId: number | string, params?: AdminListQuery) {
    try {
      const response = await adminHttpClient.get<AdminPaginatedResponse<ListeningPartRecord> | ListeningPartRecord[]>(
        `/practice-tests/${testId}/listening-parts/`,
        {params: toListQuery(params)}
      );
      return normalizeListResponse(response.data);
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async create(
    testId: number | string,
    payload: ListeningPartPayload,
    options?: {
      onUploadProgress?: (progress: AxiosProgressEvent) => void;
    }
  ) {
    const formData = new FormData();

    const wantsAudio = payload.audio_file instanceof File && !payload.remove_audio;
    const isLargeAudio = wantsAudio && shouldBypassProxyUpload(payload.audio_file);

    // If the audio is large, we bypass the Next.js proxy (which has strict body limits on Vercel)
    // and upload directly to the backend. In that case, keep the original audio file as-is.
    const normalizedPayload: ListeningPartPayload =
      wantsAudio && !isLargeAudio
        ? {
            ...payload,
            // For smaller uploads (that can still go through the proxy), we keep them compact.
            audio_file: await maybeCompressAudioFileForUpload(payload.audio_file, {
              targetMaxBytes: 3.8 * 1024 * 1024,
              forceMono: true
            })
          }
        : payload;

    appendListeningFormData(formData, normalizedPayload);

    try {
      if (isLargeAudio) {
        return await directAdminMultipartRequest<ListeningPartRecord>({
          path: `/practice-tests/${testId}/listening-parts/`,
          method: "POST",
          body: formData,
          onUploadProgress: options?.onUploadProgress
        });
      }

      const response = await adminHttpClient.post<ListeningPartRecord>(`/practice-tests/${testId}/listening-parts/`, formData, {
        onUploadProgress: options?.onUploadProgress
      });
      return response.data;
    } catch (error) {
      const mapped = toAdminApiError(error);
      if (mapped.status === 413) {
        return await directAdminMultipartRequest<ListeningPartRecord>({
          path: `/practice-tests/${testId}/listening-parts/`,
          method: "POST",
          body: formData,
          onUploadProgress: options?.onUploadProgress
        });
      }
      throw mapped;
    }
  },

  async getById(listeningPartId: number | string) {
    try {
      const response = await adminHttpClient.get<ListeningPartRecord>(`/listening-parts/${listeningPartId}/`);
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async update(
    listeningPartId: number | string,
    payload: ListeningPartPayload,
    options?: {
      onUploadProgress?: (progress: AxiosProgressEvent) => void;
    }
  ) {
    const formData = new FormData();

    const wantsAudio = payload.audio_file instanceof File && !payload.remove_audio;
    const isLargeAudio = wantsAudio && shouldBypassProxyUpload(payload.audio_file);

    const normalizedPayload: ListeningPartPayload =
      wantsAudio && !isLargeAudio
        ? {
            ...payload,
            audio_file: await maybeCompressAudioFileForUpload(payload.audio_file, {
              targetMaxBytes: 3.8 * 1024 * 1024,
              forceMono: true
            })
          }
        : payload;

    appendListeningFormData(formData, normalizedPayload);

    try {
      if (isLargeAudio) {
        return await directAdminMultipartRequest<ListeningPartRecord>({
          path: `/listening-parts/${listeningPartId}/`,
          method: "PUT",
          body: formData,
          onUploadProgress: options?.onUploadProgress
        });
      }

      const response = await adminHttpClient.put<ListeningPartRecord>(`/listening-parts/${listeningPartId}/`, formData, {
        onUploadProgress: options?.onUploadProgress
      });
      return response.data;
    } catch (error) {
      const mapped = toAdminApiError(error);
      if (mapped.status === 413) {
        return await directAdminMultipartRequest<ListeningPartRecord>({
          path: `/listening-parts/${listeningPartId}/`,
          method: "PUT",
          body: formData,
          onUploadProgress: options?.onUploadProgress
        });
      }
      throw mapped;
    }
  },

  async patch(
    listeningPartId: number | string,
    payload: Partial<ListeningPartPayload>,
    options?: {
      onUploadProgress?: (progress: AxiosProgressEvent) => void;
    }
  ) {
    const formData = new FormData();

    const wantsAudio = payload.audio_file instanceof File && !payload.remove_audio;
    const isLargeAudio = wantsAudio && shouldBypassProxyUpload(payload.audio_file);

    const normalizedPayload: Partial<ListeningPartPayload> =
      wantsAudio && !isLargeAudio
        ? {
            ...payload,
            audio_file: await maybeCompressAudioFileForUpload(payload.audio_file, {
              targetMaxBytes: 3.8 * 1024 * 1024,
              forceMono: true
            })
          }
        : payload;

    appendListeningFormData(formData, normalizedPayload);

    try {
      if (isLargeAudio) {
        return await directAdminMultipartRequest<ListeningPartRecord>({
          path: `/listening-parts/${listeningPartId}/`,
          method: "PATCH",
          body: formData,
          onUploadProgress: options?.onUploadProgress
        });
      }

      const response = await adminHttpClient.patch<ListeningPartRecord>(`/listening-parts/${listeningPartId}/`, formData, {
        onUploadProgress: options?.onUploadProgress
      });
      return response.data;
    } catch (error) {
      const mapped = toAdminApiError(error);
      if (mapped.status === 413) {
        return await directAdminMultipartRequest<ListeningPartRecord>({
          path: `/listening-parts/${listeningPartId}/`,
          method: "PATCH",
          body: formData,
          onUploadProgress: options?.onUploadProgress
        });
      }
      throw mapped;
    }
  },

  async remove(listeningPartId: number | string) {
    try {
      await adminHttpClient.delete(`/listening-parts/${listeningPartId}/`);
    } catch (error) {
      throw toAdminApiError(error);
    }
  }
};
