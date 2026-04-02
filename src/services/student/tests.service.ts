import {studentHttpClient, toListQuery, toStudentApiError} from "./httpClient";
import type {StudentListQuery, StudentPaginatedResponse, StudentTestRecord} from "./types";

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeTestRecord(item: StudentTestRecord): StudentTestRecord {
  return {
    ...item,
    id: String(item.id ?? ""),
    title: String(item.title ?? ""),
    description: String(item.description ?? ""),
    test_type: String(item.test_type ?? ""),
    type_display: String(item.type_display ?? ""),
    difficulty_level: String(item.difficulty_level ?? ""),
    difficulty_display: String(item.difficulty_display ?? ""),
    total_questions: Number(item.total_questions ?? 0),
    time_limit_seconds: typeof item.time_limit_seconds === "number" ? item.time_limit_seconds : null,
    is_premium: Boolean(item.is_premium),
    reading_passages: toArray<StudentTestRecord["reading_passages"][number]>(item.reading_passages),
    listening_parts: toArray<StudentTestRecord["listening_parts"][number]>(item.listening_parts),
    user_attempt_status: item.user_attempt_status ?? null
  };
}

function normalizeListResponse(
  data: StudentPaginatedResponse<StudentTestRecord> | StudentTestRecord[]
): StudentPaginatedResponse<StudentTestRecord> {
  if (Array.isArray(data)) {
    const results = data.map(normalizeTestRecord);
    return {
      count: results.length,
      next: null,
      previous: null,
      results
    };
  }

  const record = asRecord(data);
  const rawResults = record?.results;
  const results = toArray<StudentTestRecord>(rawResults).map(normalizeTestRecord);

  return {
    count: Number(record?.count ?? 0),
    next: typeof record?.next === "string" ? record.next : null,
    previous: typeof record?.previous === "string" ? record.previous : null,
    results
  };
}

async function fetchList(path: string, params?: StudentListQuery) {
  try {
    const response = await studentHttpClient.get<StudentPaginatedResponse<StudentTestRecord> | StudentTestRecord[]>(path, {
      params: toListQuery(params)
    });
    return normalizeListResponse(response.data);
  } catch (error) {
    throw toStudentApiError(error);
  }
}

async function fetchAllPages(path: string, params?: StudentListQuery) {
  const pageSize = Math.max(1, params?.pageSize ?? 50);
  const firstPage = Math.max(1, params?.page ?? 1);
  const maxPages = 50;

  let page = firstPage;
  let loopCount = 0;
  let mergedResults: StudentTestRecord[] = [];
  let count = 0;
  let previous: string | null = null;
  let hasNext = true;

  while (hasNext && loopCount < maxPages) {
    loopCount += 1;
    const response = await fetchList(path, {...params, page, pageSize});
    if (loopCount === 1) {
      count = response.count;
      previous = response.previous;
    }

    mergedResults = [...mergedResults, ...response.results];
    hasNext = Boolean(response.next) && mergedResults.length < count && response.results.length > 0;
    page += 1;
  }

  return {
    count,
    next: null,
    previous,
    results: mergedResults
  } satisfies StudentPaginatedResponse<StudentTestRecord>;
}

export const studentTestsService = {
  listAll(params?: StudentListQuery) {
    return fetchList("/tests/", params);
  },
  listAllPages(params?: StudentListQuery) {
    return fetchAllPages("/tests/", params);
  },
  listListening(params?: StudentListQuery) {
    return fetchList("/tests/listening/", params);
  },
  listListeningAllPages(params?: StudentListQuery) {
    return fetchAllPages("/tests/listening/", params);
  },
  listReading(params?: StudentListQuery) {
    return fetchList("/tests/reading/", params);
  },
  listReadingAllPages(params?: StudentListQuery) {
    return fetchAllPages("/tests/reading/", params);
  }
};
