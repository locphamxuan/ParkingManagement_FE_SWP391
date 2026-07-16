export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-orange-500 to-orange-400 text-white py-10">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-3">
          <h4>About us</h4>
          <p>Parking management system — easily manage parking sessions, payments and access control.</p>
        </div>

        <div className="space-y-3">
          <h4>Quick links</h4>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/auth/login">Sign in</a></li>
            <li><a href="/auth/register">Register</a></li>
            <li><a href="/">My profile</a></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4>Contact</h4>
          <p>Email: <a href="mailto:support@example.com">support@example.com</a></p>
          <p>Hotline: <a href="tel:+84900000000">0900 000 000</a></p>
        </div>
      </div>

      <div className="mt-6 border-t border-white/20 pt-4">
        <div className="max-w-6xl mx-auto px-4 text-sm text-white/90 text-center">
          <small>{`(c) ${new Date().getFullYear()} PBMS. All rights reserved.`}</small>
        </div>
      </div>
    </footer>
  );
}
