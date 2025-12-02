export interface PasswordEntry {
  id: string;
  title: string;
  username: string;
  password: string;
  website?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PasswordFormData {
  title: string;
  username: string;
  password: string;
  website?: string;
  notes?: string;
}

export interface PasswordGeneratorOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}

export interface AppSettings {
  autoLockTimeout: number; // in minutes
  biometricEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
}

export interface AuthState {
  isAuthenticated: boolean;
  isInitialized: boolean;
  biometricType?: 'fingerprint' | 'facial' | 'iris';
  error?: string;
}

export interface AppState {
  passwords: PasswordEntry[];
  searchQuery: string;
  filteredPasswords: PasswordEntry[];
  selectedPassword?: PasswordEntry;
  isLocked: boolean;
  lastActivity: Date;
}

export type PasswordCategory = 'all' | 'websites' | 'apps' | 'other';

export interface PasswordStats {
  totalPasswords: number;
  weakPasswords: number;
  reusedPasswords: number;
  lastUpdated: Date;
}

// Utility types
export type SortField = 'title' | 'username' | 'website' | 'createdAt' | 'updatedAt';
export type SortDirection = 'asc' | 'desc';

export interface SortOptions {
  field: SortField;
  direction: SortDirection;
}

// Error types
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class EncryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EncryptionError';
  }
}

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

// Constants
export const DEFAULT_PASSWORD_LENGTH = 16;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;
export const DEFAULT_AUTO_LOCK_TIMEOUT = 5; // minutes
export const MAX_AUTO_LOCK_TIMEOUT = 60; // minutes

export const PASSWORD_STRENGTH_LEVELS = {
  WEAK: 'weak',
  MEDIUM: 'medium',
  STRONG: 'strong',
  VERY_STRONG: 'very_strong'
} as const;

export type PasswordStrength = typeof PASSWORD_STRENGTH_LEVELS[keyof typeof PASSWORD_STRENGTH_LEVELS];
