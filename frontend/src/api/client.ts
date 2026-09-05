import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { tokenStorage } from '../auth/tokenStorage';
import type { LoginResponse } from '../types/api';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

/**
 * Public auth endpoints. They must not carry an access token and a 401 from them
 * is a real credential failure, never something a token refresh could fix.
 */
const PUBLIC_AUTH_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
  '/api/v1/auth/logout',
];

const isPublicAuthPath = (url: string | undefined): boolean =>
  url !== undefined && PUBLIC_AUTH_PATHS.some((path) => url.startsWith(path));

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const accessToken = tokenStorage.getAccessToken();
  if (accessToken && !isPublicAuthPath(config.url)) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

/**
 * Holds the in-flight refresh call. When several requests fail with 401 at the same
 * time they all await this one promise, so the refresh token is rotated exactly once.
 * Firing several refreshes in parallel would make all but the first fail, because the
 * backend rotates and revokes the previous refresh token.
 */
let refreshPromise: Promise<string> | null = null;

let onSessionExpired: (() => void) | null = null;

/** Lets the auth layer clear its state when the session can no longer be recovered. */
export function setSessionExpiredHandler(handler: (() => void) | null): void {
  onSessionExpired = handler;
}

async function requestNewAccessToken(): Promise<string> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available.');
  }

  // A bare axios call, so this request never re-enters the interceptors below.
  const { data } = await axios.post<LoginResponse>(
    `${API_BASE_URL}/api/v1/auth/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' } },
  );

  tokenStorage.save(data.accessToken, data.refreshToken);
  return data.accessToken;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;

    const cannotRetry =
      error.response?.status !== 401 ||
      config === undefined ||
      config._retried === true ||
      isPublicAuthPath(config.url);

    if (cannotRetry) {
      return Promise.reject(error);
    }

    config._retried = true;

    try {
      refreshPromise ??= requestNewAccessToken().finally(() => {
        refreshPromise = null;
      });

      const accessToken = await refreshPromise;
      config.headers.Authorization = `Bearer ${accessToken}`;
      return await apiClient(config);
    } catch {
      tokenStorage.clear();
      onSessionExpired?.();
      return Promise.reject(error);
    }
  },
);
