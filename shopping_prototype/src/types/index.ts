// Re-export all types for easy importing
export * from './auth';
export * from './chat';
export * from './cart';
export * from './panel';
export * from './api';

// Common utility types
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T = any> {
  data: T | null;
  loading: LoadingState;
  error: string | null;
}

// Screen size breakpoints
export type BreakpointSize = 'mobile' | 'tablet' | 'desktop' | 'wide';

export interface WindowSize {
  width: number;
  height: number;
  breakpoint: BreakpointSize;
}

// Animation types
export type AnimationDuration = 'fast' | 'normal' | 'slow';
export type AnimationEasing = 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';

export interface AnimationConfig {
  duration: AnimationDuration;
  easing: AnimationEasing;
  delay?: number;
}