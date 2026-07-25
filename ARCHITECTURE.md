# PBMS Frontend — System Design

Parking Building Management System (PBMS) — giao diện web cho 4 vai trò:
**user** (khách gửi xe), **staff** (nhân viên cổng), **manager** (quản lý tòa nhà),
**admin** (quản trị nền tảng).

Stack: **React 18 + TypeScript + Vite**, **React Router 6**, **Zustand** (state),
**Tailwind CSS** + Radix primitives, **Recharts** (biểu đồ), **framer-motion** (animation),
**@zxing / jsqr / qrcode** (QR & camera quét biển số).

---

## 1. Tổng quan kiến trúc

```
┌──────────────────────────────────────────────────────────────┐
│  Pages (theo vai trò)                                         │
│  public · user · staff · manager · admin                     │
│  - Bố cục UI, gọi hooks/services, hiển thị state             │
└───────────────┬──────────────────────────────────────────────┘
                │ dùng
                ▼
┌──────────────────────────────────────────────────────────────┐
│  Components            │  Hooks                │ Stores        │
│  ui / layout / modals  │  useAuth, useUserApi, │ authStore     │
│  charts / map / common │  useBuildingContext…  │ managerStore  │
└───────────────┬────────┴───────────┬───────────┴───────┬──────┘
                │                     │                   │
                ▼                     ▼                   ▼
┌──────────────────────────────────────────────────────────────┐
│  Services (API layer)                                         │
│  client/ (apiClient, pbmsApi, storage)  ← HTTP + token        │
│  admin/ manager/ staff/ user/           ← API theo vai trò    │
│  authService, notificationApi, kioskApi, licensePlateService  │
└───────────────┬──────────────────────────────────────────────┘
                │ HTTP (Bearer token)
                ▼
        Backend REST API  (VITE_API_BASE, mặc định :5000/api)
```

Nguyên tắc: **Page không gọi `fetch` trực tiếp**. Mọi I/O đi qua tầng `services`,
state dùng chung đặt ở `store` (Zustand), logic tái sử dụng đặt ở `hooks`.

---

## 2. Cấu trúc thư mục `src/`

```
src/
├── main.tsx, App.tsx              điểm vào + provider gốc
│
├── pages/                         màn hình theo vai trò (1 route → 1 page)
│   ├── public/   Home, Auth, Kiosk, Reviews          (không cần đăng nhập)
│   ├── user/     Dashboard, Reservations, Wallet,    (khách đã đăng nhập)
│   │             Profile, ParkingHistory, Buildings,
│   │             LongTermSubscriptions, Notifications
│   ├── staff/    Dashboard, Operations, Parked, …
│   ├── manager/  Dashboard, Buildings, Pricing, …
│   └── admin/    DashboardOverview, Users, Revenue, …
│
├── components/
│   ├── ui/        primitives (button, card, input, modal, select, badge)
│   ├── layout/    Header, Footer, Navbar, PortalSidebar (admin+manager), …
│   ├── modals/    ConfirmModal, ModalForm, PlateQRModal, UserQRModal
│   ├── charts/    RevenueChart, AnalyticsCard, ActivityTimeline
│   ├── map/       AnimatedParkingMap3D, ParkingMap2D, CartoonCar3D
│   ├── common/    DataTable, StatusBadge, SearchFilterBar, ScrollToTop
│   ├── staff/     Live cameras (plate / portrait / QR), QR scanner
│   └── manager/   AssignStaffModal
│
├── hooks/                         logic tái sử dụng (theo vai trò khi cần)
│   ├── useAuth, useBuildingContext, useManagerBuildings, useSubscriptionStatus
│   ├── user/   useUserApi (list/detail/mutation hooks)
│   ├── staff/  useAssignedGates
│   └── admin/  useAdminDataset
│
├── services/                      tầng API
│   ├── client/   apiClient (api.get/post…), pbmsApi (requestJson), storage
│   ├── admin/ manager/ staff/ user/   API + types theo vai trò
│   └── authService, notificationApi, kioskApi, licensePlateService
│
├── store/                         Zustand: authStore, managerStore (persist)
├── routes/                        AppRouter + *ProtectedRoute
├── layouts/                       AdminLayout, ManagerLayout, StaffLayout
├── types/, utils/, data/, styles/, assets/
```

