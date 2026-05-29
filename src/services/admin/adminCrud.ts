import { requestJson } from '@/services/pbmsApi';

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface CreateAdminUserInput {
  fullName: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'staff' | 'user';
  phone?: string;
}

export interface UpdateAdminUserInput {
  fullName?: string;
  role?: 'admin' | 'manager' | 'staff' | 'user';
  phone?: string;
}

export interface CreateBuildingInput {
  name: string;
  code: string;
  totalFloors: number;
  hourlyRate: number;
  fullAddress?: string;
}

export interface UpdateBuildingInput {
  name?: string;
  code?: string;
  totalFloors?: number;
  status?: 'active' | 'inactive' | 'maintenance';
  fullAddress?: string;
}

export async function createAdminUser(token: string, payload: CreateAdminUserInput): Promise<void> {
  await requestJson<ApiEnvelope<{ user: unknown }>>({
    path: '/admin/users',
    method: 'POST',
    token,
    body: payload,
  });
}

export async function updateAdminUser(token: string, userId: string, payload: UpdateAdminUserInput): Promise<void> {
  await requestJson<ApiEnvelope<{ user: unknown }>>({
    path: `/admin/users/${userId}`,
    method: 'PUT',
    token,
    body: payload,
  });
}

export async function updateAdminUserStatus(token: string, userId: string, isActive: boolean): Promise<void> {
  await requestJson<ApiEnvelope<{ user: unknown }>>({
    path: `/admin/users/${userId}/status`,
    method: 'PATCH',
    token,
    body: { isActive },
  });
}

export async function deleteAdminUser(token: string, userId: string): Promise<void> {
  await requestJson<ApiEnvelope<null>>({
    path: `/admin/users/${userId}`,
    method: 'DELETE',
    token,
  });
}

export async function createBuilding(token: string, payload: CreateBuildingInput): Promise<void> {
  await requestJson<ApiEnvelope<{ building: unknown }>>({
    path: '/admin/buildings',
    method: 'POST',
    token,
    body: {
      name: payload.name,
      code: payload.code,
      totalFloors: Number(payload.totalFloors),
      pricing: {
        hourlyRate: Number(payload.hourlyRate),
      },
      operatingHours: {
        open: '06:00',
        close: '22:00',
      },
      address: {
        fullAddress: payload.fullAddress || '',
      },
      status: 'active',
    },
  });
}

export async function updateBuilding(token: string, buildingId: string, payload: UpdateBuildingInput): Promise<void> {
  const body: Record<string, unknown> = {};

  if (payload.name !== undefined) body.name = payload.name;
  if (payload.code !== undefined) body.code = payload.code;
  if (payload.totalFloors !== undefined) body.totalFloors = Number(payload.totalFloors);
  if (payload.status !== undefined) body.status = payload.status;
  if (payload.fullAddress !== undefined) {
    body.address = { fullAddress: payload.fullAddress };
  }

  await requestJson<ApiEnvelope<{ building: unknown }>>({
    path: `/admin/buildings/${buildingId}`,
    method: 'PUT',
    token,
    body,
  });
}

export async function updateBuildingStatus(
  token: string,
  buildingId: string,
  status: 'active' | 'inactive' | 'maintenance'
): Promise<void> {
  await requestJson<ApiEnvelope<{ building: unknown }>>({
    path: `/admin/buildings/${buildingId}/status`,
    method: 'PATCH',
    token,
    body: { status },
  });
}

export async function deleteBuilding(token: string, buildingId: string): Promise<void> {
  await requestJson<ApiEnvelope<null>>({
    path: `/admin/buildings/${buildingId}`,
    method: 'DELETE',
    token,
  });
}
