"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

type GoogleSignInOptions = {
  onSuccess?: () => void;
  onError?: (error: string) => void;
};

export function useGoogleSignIn({ onSuccess, onError }: GoogleSignInOptions = {}) {
  const locale = useLocale();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initGoogle = async () => {
      try {
        const response = await fetch("/api/auth/google/client-id");
        if (!response.ok) {
          throw new Error("Failed to fetch Google Client ID");
        }
        const { client_id } = await response.json();

        if (!client_id) {
          throw new Error("Google Client ID is missing");
        }

        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => {
          const google = (window as any).google;
          if (google) {
            google.accounts.id.initialize({
              client_id: client_id,
              callback: handleCredentialResponse,
            });
            setIsInitialized(true);
          }
        };
        document.body.appendChild(script);
      } catch (err) {
        console.error("Google Auth initialization failed:", err);
      }
    };

    const handleCredentialResponse = async (response: any) => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_token: response.credential }),
        });

        const payload = (await res.json()) as {
          role?: string;
          detail?: string;
          error?: string;
        };

        if (!res.ok || !payload.role) {
          throw new Error(payload.detail || payload.error || "Google Auth failed");
        }

        onSuccess?.();
        
        if (payload.role === "admin") {
          router.replace(`/${locale}/admin`);
        } else if (payload.role === "teacher") {
          router.replace(`/${locale}/teacher`);
        } else {
          router.replace(`/${locale}/reading`);
        }
        
        router.refresh();
      } catch (err: any) {
        console.error("Google Login failed:", err);
        onError?.(err.message || "Something went wrong during Google Sign-In");
      } finally {
        setIsLoading(false);
      }
    };

    initGoogle();

    return () => {
      const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (script) {
        document.body.removeChild(script);
      }
    };
  }, [locale, router, onSuccess, onError]);

  const signIn = useCallback(() => {
    const google = (window as any).google;
    if (google && isInitialized) {
      google.accounts.id.prompt(); 
    }
  }, [isInitialized]);

  return { signIn, isReady: isInitialized, isLoading };
}
