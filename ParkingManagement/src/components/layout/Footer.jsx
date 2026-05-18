export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 text-sm text-slate-600">
          <p className="text-base font-semibold text-slate-950">PBMS</p>
          <p>Hệ thống quản lý bãi giữ xe tòa nhà.</p>
          <p>Địa chỉ: Hà Nội, Việt Nam</p>
          <p>Email: support@pbms.vn</p>
          <p>Hotline: +84 123 456 789</p>
        </div>

        <div className="text-sm text-slate-600">
          <p className="text-base font-semibold text-slate-950">Chính sách</p>
          <ul className="mt-3 space-y-2">
            <li>Điều khoản sử dụng</li>
            <li>Chính sách bảo mật</li>
            <li>Hỗ trợ khách hàng</li>
          </ul>
          <p className="mt-6 text-xs text-slate-500">© {new Date().getFullYear()} PBMS. Mọi quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
}
