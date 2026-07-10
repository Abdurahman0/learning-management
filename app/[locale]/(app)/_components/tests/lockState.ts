export type TestLockReason = "premium" | "register";

type LockStateInput = {
  isPremium: boolean;
  isAccessible?: boolean;
  isUserPremium?: boolean;
};

/**
 * A test is locked when the backend says the viewer cannot solve it
 * (`is_accessible === false`). Older payloads without the flag fall back to
 * "premium test and the viewer is not premium".
 *
 * Locked premium tests prompt an upgrade; locked non-premium tests are
 * registration-gated (only guests ever see those locked), so they prompt sign-up.
 */
export function resolveTestLockReason(test: LockStateInput): TestLockReason | null {
  const isLocked =
    typeof test.isAccessible === "boolean" ? !test.isAccessible : test.isPremium && !test.isUserPremium;

  if (!isLocked) {
    return null;
  }

  return test.isPremium ? "premium" : "register";
}
