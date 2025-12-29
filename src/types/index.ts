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
  accessToken: string;
  id: number;
  username: string;
  email: string;
  roles: string[];
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

// Headless CMS Types
export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
}

export interface SchemaField {
  id?: string; // Internal ID for DnD (Frontend only), optional from Backend
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'rich-text' | 'email' | 'url' | 'number' | 'toggle' | 'checkbox' | 'date' | 'image';
  placeholder?: string;
  gridWidth: 1 | 2;
  required?: boolean;
  defaultValue?: any;
  validation?: FieldValidation;
}

export interface PageSchema {
  schemaName: string; // e.g. ACADEMIC (Backend expects schemaName)
  schemaType: string; // e.g. EVENT
  structure: SchemaField[];
}

// Content Types
export interface Post {
  id: number;
  displayTitle?: string; // Optional, computed frontend side usually or returned by backend if enhanced
  published: boolean;
  data: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  attachmentPath?: string;
  created_by_username?: string; // Backend raw field
  createdByUsername?: string; // Normalized
  entryDateTime?: string;
  lastAction?: string;
  schemaType?: string;
  schema?: PageSchema;
}
