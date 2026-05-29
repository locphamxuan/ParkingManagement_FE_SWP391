import { api } from './apiClient';

export interface PlateRecord {
  _id?: string;
  plateNumber: string;
  vehicleType: 'car' | 'motorcycle';
  isDefault?: boolean;
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
export async function addPlate(plateNumber: string, vehicleType: 'car' | 'motorcycle'): Promise<PlateRecord[]> {
  const res = await api.post<LicensePlateResponse>('/users/license-plates', {
    plateNumber: plateNumber.trim().toUpperCase(),
    vehicleType,
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
  desiredPlates: Array<{ plateNumber: string; vehicleType: 'car' | 'motorcycle' }>
): Promise<PlateRecord[]> {
  const normalizedDesired = desiredPlates.map((p) => ({
    plateNumber: p.plateNumber.trim().toUpperCase(),
    vehicleType: p.vehicleType,
  }));

  // Plates on server that are NOT in the desired list → remove them
  const platesToRemove = currentServerPlates.filter(
    (sp) => !normalizedDesired.some((dp) => dp.plateNumber === sp.plateNumber.trim().toUpperCase())
  );

  // Plates in desired list that are NOT on server → add them
  const platesToAdd = normalizedDesired.filter(
    (dp) => !currentServerPlates.some((sp) => sp.plateNumber.trim().toUpperCase() === dp.plateNumber)
  );

  // Perform removals
  for (const plate of platesToRemove) {
    if (plate._id) {
      try {
        await removePlate(plate._id);
      } catch (err) {
        console.error(`[licensePlateService] Failed to remove plate ${plate.plateNumber}:`, err);
      }
    }
  }

  // Perform additions
  let latestPlates: PlateRecord[] = currentServerPlates;
  for (const plate of platesToAdd) {
    try {
      latestPlates = await addPlate(plate.plateNumber, plate.vehicleType);
    } catch (err) {
      console.error(`[licensePlateService] Failed to add plate ${plate.plateNumber}:`, err);
    }
  }

  // Re-fetch the final list to ensure consistency
  try {
    latestPlates = await listPlates();
  } catch {
    // Keep last known state if re-fetch fails
  }

  return latestPlates;
}
