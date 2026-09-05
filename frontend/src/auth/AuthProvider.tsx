import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { authApi } from '../api/auth';
import { setSessionExpiredHandler } from '../api/client';
import { AuthContext, type AuthContextValue } from './authContext';
import { tokenStorage } from './tokenStorage';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextValue['user']>(null);
  const [initializing, setInitializing] = useState(true);

  // Restoring the session after a page refresh: the tokens survive in localStorage but
  // the identity does not, so it is fetched from the API rather than decoded from the JWT.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      if (!tokenStorage.getAccessToken()) {
        setInitializing(false);
        return;
      }

      try {
        const currentUser = await authApi.me();
        if (!cancelled) {
          setUser(currentUser);
        }
      } catch {
        // An expired or revoked session simply starts over at the login screen.
        tokenStorage.clear();
      } finally {
        if (!cancelled) {
          setInitializing(false);
        }
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  // Lets the API client drop the user when a refresh attempt fails mid-session.
  useEffect(() => {
    setSessionExpiredHandler(() => setUser(null));
    return () => setSessionExpiredHandler(null);
  }, []);

  const login = useCallback<AuthContextValue['login']>(async (request) => {
    const tokens = await authApi.login(request);
    tokenStorage.save(tokens.accessToken, tokens.refreshToken);

    // Login only returns tokens, so the role comes from a separate identity call.
    const currentUser = await authApi.me();
    setUser(currentUser);
    return currentUser;
  }, []);

  const logout = useCallback<AuthContextValue['logout']>(async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Revoking server-side is best effort; the local session is cleared either way.
      }
    }

    tokenStorage.clear();
    setUser(null);
  }, []);

  const refreshUser = useCallback<AuthContextValue['refreshUser']>(async () => {
    if (!tokenStorage.getAccessToken()) {
      return;
    }
    setUser(await authApi.me());
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, initializing, login, logout, refreshUser }),
    [user, initializing, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