---

## 3. Tầng Services

### 3.1 HTTP client (`services/client/`)
- **`apiClient.ts`** — **client HTTP duy nhất**: `api.get/post/put/patch/delete`, luôn gửi
  `credentials: 'include'` để trình duyệt tự đính kèm **httpOnly auth cookie** do BE set
  (`pbms_token`, xem `utils/authCookie.js` phía BE) — **không** lưu token vào `localStorage`.
  `getStoredToken/setStoredToken` chỉ còn backing bằng biến in-memory (mất khi reload), dùng
  cho test helpers gọi thẳng API không qua trình duyệt. Ném `ApiError { status, payload }`,
  build query string, dispatch `auth-unauthorized` khi 401. Cũng export `requestJson(...)` —
  adapter tương thích cho `authService`, nội bộ vẫn gọi `apiRequest` → một triển khai duy nhất.
  Base URL đọc từ `VITE_API_BASE` hoặc `VITE_API_BASE_URL`.
- **`storage.ts`** — chỉ còn localStorage cho dữ liệu KHÔNG nhạy cảm (email đã lưu, thiết bị
  camera đã chọn, loại xe đã chọn...). Session/token không cache ở đây nữa — xem mục 4.

### 3.2 API theo vai trò
`admin/`, `manager/`, `staff/`, `user/` — mỗi thư mục gom endpoint + type của vai trò
đó (vd `managerApi.packages.list(buildingId)`, `userApi.reservations.create(body)`).

### 3.3 Service dùng chung
`authService` (login/forgot/reset), `notificationApi`, `kioskApi`, `licensePlateService`.

---

## 4. Quản lý state

| Loại state | Công cụ | Ví dụ |
|-----------|---------|-------|
| Phiên đăng nhập (toàn cục, persist) | `store/authStore` (Zustand + persist) | `session`, `login`, `logout` |
| Tòa nhà đang chọn của manager (persist) | `store/managerStore` | `buildings`, `selectedBuildingId` |
| Dữ liệu màn hình (list/detail) | hooks trong component | `useUserApi`, `useAdminDataset` |
| Form/UI cục bộ | `useState` trong page | filter, modal mở/đóng |

`useAuth()` là facade mỏng bọc `authStore`, cung cấp `session/user/isBootstrapping`,
`login/logout/updateProfile`. Không còn `token` trong session phía FE (auth dựa vào httpOnly
cookie) — `App.tsx` gọi `authStore.bootstrap()` một lần khi tải trang (GET `/users/auth/me`
qua cookie) để khôi phục phiên; `ProtectedRoute`/`PublicLoginRoute` chờ `isBootstrapping` xong
trước khi quyết định điều hướng, tránh bị bật về `/auth/login` mỗi lần refresh.

### Hook pattern (`hooks/user/useUserApi.ts`)
- **List hook** → `{ items, isLoading, error, pagination?, refresh() }`
- **Detail hook** → `{ data, isLoading, error, refresh() }`
- **Mutation hook** → `{ action(), isLoading, error }`

---

## 5. Routing & phân quyền (`routes/`)

- **`AppRouter.tsx`** khai báo toàn bộ route.
- Khu vực nội bộ bọc bởi guard + layout:
  - `ProtectedRoute role="admin"` → `AdminLayout` (`/admin/*`, đường dẫn cũ
    `/admin/dashboard/<page>` được redirect sang `/admin/<page>`)
  - `ProtectedRoute role="manager"` → `ManagerLayout` (`/manager/*`)
  - `ProtectedRoute role="staff"` → `StaffLayout` (`/staff/*`)
- Trang user (`/profile`, `/wallet`, …) hiện **tự guard** bên trong (kiểm tra
  `session` rồi `Navigate` về `/auth/login`).

> Quy tắc hooks: guard `if (!session) return <Navigate/>` phải đặt **sau** khi đã gọi
> hết các hook (tránh `react-hooks/rules-of-hooks`).

