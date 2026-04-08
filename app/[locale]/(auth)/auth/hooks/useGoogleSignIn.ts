"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import {usePathname, useRouter, useSearchParams} from "next/navigation";
import {useLocale} from "next-intl";

import {authApi} from "@/lib/api/auth";
import {requestGoogleIdToken} from "@/lib/auth/google-client";
import {resolveGoogleClientId} from "@/lib/auth/google-config";

type GoogleSignInOptions = {
  onSuccess?: () => void;
  onError?: (error: string) => void;
};

function resolveDashboardPath(locale: string, role: string) {
  if (role === "admin") return `/${locale}/admin`;
  if (role === "teacher") return `/${locale}/teacher`;
  return `/${locale}/reading`;
}

export function useGoogleSignIn({onSuccess, onError}: GoogleSignInOptions = {}) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const code = searchParams.get("code")?.trim() ?? "";

  const callbackPath = useMemo(() => {
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete("code");
    const query = nextSearchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!code) {
      return;
    }

    let isCancelled = false;

    const exchangeCode = async () => {
      setIsLoading(true);

      const response = await authApi.exchangeGoogleCode({code});
      if (isCancelled) {
        return;
      }

      if (!response.ok || !response.data?.role) {
        setIsLoading(false);
        onError?.(response.detail ?? "Google authentication failed.");
        return;
      }

      onSuccess?.();
      router.replace(resolveDashboardPath(locale, response.data.role));
      router.refresh();
    };

    void exchangeCode();

    return () => {
      isCancelled = true;
    };
  }, [code, locale, onError, onSuccess, router]);

  const signIn = useCallback(async () => {
    setIsLoading(true);

    try {
      const redirectFlowResponse = await authApi.getGoogleAuthorizationUrl(callbackPath);
      const authUrl = redirectFlowResponse.data?.authorization_url?.trim() ?? "";

      if (redirectFlowResponse.ok && authUrl) {
        window.location.assign(authUrl);
        return;
      }

      const clientId = await resolveGoogleClientId();
      const idToken = await requestGoogleIdToken(clientId);
      const directFlowResponse = await authApi.loginWithGoogleToken({id_token: idToken});

      if (!directFlowResponse.ok || !directFlowResponse.data?.role) {
        throw new Error(directFlowResponse.detail ?? "Google authentication failed.");
      }

      onSuccess?.();
      router.replace(resolveDashboardPath(locale, directFlowResponse.data.role));
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong during Google sign-in.";
      onError?.(message);
      setIsLoading(false);
    }
  }, [callbackPath, locale, onError, onSuccess, router]);

  return {signIn, isReady: isInitialized && !code, isLoading};
}
