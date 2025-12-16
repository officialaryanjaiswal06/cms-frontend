import axios, { AxiosError, AxiosInstance } from 'axios';
import {
  AuthResponse,
  User,
  CreateUserDto,
  UpdateUserRolesDto,
  Role,
  CreateRoleDto,
  Module,
  CreateModuleDto,
  PermissionDto
} from '@/types';

// Add new types for Register and OTP
export interface RegisterDto {
  username: string;
  email: string;
  password: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  email: string;
  otp: string;
  newPassword: string;
}

export interface Notification {
  id: number;
  email: string;
  subject: string;
  messageBody: string;
  category: 'SYSTEM_ALERT' | 'ACCOUNT' | 'PROMOTION' | 'OTP';
  status: string;
  retryTimes: number;
  createdAt: string;
}

export interface SendNotificationDto {
  email: string;
  subject: string;
  messageBody: string;
  category: 'SYSTEM_ALERT' | 'ACCOUNT' | 'PROMOTION';
}

export interface BroadcastNotificationDto {
  subject: string;
  messageBody: string;
  category: 'SYSTEM_ALERT' | 'ACCOUNT' | 'PROMOTION';
}

const API_BASE_URL = 'http://localhost:8080';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Check if this request is marked as public (No-Auth)
    if (config.headers['No-Auth'] === 'true') {
      // Remove the custom header before sending
      delete config.headers['No-Auth'];
      return config;
    }

    // Otherwise attach the token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
// Auth API
export const authApi = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    // REVERTED: Switching back to x-www-form-urlencoded for Spring Security defaults
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    // Note: We use the base 'axios' instance but override headers for this specific call
    const response = await api.post<AuthResponse>(`/login`, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  register: async (data: RegisterDto): Promise<string> => {
    // Backend endpoint: /auth/register
    // No-Auth header ensures interceptor skips token
    const response = await api.post('/auth/register', data, {
      headers: { 'No-Auth': 'true' }
    });
    return response.data; // "User Registered Successfully"
  },

  validateOtp: async (email: string, otp: string, type: 'REGISTRATION' | 'FORGOT_PASSWORD'): Promise<string> => {
    // Backend endpoint: /auth/verify-account
    // Expects JSON Body: { email, otp } - Type is implied by endpoint
    const response = await api.post(`/auth/verify-account`,
      { email, otp },
      { headers: { 'No-Auth': 'true' } }
    );
    return response.data;
  },

  forgotPassword: async (email: string): Promise<string> => {
    const response = await api.post('/auth/forgot-password',
      { email },
      { headers: { 'No-Auth': 'true' } }
    );
    return response.data;
  },

  resetPassword: async (data: ResetPasswordDto): Promise<string> => {
    const response = await api.post('/auth/reset-password',
      data,
      { headers: { 'No-Auth': 'true' } }
    );
    return response.data;
  }
};

export const notificationsApi = {
  getMyNotifications: async (email: string) => {
    const response = await api.get('/notifications/mine', {
      params: { email }
    });
    return response.data;
  }
};

export const adminNotificationsApi = {
  getHistory: async () => {
    const response = await api.get<Notification[]>('/push/history');
    return response.data;
  },

  sendManual: async (data: SendNotificationDto) => {
    const response = await api.post('/push/manual', data);
    return response.data;
  },

  broadcast: async (data: BroadcastNotificationDto) => {
    const response = await api.post('/push/broadcast/users-only', data);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/push/${id}`);
  }
};

// Users API
export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users');
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<User>('/users/me');
    return response.data;
  },

  create: async (data: CreateUserDto): Promise<User> => {
    const response = await api.post<User>('/users', data);
    return response.data;
  },

  update: async (id: number, data: Partial<User>): Promise<User> => {
    const response = await api.put<User>(`/users/${id}`, data);
    return response.data;
  },

  updateRoles: async (id: number, data: UpdateUserRolesDto): Promise<User> => {
    const response = await api.put<User>(`/users/${id}/roles`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};

// Roles API
export const rolesApi = {
  getAll: async (): Promise<Role[]> => {
    const response = await api.get<Role[]>('/admin/roles');
    return response.data;
  },

  create: async (data: CreateRoleDto): Promise<Role> => {
    const response = await api.post<Role>('/admin/roles', data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/admin/roles/${id}`);
  },

  getPermissions: async (roleId: number): Promise<PermissionDto[]> => {
    const response = await api.get<PermissionDto[]>(`/admin/roles/${roleId}/permissions`);
    return response.data;
  },

  updatePermissions: async (roleId: number, permissions: PermissionDto[]): Promise<void> => {
    await api.put(`/admin/roles/${roleId}/permissions`, permissions);
  },
};

// Modules API
export const modulesApi = {
  getAll: async (): Promise<Module[]> => {
    const response = await api.get<Module[]>('/admin/modules');
    return response.data;
  },

  create: async (data: CreateModuleDto): Promise<Module> => {
    const response = await api.post<Module>('/admin/modules', data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/admin/modules/${id}`);
  },
};

export default api;
