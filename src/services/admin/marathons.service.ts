import type {AxiosProgressEvent} from "axios";

import {maybeCompressAudioFileForUpload} from "@/lib/audio-compression";

import {directAdminMultipartRequest, shouldBypassProxyUpload} from "./directAdminClient";
import {adminHttpClient, toAdminApiError, toListQuery} from "./httpClient";
import type {
  AdminEntityId,
  AdminListQuery,
  AdminMarathonDayDetailRecord,
  AdminMarathonDayPayload,
  AdminMarathonDayRecord,
  AdminMarathonContentLinkPayload,
  AdminMarathonContentLinkRecord,
  AdminMarathonEnrollmentRecord,
  AdminMarathonExternalLinkPayload,
  AdminMarathonExternalLinkRecord,
  AdminMarathonLeaderboardEntry,
  AdminMarathonListeningPartPayload,
  AdminMarathonListeningPartRecord,
  AdminMarathonPayload,
  AdminMarathonReadingPassagePayload,
  AdminMarathonReadingPassageRecord,
  AdminMarathonRecord,
  AdminMarathonSeriesPayload,
  AdminMarathonSeriesRecord,
  AdminPaginatedResponse
} from "./types";

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

function appendListeningFormData(formData: FormData, payload: Partial<AdminMarathonListeningPartPayload>) {
  if (typeof payload.part_number === "string") formData.append("part_number", payload.part_number);
  if (typeof payload.title === "string") formData.append("title", payload.title);
  if (typeof payload.transcript_text === "string") formData.append("transcript_text", payload.transcript_text);
  if (typeof payload.difficulty_level === "string") formData.append("difficulty_level", payload.difficulty_level);
  if (typeof payload.max_questions === "number") formData.append("max_questions", String(payload.max_questions));
  if (typeof payload.estimated_time_minutes === "number") formData.append("estimated_time_minutes", String(payload.estimated_time_minutes));
  if (payload.estimated_time_minutes === null) formData.append("estimated_time_minutes", "");
  if (typeof payload.time_limit_seconds === "number") formData.append("time_limit_seconds", String(payload.time_limit_seconds));
  if (payload.time_limit_seconds === null) formData.append("time_limit_seconds", "");
  if (typeof payload.is_active === "boolean") formData.append("is_active", String(payload.is_active));
  if (typeof payload.is_premium === "boolean") formData.append("is_premium", String(payload.is_premium));
  if (payload.audio_file instanceof File) formData.append("audio_file", payload.audio_file);
  if (payload.remove_audio) formData.append("remove_audio", "true");
}

