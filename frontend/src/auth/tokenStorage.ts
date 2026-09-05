const ACCESS_TOKEN_KEY = 'mc.accessToken';
const REFRESH_TOKEN_KEY = 'mc.refreshToken';

/**
 * Tokens live in localStorage so a page refresh keeps the session.
 * The identity itself is never stored here: it is read back from GET /api/v1/auth/me,
 * so the frontend never has to decode or trust the JWT payload.
 */
export const tokenStorage = {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  save(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  clear(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};
