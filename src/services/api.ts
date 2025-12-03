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
export const authApi = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    
    const response = await axios.post<AuthResponse>(`${API_BASE_URL}/login`, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },
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
