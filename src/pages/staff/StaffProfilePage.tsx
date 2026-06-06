import { useState } from 'react';
import { AlertCircle, Building2, CheckCircle2, Clock, Edit, LogOut, Save, User, X } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { Button } from '@/components/ui/button';

export function StaffProfilePage() {
  const { session, user, logout, updateProfile } = useAuth();
  const { building } = useBuildingContext();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!session?.token || session?.role !== 'staff') {
    return <Navigate to="/auth/login" replace />;
  }

  const displayName = session.displayName || user?.fullName || '';
  const initials = (displayName || session.email || 'S')[0]?.toUpperCase();

  const handleStartEdit = () => {
    setFullName(displayName);
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
    if (!trimmedName) { setNameError('Vui lòng nhập họ tên!'); return; }
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(newPhone)) {
      setPhoneError('Số điện thoại phải bắt đầu bằng 0 và có đúng 10 chữ số!');
      return;
    }
    updateProfile({ fullName: trimmedName, phone: newPhone, licensePlates: session.licensePlates || [] });
    setIsEditing(false);
    setSuccess('Cập nhật thông tin thành công!');
    setTimeout(() => setSuccess(null), 4000);
  };

  return (
    <div className="space-y-5">
      {/* Success */}
      {success && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-400">
          <CheckCircle2 size={15} /> {success}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/8 bg-slate-900/60 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10">
            <User size={18} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Nhân viên vận hành</p>
            <h1 className="text-base font-bold text-white">Hồ sơ cá nhân</h1>
          </div>
        </div>
        <div className="flex gap-2">
          {!isEditing && (
            <Button variant="secondary" size="sm" onClick={handleStartEdit} className="gap-1.5">
              <Edit size={13} /> Chỉnh sửa
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { logout(); navigate('/auth/login', { replace: true }); }}
            className="gap-1.5 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
          >
            <LogOut size={13} /> Đăng xuất
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* Left: profile fields */}
        <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-6">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">Thông tin tài khoản</p>

          {isEditing ? (
            <form onSubmit={handleSave} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">Họ tên</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); setNameError(null); }}
                  required
                  className="h-10 w-full rounded-xl border border-white/10 bg-slate-800 px-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Nguyễn Văn A"
                />
                {nameError && <p className="flex items-center gap-1 text-xs text-rose-400"><AlertCircle size={12} />{nameError}</p>}
              </div>

              <div className="space-y-1.5 opacity-60">
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">Email</label>
                <input
                  type="email"
                  value={session.email}
                  disabled
                  className="h-10 w-full rounded-xl border border-white/10 bg-slate-800/50 px-3 text-sm text-slate-400 outline-none cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">Số điện thoại</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value.replace(/[^0-9]/g, '')); setPhoneError(null); }}
                  maxLength={10}
                  required
                  className="h-10 w-full rounded-xl border border-white/10 bg-slate-800 px-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="0901234567"
                />
                {phoneError && <p className="flex items-center gap-1 text-xs text-rose-400"><AlertCircle size={12} />{phoneError}</p>}
              </div>

              <div className="flex items-end gap-2 md:col-span-2">
                <Button type="submit" size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Save size={13} /> Lưu thay đổi
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={handleCancel} className="gap-1.5">
                  <X size={13} /> Hủy
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: 'Họ tên', value: displayName || 'Chưa cập nhật' },
                { label: 'Email', value: session.email },
                { label: 'Số điện thoại', value: session.phone || 'Chưa cập nhật' },
                { label: 'Vai trò', value: 'STAFF' },
              ].map((f) => (
                <div key={f.label} className="rounded-xl border border-white/8 bg-slate-800/50 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{f.label}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{f.value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: identity card */}
        <div className="space-y-4">
          {/* Avatar */}
          <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10">
                <span className="text-2xl font-black text-emerald-400">{initials}</span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Staff Portal</p>
                <p className="text-base font-bold text-white">{displayName || 'Nhân viên'}</p>
                <p className="text-xs text-slate-400">{session.email}</p>
              </div>
            </div>
          </div>

          {/* Building info */}
          {building && (
            <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Building2 size={14} className="text-emerald-400" />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Tòa nhà phụ trách</p>
              </div>
              <div className="space-y-2">
                <div className="rounded-xl border border-white/8 bg-slate-800/50 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tên tòa nhà</p>
                  <p className="mt-0.5 text-sm font-semibold text-white">{building.name}</p>
                </div>
                <div className="rounded-xl border border-white/8 bg-slate-800/50 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Mã</p>
                  <p className="mt-0.5 font-mono text-sm text-emerald-400">{building.code}</p>
                </div>
                {building.operatingHours && (
                  <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-slate-800/50 px-3 py-2.5">
                    <Clock size={12} className="text-slate-500" />
                    <p className="text-xs text-slate-400">
                      {building.operatingHours.open} – {building.operatingHours.close}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
