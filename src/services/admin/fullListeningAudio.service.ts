import type {AxiosProgressEvent} from "axios";

import {adminHttpClient, toAdminApiError} from "./httpClient";
import {directAdminMultipartRequest, shouldBypassProxyUpload} from "./directAdminClient";
import type {
  FullListeningAudioRecord,
  FullListeningAudioSegmentPayload,
  FullListeningAudioUpsertPayload
} from "./types";

function appendFullAudioFormData(formData: FormData, payload: FullListeningAudioUpsertPayload) {
  if (payload.source_audio_file instanceof File) {
    formData.append("source_audio_file", payload.source_audio_file);
  }
  if (payload.segments) {
    formData.append("segments", JSON.stringify(payload.segments));
  }
}

export const fullListeningAudioService = {
  async get(testId: number | string) {
    try {
      const response = await adminHttpClient.get<FullListeningAudioRecord>(`/practice-tests/${testId}/full-listening-audio/`);
      return response.data;
    } catch (error) {
      throw toAdminApiError(error);
    }
  },

  async create(
    testId: number | string,
    payload: FullListeningAudioUpsertPayload,
    options?: {
      onUploadProgress?: (progress: AxiosProgressEvent) => void;
    }
  ) {
    const formData = new FormData();
    appendFullAudioFormData(formData, payload);

    try {
      const hasLargeFile = shouldBypassProxyUpload(payload.source_audio_file);
      if (hasLargeFile) {
        return await directAdminMultipartRequest<FullListeningAudioRecord>({
          path: `/practice-tests/${testId}/full-listening-audio/`,
          method: "POST",
          body: formData,
          onUploadProgress: options?.onUploadProgress
        });
      }

      const response = await adminHttpClient.post<FullListeningAudioRecord>(`/practice-tests/${testId}/full-listening-audio/`, formData, {
        onUploadProgress: options?.onUploadProgress
      });
      return response.data;
    } catch (error) {
      const mapped = toAdminApiError(error);
      if (mapped.status === 413) {
        return await directAdminMultipartRequest<FullListeningAudioRecord>({
          path: `/practice-tests/${testId}/full-listening-audio/`,
          method: "POST",
          body: formData,
          onUploadProgress: options?.onUploadProgress
        });
      }
      throw mapped;
    }
  },

  async patch(
    testId: number | string,
    payload: Partial<FullListeningAudioUpsertPayload>,
    options?: {
      onUploadProgress?: (progress: AxiosProgressEvent) => void;
    }
  ) {
    const formData = new FormData();
    appendFullAudioFormData(formData, payload as FullListeningAudioUpsertPayload);

    try {
      const hasLargeFile = shouldBypassProxyUpload(payload.source_audio_file);
      if (hasLargeFile) {
        return await directAdminMultipartRequest<FullListeningAudioRecord>({
          path: `/practice-tests/${testId}/full-listening-audio/`,
          method: "PATCH",
          body: formData,
          onUploadProgress: options?.onUploadProgress
        });
      }

      const response = await adminHttpClient.patch<FullListeningAudioRecord>(`/practice-tests/${testId}/full-listening-audio/`, formData, {
        onUploadProgress: options?.onUploadProgress
      });
      return response.data;
    } catch (error) {
      const mapped = toAdminApiError(error);
      if (mapped.status === 413) {
        return await directAdminMultipartRequest<FullListeningAudioRecord>({
          path: `/practice-tests/${testId}/full-listening-audio/`,
          method: "PATCH",
          body: formData,
          onUploadProgress: options?.onUploadProgress
        });
      }
      throw mapped;
    }
  },

  async remove(testId: number | string) {
    try {
      await adminHttpClient.delete(`/practice-tests/${testId}/full-listening-audio/`);
    } catch (error) {
      throw toAdminApiError(error);
    }
  }
};

export type {FullListeningAudioSegmentPayload, FullListeningAudioUpsertPayload};

