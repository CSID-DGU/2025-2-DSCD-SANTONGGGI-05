import type { ApiClientConfig, ApiResponse, RequestConfig } from '@/types';

const DEFAULT_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT ?? 120000);
const DEFAULT_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? `${window.location.origin}/api`;

const defaultConfig: ApiClientConfig = {
  baseURL: DEFAULT_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  retries: 0,
  retryDelay: 500
};

const buildUrl = (baseURL: string, url: string, params?: Record<string, any>): string => {
  const sanitizedBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
  const sanitizedPath = url.startsWith('/') ? url : `/${url}`;
  const target = new URL(`${sanitizedBase}${sanitizedPath}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      target.searchParams.append(key, String(value));
    });
  }

  return target.toString();
};

const createAbortSignal = (timeout: number): AbortController => {
  const controller = new AbortController();
  if (timeout <= 0) {
    return controller;
  }

  const timeoutId = setTimeout(() => controller.abort(), timeout);
  controller.signal.addEventListener('abort', () => clearTimeout(timeoutId));

  return controller;
};

const parseResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  let body: any = null;

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      body = await response.json();
    } catch {
      body = null;
    }
  } else {
    body = await response.text();
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    if (body && typeof body === 'object') {
      if ('message' in body && typeof body.message === 'string') {
        message = String(body.message);
      } else if ('detail' in body) {
        const detail = (body as any).detail;
        if (typeof detail === 'string') {
          message = detail;
        } else if (Array.isArray(detail) && detail.length > 0) {
          const first = detail[0];
          if (typeof first === 'string') {
            message = first;
          } else if (first && typeof first === 'object' && 'msg' in first) {
            message = String(first.msg);
          }
        }
      }
    }

    return {
      success: false,
      error: message,
      message,
      data: body ?? undefined
    };
  }

  return {
    success: true,
    data: body as T
  };
};

const request = async <T>(config: RequestConfig): Promise<ApiResponse<T>> => {
  const {
    method,
    url,
    data,
    params,
    headers,
    timeout,
  } = config;

  const endpoint = buildUrl(defaultConfig.baseURL, url, params);
  const controller = createAbortSignal(timeout ?? defaultConfig.timeout);

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers
  };

  let body: BodyInit | null = null;
  if (data !== undefined && data !== null) {
    body = JSON.stringify(data);
  }

  try {
    const requestInit: RequestInit = {
      method,
      headers: finalHeaders,
      signal: controller.signal,
      credentials: 'include',
      ...(body !== null ? { body } : {})
    };

    const response = await fetch(endpoint, requestInit);

    return await parseResponse<T>(response);
  } catch (error: any) {
    const message = error?.name === 'AbortError'
      ? '요청 시간이 초과되었습니다.'
      : error?.message ?? '요청 중 오류가 발생했습니다.';

    return {
      success: false,
      error: message,
      message
    };
  }
};

export const apiClient = {
  get: async <T>(url: string, params?: Record<string, any>, config: Partial<RequestConfig> = {}) => {
    const baseConfig: RequestConfig = {
      method: 'GET',
      url
    };

    if (params !== undefined) {
      baseConfig.params = params;
    }

    Object.entries(config).forEach(([key, value]) => {
      if (value !== undefined) {
        (baseConfig as Record<string, any>)[key] = value;
      }
    });

    return request<T>(baseConfig);
  },

  post: async <T>(url: string, data?: any, config: Partial<RequestConfig> = {}) => {
    return request<T>({
      method: 'POST',
      url,
      data,
      ...config
    });
  },

  put: async <T>(url: string, data?: any, config: Partial<RequestConfig> = {}) => {
    return request<T>({
      method: 'PUT',
      url,
      data,
      ...config
    });
  },

  delete: async <T>(url: string, params?: Record<string, any>, config: Partial<RequestConfig> = {}) => {
    const baseConfig: RequestConfig = {
      method: 'DELETE',
      url
    };

    if (params !== undefined) {
      baseConfig.params = params;
    }

    Object.entries(config).forEach(([key, value]) => {
      if (value !== undefined) {
        (baseConfig as Record<string, any>)[key] = value;
      }
    });

    return request<T>(baseConfig);
  }
};
