# Manager Dashboard Pages

Tập hợp các trang giao diện cho Manager trong ứng dụng Parking Management System (PBMS). Mỗi Manager quản lý 1 tòa nhà và nhiều nhân viên.

## Các Trang Chính

### 1. **ManagerDashboardPage** (FR-MGR-01-14)
Trang chính của Manager Dashboard - là trang tổng hợp với 10 tab chức năng khác nhau:

- **Overview (FR-MGR-01)**: Tổng quan tòa nhà, KPI hôm nay, trạng thái slot theo tầng
- **Floors & Gates (FR-MGR-02/03)**: Quản lý tầng và cổng vào/ra
- **Parking Slots (FR-MGR-04)**: Quản lý trạng thái slot (trống/đang dùng/đặt trước/bảo trì)
- **Vehicle Types (FR-MGR-05)**: Quản lý loại phương tiện được phép
- **Pricing (FR-MGR-06/07)**: Bảng giá và lịch sử thay đổi chính sách giá
- **Packages & Reservation (FR-MGR-08/10)**: Gói đặt chỗ dài hạn (tuần/tháng/quý) và chính sách đặt trước
- **Staff & Shifts (FR-MGR-11/12)**: Quản lý nhân viên, ca làm việc và phân công
- **Revenue Report (FR-MGR-12)**: Báo cáo doanh thu theo ca
- **Feedback (FR-MGR-13)**: Phản hồi và kiến nạt từ khách hàng
- **Audit Logs (FR-MGR-14)**: Lịch sử thay đổi trong tòa nhà

### 2. **ManagerFloorsPage** (FR-MGR-02/03)
Quản lý tầng và cổng:
- Danh sách các tầng với thông tin slot, loại xe, cổng vào/ra
- Danh sách chi tiết các cổng với quyền hạn xe
- Cho phép thêm/chỉnh sửa tầng

### 3. **ManagerSlotsPage** (FR-MGR-04)
Quản lý slot do xe:
- Hiển thị trạng thái slot theo tầng (trống/đang dùng/đặt trước/bảo trì)
- Thống kê visual với thanh tiến trình
- Lọc nâng cao

### 4. **ManagerVehiclesPage** (FR-MGR-05)
Quản lý loại phương tiện:
- Danh sách loại xe với kích thước tối đa
- Cho phép thêm/chỉnh sửa/xóa loại xe
- Trạng thái hoạt động của từng loại

### 5. **ManagerPricingPage** (FR-MGR-06/07)
Bảng giá và chính sách:
- Bảng giá hiện tại theo loại xe và khung giờ
- Lịch sử thay đổi giá (FR-MGR-07)
- Trạng thái phê duyệt (approved/pending)
- Cho phép thêm/chỉnh sửa bảng giá

### 6. **ManagerPackagesPage** (FR-MGR-08/10)
Gói đặt chỗ và chính sách:
- Danh sách gói (tuần/tháng/quý) với giá và số lượng đăng ký
- Doanh thu từ gói
- Chính sách đặt trước (tỷ lệ, thời gian giữ slot, hoàn tiền)
- Thêm/chỉnh sửa gói mới

### 7. **ManagerStaffPage** (FR-MGR-11/12)
Quản lý nhân viên và ca làm việc:
- Danh sách nhân viên với vai trò (staff/shift_leader)
- Danh sách ca làm việc (sáng/chiều/đêm)
- Tiến độ phân công nhân viên vào ca
- Thêm nhân viên mới, phân công ca

### 8. **ManagerRevenueReportPage** (FR-MGR-12)
Báo cáo doanh thu:
- Thống kê tổng doanh thu, số lượt xe, tiền chờ xử lý, tiền đã đối soát
- Bảng chi tiết theo ca (sáng/chiều/đêm)
- Tỷ lệ đã đối soát (%)
- Xuất báo cáo

### 9. **ManagerFeedbackPage** (FR-MGR-13)
Phản hồi từ khách hàng:
- Danh sách phản hồi chờ xử lý
- Đánh giá sao trung bình
- Cho phép viết phản hồi và đánh dấu đã xử lý
- Hướng dẫn phản hồi chuyên nghiệp

### 10. **ManagerAuditLogsPage** (FR-MGR-14)
Lịch sử thay đổi tòa nhà:
- Ghi lại tất cả thay đổi quan trọng (giá, quyền hạn, doanh thu, v.v.)
- Phân loại mức độ nghiêm trọng (high/medium/low)
- Lọc theo người thực hiện, hành động, thời gian
- Bảo vệ toàn vẹn - không thể xóa hay chỉnh sửa

