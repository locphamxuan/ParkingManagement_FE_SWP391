export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-orange-500 to-orange-400 text-white py-10">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-3">
          <h4>Về chúng tôi</h4>
          <p>Hệ thống quản lý bãi đỗ xe - quản lý đặt chỗ, thanh toán và kiểm soát truy cập dễ dàng.</p>
        </div>

        <div className="space-y-3">
          <h4>Liên kết nhanh</h4>
          <ul>
            <li><a href="/">Trang chủ</a></li>
            <li><a href="/auth/login">Đăng nhập</a></li>
            <li><a href="/auth/register">Đăng ký</a></li>
            <li><a href="/">Hồ sơ của tôi</a></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4>Liên hệ</h4>
          <p>Email: <a href="mailto:support@example.com">support@example.com</a></p>
          <p>Hotline: <a href="tel:+84900000000">0900 000 000</a></p>
        </div>
      </div>

      <div className="mt-6 border-t border-white/20 pt-4">
        <div className="max-w-6xl mx-auto px-4 text-sm text-white/90 text-center">
          <small>{`(c) ${new Date().getFullYear()} PBMS. Bảo lưu mọi quyền.`}</small>
        </div>
      </div>
    </footer>
  );
}
