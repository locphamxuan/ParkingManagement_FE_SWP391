import { requestJson } from '@/services/pbmsApi';

interface ApiResponse<T> {
  data: T;
}

export interface ManagerBuildingRecord {
  _id: string;
  name: string;
  code?: string;
  status?: string;
  totalFloors?: number;
  address?: { fullAddress?: string };
  manager?: string;
  [key: string]: unknown;
}

export interface ManagerOverviewData {
  slots: { total: number; occupied?: number; occupancyRate?: number; [key: string]: unknown };
  floors: number;
  gates: number;
  sessions: { active: number; today: number };
  subscriptions: { active: number };
  feedbacks: { pending: number };
  revenue: { today: number; weekly?: Array<{ date: string; revenue: number; sessions: number }>; [key: string]: unknown };
}

export const managerApi = {
  async getAssignedBuildings(token?: string): Promise<ManagerBuildingRecord[]> {
    const response = await requestJson<ApiResponse<ManagerBuildingRecord[]>>({
      path: '/manager/buildings',
      token,
    });
    return response.data ?? [];
  },

  async updateBuilding(
    buildingId: string,
    payload: Record<string, unknown>,
    token?: string,
  ): Promise<ManagerBuildingRecord> {
    const response = await requestJson<ApiResponse<ManagerBuildingRecord>>({
      path: `/manager/buildings/${buildingId}`,
      method: 'PUT',
      token,
      body: payload,
    });
    return response.data;
  },

  async getBuildingDashboard(
    buildingId: string,
    token?: string,
  ): Promise<ManagerOverviewData> {
    const response = await requestJson<ApiResponse<ManagerOverviewData>>({
      path: `/manager/buildings/${buildingId}/dashboard`,
      token,
    });
    return response.data;
  },

  async listVehicleTypes(
    buildingId: string,
    token?: string,
  ): Promise<Array<{ _id: string; name: string; description?: string; [key: string]: unknown }>> {
    const response = await requestJson<ApiResponse<{ items: Array<{ _id: string; name: string; description?: string }> }>>({
      path: `/manager/buildings/${buildingId}/vehicle-types`,
      token,
    });
    return response.data?.items ?? [];
  },

  async createVehicleType(
    buildingId: string,
    payload: Record<string, unknown>,
    token?: string,
  ): Promise<{ _id: string; name: string }> {
    const response = await requestJson<ApiResponse<{ item: { _id: string; name: string } }>>({
      path: `/manager/buildings/${buildingId}/vehicle-types`,
      method: 'POST',
      token,
      body: payload,
    });
    return response.data?.item as { _id: string; name: string };
  },

  async removeVehicleType(
    buildingId: string,
    typeId: string,
    token?: string,
  ): Promise<void> {
    await requestJson({
      path: `/manager/buildings/${buildingId}/vehicle-types/${typeId}`,
      method: 'DELETE',
      token,
    });
  },

  async listFeedbacks(
    buildingId: string,
    token?: string,
  ): Promise<Array<{ _id: string; subject?: string; status?: string; createdAt?: string; comment?: string; [key: string]: unknown }>> {
    const response = await requestJson<ApiResponse<{ items: Array<{ _id: string; subject?: string; status?: string; createdAt?: string; comment?: string }> }>>({
      path: `/manager/buildings/${buildingId}/feedbacks`,
      token,
    });
    return response.data?.items ?? [];
  },

  async respondFeedback(
    buildingId: string,
    feedbackId: string,
    payload: { response: string },
    token?: string,
  ): Promise<void> {
    await requestJson({
      path: `/manager/buildings/${buildingId}/feedbacks/${feedbackId}`,
      method: 'PATCH',
      token,
      body: payload,
    });
  },
};
