"use client";

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const SCRIPT_ID = "google-identity-services-script";

let scriptPromise: Promise<void> | null = null;

function loadGoogleScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google sign-in is only available in the browser."));
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    if (existingScript) {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }

      existingScript.addEventListener("load", () => resolve(), {once: true});
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Google sign-in script.")), {
        once: true
      });
      window.setTimeout(() => {
        if (window.google?.accounts?.id) {
          resolve();
          return;
        }

        reject(new Error("Google sign-in script is not ready yet."));
      }, 5000);
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google sign-in script."));

    document.head.appendChild(script);
  });

  return scriptPromise;
}

export async function requestGoogleIdToken(clientId: string): Promise<string> {
  if (!clientId) {
    throw new Error("Google client ID is not configured.");
  }

  await loadGoogleScript();

  if (!window.google?.accounts?.id) {
    throw new Error("Google sign-in is currently unavailable.");
  }

  return new Promise<string>((resolve, reject) => {
    let settled = false;

    const safeResolve = (credential: string) => {
      if (settled) {
        return;
      }

      settled = true;
      resolve(credential);
    };

    const safeReject = (message: string) => {
      if (settled) {
        return;
      }

      settled = true;
      reject(new Error(message));
    };

    window.google?.accounts?.id?.cancel?.();
    window.google?.accounts?.id?.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response.credential) {
          safeResolve(response.credential);
          return;
        }

        safeReject("Google sign-in did not return a valid token.");
      },
      cancel_on_tap_outside: true
    });

    window.google?.accounts?.id?.prompt((notification) => {
      if (notification.isNotDisplayed?.()) {
        const reason = notification.getNotDisplayedReason?.();
        safeReject(reason ? `Google sign-in is not available: ${reason}.` : "Google sign-in is not available right now.");
        return;
      }

      if (notification.isSkippedMoment?.()) {
        const reason = notification.getSkippedReason?.();
        safeReject(reason ? `Google sign-in was skipped: ${reason}.` : "Google sign-in was skipped.");
        return;
      }

      if (notification.isDismissedMoment?.()) {
        const reason = notification.getDismissedReason?.();
        safeReject(reason ? `Google sign-in was cancelled: ${reason}.` : "Google sign-in was cancelled.");
      }
    });

    window.setTimeout(() => {
      safeReject("Google sign-in timed out. Please try again.");
    }, 30000);
  });
}