---

## 6. Luồng request/response tiêu biểu

```
Page → hook (useUserApi) → userApi.parkingHistory.list({page,limit})
     → apiClient.api.get('/users/parking-history', {query})
     → fetch  (credentials:'include' → cookie pbms_token tự đính kèm)
     → BE → 200 { data: { items, pagination } }  |  4xx/5xx → ApiError
hook: setState({items|error, isLoading:false}) → component re-render
```

Lỗi 401 → clear session state trong `authStore`, dispatch `auth-unauthorized`, điều hướng về
đăng nhập (cookie hết hạn/không hợp lệ vẫn được BE dọn qua `clearAuthCookie`). Lỗi 4xx/5xx khác
→ hiển thị thông báo + nút thử lại. Chi tiết luồng đăng nhập/khôi phục phiên đầy đủ: xem
`docs/CODEBASE_GUIDE.md` ở thư mục gốc repo (mục "Luồng đăng nhập & phiên").

---

## 7. Chất lượng mã & build

- **TypeScript strict** (`tsconfig.json`), alias `@/* → src/*`.
- **ESLint** (`.eslintrc.cjs`): `eslint:recommended` + `@typescript-eslint` +
  `react-hooks`. **Prettier** (`.prettierrc.json`) cho format.
- Scripts:
  - `npm run dev` — Vite dev server
  - `npm run build` — `tsc --noEmit && vite build` (typecheck trước khi đóng gói)
  - `npm run typecheck` · `npm run lint` · `npm run lint:fix` · `npm run format`
- **Chỉ phụ thuộc frontend** trong `package.json` — đã loại bỏ deps backend
  (mongoose/express/@payos) để bundle gọn.

---

## 8. Nợ kỹ thuật / hướng cải thiện tiếp

- ✅ ~~Hợp nhất 2 HTTP client~~ — đã gộp `pbmsApi` vào `apiClient`.
- ✅ ~~Mật khẩu plaintext trong `pbms_saved_accounts`~~ — chỉ còn lưu email.
- ✅ ~~Code-splitting~~ — đã `React.lazy` toàn bộ page (chunk chính ~334 kB).
- ✅ ~~ESLint warnings~~ — `npm run lint` (`--max-warnings 0`) đã xanh: sửa hết
  `no-explicit-any`/`exhaustive-deps`/unused-vars + các rule a11y tương tác
  (select, slot 3D, dropdown login); 2 rule label-association tạm `off` (xem dưới).
- ✅ ~~WalletPage 796 dòng~~ — tách thành `useWallet` hook + 4 component trong
  `components/user/wallet/` (mỗi file < 300 dòng).

Còn lại (ưu tiên từ trên xuống):
1. **Toast/Confirm hạ tầng** — còn ~45 chỗ dùng `window.confirm`/`alert` thô
   (manager CRUD pages, useReviews, useReservationHistory). Cần một
   `ToastProvider` + `useConfirm` rồi thay dần; UI hiện tại lệch hẳn so với
   design system (modal đẹp vs alert mặc định của trình duyệt).
2. **File > 300 dòng còn lại** — `hooks/user/useUserApi.ts` (784, tập hợp hook
   lặp pattern — cân nhắc factory), `ManagerSlotsPage` (742+), `StaffParkedPage`
   (707), `AnimatedParkingMap3D` (708), `ParkingMap2D` (666), `HomePage` (563),
   `BuildingsPage` (548). Tách theo đúng pattern hook + components đã dùng cho
   StaffOperationsPage/WalletPage.
3. **`jsx-a11y/label-has-associated-control` đang `off`** — ~120 label chưa gắn
   `htmlFor`/`id`. Form auth đã gắn xong; dọn tiếp theo từng form rồi bật lại rule.
4. **Trang user tự-guard** → cân nhắc gom vào một `UserProtectedRoute` cho nhất quán.
5. **`requestJson` adapter** chỉ để tương thích — có thể migrate dần `auth`/`admin`
   sang `api.*` rồi bỏ adapter.
