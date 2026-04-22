export type OnboardingModule = "listening" | "reading" | "writing" | "speaking";

export type OnboardingTargets = Record<OnboardingModule, number>;

export type OnboardingAnswers = {
  examDate?: string; // YYYY-MM-DD
  targets: OnboardingTargets;
  strongest?: OnboardingModule;
  weakest?: OnboardingModule;
  hoursPerDay?: number;
};

export type OnboardingStatus = "pending" | "skipped" | "completed";

export type OnboardingState = {
  version: 1;
  status: OnboardingStatus;
  updatedAt: string;
  answers: OnboardingAnswers;
};

const STORAGE_KEY = "englishlabs:onboarding:v1";
export const ONBOARDING_OPEN_EVENT = "englishlabs:onboarding:open";
export const ONBOARDING_CHANGE_EVENT = "englishlabs:onboarding:changed";

export const DEFAULT_TARGETS: OnboardingTargets = {
  listening: 9,
  reading: 9,
  writing: 9,
  speaking: 9
};

function safeParseState(raw: string): OnboardingState | null {
  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingState> | null;
    if (!parsed || parsed.version !== 1) return null;
    if (parsed.status !== "pending" && parsed.status !== "skipped" && parsed.status !== "completed") return null;
    const answers = (parsed.answers ?? {}) as Partial<OnboardingAnswers>;
    const targets = (answers.targets ?? {}) as Partial<OnboardingTargets>;
    return {
      version: 1,
      status: parsed.status,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
      answers: {
        examDate: typeof answers.examDate === "string" ? answers.examDate : undefined,
        targets: {
          listening: typeof targets.listening === "number" ? targets.listening : DEFAULT_TARGETS.listening,
          reading: typeof targets.reading === "number" ? targets.reading : DEFAULT_TARGETS.reading,
          writing: typeof targets.writing === "number" ? targets.writing : DEFAULT_TARGETS.writing,
          speaking: typeof targets.speaking === "number" ? targets.speaking : DEFAULT_TARGETS.speaking
        },
        strongest: answers.strongest,
        weakest: answers.weakest,
        hoursPerDay: typeof answers.hoursPerDay === "number" ? answers.hoursPerDay : undefined
      }
    };
  } catch {
    return null;
  }
}

export function readOnboardingState(): OnboardingState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return safeParseState(raw);
  } catch {
    return null;
  }
}

export function writeOnboardingState(state: OnboardingState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function seedOnboardingPending() {
  if (typeof window === "undefined") return;
  const current = readOnboardingState();
  if (current) return;

  writeOnboardingState({
    version: 1,
    status: "pending",
    updatedAt: new Date().toISOString(),
    answers: {targets: DEFAULT_TARGETS}
  });
}

export function setOnboardingStatus(status: OnboardingStatus, answers?: Partial<OnboardingAnswers>) {
  const base = readOnboardingState() ?? {
    version: 1 as const,
    status: "pending" as OnboardingStatus,
    updatedAt: new Date().toISOString(),
    answers: {targets: DEFAULT_TARGETS}
  };

  writeOnboardingState({
    ...base,
    status,
    updatedAt: new Date().toISOString(),
    answers: {
      ...base.answers,
      ...answers,
      targets: {
        ...DEFAULT_TARGETS,
        ...(base.answers.targets ?? {}),
        ...(answers?.targets ?? {})
      }
    }
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ONBOARDING_CHANGE_EVENT));
  }
}

export function openOnboardingWizard() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ONBOARDING_OPEN_EVENT));
}
