import { ApiResponse } from './index';
import { PanelData } from './panel';

// HTTP method types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// API client configuration
export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  headers?: Record<string, string>;
}

// Request configuration
export interface RequestConfig {
  method: HttpMethod;
  url: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  auth?: boolean;
}

// API error types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  status: number;
  timestamp: Date;
}

// Authentication API
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: any;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
  };
}

// Chat API (ERD 기반으로 단순화됨)
export interface SendMessageRequest {
  user_id: number;
  message: string;
}

export interface SendMessageResponse {
  user_id: number;
  ai_message: string;
  type: number;
  recommendationItems: any[];
}

export interface GetChatHistoryRequest {
  sessionId?: string;
  limit?: number;
  offset?: number;
  before?: string;
}

export interface GetChatHistoryResponse {
  messages: any[];
  hasMore: boolean;
  nextCursor?: string;
}

// Cart API
export interface GetCartResponse {
  items: any[];
  summary: any;
  lastUpdated: string;
}

export interface AddToCartResponse {
  item: any;
  summary: any;
}

export interface UpdateCartItemResponse {
  item: any;
  summary: any;
}

export interface RemoveCartItemRequest {
  itemId: string;
}

// Product API
export interface SearchProductsRequest {
  query?: string;
  category?: string;
  filters?: Record<string, any>;
  sort?: string;
  limit?: number;
  offset?: number;
}

export interface SearchProductsResponse {
  products: any[];
  total: number;
  filters: any[];
  suggestions?: string[];
}

export interface GetProductRequest {
  productId: string;
  includeReviews?: boolean;
  includeRecommendations?: boolean;
}

export interface GetProductResponse {
  product: any;
  reviews?: any[];
  recommendations?: any[];
  relatedProducts?: any[];
}

// Panel API
export interface GetPanelDataRequest {
  type: string;
  params?: Record<string, any>;
  context?: {
    productId?: string;
    searchQuery?: string;
    userPreferences?: any;
  };
}

export interface GetPanelDataResponse {
  panelData: PanelData;
  metadata?: {
    cached: boolean;
    lastUpdated: string;
    source: string;
  };
}

// Analytics API
export interface TrackEventRequest {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp?: Date;
}

export interface GetAnalyticsRequest {
  metrics: string[];
  timeRange: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, any>;
  groupBy?: string;
}

export interface GetAnalyticsResponse {
  data: any[];
  summary: Record<string, any>;
  timeRange: {
    start: string;
    end: string;
  };
}

// File upload API
export interface UploadFileRequest {
  file: File;
  type: 'image' | 'document' | 'avatar';
  metadata?: Record<string, any>;
}

export interface UploadFileResponse {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

// Webhook types
export interface WebhookPayload {
  type: string;
  data: any;
  timestamp: Date;
  source: string;
}

// Real-time connection types
export interface WebSocketMessage {
  type: 'message' | 'typing' | 'status' | 'panel_update' | 'cart_update';
  payload: any;
  timestamp: Date;
  id: string;
}

export interface ConnectionStatus {
  connected: boolean;
  lastConnected?: Date;
  lastDisconnected?: Date;
  retryCount: number;
  error?: string;
}