## Cấu Trúc Dữ Liệu

### Data Files
- **src/data/managerFlow.ts**: Chứa tất cả dữ liệu mock cho Manager
  - `managerFlowModules`: Danh sách 10 module chức năng
  - `managerKpis`: KPI hôm nay (chiếm dụng, doanh thu, phiên, cảnh báo)
  - `buildingInfo`: Thông tin tòa nhà hiện tại
  - `floorData`: Danh sách tầng
  - `gateData`: Danh sách cổng
  - `vehicleTypeData`: Loại phương tiện
  - `pricingData`: Bảng giá
  - `policyPushLogsManager`: Lịch sử thay đổi giá
  - `staffData`: Danh sách nhân viên
  - `shiftData`: Danh sách ca làm việc
  - `revenueReportManager`: Báo cáo doanh thu theo ca
  - `feedbackData`: Phản hồi khách hàng
  - `auditLogsManager`: Lịch sử thay đổi tòa nhà
  - `slotStatusData`: Trạng thái slot theo tầng
  - `packageData`: Gói đặt chỗ dài hạn

## Tính Năng Chung

### UI Components
- Thanh header với Logo, tên manager, thông tin tòa nhà
- Sidebar điều hướng với 10 tab
- Responsive design (Mobile-friendly)
- Gradient backgrounds, icons, status badges
- Modal forms, tables, grids

### Styling
- Tailwind CSS utilities
- Consistent color scheme (blue primary, green success, red error, orange warning)
- Dark mode support (tạm thời chỉ light mode)

### Features
- Tab-based navigation với URL params
- Search/Filter capabilities
- Export functionality (báo cáo)
- Real-time status updates
- User-friendly interface tương tự Admin Dashboard

## Cách Sử Dụng

### Import
```tsx
import { ManagerDashboardPage } from '@/pages/manager';
```

### Integration
```tsx
<ManagerDashboardPage 
  user={currentUser}
  onLogout={handleLogout}
  onRefresh={handleRefresh}
/>
```

### Props
- `user?`: `{ fullName?: string; email?: string } | null` - Thông tin user
- `onLogout`: `() => void` - Callback khi logout
- `onRefresh`: `() => void` - Callback khi refresh

## Functional Requirements Mapping

| FR ID | Chức năng | Page | Status |
|-------|----------|------|--------|
| FR-MGR-01 | Quản lý thông tin tòa nhà | Overview | ✓ |
| FR-MGR-02 | Quản lý tầng (floors) | FloorsPage | ✓ |
| FR-MGR-03 | Quản lý cổng (gates) | FloorsPage | ✓ |
| FR-MGR-04 | Quản lý slot độ xe | SlotsPage | ✓ |
| FR-MGR-05 | Quản lý loại xe | VehiclesPage | ✓ |
| FR-MGR-06 | Cấu hình bảng giá | PricingPage | ✓ |
| FR-MGR-07 | Xem lịch sử thay đổi giá | PricingPage | ✓ |
| FR-MGR-08 | Quản lý gói dài hạn | PackagesPage | ✓ |
| FR-MGR-09 | Xem danh sách khách gói | PackagesPage | ✓ |
| FR-MGR-10 | Cấu hình chính sách đặt chỗ | PackagesPage | ✓ |
| FR-MGR-11 | Quản lý ca làm việc | StaffPage | ✓ |
| FR-MGR-12 | Báo cáo doanh thu | RevenueReportPage | ✓ |
| FR-MGR-13 | Phản hồi từ khách | FeedbackPage | ✓ |
| FR-MGR-14 | Audit logs | AuditLogsPage | ✓ |

## File Structure
```
src/pages/manager/
├── index.ts
├── ManagerDashboardPage.tsx
├── ManagerFloorsPage.tsx
├── ManagerSlotsPage.tsx
├── ManagerVehiclesPage.tsx
├── ManagerPricingPage.tsx
├── ManagerPackagesPage.tsx
├── ManagerStaffPage.tsx
├── ManagerRevenueReportPage.tsx
├── ManagerFeedbackPage.tsx
└── ManagerAuditLogsPage.tsx

src/data/
└── managerFlow.ts
```

## Notes
- Tất cả dữ liệu hiện tại là mock data - cần kết nối với API thực
- Manager chỉ có thể quản lý 1 tòa nhà - cần filter dữ liệu theo buildingId
- Các chức năng "thêm/sửa/xóa" hiện chỉ là placeholder - cần implement API calls
- Có thể mở rộng với pagination, search, export PDF cho báo cáo