export const adminMarathonSeriesService = {
  async list(params?: AdminListQuery & {is_active?: boolean}) {
    try {
      const response = await adminHttpClient.get<AdminPaginatedResponse<AdminMarathonSeriesRecord> | AdminMarathonSeriesRecord[]>("/marathon-series/", {
        params: {
          ...toListQuery(params),
          ...(typeof params?.is_active === "boolean" ? {is_active: params.is_active} : {})
        }
      });
      return normalizeListResponse(response.data);
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async create(payload: AdminMarathonSeriesPayload) {
    try {
      const response = await adminHttpClient.post<AdminMarathonSeriesRecord>("/marathon-series/", payload);
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async patch(seriesId: AdminEntityId, payload: Partial<AdminMarathonSeriesPayload>) {
    try {
      const response = await adminHttpClient.patch<AdminMarathonSeriesRecord>(`/marathon-series/${seriesId}/`, payload);
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async remove(seriesId: AdminEntityId) {
    try {
      await adminHttpClient.delete(`/marathon-series/${seriesId}/`);
    } catch (error) {
      throw toAdminApiError(error);
    }
  }
};

export const adminMarathonsService = {
  async list(params?: AdminListQuery & {is_visible?: boolean; for_premium_users?: boolean}) {
    try {
      const response = await adminHttpClient.get<AdminPaginatedResponse<AdminMarathonRecord> | AdminMarathonRecord[]>("/marathons/", {
        params: {
          ...toListQuery(params),
          ...(typeof params?.is_visible === "boolean" ? {is_visible: params.is_visible} : {}),
          ...(typeof params?.for_premium_users === "boolean" ? {for_premium_users: params.for_premium_users} : {})
        }
      });
      return normalizeListResponse(response.data);
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async getById(marathonId: AdminEntityId) {
    try {
      const response = await adminHttpClient.get<AdminMarathonRecord>(`/marathons/${marathonId}/`);
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async create(payload: AdminMarathonPayload) {
    try {
      const response = await adminHttpClient.post<AdminMarathonRecord>("/marathons/", payload);
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async patch(marathonId: AdminEntityId, payload: Partial<AdminMarathonPayload>) {
    try {
      const response = await adminHttpClient.patch<AdminMarathonRecord>(`/marathons/${marathonId}/`, payload);
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async remove(marathonId: AdminEntityId) {
    try {
      await adminHttpClient.delete(`/marathons/${marathonId}/`);
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async listDays(marathonId: AdminEntityId) {
    try {
      const response = await adminHttpClient.get<AdminPaginatedResponse<AdminMarathonDayRecord> | AdminMarathonDayRecord[]>(`/marathons/${marathonId}/days/`);
      return normalizeListResponse(response.data);
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async getDay(marathonId: AdminEntityId, dayNumber: number) {
    try {
      const response = await adminHttpClient.get<AdminMarathonDayDetailRecord>(`/marathons/${marathonId}/days/${dayNumber}/`);
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async patchDay(marathonId: AdminEntityId, dayNumber: number, payload: AdminMarathonDayPayload) {
    try {
      const response = await adminHttpClient.patch<AdminMarathonDayDetailRecord>(`/marathons/${marathonId}/days/${dayNumber}/`, payload);
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async createExternalLink(marathonId: AdminEntityId, dayNumber: number, payload: AdminMarathonExternalLinkPayload) {
    try {
      const response = await adminHttpClient.post<AdminMarathonExternalLinkRecord>(`/marathons/${marathonId}/days/${dayNumber}/external-links/`, payload);
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async patchExternalLink(marathonId: AdminEntityId, dayNumber: number, linkId: AdminEntityId, payload: Partial<AdminMarathonExternalLinkPayload>) {
    try {
      const response = await adminHttpClient.patch<AdminMarathonExternalLinkRecord>(
        `/marathons/${marathonId}/days/${dayNumber}/external-links/${linkId}/`,
        payload
      );
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async removeExternalLink(marathonId: AdminEntityId, dayNumber: number, linkId: AdminEntityId) {
    try {
      await adminHttpClient.delete(`/marathons/${marathonId}/days/${dayNumber}/external-links/${linkId}/`);
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async listReadingPassages(_marathonId: AdminEntityId, params?: AdminListQuery) {
    try {
      const response = await adminHttpClient.get<AdminPaginatedResponse<AdminMarathonReadingPassageRecord> | AdminMarathonReadingPassageRecord[]>(
        "/marathon-reading-passages/",
        {params: toListQuery(params)}
      );
      return normalizeListResponse(response.data);
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async createReadingPassage(_marathonId: AdminEntityId, payload: AdminMarathonReadingPassagePayload) {
    try {
      const response = await adminHttpClient.post<AdminMarathonReadingPassageRecord>("/marathon-reading-passages/", payload);
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async getReadingPassageById(passageId: AdminEntityId) {
    try {
      const response = await adminHttpClient.get<AdminMarathonReadingPassageRecord>(`/marathon-reading-passages/${passageId}/`);
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async patchReadingPassage(passageId: AdminEntityId, payload: Partial<AdminMarathonReadingPassagePayload>) {
    try {
      const response = await adminHttpClient.patch<AdminMarathonReadingPassageRecord>(`/marathon-reading-passages/${passageId}/`, payload);
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async removeReadingPassage(passageId: AdminEntityId) {
    try {
      await adminHttpClient.delete(`/marathon-reading-passages/${passageId}/`);
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async assignPassage(marathonId: AdminEntityId, dayNumber: number, passageId: AdminEntityId) {
    try {
      const response = await adminHttpClient.post(`/marathons/${marathonId}/days/${dayNumber}/assign-passage/${passageId}/`);
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async unassignPassage(marathonId: AdminEntityId, dayNumber: number, passageId: AdminEntityId) {
    try {
      await adminHttpClient.delete(`/marathons/${marathonId}/days/${dayNumber}/assign-passage/${passageId}/`);
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async upsertPassageLink(
    marathonId: AdminEntityId,
    dayNumber: number,
    passageId: AdminEntityId,
    payload: AdminMarathonContentLinkPayload
  ) {
    try {
      const response = await adminHttpClient.put<AdminMarathonContentLinkRecord>(
        `/marathons/${marathonId}/days/${dayNumber}/passage-links/${passageId}/`,
        payload
      );
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async removePassageLink(marathonId: AdminEntityId, dayNumber: number, passageId: AdminEntityId) {
    try {
      await adminHttpClient.delete(`/marathons/${marathonId}/days/${dayNumber}/passage-links/${passageId}/`);
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async listListeningParts(_marathonId: AdminEntityId, params?: AdminListQuery) {
    try {
      const response = await adminHttpClient.get<AdminPaginatedResponse<AdminMarathonListeningPartRecord> | AdminMarathonListeningPartRecord[]>(
        "/marathon-listening-parts/",
        {params: toListQuery(params)}
      );
      return normalizeListResponse(response.data);
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async createListeningPart(
    _marathonId: AdminEntityId,
    payload: AdminMarathonListeningPartPayload,
    options?: {onUploadProgress?: (progress: AxiosProgressEvent) => void}
  ) {
    const audioFile = payload.audio_file instanceof File ? payload.audio_file : null;
    const wantsAudio = audioFile instanceof File && !payload.remove_audio;
    const isLargeAudio = wantsAudio && shouldBypassProxyUpload(audioFile);

    const normalizedPayload: AdminMarathonListeningPartPayload =
      wantsAudio && !isLargeAudio
        ? {
            ...payload,
            audio_file: await maybeCompressAudioFileForUpload(audioFile, {
              targetMaxBytes: 3.8 * 1024 * 1024,
              forceMono: true
            })
          }
        : payload;

    try {
      const formData = new FormData();
      appendListeningFormData(formData, normalizedPayload);

      if (isLargeAudio) {
        return await directAdminMultipartRequest<AdminMarathonListeningPartRecord>({
          path: "/marathon-listening-parts/",
          method: "POST",
          body: formData,
          onUploadProgress: options?.onUploadProgress
        });
      }

      const response = await adminHttpClient.post<AdminMarathonListeningPartRecord>("/marathon-listening-parts/", formData, {
        onUploadProgress: options?.onUploadProgress
      });
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async getListeningPartById(partId: AdminEntityId) {
    try {
      const response = await adminHttpClient.get<AdminMarathonListeningPartRecord>(`/marathon-listening-parts/${partId}/`);
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async patchListeningPart(
    partId: AdminEntityId,
    payload: Partial<AdminMarathonListeningPartPayload>,
    options?: {onUploadProgress?: (progress: AxiosProgressEvent) => void}
  ) {
    const formData = new FormData();
    const audioFile = payload.audio_file instanceof File ? payload.audio_file : null;
    const wantsAudio = audioFile instanceof File && !payload.remove_audio;
    const isLargeAudio = wantsAudio && shouldBypassProxyUpload(audioFile);

    const normalizedPayload: Partial<AdminMarathonListeningPartPayload> =
      wantsAudio && !isLargeAudio
        ? {
            ...payload,
            audio_file: await maybeCompressAudioFileForUpload(audioFile, {
              targetMaxBytes: 3.8 * 1024 * 1024,
              forceMono: true
            })
          }
        : payload;

    appendListeningFormData(formData, normalizedPayload);

    try {
      if (isLargeAudio) {
        return await directAdminMultipartRequest<AdminMarathonListeningPartRecord>({
          path: `/marathon-listening-parts/${partId}/`,
          method: "PATCH",
          body: formData,
          onUploadProgress: options?.onUploadProgress
        });
      }

      const response = await adminHttpClient.patch<AdminMarathonListeningPartRecord>(`/marathon-listening-parts/${partId}/`, formData, {
        onUploadProgress: options?.onUploadProgress
      });
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async removeListeningPart(partId: AdminEntityId) {
    try {
      await adminHttpClient.delete(`/marathon-listening-parts/${partId}/`);
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async assignListeningPart(marathonId: AdminEntityId, dayNumber: number, partId: AdminEntityId) {
    try {
      const response = await adminHttpClient.post(`/marathons/${marathonId}/days/${dayNumber}/assign-part/${partId}/`);
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async unassignListeningPart(marathonId: AdminEntityId, dayNumber: number, partId: AdminEntityId) {
    try {
      await adminHttpClient.delete(`/marathons/${marathonId}/days/${dayNumber}/assign-part/${partId}/`);
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async upsertPartLink(
    marathonId: AdminEntityId,
    dayNumber: number,
    partId: AdminEntityId,
    payload: AdminMarathonContentLinkPayload
  ) {
    try {
      const response = await adminHttpClient.put<AdminMarathonContentLinkRecord>(
        `/marathons/${marathonId}/days/${dayNumber}/part-links/${partId}/`,
        payload
      );
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async removePartLink(marathonId: AdminEntityId, dayNumber: number, partId: AdminEntityId) {
    try {
      await adminHttpClient.delete(`/marathons/${marathonId}/days/${dayNumber}/part-links/${partId}/`);
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async listEnrollments(marathonId: AdminEntityId, params?: AdminListQuery) {
    try {
      const response = await adminHttpClient.get<AdminPaginatedResponse<AdminMarathonEnrollmentRecord> | AdminMarathonEnrollmentRecord[]>(
        `/marathons/${marathonId}/enrollments/`,
        {params: toListQuery(params)}
      );
      return normalizeListResponse(response.data);
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async getLeaderboard(marathonId: AdminEntityId) {
    try {
      const response = await adminHttpClient.get<AdminPaginatedResponse<AdminMarathonLeaderboardEntry> | AdminMarathonLeaderboardEntry[]>(
        `/marathons/${marathonId}/leaderboard/`
      );
      return normalizeListResponse(response.data);
    } catch (error) {
      throw toAdminApiError(error);
    }
  }
};
