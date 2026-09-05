import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { API_BASE_URL, apiClient, setSessionExpiredHandler } from './client';
import { tokenStorage } from '../auth/tokenStorage';

const REFRESH_URL = `${API_BASE_URL}/api/v1/auth/refresh`;
const PROTECTED_URL = '/api/v1/patients/me';

/** Mocks apiClient's own adapter; its interceptors still run. */
let clientMock: MockAdapter;
/** requestNewAccessToken calls bare axios, so the global instance is mocked separately. */
let axiosMock: MockAdapter;

function newTokens(suffix: string) {
  return {
    accessToken: `access-${suffix}`,
    refreshToken: `refresh-${suffix}`,
    tokenType: 'Bearer',
    expiresIn: 900,
  };
}

beforeEach(() => {
  clientMock = new MockAdapter(apiClient);
  axiosMock = new MockAdapter(axios);
  tokenStorage.save('access-old', 'refresh-old');
});

afterEach(() => {
  clientMock.restore();
  axiosMock.restore();
  setSessionExpiredHandler(null);
});

describe('request interceptor', () => {
  it('attaches the stored access token', async () => {
    clientMock.onGet(PROTECTED_URL).reply(200, {});

    await apiClient.get(PROTECTED_URL);

    expect(clientMock.history.get[0].headers?.Authorization).toBe('Bearer access-old');
  });

  it('does not attach a token to the public auth endpoints', async () => {
    clientMock.onPost('/api/v1/auth/login').reply(200, {});

    await apiClient.post('/api/v1/auth/login', {});

    expect(clientMock.history.post[0].headers?.Authorization).toBeUndefined();
  });

  it('sends no Authorization header when nothing is stored', async () => {
    tokenStorage.clear();
    clientMock.onGet(PROTECTED_URL).reply(200, {});

    await apiClient.get(PROTECTED_URL);

    expect(clientMock.history.get[0].headers?.Authorization).toBeUndefined();
  });
});

describe('token refresh', () => {
  it('refreshes once on 401 and retries the original request', async () => {
    clientMock
      .onGet(PROTECTED_URL)
      .replyOnce(401)
      .onGet(PROTECTED_URL)
      .reply(200, { fullName: 'Le Van Cuong' });
    axiosMock.onPost(REFRESH_URL).reply(200, newTokens('new'));

    const response = await apiClient.get(PROTECTED_URL);

    expect(response.data).toEqual({ fullName: 'Le Van Cuong' });
    expect(axiosMock.history.post).toHaveLength(1);
    // The retry must carry the new token, not the expired one.
    expect(clientMock.history.get[1].headers?.Authorization).toBe('Bearer access-new');
  });

  it('stores the rotated token pair', async () => {
    clientMock.onGet(PROTECTED_URL).replyOnce(401).onGet(PROTECTED_URL).reply(200, {});
    axiosMock.onPost(REFRESH_URL).reply(200, newTokens('new'));

    await apiClient.get(PROTECTED_URL);

    expect(tokenStorage.getAccessToken()).toBe('access-new');
    expect(tokenStorage.getRefreshToken()).toBe('refresh-new');
  });

  /**
   * The single-flight guarantee. The backend rotates and revokes the previous refresh
   * token, so a second concurrent refresh would fail and log the user out.
   */
  it('shares one refresh across concurrent 401s', async () => {
    clientMock
      .onGet(PROTECTED_URL)
      .replyOnce(401)
      .onGet(PROTECTED_URL)
      .replyOnce(401)
      .onGet(PROTECTED_URL)
      .replyOnce(401)
      .onGet(PROTECTED_URL)
      .reply(200, { ok: true });

    let refreshCalls = 0;
    axiosMock.onPost(REFRESH_URL).reply(() => {
      refreshCalls += 1;
      return [200, newTokens('new')];
    });

    const responses = await Promise.all([
      apiClient.get(PROTECTED_URL),
      apiClient.get(PROTECTED_URL),
      apiClient.get(PROTECTED_URL),
    ]);

    expect(refreshCalls).toBe(1);
    expect(responses.map((response) => response.status)).toEqual([200, 200, 200]);
  });

  it('allows a later 401 to trigger a fresh refresh', async () => {
    clientMock
      .onGet(PROTECTED_URL)
      .replyOnce(401)
      .onGet(PROTECTED_URL)
      .replyOnce(200, {})
      .onGet(PROTECTED_URL)
      .replyOnce(401)
      .onGet(PROTECTED_URL)
      .reply(200, {});
    axiosMock.onPost(REFRESH_URL).reply(200, newTokens('new'));

    await apiClient.get(PROTECTED_URL);
    await apiClient.get(PROTECTED_URL);

    // The in-flight promise must be released after settling, not cached forever.
    expect(axiosMock.history.post).toHaveLength(2);
  });

  it('retries only once, so a still-failing request surfaces its error', async () => {
    clientMock.onGet(PROTECTED_URL).reply(401);
    axiosMock.onPost(REFRESH_URL).reply(200, newTokens('new'));

    await expect(apiClient.get(PROTECTED_URL)).rejects.toMatchObject({
      response: { status: 401 },
    });

    expect(axiosMock.history.post).toHaveLength(1);
    expect(clientMock.history.get).toHaveLength(2);
  });
});

describe('when the session cannot be recovered', () => {
  it('clears the tokens and notifies the auth layer', async () => {
    clientMock.onGet(PROTECTED_URL).reply(401);
    axiosMock.onPost(REFRESH_URL).reply(401);
    const onExpired = vi.fn();
    setSessionExpiredHandler(onExpired);

    await expect(apiClient.get(PROTECTED_URL)).rejects.toBeDefined();

    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(onExpired).toHaveBeenCalledOnce();
  });

  it('does not attempt a refresh without a stored refresh token', async () => {
    tokenStorage.clear();
    clientMock.onGet(PROTECTED_URL).reply(401);
    const onExpired = vi.fn();
    setSessionExpiredHandler(onExpired);

    await expect(apiClient.get(PROTECTED_URL)).rejects.toBeDefined();

    expect(axiosMock.history.post).toHaveLength(0);
    expect(onExpired).toHaveBeenCalledOnce();
  });

  it('rejects the original error rather than the refresh error', async () => {
    clientMock.onGet(PROTECTED_URL).reply(401, { code: 'UNAUTHORIZED' });
    axiosMock.onPost(REFRESH_URL).reply(401, { code: 'INVALID_REFRESH_TOKEN' });

    await expect(apiClient.get(PROTECTED_URL)).rejects.toMatchObject({
      response: { data: { code: 'UNAUTHORIZED' } },
    });
  });
});

describe('public auth endpoints', () => {
  it('never refreshes on a failed login, because 401 means wrong credentials', async () => {
    clientMock.onPost('/api/v1/auth/login').reply(401, { code: 'INVALID_CREDENTIALS' });

    await expect(apiClient.post('/api/v1/auth/login', {})).rejects.toMatchObject({
      response: { data: { code: 'INVALID_CREDENTIALS' } },
    });

    expect(axiosMock.history.post).toHaveLength(0);
    expect(tokenStorage.getAccessToken()).toBe('access-old');
  });
});
