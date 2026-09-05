import { apiClient } from './client';
import type {
  CurrentUser,
  LoginRequest,
  LoginResponse,
  RegisterPatientRequest,
  RegisterPatientResponse,
} from '../types/api';

export const authApi = {
  async login(request: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/api/v1/auth/login', request);
    return data;
  },

  async register(request: RegisterPatientRequest): Promise<RegisterPatientResponse> {
    const { data } = await apiClient.post<RegisterPatientResponse>(
      '/api/v1/auth/register',
      request,
    );
    return data;
  },

  async me(): Promise<CurrentUser> {
    const { data } = await apiClient.get<CurrentUser>('/api/v1/auth/me');
    return data;
  },

  async logout(refreshToken: string): Promise<void> {
    await apiClient.post('/api/v1/auth/logout', { refreshToken });
  },
};
