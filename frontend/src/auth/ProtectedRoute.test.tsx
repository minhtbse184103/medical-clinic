import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { ProtectedRoute } from './ProtectedRoute';
import { AuthContext, type AuthContextValue } from './authContext';
import type { CurrentUser, Role } from '../types/api';

function userWithRole(role: Role): CurrentUser {
  return { userId: 1, email: 'someone@clinic.local', role, status: 'ACTIVE', fullName: null };
}

function renderAt(
  path: string,
  auth: Pick<AuthContextValue, 'user' | 'initializing'>,
  allowedRoles?: Role[],
) {
  const value: AuthContextValue = {
    ...auth,
    login: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
  };

  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={allowedRoles} />}>
            <Route path="/appointments" element={<div>protected content</div>} />
          </Route>
          <Route path="/login" element={<div>login page</div>} />
          <Route path="/" element={<div>dashboard</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('ProtectedRoute', () => {
  it('renders the route for a signed-in user when no role is required', () => {
    renderAt('/appointments', { user: userWithRole('PATIENT'), initializing: false });

    expect(screen.getByText('protected content')).toBeInTheDocument();
  });

  it('sends an anonymous visitor to the login page', () => {
    renderAt('/appointments', { user: null, initializing: false });

    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  /**
   * Without this the very first render of a protected URL would bounce to /login,
   * because the stored session has not been read back from /auth/me yet.
   */
  it('waits while the stored session is being restored', () => {
    renderAt('/appointments', { user: null, initializing: true });

    expect(screen.queryByText('login page')).not.toBeInTheDocument();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  it('admits a role that is on the allowed list', () => {
    renderAt('/appointments', { user: userWithRole('PATIENT'), initializing: false }, ['PATIENT']);

    expect(screen.getByText('protected content')).toBeInTheDocument();
  });

  it('redirects a signed-in user whose role is not allowed', () => {
    renderAt('/appointments', { user: userWithRole('DOCTOR'), initializing: false }, ['PATIENT']);

    expect(screen.getByText('dashboard')).toBeInTheDocument();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  it('keeps every other role out of a single-role area', () => {
    const rolesThatMustNotEnter: Role[] = ['ADMIN', 'DOCTOR', 'RECEPTIONIST'];

    for (const role of rolesThatMustNotEnter) {
      const { unmount } = renderAt(
        '/appointments',
        { user: userWithRole(role), initializing: false },
        ['PATIENT'],
      );

      expect(screen.queryByText('protected content')).not.toBeInTheDocument();
      unmount();
    }
  });
});
