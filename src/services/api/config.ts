/**
 * Iris Mobile BFF API Configuration
 * Derived from mobile-openapi.json
 */

export const API_BASE_URL =
    'https://4xx1pqey53.execute-api.ap-south-1.amazonaws.com/suite-network-dev';

// Default Tenant UUID used across multi-tenant endpoints
export const DEFAULT_TENANT_ID = 'e7b8c2d1-9f3a-4b5c-8d1e-2f3a4b5c6d7e';

export const API_TIMEOUT_MS = 15000;

let currentAuthToken: string | null = null;
let currentTenantId: string = DEFAULT_TENANT_ID;

export const ApiConfig = {
    getBaseUrl(): string {
        return API_BASE_URL;
    },

    getAuthToken(): string | null {
        return currentAuthToken;
    },

    setAuthToken(token: string | null) {
        currentAuthToken = token;
    },

    getTenantId(): string {
        return currentTenantId;
    },

    setTenantId(tenantId: string) {
        currentTenantId = tenantId;
    },
};
