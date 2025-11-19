import {
  AdjustInventoryRequest,
  CreateInventoryRequest,
  CreateUserRequest,
  InventoryFilters,
  InventoryListResponse,
  InventoryRecord,
  InventoryUpdateEvent,
  LoginRequest,
  LoginResponse,
  PaginatedUsersResponse,
  PasswordChangeRequest,
  SKU,
  SKUListFilters,
  SKUListResponse,
  SKURequestBody,
  Store,
  StoreListResponse,
  StoreStaffAssociation,
  StoreStaffListResponse,
  UpdateInventoryRequest,
  UpdateUserRequest,
  User,
} from '@/lib/types';
import { API_BASE_URL } from '@/lib/config';

const jsonHeaders = {
  'Content-Type': 'application/json',
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const payload = await response.json();
      if (payload?.message) {
        message = payload.message;
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

function buildQuery(params: Record<string, string | number | boolean | undefined | null>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export async function loginRequest(body: LoginRequest, baseUrl = API_BASE_URL): Promise<LoginResponse> {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  return handleResponse<LoginResponse>(response);
}

export type ApiClient = ReturnType<typeof createApiClient>;

export function createApiClient(token: string | null, baseUrl = API_BASE_URL) {
  async function authedFetch<T>(path: string, init: RequestInit = {}) {
    if (!token) {
      throw new Error('You must be authenticated to call this endpoint.');
    }

    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        ...jsonHeaders,
        ...(init.headers || {}),
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    return handleResponse<T>(response);
  }

  return {
    // Profile
    getProfile: () => authedFetch<User>('/api/profile'),
    changePassword: (body: PasswordChangeRequest) =>
      authedFetch<{ message: string }>('/api/profile/password', {
        method: 'PUT',
        body: JSON.stringify(body),
      }),

    // Users
    listUsers: (params: { page?: number; limit?: number } = {}) =>
      authedFetch<PaginatedUsersResponse>(`/api/manager/users${buildQuery(params as Record<string, string | number | boolean | undefined | null>)}`),
    createUser: (body: CreateUserRequest) =>
      authedFetch<User>('/api/manager/users', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateUser: (body: UpdateUserRequest) =>
      authedFetch<User>('/api/manager/users', {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    deleteUser: (id: string) =>
      authedFetch<{ message: string }>(`/api/manager/users/${id}`, {
        method: 'DELETE',
      }),

    // Stores
    listStores: () => authedFetch<StoreListResponse>('/api/manager/stores'),
    createStore: (body: { name: string; address: string }) =>
      authedFetch<Store>('/api/manager/stores', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    deleteStore: (id: string) =>
      authedFetch<{ message: string }>(`/api/manager/stores/${id}`, {
        method: 'DELETE',
      }),

    // Store Staff
    listStoreStaff: (storeId: string) =>
      authedFetch<StoreStaffListResponse>(`/api/manager/stores/staff${buildQuery({ store_id: storeId } as Record<string, string | number | boolean | undefined | null>)}`),
    addStaffToStore: (body: { store_id: string; user_id: string }) =>
      authedFetch<StoreStaffAssociation>('/api/manager/stores/staff', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    deleteStaffFromStore: (id: string) =>
      authedFetch<{ message: string }>(`/api/manager/stores/staff/${id}`, {
        method: 'DELETE',
      }),

    // SKUs (read operations available to all authenticated users)
    listSkus: (filters: SKUListFilters = {}) =>
      authedFetch<SKUListResponse>(`/api/skus${buildQuery(filters as Record<string, string | number | boolean | undefined | null>)}`),
    listSkuCategories: () => authedFetch<{ categories: string[] }>('/api/skus/categories'),
    getSku: (id: string) => authedFetch<SKU>(`/api/skus/${id}`),
    createSku: (body: SKURequestBody) =>
      authedFetch<SKU>('/api/manager/skus', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateSku: (id: string, body: Partial<SKURequestBody>) =>
      authedFetch<SKU>(`/api/manager/skus/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    deleteSku: (id: string) =>
      authedFetch<{ message: string }>(`/api/manager/skus/${id}`, {
        method: 'DELETE',
      }),

    // Inventory
    listInventory: (filters: InventoryFilters = {}) =>
      authedFetch<InventoryListResponse>(`/api/inventory${buildQuery(filters as Record<string, string | number | boolean | undefined | null>)}`),
    getInventoryById: (id: string) => authedFetch<InventoryRecord>(`/api/inventory/${id}`),
    createInventory: (body: CreateInventoryRequest) =>
      authedFetch<InventoryRecord>('/api/manager/inventory', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateInventory: (id: string, body: UpdateInventoryRequest) =>
      authedFetch<InventoryRecord>(`/api/manager/inventory/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    deleteInventory: (id: string) =>
      authedFetch<{ message: string }>(`/api/manager/inventory/${id}`, {
        method: 'DELETE',
      }),
    adjustInventory: (id: string, body: AdjustInventoryRequest) =>
      authedFetch<InventoryRecord>(`/api/inventory/${id}/adjust`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  };
}

export type InventoryEventHandler = (event: InventoryUpdateEvent) => void;

