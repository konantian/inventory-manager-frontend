export type UserRole = 'manager' | 'staff';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface PasswordChangeRequest {
  old_password: string;
  new_password: string;
}

export interface PaginatedUsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  target_id: string;
  username?: string;
  email?: string;
  role?: UserRole;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export interface StoreListResponse {
  items: Store[];
}

export interface StoreStaffListResponse {
  store_id: string;
  staff: User[];
}

export interface StoreStaffAssociation {
  id: string;
  store_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  user: User;
  store: Store;
}

export interface SKU {
  id: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface SKUListResponse {
  items: SKU[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface SKURequestBody {
  name: string;
  category: string;
  description?: string;
  price: number;
}

export interface InventoryRecord {
  id: string;
  sku_id: string;
  store_id: string;
  quantity: number;
  version: number;
  sku?: SKU;
  store?: Store;
  created_at: string;
  updated_at: string;
}

export interface InventoryListResponse {
  items: InventoryRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CreateInventoryRequest {
  sku_id: string;
  store_id: string;
  quantity: number;
}

export interface UpdateInventoryRequest {
  quantity: number;
}

export interface AdjustInventoryRequest {
  delta_quantity: number;
}

export interface InventoryUpdateEvent {
  id: string;
  operation_type: 'create' | 'update' | 'adjust' | 'delete';
  sender_instance_id: string;
  inventory_id: string;
  sku_id: string;
  sku_name: string;
  store_id: string;
  store_name: string;
  user_id: string;
  user_name: string;
  delta_quantity: number;
  new_quantity: number;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryFilters {
  store_id?: string;
  sku_id?: string;
  page?: number;
  page_size?: number;
  sort_by?: 'quantity' | 'created_at' | 'updated_at';
  order?: 'asc' | 'desc';
}

export interface SKUListFilters {
  page?: number;
  page_size?: number;
  search?: string;
  category?: string;
  sort_by?: 'name' | 'category' | 'price' | 'created_at' | 'updated_at';
  order?: 'asc' | 'desc';
}

