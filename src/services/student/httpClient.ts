import axios, {AxiosError, type AxiosInstance, type AxiosRequestConfig} from "axios";

import {StudentApiError, type StudentFieldErrors, type StudentListQuery} from "./types";

const STUDENT_PROXY_BASE_URL = "/api/student-proxy";
const SUPPORTED_LOCALES = new Set(["en", "uz"]);

function resolveLocaleFromPathname(pathname: string) {
  const candidate = pathname.split("/").filter(Boolean)[0] ?? "";
  return SUPPORTED_LOCALES.has(candidate) ? candidate : "en";
}

function redirectToRegister() {
  if (typeof window === "undefined") {
    return;
  }

  const locale = resolveLocaleFromPathname(window.location.pathname);
  window.location.replace(`/${locale}/register`);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asErrorMessage(payload: unknown, status?: number) {
  const record = asRecord(payload);
  if (!record) {
    if (status === 401) return "Authentication failed.";
    if (status === 403) return "You do not have permission for this action.";
    if (status === 429) return "Too many requests. Please try again soon.";
    if (status === 500) return "Server error. Please retry.";
    return "Request failed.";
  }

  const nestedError = asRecord(record.error);
  const nestedMessage = nestedError?.message;
  if (typeof nestedMessage === "string" && nestedMessage.trim()) {
    return nestedMessage.trim();
  }

  const directKeys = ["detail", "message", "error", "non_field_errors"];
  for (const key of directKeys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (Array.isArray(value) && typeof value[0] === "string") {
      return String(value[0]);
    }
  }

  return "Request failed.";
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function asFieldErrors(payload: unknown): StudentFieldErrors {
  const record = asRecord(payload);
  if (!record) return {};

  const result: StudentFieldErrors = {};
  const nestedError = asRecord(record.error);
  const nestedDetails = asRecord(nestedError?.details);

  if (nestedDetails) {
    for (const [key, value] of Object.entries(nestedDetails)) {
      const messages = toStringArray(value);
      if (messages.length) {
        result[key] = messages;
      }
    }
  }

  for (const [key, value] of Object.entries(record)) {
    if (key === "detail" || key === "message" || key === "error" || key === "non_field_errors") {
      continue;
    }

    const messages = toStringArray(value);
    if (messages.length) {
      result[key] = messages;
      continue;
    }

    if (typeof value === "string" && value.trim()) {
      result[key] = [value.trim()];
    }
  }

  return result;
}

export function toStudentApiError(error: unknown): StudentApiError {
  if (error instanceof StudentApiError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<unknown>;
    const status = axiosError.response?.status ?? 500;
    const data = axiosError.response?.data;
    const message = asErrorMessage(data, status);
    const fieldErrors = asFieldErrors(data);
    return new StudentApiError(message, status, fieldErrors, data ?? error);
  }

  if (error instanceof Error) {
    return new StudentApiError(error.message || "Request failed.", 500, {}, error);
  }

  return new StudentApiError("Request failed.", 500, {}, error);
}

type RetryableConfig = AxiosRequestConfig & {
  _retry?: boolean;
};

const refreshClient = axios.create({
  withCredentials: true
});

export function createStudentHttpClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: STUDENT_PROXY_BASE_URL,
    timeout: 45_000,
    withCredentials: true
  });

  instance.interceptors.request.use((config) => {
    if (config.headers && typeof (config.headers as {set?: (name: string, value: string) => void}).set === "function") {
      (config.headers as {set: (name: string, value: string) => void}).set("Accept", "application/json");
      return config;
    }

    const next = {...config};
    next.headers = {
      ...(config.headers ?? {}),
      Accept: "application/json"
    } as never;
    return next;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (!axios.isAxiosError(error)) {
        return Promise.reject(toStudentApiError(error));
      }

      const status = error.response?.status;
      const original = (error.config ?? {}) as RetryableConfig;

      if (status === 401 && !original._retry) {
        original._retry = true;

        try {
          await refreshClient.post("/api/auth/token/refresh", {});
          return instance.request(original);
        } catch {
          try {
            await refreshClient.post("/api/auth/logout", {});
          } catch {
            // Ignore logout cleanup errors.
          }
          redirectToRegister();
        }
      }

      return Promise.reject(toStudentApiError(error));
    }
  );

  return instance;
}

export const studentHttpClient = createStudentHttpClient();

export function toListQuery(params?: StudentListQuery) {
  if (!params) return undefined;

  return {
    ...(typeof params.page === "number" ? {page: params.page} : {}),
    ...(typeof params.pageSize === "number" ? {page_size: params.pageSize} : {}),
    ...(params.search ? {search: params.search} : {}),
    ...(params.ordering ? {ordering: params.ordering} : {}),
    ...(typeof params.premium === "boolean" ? {premium: params.premium} : {}),
    ...(params.difficulty ? {difficulty: params.difficulty} : {}),
    ...(params.module ? {module: params.module} : {}),
    ...(params.reason ? {reason: params.reason} : {})
  };
}
