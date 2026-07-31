/**
 * Vietnamese license-plate normalization & validation (mirrors the backend
 * `plate.util.js`). Canonical form: `59G2-038.80`.
 *
 *   - province: 2 digits
 *   - series:   1–2 letters + optional 1 digit:
 *       - car (ô tô)          → 1 letter:        30A, 51F, 36C
 *       - motorcycle (xe máy) → 1 letter + digit: 59X1, 29B1, 60F8
 *       - special/joint-venture → 2 letters:      51LD, 80NG
 *       - rare                → 2 letters + digit: 59AB1
 *   - number:   4 or 5 digits. 5-digit groups render as `NNN.NN`; 4-digit plain.
 *
 * `normalizePlate` is idempotent on canonical input.
 */

export const CANONICAL_PLATE_REGEX = /^\d{2}[A-Z]{1,2}\d?-(?:\d{3}\.\d{2}|\d{4})$/;

/** Popular car makes on Vietnamese roads. */
export const CAR_BRANDS = [
  'Toyota', 'Honda', 'Hyundai', 'Kia', 'Mazda', 'Ford', 'Mitsubishi',
  'VinFast', 'Suzuki', 'Nissan', 'Isuzu', 'Chevrolet', 'Mercedes-Benz',
  'BMW', 'Audi', 'Lexus', 'Peugeot', 'Daewoo',
  'Other',
] as const;

/** Popular motorcycle makes on Vietnamese roads. */
export const MOTORCYCLE_BRANDS = [
  'Honda', 'Yamaha', 'Suzuki', 'SYM', 'Piaggio', 'Vespa', 'VinFast',
  'Kymco', 'Detech', 'Espero',
  'Other',
] as const;

/**
 * Danh sách hãng gợi ý theo NHÓM xe (2 bánh / 4 bánh) — chỉ là gợi ý nhập liệu,
 * backend nhận mọi chuỗi. Nhóm được suy từ thể loại xe, khớp `kindOfCategory` ở BE.
 */
const TWO_WHEEL_CATEGORIES = new Set(['motorcycle', 'ebike', 'emotorbike']);

export function brandsForCategory(category: string | null | undefined): readonly string[] {
  return TWO_WHEEL_CATEGORIES.has(`${category ?? ''}`) ? MOTORCYCLE_BRANDS : CAR_BRANDS;
}

/** True khi thể loại xe thuộc nhóm 2 bánh — dùng để chọn icon/màu trong UI. */
export function isTwoWheelCategory(category: string | null | undefined): boolean {
  return TWO_WHEEL_CATEGORIES.has(`${category ?? ''}`);
}

/** Normalize arbitrary input to the canonical VN plate form, or '' if unparseable. */
export function normalizePlate(raw: string | null | undefined): string {
  const s = `${raw ?? ''}`.toUpperCase();

  const head = s.match(/(\d{2})[^A-Z0-9]*([A-Z]{1,2})(.*)$/);
  if (!head) return '';

  const province = head[1];
  const letters = head[2];
  const rest = head[3];

  let seriesDigit = '';
  let numberDigits: string;

  const sep = rest.match(/^\s*(\d?)\s*[-_.\s]+\s*([\d.\s]+)$/);
  if (sep) {
    seriesDigit = sep[1] || '';
    numberDigits = sep[2].replace(/[^0-9]/g, '');
  } else {
    const tail = rest.replace(/[^0-9]/g, '');
    if (tail.length >= 6) {
      seriesDigit = tail.slice(0, tail.length - 5);
      numberDigits = tail.slice(tail.length - 5);
    } else {
      numberDigits = tail;
    }
  }

  if (seriesDigit.length > 1) return '';
  if (numberDigits.length < 4 || numberDigits.length > 5) return '';

  const formattedNumber =
    numberDigits.length === 5
      ? `${numberDigits.slice(0, 3)}.${numberDigits.slice(3)}`
      : numberDigits;

  return `${province}${letters}${seriesDigit}-${formattedNumber}`;
}

/** True when `value` is already a canonical Vietnamese plate. */
export function isValidVietnamPlate(value: string | null | undefined): boolean {
  return CANONICAL_PLATE_REGEX.test(`${value ?? ''}`);
}
