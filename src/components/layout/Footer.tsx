import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-orange-500 to-amber-500 text-orange-50 py-8 px-0 pb-4 text-base mt-8 shadow-lg shadow-orange-500/16">
      <div className="max-w-4xl mx-auto px-4 flex gap-8 flex-wrap">
        <div className="flex-1 min-w-52">
          <h4 className="mb-2 text-white">Về chúng tôi</h4>
          <p className="text-orange-50">Hệ thống quản lý bãi đỗ xe - quản lý đặt chỗ, thanh toán và kiểm soát truy cập dễ dàng.</p>
        </div>

        <div className="flex-1 min-w-52">
          <h4 className="mb-2 text-white">Liên kết nhanh</h4>
          <ul className="list-none p-0 m-0">
            <li className="my-1"><Link to="/" className="text-orange-100 no-underline font-semibold hover:text-white hover:underline">Trang chủ</Link></li>
            <li className="my-1"><Link to="/auth/login" className="text-orange-100 no-underline font-semibold hover:text-white hover:underline">Đăng nhập</Link></li>
            <li className="my-1"><Link to="/auth/register" className="text-orange-100 no-underline font-semibold hover:text-white hover:underline">Đăng ký</Link></li>
            <li className="my-1"><Link to="/dashboard" className="text-orange-100 no-underline font-semibold hover:text-white hover:underline">Hồ sơ của tôi</Link></li>
          </ul>
        </div>

        <div className="flex-1 min-w-52">
          <h4 className="mb-2 text-white">Liên hệ</h4>
          <p className="text-orange-50">Email: <a href="mailto:support@example.com" className="text-orange-100 no-underline font-semibold hover:text-white hover:underline">support@example.com</a></p>
          <p className="text-orange-50">Hotline: <a href="tel:+84900000000" className="text-orange-100 no-underline font-semibold hover:text-white hover:underline">0900 000 000</a></p>
        </div>
      </div>

      <div className="border-t border-white/18 mt-4 pt-4 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <small className="text-white/92">{`(c) ${new Date().getFullYear()} PBMS. Bảo lưu mọi quyền.`}</small>
        </div>
      </div>
    </footer>
  );
}
