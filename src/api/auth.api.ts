import { axiosInstance } from './axios';
import type { ApiResponse, ChangePasswordRequest, LoginRequest, LoginResponse, RegisterRequest, UpdateProfileRequest, UserResponse } from '../types/auth.types';

export const authApi = {
  login: (data: LoginRequest) =>
    axiosInstance.post<ApiResponse<LoginResponse>>('/users/login', data),

  register: (data: RegisterRequest) =>
    axiosInstance.post<ApiResponse<UserResponse>>('/users/register', data),

  getProfile: (token?: string) =>
    axiosInstance.get<ApiResponse<UserResponse>>('/users/profile', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),

  checkEmail: (email: string) =>
    axiosInstance.get<ApiResponse<{ email: string; available: boolean }>>('/users/check-email', {
      params: { email },
    }),

  forgotPassword: (email: string) =>
    axiosInstance.post<ApiResponse<void>>('/users/password/forgot', { email }),

  resetPassword: (token: string, newPassword: string, confirmPassword: string) =>
    axiosInstance.post<ApiResponse<void>>('/users/password/reset', { token, newPassword, confirmPassword }),

  updateProfile: (data: UpdateProfileRequest) =>
    axiosInstance.put<ApiResponse<UserResponse>>('/users/profile', data),

  changePassword: (data: ChangePasswordRequest) =>
    axiosInstance.put<ApiResponse<void>>('/users/password/change', data),
};
