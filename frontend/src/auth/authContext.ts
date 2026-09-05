import { createContext } from 'react';

import type { CurrentUser, LoginRequest } from '../types/api';

export interface AuthContextValue {
  user: CurrentUser | null;
  /** True while the stored session is being restored on first render. */
  initializing: boolean;
  login: (request: LoginRequest) => Promise<CurrentUser>;
  logout: () => Promise<void>;
  /** Re-reads the identity, for when something the header shows has changed. */
  refreshUser: () => Promise<void>;
}

/**
 * Kept apart from the provider component so the module exports only non-components,
 * which is what React Fast Refresh needs to reload the provider cleanly.
 */
export const AuthContext = createContext<AuthContextValue | null>(null);
