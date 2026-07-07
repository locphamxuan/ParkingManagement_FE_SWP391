# CLAUDE.md — ParkingManagement FE

## Git workflow

- **Bắt buộc** checkout nhánh mới trước khi thực hiện bất kỳ thay đổi nào:
  ```bash
  git checkout -b <type>/<short-description>
  ```
  Ví dụ: `feat/reservation-filter`, `fix/checkout-fee`, `refactor/service-layer`
- **Không commit** cho đến khi người dùng yêu cầu rõ ràng.
- Không dùng `--no-verify`, không force push lên `main`/`dev`.

## Ngôn ngữ

- **Toàn bộ text hiển thị trên UI** (label, placeholder, button, toast, error message, modal, tooltip…) phải bằng **tiếng Anh**.
- **Comment trong code** viết bằng **tiếng Việt** — giải thích WHY, không giải thích WHAT.
- Không dùng tiếng Việt lẫn lộn trong cùng một string UI.

## Clean code

- Không thêm feature, refactor, hay abstraction vượt quá phạm vi task được yêu cầu.
- Không thêm comment giải thích WHAT code làm — tên biến/hàm đã nói lên điều đó.
- Xóa `console.log` debug trước khi báo task hoàn thành.
- Không dùng `any` trong TypeScript trừ khi thực sự không thể tránh; nếu dùng phải có comment giải thích.
- Không hardcode string key localStorage/sessionStorage — khai báo trong `src/services/client/storage.ts`.
- Không gọi API trực tiếp trong component/page — phải qua service layer (`src/services/`).

## Cấu trúc thư mục

```
src/
  components/       # Shared UI components (không chứa business logic)
    common/         # Atoms: Button, Input, Modal, Badge…
    <domain>/       # Domain-specific: user/, staff/, manager/…
  pages/            # Route-level components (1 page = 1 folder nếu có sub-components)
  layouts/          # Layout wrappers (AdminLayout, StaffLayout…)
  hooks/            # Custom hooks theo domain: hooks/user/, hooks/staff/…
  services/         # API service layer theo role: admin/, manager/, staff/, user/
    client/         # HTTP client, storage, interceptors
  store/            # Global state (Zustand)
  routes/           # AppRouter + ProtectedRoute
  utils/            # Pure functions, constants, helpers
  types/            # Shared TypeScript interfaces (không duplicate giữa các service)
```

- Mỗi domain interface chỉ được định nghĩa **một lần** trong `src/types/` hoặc trong service file của nó — không duplicate.
- Component lớn hơn ~300 dòng phải được split.

## System design

- **Service layer** là nguồn sự thật duy nhất cho API calls — page/component không import `apiClient` trực tiếp.
- **State management**: server state dùng hook (`useXxx`) trong `src/hooks/`; global UI state dùng Zustand store.
- **Error handling**: mọi API call phải có error state hiển thị cho người dùng — không để lỗi im lặng.
- Không lưu dữ liệu nhạy cảm (token, password) vào `localStorage` ngoài các helper đã định nghĩa trong `storage.ts`.

## OpenAPI / API contract

- Trước khi viết hoặc sửa service function, đối chiếu với BE API contract (endpoint, request body, response shape).
- TypeScript interface của response phải khớp với schema BE — không tự suy diễn shape từ UI logic.
- Khi BE thêm field mới, cập nhật type tương ứng trong service file, không dùng `as any` để tránh.

## Testing

- Sau khi thực hiện thay đổi UI, chạy dev server và kiểm tra thủ công golden path của feature.
- Kiểm tra cả edge case: empty state, loading state, error state.
- Nếu có unit test (`*.test.ts`), chạy `npm test` và đảm bảo không có test mới fail.
- TypeScript build (`npm run build` hoặc `tsc --noEmit`) phải pass — không để lỗi type compile.

## Commit (chỉ khi được yêu cầu)

Dùng conventional commits, không chứa tên AI/Claude:
```
feat(scope): mô tả ngắn gọn
fix(scope): mô tả ngắn gọn
refactor(scope): mô tả ngắn gọn
```
