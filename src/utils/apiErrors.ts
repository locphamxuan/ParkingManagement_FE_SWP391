import { ApiError } from '@/services/client/apiClient';

/** Trích xuất error code từ BE response payload (vd: 'BUILDING_NO_SLOTS'). */
export function getApiErrorCode(err: unknown): string | undefined {
  if (err instanceof ApiError && err.payload && typeof err.payload === 'object') {
    return (err.payload as { code?: string }).code;
  }
  return undefined;
}

/** Map error code → English message; fallback về err.message hoặc default. */
export function resolveErrorMessage(err: unknown, fallback = 'An unexpected error occurred.'): string {
  const code = getApiErrorCode(err);
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  return err instanceof Error ? err.message : fallback;
}

const ERROR_MESSAGES: Record<string, string> = {
  // Reservation creation
  BUILDING_NO_SLOTS:
    'This building has no parking slots configured yet. Please try another location.',
  BUILDING_FULLY_BOOKED:
    'This building is fully booked for the selected time window. Please choose a different time.',
  PLATE_RECENTLY_CANCELLED:
    'This plate recently cancelled a reservation. Please wait 24 hours before re-booking at the same building.',
  CANCELLATION_CUTOFF_PASSED:
    'Cancellation deadline has passed — you must cancel at least the required number of hours before your reserved time.',
  INSUFFICIENT_WALLET_BALANCE:
    'Insufficient wallet balance. Please top up and try again.',

  // Long-term subscription
  VEHICLE_CURRENTLY_PARKED:
    'Cannot cancel: your vehicle is currently parked inside. Please exit the parking lot first.',
  CANCELLATION_WINDOW_EXPIRED:
    'Self-cancellation window (3 days from start date) has expired. Please contact the building admin for assistance.',

  // General
  FORBIDDEN_BUILDING_SCOPE: 'You do not have access to this building.',
  USER_FEEDBACK_ONLY: 'Only registered users can submit feedback.',
};
