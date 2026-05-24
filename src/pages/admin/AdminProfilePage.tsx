import { useState } from 'react';
import { ArrowLeft, LogOut, User, Edit, Save, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function AdminProfilePage() {
  const { session, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!session?.token || session?.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  const handleStartEdit = () => {
    setFullName(session.displayName || session.fullName || '');
    setPhone(session.phone || '');
    setNameError(null);
    setPhoneError(null);
    setSuccess(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNameError(null);
    setPhoneError(null);
    setSuccess(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setPhoneError(null);
    setSuccess(null);

    const trimmedName = fullName.trim();
    const newPhone = phone.trim();
    const oldPhone = (session.phone || '').trim();

    // Step 1: Validate Name
    if (!trimmedName) {
      setNameError('Vui lòng nhập họ tên!');
      return;
    }

    // Step 2: Validate phone number
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(newPhone)) {
      setPhoneError('Số điện thoại phải bắt đầu bằng số 0 và có đúng 10 chữ số!');
      return;
    }

    // Step 3: Check duplicate phone
    const allRegisteredPhonesRaw = localStorage.getItem('pbms.allRegisteredPhones');
    let allRegisteredPhones: string[] = allRegisteredPhonesRaw
      ? JSON.parse(allRegisteredPhonesRaw)
      : ['0911111111', '0922222222'];

    if (newPhone !== oldPhone && allRegisteredPhones.includes(newPhone)) {
      setPhoneError('Số điện thoại này đã được đăng ký bởi một tài khoản khác!');
      return;
    }

    // Step 4: Update register phone storage
    if (oldPhone) {
      allRegisteredPhones = allRegisteredPhones.filter((p) => p !== oldPhone);
    }
    allRegisteredPhones.push(newPhone);
    localStorage.setItem('pbms.allRegisteredPhones', JSON.stringify(allRegisteredPhones));

    // Step 5: Update profile
    updateProfile({
      fullName: trimmedName,
      phone: newPhone,
      licensePlates: session.licensePlates || []
    });

    setIsEditing(false);
    setSuccess('Cập nhật thông tin thành công!');
    setTimeout(() => setSuccess(null), 4000);
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Success Toast Alert */}
        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 shadow-sm">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-sky-600">Hồ sơ Admin</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Thông tin cá nhân</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Trang hồ sơ dành cho quản trị viên hệ thống. Tại đây bạn có thể xem, chỉnh sửa thông tin tài khoản và đăng xuất nhanh.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {!isEditing && (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition duration-200 hover:scale-105"
                onClick={handleStartEdit}
              >
                <Edit size={15} /> Chỉnh sửa hồ sơ
              </button>
            )}
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              onClick={() => navigate('/admin/dashboard')}
            >
              <ArrowLeft size={16} /> Quay lại dashboard
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              onClick={() => {
                logout();
                navigate('/admin/login', { replace: true });
              }}
            >
              <LogOut size={16} /> Đăng xuất
            </button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.28em] text-sky-600">Thông tin tài khoản</p>
              <h2 className="text-2xl font-semibold text-slate-900">Hồ sơ của bạn</h2>
            </div>

            {isEditing ? (
              <form onSubmit={handleSave} className="grid gap-5 rounded-3xl bg-slate-50 p-6">
                <div className="grid gap-2 rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                  <label className="text-xs uppercase tracking-[0.24em] text-slate-500 font-semibold">Tên</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setNameError(null);
                    }}
                    required
                    className="mt-1 block w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 text-sm h-11 px-4 transition-all duration-300 outline-none"
                    placeholder="Nguyễn Văn A"
                  />
                  {nameError && (
                    <p className="mt-1 text-xs text-rose-600 flex items-center gap-1.5 font-medium">
                      <AlertCircle size={13} /> {nameError}
                    </p>
                  )}
                </div>

                <div className="grid gap-2 rounded-2xl bg-white p-6 shadow-sm border border-slate-100 opacity-70">
                  <span className="text-xs uppercase tracking-[0.24em] text-slate-500 font-semibold">Email</span>
                  <input
                    type="email"
                    value={session.email}
                    disabled
                    className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm h-11 px-4 outline-none cursor-not-allowed"
                  />
                </div>

                <div className="grid gap-2 rounded-2xl bg-white p-6 shadow-sm border border-slate-100 opacity-70">
                  <span className="text-xs uppercase tracking-[0.24em] text-slate-500 font-semibold">Vai trò</span>
                  <input
                    type="text"
                    value={session.role}
                    disabled
                    className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 text-slate-500 uppercase text-sm h-11 px-4 outline-none cursor-not-allowed font-mono"
                  />
                </div>

                <div className="grid gap-2 rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                  <label className="text-xs uppercase tracking-[0.24em] text-slate-500 font-semibold">Số điện thoại</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setPhone(val);
                      setPhoneError(null);
                    }}
                    required
                    maxLength={10}
                    className="mt-1 block w-full rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 text-sm h-11 px-4 transition-all duration-300 outline-none"
                    placeholder="Ví dụ: 0901234567"
                  />
                  {phoneError && (
                    <p className="mt-1 text-xs text-rose-600 flex items-center gap-1.5 font-medium">
                      <AlertCircle size={13} /> {phoneError}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 hover:scale-[1.02] shadow-sm"
                  >
                    <Save size={15} /> Lưu thay đổi
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 hover:scale-[1.02]"
                  >
                    <X size={15} /> Hủy
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid gap-4 rounded-3xl bg-slate-50 p-6">
                <div className="grid gap-2 rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Tên</p>
                  <p className="text-lg font-medium text-slate-900">{session.displayName || session.fullName || 'Chưa cập nhật'}</p>
                </div>

                <div className="grid gap-2 rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Email</p>
                  <p className="text-lg font-medium text-slate-900">{session.email}</p>
                </div>

                <div className="grid gap-2 rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Vai trò</p>
                  <p className="text-lg font-medium text-slate-900 uppercase font-mono text-sky-600">{session.role}</p>
                </div>

                <div className="grid gap-2 rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Số điện thoại</p>
                  <p className="text-lg font-medium text-slate-900">{session.phone || 'Chưa cập nhật'}</p>
                </div>
              </div>
            )}
          </section>

          <aside className="rounded-3xl border border-slate-200 bg-sky-600/5 p-8 shadow-sm">
            <div className="flex h-full flex-col justify-between gap-6">
              <div className="flex items-center gap-4 rounded-3xl bg-white/90 p-4 shadow-sm border border-slate-100">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-sky-600 text-white">
                  <User size={24} />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-sky-700">Tài khoản</p>
                  <p className="text-xl font-semibold text-slate-950">{session.displayName || session.fullName || 'Administrator'}</p>
                </div>
              </div>

              <div className="space-y-4 rounded-3xl bg-white/90 p-6 shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900">Chi tiết nhanh</h3>
                <div className="grid gap-3 text-sm text-slate-600">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-medium text-slate-800">Email</p>
                    <p>{session.email}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-medium text-slate-800">Vai trò</p>
                    <p className="uppercase font-mono">{session.role}</p>
                  </div>
                </div>
              </div>
              {/* Removed note and highlight panels */}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
