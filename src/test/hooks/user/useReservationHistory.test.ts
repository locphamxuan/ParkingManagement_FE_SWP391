import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useReservationHistory } from '@/hooks/user/useReservationHistory';

// Mock toàn bộ userApi để không gọi network thật
vi.mock('@/services/user/userApi', () => ({
  userApi: {
    reservations: {
      list: vi.fn(),
      cancel: vi.fn(),
    },
  },
}));

// Mock window.confirm và window.alert để tránh jsdom throw
vi.stubGlobal('confirm', vi.fn(() => true));
vi.stubGlobal('alert', vi.fn());

import { userApi } from '@/services/user/userApi';

// Helper tạo reservation giả
function makeReservation(id: string, status = 'pending') {
  return {
    _id: id,
    status,
    building: { _id: 'b1', name: 'Building A' },
    vehicleType: { _id: 'v1', name: 'Car' },
    plateNumber: '51A-123.45',
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    estimatedFee: 50000,
    fee: 7500,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function makeListResponse(items: unknown[], total = items.length) {
  return {
    data: {
      items,
      pagination: { totalPages: Math.ceil(total / 10), total, page: 1, limit: 10 },
    },
  };
}

describe('useReservationHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('load items thành công khi mount', async () => {
    const items = [makeReservation('r1'), makeReservation('r2')];
    vi.mocked(userApi.reservations.list).mockResolvedValue(makeListResponse(items));

    const { result } = renderHook(() => useReservationHistory());

    // Ban đầu đang loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.items).toHaveLength(2);
    expect(result.current.error).toBeNull();
    expect(result.current.totalPages).toBe(1);
  });

  it('set error khi API fail', async () => {
    vi.mocked(userApi.reservations.list).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useReservationHistory());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Network error');
    expect(result.current.items).toHaveLength(0);
  });

  it('reload khi statusFilter thay đổi', async () => {
    vi.mocked(userApi.reservations.list).mockResolvedValue(makeListResponse([]));

    const { result } = renderHook(() => useReservationHistory());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Lần đầu gọi với status=undefined (all)
    expect(vi.mocked(userApi.reservations.list)).toHaveBeenCalledWith(
      expect.objectContaining({ status: undefined }),
    );

    // Đổi filter sang 'pending'
    act(() => result.current.setStatusFilter('pending'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(vi.mocked(userApi.reservations.list)).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'pending' }),
    );
  });

  it('handleCancel: cập nhật status item thành cancelled', async () => {
    const items = [makeReservation('r1', 'pending'), makeReservation('r2', 'pending')];
    vi.mocked(userApi.reservations.list).mockResolvedValue(makeListResponse(items));
    vi.mocked(userApi.reservations.cancel).mockResolvedValue(undefined);

    const { result } = renderHook(() => useReservationHistory());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleCancel('r1');
    });

    const cancelled = result.current.items.find((r) => r._id === 'r1');
    expect(cancelled?.status).toBe('cancelled');
    // r2 không bị ảnh hưởng
    expect(result.current.items.find((r) => r._id === 'r2')?.status).toBe('pending');
  });

  it('handleCancel: không làm gì khi confirm trả về false', async () => {
    vi.mocked(window.confirm).mockReturnValueOnce(false);
    vi.mocked(userApi.reservations.list).mockResolvedValue(
      makeListResponse([makeReservation('r1')]),
    );

    const { result } = renderHook(() => useReservationHistory());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleCancel('r1');
    });

    expect(userApi.reservations.cancel).not.toHaveBeenCalled();
    // Status không đổi
    expect(result.current.items[0].status).toBe('pending');
  });

  it('handleCancel: set cancellingId trong khi đang cancel', async () => {
    let resolve!: () => void;
    vi.mocked(userApi.reservations.list).mockResolvedValue(
      makeListResponse([makeReservation('r1')]),
    );
    vi.mocked(userApi.reservations.cancel).mockReturnValue(
      new Promise<void>((res) => { resolve = res; }),
    );

    const { result } = renderHook(() => useReservationHistory());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => { result.current.handleCancel('r1'); });

    await waitFor(() => expect(result.current.cancellingId).toBe('r1'));

    // Resolve promise → cancellingId phải trở về null
    await act(async () => { resolve(); });

    expect(result.current.cancellingId).toBeNull();
  });

  it('refresh gọi lại load với page và filter hiện tại', async () => {
    vi.mocked(userApi.reservations.list).mockResolvedValue(makeListResponse([]));

    const { result } = renderHook(() => useReservationHistory());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const callCount = vi.mocked(userApi.reservations.list).mock.calls.length;

    act(() => { result.current.refresh(); });

    await waitFor(() =>
      expect(vi.mocked(userApi.reservations.list).mock.calls.length).toBeGreaterThan(callCount),
    );
  });
});
