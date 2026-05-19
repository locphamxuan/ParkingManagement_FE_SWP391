import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-col about">
          <h4>Về chúng tôi</h4>
          <p>Hệ thống quản lý bãi đỗ xe - quản lý đặt chỗ, thanh toán và kiểm soát truy cập dễ dàng.</p>
        </div>

        <div className="footer-col links">
          <h4>Liên kết nhanh</h4>
          <ul>
            <li><Link to="/">Trang chủ</Link></li>
            <li><Link to="/auth/login">Đăng nhập</Link></li>
            <li><Link to="/auth/register">Đăng ký</Link></li>
            <li><Link to="/dashboard">Hồ sơ của tôi</Link></li>
          </ul>
        </div>

        <div className="footer-col contact">
          <h4>Liên hệ</h4>
          <p>Email: <a href="mailto:support@example.com">support@example.com</a></p>
          <p>Hotline: <a href="tel:+84900000000">0900 000 000</a></p>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <small>{`(c) ${new Date().getFullYear()} PBMS. Bảo lưu mọi quyền.`}</small>
        </div>
      </div>
    </footer>
  );
}
