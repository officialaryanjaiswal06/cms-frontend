// User Types
export interface User {
  id: number;
  username: string;
  email: string;
  roles: string[];
}

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  roles: string[];
}

export interface UpdateUserRolesDto {
  roles: string[];
}

// Role Types
export interface Role {
  id: number;
  name: string;
}

export interface CreateRoleDto {
  name: string;
}

// Module Types
export interface Module {
  id: number;
  moduleName: string;
}

export interface CreateModuleDto {
  moduleName: string;
}

// Permission Types
export interface PermissionDto {
  moduleName: string;
  canSelect: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

// Auth Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}

export interface DecodedToken {
  sub: string;
  roles: string[];
  permissions: string[];
  exp: number;
  iat: number;
}

// API Response Types
export interface ApiError {
  message: string;
  status: number;
}
