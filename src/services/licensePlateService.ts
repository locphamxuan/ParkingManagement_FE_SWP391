import { api } from './apiClient';

export interface PlateRecord {
  _id?: string;
  plateNumber: string;
  vehicleType: 'car' | 'motorcycle';
  brand?: string | null;
  isDefault?: boolean;
  // Opaque per-plate QR token (PLT-...). Staff scan this with Camera 2 to identify the vehicle.
  qrCode?: string;
}

interface LicensePlateResponse {
  data?: {
    licensePlates?: PlateRecord[];
  };
}

/**
 * List all license plates for the current authenticated user.
 */
export async function listPlates(): Promise<PlateRecord[]> {
  const res = await api.get<LicensePlateResponse>('/users/license-plates');
  return (res?.data?.licensePlates ?? []) as PlateRecord[];
}

/**
 * Add a new plate for the current user.
 * Returns the updated list of all plates.
 */
export async function addPlate(
  plateNumber: string,
  vehicleType: 'car' | 'motorcycle',
  brand?: string | null
): Promise<PlateRecord[]> {
  const res = await api.post<LicensePlateResponse>('/users/license-plates', {
    plateNumber: plateNumber.trim().toUpperCase(),
    vehicleType,
    brand: brand || null,
  });
  return (res?.data?.licensePlates ?? []) as PlateRecord[];
}

/**
 * Remove a plate by its MongoDB ObjectId.
 * Returns the updated list of all plates.
 */
export async function removePlate(plateId: string): Promise<PlateRecord[]> {
  const res = await api.delete<LicensePlateResponse>(`/users/license-plates/${plateId}`);
  return (res?.data?.licensePlates ?? []) as PlateRecord[];
}

/**
 * Sync a desired set of plates against the backend.
 * Figures out which ones to add (new) and which ones to remove (deleted).
 * Returns the final up-to-date plate list from the server.
 */
export async function syncPlates(
  currentServerPlates: PlateRecord[],
  desiredPlates: Array<{ plateNumber: string; vehicleType: 'car' | 'motorcycle'; brand?: string | null }>
): Promise<PlateRecord[]> {
  const normalizedDesired = desiredPlates.map((p) => ({
    plateNumber: p.plateNumber.trim().toUpperCase(),
    vehicleType: p.vehicleType,
    brand: p.brand ?? null,
  }));

  // Plates on server that are NOT in the desired list → remove them
  const platesToRemove = currentServerPlates.filter(
    (sp) => !normalizedDesired.some((dp) => dp.plateNumber === sp.plateNumber.trim().toUpperCase())
  );

  // Plates in desired list that are NOT on server → add them
  const platesToAdd = normalizedDesired.filter(
    (dp) => !currentServerPlates.some((sp) => sp.plateNumber.trim().toUpperCase() === dp.plateNumber)
  );

  // Collect failures so the caller can surface them (don't silently swallow —
  // a swallowed add error makes the UI show a plate that was never saved).
  const errors: string[] = [];

  // Perform removals
  for (const plate of platesToRemove) {
    if (plate._id) {
      try {
        await removePlate(plate._id);
      } catch (err) {
        errors.push(`Xoá ${plate.plateNumber}: ${err instanceof Error ? err.message : 'lỗi'}`);
      }
    }
  }

  // Perform additions
  let latestPlates: PlateRecord[] = currentServerPlates;
  for (const plate of platesToAdd) {
    try {
      latestPlates = await addPlate(plate.plateNumber, plate.vehicleType, plate.brand);
    } catch (err) {
      errors.push(`Thêm ${plate.plateNumber}: ${err instanceof Error ? err.message : 'lỗi'}`);
    }
  }

  // Re-fetch the final list to ensure consistency
  try {
    latestPlates = await listPlates();
  } catch {
    // Keep last known state if re-fetch fails
  }

  if (errors.length) {
    throw new Error(`Đồng bộ biển số thất bại — ${errors.join('; ')}`);
  }

  return latestPlates;
}
