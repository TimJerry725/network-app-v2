/**
 * Iris Mobile BFF Centralized HTTP Client
 * Implements fetch with Bearer token authentication, timeout, and envelope handling
 */

import { ApiConfig, API_TIMEOUT_MS } from './config';
import { ApiResponse, ErrorResponse } from './types';

export class ApiError extends Error {
    public code: number;
    public details?: any;

    constructor(message: string, code: number = 500, details?: any) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.details = details;
    }
}

interface RequestOptions extends RequestInit {
    params?: Record<string, string | number | boolean | undefined | null>;
    requiresAuth?: boolean;
    tenantId?: string;
    timeoutMs?: number;
}

async function request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const {
        params,
        requiresAuth = false,
        tenantId,
        timeoutMs = API_TIMEOUT_MS,
        headers: customHeaders,
        ...fetchOptions
    } = options;

    let url = endpoint.startsWith('http') ? endpoint : `${ApiConfig.getBaseUrl()}${endpoint}`;

    // Append query parameters
    if (params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, val]) => {
            if (val !== undefined && val !== null) {
                searchParams.append(key, String(val));
            }
        });
        const qs = searchParams.toString();
        if (qs) {
            url += (url.includes('?') ? '&' : '?') + qs;
        }
    }

    const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(customHeaders as Record<string, string>),
    };

    const token = ApiConfig.getAuthToken();
    if (requiresAuth && token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const effectiveTenantId = tenantId || ApiConfig.getTenantId();
    if (effectiveTenantId && !headers['tenantid']) {
        headers['tenantid'] = effectiveTenantId;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            headers,
            signal: controller.signal,
        });

        clearTimeout(timer);

        const contentType = response.headers.get('content-type') || '';
        const isJson = contentType.includes('application/json');

        const rawData = isJson ? await response.json() : await response.text();

        if (!response.ok) {
            const errObj = isJson ? (rawData as ErrorResponse) : null;
            const msg = errObj?.message || `HTTP ${response.status}: ${response.statusText}`;
            throw new ApiError(msg, response.status, errObj?.details);
        }

        // Unpack standard ApiResponse envelope if present
        if (isJson && typeof rawData === 'object' && rawData !== null && 'data' in rawData) {
            const apiRes = rawData as ApiResponse<T>;
            if (apiRes.error) {
                throw new ApiError(apiRes.message || 'API request returned an error', apiRes.code || response.status);
            }
            return apiRes.data as T;
        }

        return rawData as T;
    } catch (err: any) {
        clearTimeout(timer);
        if (err.name === 'AbortError') {
            throw new ApiError(`Request timeout after ${timeoutMs}ms`, 408);
        }
        if (err instanceof ApiError) {
            throw err;
        }
        throw new ApiError(err.message || 'Network request failed', 0);
    }
}

export const apiClient = {
    get<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
        return request<T>(endpoint, { ...options, method: 'GET' });
    },

    post<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
        return request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        });
    },

    put<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
        return request<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
        });
    },

    patch<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
        return request<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: body ? JSON.stringify(body) : undefined,
        });
    },

    delete<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
        return request<T>(endpoint, { ...options, method: 'DELETE' });
    },
};
