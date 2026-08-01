import { describe, it, expect } from 'vitest';
import { plateVehicleKind, plateMatchesCategory } from '@/utils/plate';

/**
 * Luật này được chép ở hai nơi (`utils/plate.ts` và BE `utils/plate.util.js` +
 * `utils/vehicleRules.js`) nên các trường hợp ở đây cố ý trùng với bộ test BE
 * `tests/integration/user/vehicle.service.test.js`: hai bên lệch nhau là người
 * dùng bị form chặn oan hoặc bị server từ chối sau khi form đã cho qua.
 */
describe('plateVehicleKind', () => {
  it('một chữ cái sê-ri → biển ô tô', () => {
    expect(plateVehicleKind('30A-970.22')).toBe('car');
    expect(plateVehicleKind('51F-123.45')).toBe('car');
  });

  it('chữ cái kèm chữ số sê-ri → biển xe máy', () => {
    expect(plateVehicleKind('59G2-038.80')).toBe('motorcycle');
    expect(plateVehicleKind('29B1-234.56')).toBe('motorcycle');
  });

  it('nhận cả dạng gõ tự do, không chỉ dạng chuẩn', () => {
    expect(plateVehicleKind('59 g2 03880')).toBe('motorcycle');
    expect(plateVehicleKind('30a97022')).toBe('car');
  });

  it('biển đặc biệt 2 chữ cái → không suy đoán', () => {
    expect(plateVehicleKind('51LD-123.45')).toBeNull();
    expect(plateVehicleKind('80NG-123.45')).toBeNull();
  });

  it('biển sai định dạng / rỗng → null', () => {
    expect(plateVehicleKind('abc')).toBeNull();
    expect(plateVehicleKind('')).toBeNull();
    expect(plateVehicleKind(null)).toBeNull();
    expect(plateVehicleKind(undefined)).toBeNull();
  });
});

describe('plateMatchesCategory', () => {
  it('chặn khi biển và thể loại lệch nhóm', () => {
    expect(plateMatchesCategory('30A-970.22', 'motorcycle')).toBe(false);
    expect(plateMatchesCategory('59G2-038.80', 'car')).toBe(false);
  });

  it('cho qua khi cùng nhóm, kể cả thể loại chi tiết khác nhau', () => {
    expect(plateMatchesCategory('30A-970.22', 'suv')).toBe(true);
    expect(plateMatchesCategory('30A-970.22', 'truck')).toBe(true);
    expect(plateMatchesCategory('59G2-038.80', 'ebike')).toBe(true);
    expect(plateMatchesCategory('59G2-038.80', 'emotorbike')).toBe(true);
  });

  it('không suy được nhóm thì không chặn', () => {
    expect(plateMatchesCategory('51LD-123.45', 'motorcycle')).toBe(true);
    expect(plateMatchesCategory('51LD-123.45', 'car')).toBe(true);
    expect(plateMatchesCategory('chưa gõ xong', 'car')).toBe(true);
  });

  it('"other" nằm ở nhóm 4 bánh, giống kindOfCategory bên BE', () => {
    expect(plateMatchesCategory('30A-970.22', 'other')).toBe(true);
    expect(plateMatchesCategory('59G2-038.80', 'other')).toBe(false);
  });
});
