import { describe, it, expect } from 'vitest';
import { getApiErrorCode, resolveErrorMessage } from '@/utils/apiErrors';
import { ApiError } from '@/services/client/apiClient';

// Tạo ApiError giả lập response từ BE
function makeApiError(code: string, message = 'backend error', status = 400): ApiError {
  return new ApiError(message, status, { success: false, message, code });
}

describe('getApiErrorCode', () => {
  it('trả về code từ ApiError payload', () => {
    const err = makeApiError('BUILDING_NO_SLOTS');
    expect(getApiErrorCode(err)).toBe('BUILDING_NO_SLOTS');
  });

  it('trả về undefined khi không phải ApiError', () => {
    expect(getApiErrorCode(new Error('plain error'))).toBeUndefined();
  });

  it('trả về undefined khi err là null/undefined', () => {
    expect(getApiErrorCode(null)).toBeUndefined();
    expect(getApiErrorCode(undefined)).toBeUndefined();
  });

  it('trả về undefined khi payload không có code', () => {
    const err = new ApiError('msg', 400, { success: false });
    expect(getApiErrorCode(err)).toBeUndefined();
  });
});

describe('resolveErrorMessage', () => {
  it('map BUILDING_NO_SLOTS → English message', () => {
    const err = makeApiError('BUILDING_NO_SLOTS');
    const msg = resolveErrorMessage(err);
    expect(msg).toContain('no parking slots configured');
  });

  it('map BUILDING_FULLY_BOOKED → English message', () => {
    const err = makeApiError('BUILDING_FULLY_BOOKED');
    const msg = resolveErrorMessage(err);
    expect(msg).toContain('fully booked');
  });

  it('map VEHICLE_CURRENTLY_PARKED → English message', () => {
    const err = makeApiError('VEHICLE_CURRENTLY_PARKED');
    const msg = resolveErrorMessage(err);
    expect(msg).toContain('currently parked inside');
  });

  it('map CANCELLATION_WINDOW_EXPIRED → English message', () => {
    const err = makeApiError('CANCELLATION_WINDOW_EXPIRED');
    const msg = resolveErrorMessage(err);
    expect(msg).toContain('3 days');
  });

  it('map PLATE_RECENTLY_CANCELLED → English message', () => {
    const err = makeApiError('PLATE_RECENTLY_CANCELLED');
    const msg = resolveErrorMessage(err);
    expect(msg).toContain('24 hours');
  });

  it('fallback về err.message khi code không có trong map', () => {
    const err = makeApiError('UNKNOWN_CODE', 'custom backend message');
    expect(resolveErrorMessage(err)).toBe('custom backend message');
  });

  it('fallback về err.message khi là Error thường', () => {
    const err = new Error('generic error');
    expect(resolveErrorMessage(err)).toBe('generic error');
  });

  it('dùng default fallback khi không phải Error', () => {
    expect(resolveErrorMessage('string error')).toBe('An unexpected error occurred.');
    expect(resolveErrorMessage(null)).toBe('An unexpected error occurred.');
  });

  it('dùng custom fallback khi truyền vào', () => {
    expect(resolveErrorMessage(null, 'Custom fallback')).toBe('Custom fallback');
  });
});
