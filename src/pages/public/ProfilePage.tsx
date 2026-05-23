import { useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, LogOut, User } from 'lucide-react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { session, logout } = useAuth();

  const user = useMemo(() => {
    if (!session) return null;
    return {
      fullName: session.displayName,
      email: session.email,
      phone: '', // Defaulting phone detail
      role: session.role
    };
  }, [session]);

  if (!session || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden selection:bg-orange-500 selection:text-white">
      
      {/* Background Cyber Glowing Accents */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.06),transparent_60%)] pointer-events-none blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[450px] h-[450px] rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05),transparent_60%)] pointer-events-none blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 relative z-10">
        
        {/* Sticky Glass Panel Header */}
        <motion.div 
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 18 }}
          className="mb-8 flex items-center justify-between gap-4 rounded-3xl border border-white/5 bg-slate-900/60 p-4 backdrop-blur-md shadow-2xl"
        >
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-white/5 bg-slate-950 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-orange-400 hover:border-orange-500/30 hover:shadow-[0_0_15px_rgba(249,115,22,0.2)] transition-all duration-300 hover:scale-105"
            onClick={() => navigate('/', { replace: true })}
          >
            <ArrowLeft size={14} className="stroke-[3]" />
            Về trang chủ
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all duration-300 hover:shadow-[0_0_15px_rgba(220,38,38,0.25)] hover:scale-105"
            onClick={handleLogout}
          >
            <LogOut size={14} className="stroke-[3]" />
            Đăng xuất
          </button>
        </motion.div>

        {/* Content Section layout */}
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          
          {/* User profile info block */}
          <motion.section 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 90, damping: 16 }}
            className="space-y-6 rounded-3xl border border-white/5 bg-slate-900/40 p-8 backdrop-blur-md shadow-2xl relative overflow-hidden"
          >
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-400 font-mono">Hồ sơ người dùng</p>
              <h1 className="text-3xl font-black tracking-tight text-white">
                Thông tin <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-blue-400 bg-clip-text text-transparent">tài khoản cá nhân</span>
              </h1>
              <p className="max-w-2xl text-xs font-semibold leading-relaxed text-slate-400">
                Đây là trang hồ sơ dành cho tài khoản người dùng đã đăng nhập. Từ đây bạn có thể xem đầy đủ thông tin cá nhân, vai trò và quản lý phiên đăng nhập.
              </p>
            </div>

            <div className="grid gap-4 rounded-3xl bg-slate-950/40 p-6 border border-white/5">
              {[
                { label: 'Tên', value: user.fullName },
                { label: 'Email', value: user.email },
                { label: 'Số điện thoại', value: user.phone },
                { label: 'Vai trò', value: user.role, uppercase: true },
              ].map((field, idx) => (
                <motion.div 
                  key={field.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + idx * 0.06 }}
                  className="grid gap-1.5 rounded-2xl border border-white/5 bg-slate-950/70 p-5 shadow-inner transition-all duration-300 hover:border-orange-500/15"
                >
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 font-mono">{field.label}</p>
                  <p className={`text-base font-black text-slate-200 ${field.uppercase ? 'uppercase font-mono text-orange-400 text-sm' : ''}`}>
                    {field.value || '— Chưa cập nhật —'}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Sidebar right aside detail block */}
          <motion.aside 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 90, damping: 16, delay: 0.1 }}
            className="rounded-3xl border border-white/5 bg-slate-900/20 p-8 backdrop-blur-md shadow-2xl flex flex-col gap-6 justify-between"
          >
            <div className="space-y-6">
              
              {/* Account Quick Header card */}
              <div className="flex items-center gap-4 rounded-3xl bg-slate-950/60 border border-white/5 p-5 shadow-md">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-slate-950 shadow-[0_0_15px_rgba(249,115,22,0.25)]">
                  <User size={24} className="stroke-[2.5]" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 font-mono">Tài khoản</p>
                  <p className="text-lg font-black text-white leading-tight mt-0.5">{user.fullName || 'Người dùng mới'}</p>
                </div>
              </div>

              {/* Quick Details List */}
              <div className="space-y-4 rounded-3xl bg-slate-950/40 border border-white/5 p-6 shadow-md">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono">Chi tiết nhanh</h2>
                <div className="grid gap-3 text-xs text-slate-400">
                  <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                    <p className="text-[10px] font-black uppercase text-slate-500 font-mono">Email</p>
                    <p className="mt-1 text-slate-200 font-bold">{user.email || 'Chưa cập nhật'}</p>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                    <p className="text-[10px] font-black uppercase text-slate-500 font-mono">Vai trò</p>
                    <p className="mt-1 font-mono uppercase text-orange-400 font-black">{user.role || 'user'}</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Note text panel */}
            <div className="rounded-3xl border border-blue-500/20 bg-slate-950/80 p-6 text-slate-300 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.06),transparent_65%)] pointer-events-none" />
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-400 font-mono">Lưu ý bảo mật</p>
              <p className="mt-3 text-xs leading-relaxed text-slate-400 font-semibold">
                Thông tin này được lấy từ phiên đăng nhập hiện tại. Nếu bạn muốn cập nhật dữ liệu, hãy sử dụng trang quản lý tài khoản hoặc liên hệ bộ phận hỗ trợ.
              </p>
            </div>

          </motion.aside>
        </div>
      </div>
    </main>
  );
}
