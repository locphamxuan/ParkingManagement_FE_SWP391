# PBMS Frontend

Frontend-only enterprise Admin console cho Parking Building Management System (PBMS), dùng React + TypeScript + Tailwind.

## Chạy dự án

```bash
cd FE
npm install
npm run dev
```

## Mock Auth

- Route public: `/`
- Route login: `/admin/login`
- Route protected: `/admin/dashboard`
- Mock credential:
	- email: `admin@pbms.com`
	- password: `123456`

Session được lưu bằng localStorage qua Zustand persist.

## Mock Data Architecture (de-couple để đổi BE nhanh)

UI không import mock trực tiếp. Tất cả dữ liệu admin đi qua service layer:

- Data entrypoint: `src/services/admin/index.ts`
- Mock adapter: `src/services/admin/mockAdapter.ts`
- API adapter: `src/services/admin/apiAdapter.ts`
- Hook tiêu thụ cho UI: `src/hooks/useAdminDataset.ts`

Quy trình đổi sang BE thật:

1. Set biến môi trường `VITE_USE_MOCK_DATA=false`.
2. Implement endpoint thật trong `src/services/admin/apiAdapter.ts`.
3. Mapping response BE vào `AdminDataset` trong `src/services/admin/types.ts`.
4. Xóa `src/services/admin/mockAdapter.ts` và `src/mock/data.ts` khi không cần nữa.

Không cần sửa các page admin vì chúng chỉ đọc qua `useAdminDataset()`.

## Cấu trúc chính

```text
src/
	components/
	hooks/
	layouts/
	mock/
	pages/
	routes/
	services/
	store/
	styles/
	types/
	utils/
```