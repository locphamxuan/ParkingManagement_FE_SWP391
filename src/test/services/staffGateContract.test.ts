import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { staffApi } from '@/services/staff/staffApi';

/**
 * Hợp đồng của ba lệnh gọi ở CỔNG. Cả ba từng lệch khỏi backend một cách im lặng
 * — request vẫn gửi đi, chỉ là server trả 400 rồi FE nuốt lỗi, nên không test nào
 * đỏ và không ai thấy. Những khẳng định dưới đây cố ý bám vào đúng các quy tắc mà
 * backend thực sự cưỡng chế:
 *
 *  - `tests/integration/security/scanGuard.test.js` — "rejects a bare base64
 *    string with no data-URL prefix" và mọi ca test đều gửi kèm `building`.
 *  - `services/staff/parkingSession/query.service.js` — `scanVehicle`/`lookupPlate`
 *    ném BUILDING_REQUIRED khi thiếu tòa nhà.
 */

const BUILDING = '652f1c9e5b1a2c0012345678';
const JPEG_DATA_URL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ';

let fetchMock: ReturnType<typeof vi.fn>;

const lastCall = () => {
  const calls = fetchMock.mock.calls;
  const [url, init] = calls[calls.length - 1] as [string, RequestInit];
  return { url, body: init.body ? JSON.parse(String(init.body)) : null };
};

beforeEach(() => {
  fetchMock = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ success: true, data: {} }),
  }));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('staffApi.scanVehicle', () => {
  it('gửi nguyên data URL — backend chặn base64 trần với IMAGE_MALFORMED', async () => {
    await staffApi.scanVehicle(JPEG_DATA_URL, BUILDING);

    expect(lastCall().body.image).toBe(JPEG_DATA_URL);
    expect(lastCall().body.image).toMatch(/^data:image\/[a-z]+;base64,/);
  });

  it('kèm building trong body — thiếu là 400 BUILDING_REQUIRED', async () => {
    await staffApi.scanVehicle(JPEG_DATA_URL, BUILDING);

    expect(lastCall().body.building).toBe(BUILDING);
  });
});

describe('staffApi.lookupPlate', () => {
  it('kèm building vào query — kết quả chỉ có nghĩa trong phạm vi một tòa', async () => {
    await staffApi.lookupPlate('59G2-038.80', BUILDING);

    expect(lastCall().url).toContain(`building=${BUILDING}`);
  });

});

describe('staffApi.resolveQr', () => {
  it('kèm building vào query cho cả hai nhánh QR', async () => {
    await staffApi.resolveQr('PLT-abc123', BUILDING);

    expect(lastCall().url).toContain(`building=${BUILDING}`);
  });
});
