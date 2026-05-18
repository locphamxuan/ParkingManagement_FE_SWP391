import api from '@/lib/axios';

/**
 * Danh sách bãi đang hoạt động (API: GET /users/buildings).
 * @param {{ status?: string, page?: number, limit?: number }} [params]
 */
export async function getBuildings(params = {}) {
  const { data } = await api.get('/users/buildings', { params });
  return data;
}

/**
 * Chi tiết một tòa nhà / bãi (API: GET /users/buildings/:id).
 * @param {string} buildingId
 */
export async function getBuildingById(buildingId) {
  const { data } = await api.get(`/users/buildings/${buildingId}`);
  return data;
}

/**
 * Tầng và loại xe của bãi (API: GET /users/buildings/:id/floors).
 * @param {string} buildingId
 */
export async function getBuildingFloors(buildingId) {
  const { data } = await api.get(`/users/buildings/${buildingId}/floors`);
  return data;
}

/**
 * Tra cứu ô trống (API: GET /users/buildings/:id/slots).
 * @param {string} buildingId
 * @param {{ floorId?: string, vehicleType?: string }} [params]
 */
export async function getBuildingSlots(buildingId, params = {}) {
  const { data } = await api.get(`/users/buildings/${buildingId}/slots`, { params });
  return data;
}
