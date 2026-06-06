import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Edit,
  LogOut,
  RefreshCw,
  Save,
  Shield,
  User,
  Users,
  X,
} from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { adminApi, type AdminUser } from '@/services/admin/adminApi';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';

const ROLE_TABS = [
  { key: 'admin', label: 'Admin', icon: Shield, color: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/8' },
  { key: 'manager', label: 'Manager', icon: Building2, color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/8' },
  { key: 'staff', label: 'Staff', icon: User, color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/8' },
  { key: 'user', label: 'User', icon: Users, color: 'text-sky-400', border: 'border-sky-500/30', bg: 'bg-sky-500/8' },
] as const;

const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

export function AdminProfilePage() {
  const { session, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  // ── Own profile edit state ──────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ── User directory state ────────────────────────────────────────────────────
  const [activeRole, setActiveRole] = useState<'admin' | 'manager' | 'staff' | 'user'>('manager');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  if (!session?.token || session?.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  const loadUsers = useCallback(async (role: string) => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const res = await adminApi.users.list({ role });
      const raw = res as unknown as { data?: { items?: AdminUser[] } | AdminUser[] };
      const list =
        (raw?.data as { items?: AdminUser[] })?.items ??
        (Array.isArray(raw?.data) ? (raw.data as AdminUser[]) : []);
      setUsers(Array.isArray(list) ? list : []);
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : 'Không thể tải danh sách.');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers(activeRole);
  }, [activeRole, loadUsers]);

  const handleStartEdit = () => {
    setFullName(session.displayName || '');
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
    if (!phoneRegex.test(newPhone)) { setPhoneError('Số điện thoại phải bắt đầu bằng 0 và có đúng 10 chữ số!'); return; }
    updateProfile({ fullName: trimmedName, phone: newPhone, licensePlates: session.licensePlates || [] });
    setIsEditing(false);
    setSuccess('Cập nhật thông tin thành công!');
    setTimeout(() => setSuccess(null), 4000);
  };

  const filteredUsers = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      u.fullName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q)
    );
  });

  const activeTab = ROLE_TABS.find((t) => t.key === activeRole)!;

  return (
    <div className="space-y-6">
      {/* Success toast */}
      {success && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-400">
          <CheckCircle2 size={16} />
          {success}
        </div>
      )}

      {/* ── Section 1: Admin's own profile ─────────────────────────────────── */}
      <section className="rounded-2xl border border-white/8 bg-slate-900/60 p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose-500/25 bg-rose-500/10">
              <Shield size={20} className="text-rose-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-500">Quản trị viên</p>
              <h2 className="text-lg font-bold text-white">Hồ sơ của tôi</h2>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
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

        {isEditing ? (
          <form onSubmit={handleSave} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">Họ tên</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setNameError(null); }}
                required
                className="h-10 w-full rounded-xl border border-white/10 bg-slate-800 px-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-rose-500"
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
                className="h-10 w-full rounded-xl border border-white/10 bg-slate-800 px-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-rose-500"
                placeholder="0901234567"
              />
              {phoneError && <p className="flex items-center gap-1 text-xs text-rose-400"><AlertCircle size={12} />{phoneError}</p>}
            </div>

            <div className="flex items-end gap-2 md:col-span-2">
              <Button type="submit" size="sm" className="gap-1.5"><Save size={13} /> Lưu thay đổi</Button>
              <Button type="button" variant="secondary" size="sm" onClick={handleCancel} className="gap-1.5">
                <X size={13} /> Hủy
              </Button>
            </div>
          </form>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Họ tên', value: session.displayName || 'Chưa cập nhật' },
              { label: 'Email', value: session.email },
              { label: 'Số điện thoại', value: session.phone || 'Chưa cập nhật' },
              { label: 'Vai trò', value: session.role?.toUpperCase() ?? 'ADMIN' },
            ].map((f) => (
              <div key={f.label} className="rounded-xl border border-white/8 bg-slate-800/50 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{f.label}</p>
                <p className="mt-1 text-sm font-semibold text-white">{f.value}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Section 2: User directory ────────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/8 bg-slate-900/60 p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-500/25 bg-sky-500/10">
              <Users size={20} className="text-sky-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-500">Quản trị</p>
              <h2 className="text-lg font-bold text-white">Danh sách người dùng</h2>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void loadUsers(activeRole)}
            className="gap-1.5"
          >
            <RefreshCw size={13} className={usersLoading ? 'animate-spin' : ''} /> Làm mới
          </Button>
        </div>

        {/* Role tabs */}
        <div className="mb-4 flex flex-wrap gap-2">
          {ROLE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeRole === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => { setActiveRole(tab.key); setSearch(''); }}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? `${tab.border} ${tab.bg} ${tab.color} scale-[1.02]`
                    : 'border-white/8 bg-white/3 text-slate-400 hover:bg-white/6 hover:text-slate-200'
                }`}
              >
                <Icon size={13} />
                {tab.label}
                {isActive && !usersLoading && (
                  <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] font-bold">
                    {filteredUsers.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Tìm theo tên, email, SĐT của ${activeTab.label}...`}
            className="h-10 w-full rounded-xl border border-white/10 bg-slate-800 px-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Content */}
        {usersError && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-400">
            {usersError}
          </div>
        )}

        {usersLoading ? (
          <div className="py-8 text-center text-sm text-slate-400">Đang tải danh sách {activeTab.label}...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-10 text-center">
            <activeTab.icon size={28} className="mx-auto mb-2 text-slate-700" />
            <p className="text-sm text-slate-500">
              {search ? `Không tìm thấy ${activeTab.label} phù hợp.` : `Chưa có ${activeTab.label} nào.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Họ tên</th>
                  <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Email</th>
                  <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">SĐT</th>
                  <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Trạng thái</th>
                  <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Ngày tạo</th>
                  {activeRole === 'manager' || activeRole === 'staff' ? (
                    <th className="pb-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500">Tòa nhà</th>
                  ) : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="group hover:bg-white/3">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${activeTab.border} ${activeTab.bg}`}>
                          <span className={`text-xs font-bold ${activeTab.color}`}>
                            {(u.fullName?.[0] ?? u.email[0] ?? '?').toUpperCase()}
                          </span>
                        </div>
                        <span className="font-semibold text-white">{u.fullName || '—'}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-slate-400">{u.email}</td>
                    <td className="py-3 pr-4 text-slate-400">{u.phone || '—'}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={u.isActive ? 'active' : 'inactive'} />
                    </td>
                    <td className="py-3 pr-4 text-slate-500 text-xs">{fmtDate(u.createdAt)}</td>
                    {activeRole === 'manager' || activeRole === 'staff' ? (
                      <td className="py-3 text-xs text-slate-500">
                        {u.assignedBuildings?.length
                          ? `${u.assignedBuildings.length} tòa nhà`
                          : 'Chưa gán'}
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
