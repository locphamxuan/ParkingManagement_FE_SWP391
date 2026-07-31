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
  Mail,
  Phone,
  Fingerprint
} from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { adminApi, type AdminUser } from '@/services/admin/adminApi';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';

const ROLE_TABS = [
  { key: 'admin', label: 'Admin', icon: Shield, color: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/10 shadow-[0_0_12px_rgba(244,63,94,0.1)]' },
  { key: 'manager', label: 'Manager', icon: Building2, color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.1)]' },
  { key: 'staff', label: 'Staff', icon: User, color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.1)]' },
  { key: 'user', label: 'User', icon: Users, color: 'text-sky-400', border: 'border-sky-500/30', bg: 'bg-sky-500/10 shadow-[0_0_12px_rgba(56,189,248,0.1)]' }
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
      setUsersError(err instanceof Error ? err.message : 'Failed to load the list.');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers(activeRole);
  }, [activeRole, loadUsers]);

  if (!session || session.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  const displayName = session.displayName || '';
  const initials = (displayName || session.email || 'A')[0]?.toUpperCase();

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
    if (!trimmedName) {
      setNameError('Please enter your full name!');
      return;
    }
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(newPhone)) {
      setPhoneError('Phone number must start with 0 and have exactly 10 digits!');
      return;
    }
    updateProfile({ fullName: trimmedName, phone: newPhone });
    setIsEditing(false);
    setSuccess('Profile updated successfully!');
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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Success Notification Alert */}
      {success && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-950/20 px-4 py-3.5 text-sm font-bold text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)] animate-fadeIn">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* ── Section 1: Admin's own profile ─────────────────────────────────── */}
      <div className="relative overflow-hidden flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/8 bg-slate-900/40 p-6 backdrop-blur-md shadow-lg">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 w-40 h-40 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.06),transparent_65%)] pointer-events-none blur-xl" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 shadow-[0_0_12px_rgba(244,63,94,0.15)]">
            <Shield size={20} className="text-rose-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 font-mono">System Administrator</p>
            <h1 className="text-xl font-bold text-white mt-0.5 tracking-tight">My Profile</h1>
          </div>
        </div>
        <div className="flex gap-2.5 relative z-10">
          {!isEditing && (
            <Button
              variant="secondary"
              onClick={handleStartEdit}
              className="gap-2 rounded-xl border border-white/10 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white px-6 h-11 text-xs font-black uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] cursor-pointer"
            >
              <Edit size={14} className="text-rose-400" /> Edit
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              logout();
              navigate('/auth/login', { replace: true });
            }}
            className="gap-2 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 px-6 h-11 text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer"
          >
            <LogOut size={14} /> Logout
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_310px]">
        {/* Left Side: Detail Fields or Edit Form */}
        <div className="rounded-3xl border border-white/8 bg-slate-900/40 p-6 shadow-lg backdrop-blur-md relative overflow-hidden">
          {/* Decorative Corner Glow */}
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.04),transparent_60%)] pointer-events-none blur-2xl" />

          <p className="mb-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 font-mono">Account Information</p>

          {isEditing ? (
            <form onSubmit={handleSave} className="grid gap-5 md:grid-cols-2 relative z-10">
              {/* Họ tên */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User size={15} />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setNameError(null);
                    }}
                    required
                    className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-rose-500/40 focus:ring-1 focus:ring-rose-500/20 transition-all duration-300"
                    placeholder="John Doe"
                  />
                </div>
                {nameError && (
                  <p className="flex items-center gap-1.5 text-xs text-rose-400 mt-1 font-semibold">
                    <AlertCircle size={13} /> {nameError}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5 opacity-60">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail size={15} />
                  </div>
                  <input
                    type="email"
                    value={session.email}
                    disabled
                    className="h-11 w-full rounded-xl border border-white/5 bg-slate-950/20 pl-10 pr-4 text-sm text-slate-400 outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Số điện thoại */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Phone size={15} />
                  </div>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/[^0-9]/g, ''));
                      setPhoneError(null);
                    }}
                    maxLength={10}
                    required
                    className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-rose-500/40 focus:ring-1 focus:ring-rose-500/20 transition-all duration-300"
                    placeholder="0901234567"
                  />
                </div>
                {phoneError && (
                  <p className="flex items-center gap-1.5 text-xs text-rose-400 mt-1 font-semibold leading-normal">
                    <AlertCircle size={13} /> {phoneError}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-end gap-3 pt-3 md:col-span-2">
                <Button
                  type="submit"
                  className="gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-purple-500 text-white font-black text-xs uppercase tracking-wider px-6 h-11 hover:shadow-[0_0_20px_rgba(244,63,94,0.35)] transition-all duration-300 hover:scale-[1.01] cursor-pointer"
                >
                  <Save size={14} className="text-white" /> Save Changes
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancel}
                  className="gap-2 rounded-xl border border-white/10 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-6 h-11 font-black text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer"
                >
                  <X size={14} className="text-slate-400" /> Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 relative z-10">
              {[
                { label: 'Full Name', value: displayName || 'Not updated', icon: User },
                { label: 'Email', value: session.email, icon: Mail },
                { label: 'Phone Number', value: session.phone || 'Not updated', icon: Phone },
                { label: 'Role', value: 'ADMIN', icon: Shield }
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.label}
                    className="flex items-center gap-4 rounded-2xl border border-white/5 bg-slate-950/40 p-4 transition-all duration-300 hover:border-rose-500/20 hover:bg-slate-950/60 hover:shadow-[0_4px_20px_rgba(0,0,0,0.15)] group"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/10 group-hover:scale-105 transition-all duration-300">
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 font-mono">{f.label}</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-200 truncate">{f.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Identity Card Badge */}
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-slate-900/40 p-5 shadow-lg backdrop-blur-md text-center flex flex-col items-center">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-rose-500 via-purple-400 to-rose-500" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-rose-500/10 to-transparent blur-xl pointer-events-none" />

            {/* Avatar container with hover glow */}
            <div className="relative mt-2 group">
              <div className="absolute inset-0 rounded-2xl bg-rose-500/20 blur-md opacity-40 group-hover:opacity-80 transition-all duration-500" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-rose-400/40 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-2xl font-black text-rose-400 shadow-md">
                {initials}
              </div>
            </div>

            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-rose-400 border border-rose-500/20 font-mono">
              <Fingerprint size={10} /> Admin Portal
            </span>

            <h2 className="mt-3 text-base font-extrabold text-white tracking-tight leading-snug truncate max-w-full">
              {displayName || 'Administrator'}
            </h2>
            <p className="text-xs text-slate-400 truncate max-w-full mt-0.5 font-medium">{session.email}</p>
          </div>
        </div>
      </div>

      {/* ── Section 2: User directory ────────────────────────────────────────── */}
      <div className="rounded-3xl border border-white/8 bg-slate-900/40 p-6 backdrop-blur-md shadow-lg relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.03),transparent_60%)] pointer-events-none blur-2xl" />

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10 shadow-[0_0_12px_rgba(56,189,248,0.15)]">
              <Users size={20} className="text-sky-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-500 font-mono">Directory Management</p>
              <h2 className="text-lg font-bold text-white mt-0.5 tracking-tight">User Directory</h2>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={() => void loadUsers(activeRole)}
            className="gap-2 rounded-xl border border-white/10 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white px-5 h-11 text-xs font-black uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] cursor-pointer"
          >
            <RefreshCw size={14} className={usersLoading ? 'animate-spin text-sky-400' : 'text-sky-400'} /> Refresh
          </Button>
        </div>

        {/* Role tabs */}
        <div className="mb-5 flex flex-wrap gap-2.5 relative z-10">
          {ROLE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeRole === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveRole(tab.key);
                  setSearch('');
                }}
                className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                  isActive
                    ? `${tab.border} ${tab.bg} ${tab.color}`
                    : 'border-white/5 bg-slate-950/20 text-slate-400 hover:bg-slate-950/40 hover:text-slate-200'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {isActive && !usersLoading && (
                  <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-mono font-bold ml-1">
                    {filteredUsers.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative z-10">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search by name, email, phone for ${activeTab.label}...`}
            className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-rose-500/40 focus:ring-1 focus:ring-rose-500/20 transition-all duration-300"
          />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {usersError && (
            <div className="flex items-center gap-3 rounded-2xl border border-rose-500/25 bg-rose-950/20 px-4 py-3.5 text-sm font-bold text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.1)] mb-4">
              <AlertCircle size={16} />
              <span>{usersError}</span>
            </div>
          )}

          {usersLoading ? (
            <div className="py-12 text-center text-sm font-bold text-slate-400 tracking-wider font-mono animate-pulse">
              Loading {activeTab.label}...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-white/5 rounded-3xl bg-slate-950/20">
              <activeTab.icon size={36} className="mx-auto mb-3 text-slate-650 opacity-40" />
              <p className="text-sm font-semibold text-slate-400">
                {search ? `No matching ${activeTab.label} found.` : `No ${activeTab.label} yet.`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-950/20">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-slate-950/40 text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono">
                    <th className="py-4 px-5 text-left">Full Name</th>
                    <th className="py-4 px-5 text-left">Email</th>
                    <th className="py-4 px-5 text-left">Phone</th>
                    <th className="py-4 px-5 text-left">Status</th>
                    <th className="py-4 px-5 text-left">Created At</th>
                    {activeRole === 'manager' || activeRole === 'staff' ? (
                      <th className="py-4 px-5 text-left">Building</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="group hover:bg-white/2 transition-colors duration-250">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${activeTab.border} ${activeTab.bg}`}>
                            <span className={`text-xs font-black ${activeTab.color}`}>
                              {(u.fullName?.[0] ?? u.email[0] ?? '?').toUpperCase()}
                            </span>
                          </div>
                          <span className="font-bold text-slate-200 group-hover:text-white transition-colors">
                            {u.fullName || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-slate-450 font-medium">{u.email}</td>
                      <td className="py-3.5 px-5 text-slate-450 font-mono text-xs">{u.phone || '—'}</td>
                      <td className="py-3.5 px-5">
                        <StatusBadge status={u.isActive ? 'active' : 'inactive'} />
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 font-mono text-xs">{fmtDate(u.createdAt)}</td>
                      {activeRole === 'manager' || activeRole === 'staff' ? (
                        <td className="py-3.5 px-5 text-xs text-slate-400 font-semibold">
                          {u.assignedBuildings?.length
                            ? `${u.assignedBuildings.length} buildings`
                            : 'Not assigned'}
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
