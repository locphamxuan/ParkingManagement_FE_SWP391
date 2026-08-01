export const ADMIN_EMAIL_FALLBACK = 'admin@pbms.local';

/**
 * Độ dài mật khẩu tối thiểu — phải khớp `MIN_PASSWORD_LENGTH` bên backend
 * (`utils/passwordPolicy.js`), nơi thực sự chốt. Ở FE chỉ để báo sớm cho người
 * dùng thay vì để họ gõ xong mới nhận lỗi 400 WEAK_PASSWORD.
 *
 * Backend còn chặn thêm mật khẩu quá phổ biến / chuỗi lặp / chuỗi liên tiếp —
 * những cái đó cố tình KHÔNG chép sang đây, cứ để server trả thông báo.
 */
export const MIN_PASSWORD_LENGTH = 12;
