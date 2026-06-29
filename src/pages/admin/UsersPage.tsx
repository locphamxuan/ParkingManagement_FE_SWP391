import { useMemo, useState } from 'react';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { Pencil, Lock, Unlock, Trash2, User, Mail, Phone, Shield, Building2 } from 'lucide-react';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { ModalForm } from '@/components/modals/ModalForm';
import { SearchFilterBar } from '@/components/common/SearchFilterBar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CustomSelect } from '@/components/ui/select';
import { useAdminDataset } from '@/hooks/admin/useAdminDataset';
import {
  createAdminUser,
  deleteAdminUser,
  updateAdminUser,
  updateAdminUserStatus,
} from '@/services/admin/adminCrud';
import { useAuth } from '@/hooks/useAuth';
import type { UserRecord } from '@/types';

export function UsersPage() {
  const { data, isLoading, error, refresh } = useAdminDataset();
  const { session } = useAuth();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDeleteUser, setPendingDeleteUser] = useState<UserRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [form, setForm] = useState<{
    fullName: string;
    email: string;
    password: string;
    phone: string;
    role: 'user' | 'staff' | 'manager' | 'admin';
    buildingId: string;
  }>({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: 'user',
    buildingId: '',
  });

  const filtered = useMemo(() => {
    // Tab Người dùng chỉ quản lý tài khoản khách (role === 'user').
    const source = (data?.users ?? []).filter((user) => user.role === 'user');
    return source.filter((user) => {
      const q = query.trim().toLowerCase();
      const matchQuery =
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.linkedPlates.some((plate) => plate.toLowerCase().includes(q));
      const matchStatus = statusFilter === 'all' || user.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [data?.users, query, statusFilter]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Đang tải danh sách người dùng...</div>;
  }

  if (error || !data) {
    return <div className="text-sm text-red-600">{error || 'Tải người dùng thất bại.'}</div>;
  }

  const token = session?.token || '';

  const openCreateModal = () => {
    setActionError(null);
    setForm({ fullName: '', email: '', password: '', phone: '', role: 'user', buildingId: '' });
    setIsCreating(true);
  };

  const openEditModal = (user: UserRecord) => {
    setActionError(null);
    setForm({
      fullName: user.name,
      email: user.email,
      password: '',
      phone: user.phone || '',
      role: user.role,
      buildingId: '',
    });
    setSelectedUser(user);
  };

  const closeModals = () => {
    setIsCreating(false);
    setSelectedUser(null);
    setActionError(null);
    setIsSaving(false);
  };

  const saveCreate = async () => {
    if (!token) return;
    try {
      setIsSaving(true);
      setActionError(null);
      await createAdminUser(token, {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role: form.role,
        buildingId: form.buildingId || undefined,
      });
      await refresh();
      closeModals();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không thể tạo người dùng');
      setIsSaving(false);
    }
  };

  const saveUpdate = async () => {
    if (!token || !selectedUser) return;
    try {
      setIsSaving(true);
      setActionError(null);
      await updateAdminUser(token, selectedUser.id, {
        fullName: form.fullName,
        phone: form.phone,
      });
      await refresh();
      closeModals();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không thể cập nhật người dùng');
      setIsSaving(false);
    }
  };

  const toggleStatus = async (user: UserRecord) => {
    if (!token) return;
    try {
      setActionError(null);
      await updateAdminUserStatus(token, user.id, user.status !== 'active');
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không thể đổi trạng thái người dùng');
    }
  };

  const confirmDeleteUser = async () => {
    if (!token || !pendingDeleteUser) return;
    try {
      setIsDeleting(true);
      setActionError(null);
      await deleteAdminUser(token, pendingDeleteUser.id);
      await refresh();
      setPendingDeleteUser(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không thể xóa người dùng');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: DataColumn<UserRecord>[] = [
    { key: 'name', title: 'Họ tên' },
    { key: 'email', title: 'Email' },
    { key: 'phone', title: 'Số điện thoại', render: (row) => row.phone || 'Chưa cập nhật' },
    { key: 'status', title: 'Trạng thái', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'walletBalance',
      title: 'Số dư ví',
      render: (row) => `${row.walletBalance.toLocaleString('vi-VN')} ₫`,
    },
    {
      key: 'linkedPlates',
      title: 'Biển số liên kết',
      render: (row) => {
        const plates = row.linkedPlates || [];
        if (plates.length === 0) {
          return <span className="text-muted-foreground italic text-xs">Chưa liên kết</span>;
        }
        return (
          <div className="flex flex-wrap gap-1.5">
            {plates.map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-mono font-black border tracking-wider bg-blue-500/20 border-blue-500/30 text-blue-400"
              >
                {p}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'actions',
      title: 'Hành động',
      render: (row) => (
        <div className="flex items-center gap-1.5 flex-nowrap">
          <button
            onClick={() => openEditModal(row)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:scale-[1.08] active:scale-95 hover:shadow-[0_0_10px_rgba(245,158,11,0.15)] transition-all duration-200"
            title="Sửa"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => toggleStatus(row)}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 hover:scale-[1.08] active:scale-95 ${
              row.status === 'active'
                ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:shadow-[0_0_10px_rgba(244,63,94,0.15)]'
                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:shadow-[0_0_10px_rgba(16,185,129,0.15)]'
            }`}
            title={row.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
          >
            {row.status === 'active' ? <Lock size={16} /> : <Unlock size={16} />}
          </button>
          <button
            onClick={() => setPendingDeleteUser(row)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:scale-[1.08] active:scale-95 hover:shadow-[0_0_10px_rgba(239,68,68,0.15)] transition-all duration-200"
            title="Xóa"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-4">
      {actionError ? <div className="text-sm text-red-600">{actionError}</div> : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <SearchFilterBar
          query={query}
          onQueryChange={setQuery}
          filterValue={statusFilter}
          onFilterChange={setStatusFilter}
          filterOptions={['all', 'active', 'blocked', 'pending']}
        />
        <Button onClick={openCreateModal}>Tạo người dùng</Button>
      </div>

      <DataTable title="Người dùng" rows={filtered} columns={columns} />

      {/* Edit User Modal */}
      <ModalForm
        open={Boolean(selectedUser)}
        onOpenChange={(open) => {
          if (!open) closeModals();
        }}
        title="Cập nhật người dùng"
        onSubmit={saveUpdate}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
          {/* Họ tên */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              Họ tên <span className="text-orange-500 font-extrabold">*</span>
            </label>
            <div className="relative group">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors pointer-events-none">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Nhập họ và tên"
                value={form.fullName}
                onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                className="h-11 w-full pl-10 pr-4 rounded-xl border border-white/10 bg-slate-950/40 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-300 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>

          {/* Số điện thoại */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              Số điện thoại <span className="text-orange-500 font-extrabold">*</span>
            </label>
            <div className="relative group">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors pointer-events-none">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Nhập số điện thoại"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                className="h-11 w-full pl-10 pr-4 rounded-xl border border-white/10 bg-slate-950/40 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-300 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>

          {/* Email (Disabled) */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              Địa chỉ Email
            </label>
            <div className="relative opacity-60">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                disabled
                className="h-11 w-full pl-10 pr-4 rounded-xl border border-white/10 bg-slate-950/20 text-sm text-slate-400 outline-none cursor-not-allowed"
              />
            </div>
          </div>
        </div>
        {isSaving ? <p className="text-xs text-orange-500 animate-pulse mt-3 font-semibold">Đang lưu thay đổi...</p> : null}
      </ModalForm>

      {/* Create User Modal */}
      <ModalForm
        open={isCreating}
        onOpenChange={(open) => {
          if (!open) closeModals();
        }}
        title="Tạo người dùng"
        onSubmit={saveCreate}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
          {/* Họ tên */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              Họ tên <span className="text-orange-500 font-extrabold">*</span>
            </label>
            <div className="relative group">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors pointer-events-none">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Họ tên người dùng"
                value={form.fullName}
                onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                className="h-11 w-full pl-10 pr-4 rounded-xl border border-white/10 bg-slate-950/40 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-300 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>

          {/* Số điện thoại */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              Số điện thoại <span className="text-orange-500 font-extrabold">*</span>
            </label>
            <div className="relative group">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors pointer-events-none">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Số điện thoại"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                className="h-11 w-full pl-10 pr-4 rounded-xl border border-white/10 bg-slate-950/40 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-300 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              Địa chỉ Email <span className="text-orange-500 font-extrabold">*</span>
            </label>
            <div className="relative group">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors pointer-events-none">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                placeholder="Nhập email đăng nhập"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                className="h-11 w-full pl-10 pr-4 rounded-xl border border-white/10 bg-slate-950/40 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-300 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>

          {/* Mật khẩu */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              Mật khẩu <span className="text-orange-500 font-extrabold">*</span>
            </label>
            <div className="relative group">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors pointer-events-none">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder="Nhập mật khẩu"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                className="h-11 w-full pl-10 pr-4 rounded-xl border border-white/10 bg-slate-950/40 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-300 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>

          {/* Vai trò */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-orange-500" />
              Vai trò <span className="text-orange-500 font-extrabold">*</span>
            </label>
            <CustomSelect
              className="h-11 rounded-xl border-white/10 bg-slate-950/40 text-sm text-slate-100 outline-none"
              value={form.role}
              onChange={(val) =>
                setForm((prev) => ({ ...prev, role: val as typeof prev.role, buildingId: '' }))
              }
              options={[
                { value: 'user', label: 'Người dùng' },
                { value: 'staff', label: 'Nhân viên' },
                { value: 'manager', label: 'Quản lý' }
              ]}
            />
          </div>

          {/* Tòa nhà phụ trách */}
          {(form.role === 'staff' || form.role === 'manager') && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-orange-500" />
                Tòa nhà phụ trách <span className="text-orange-500 font-extrabold">*</span>
              </label>
              <CustomSelect
                className="h-11 rounded-xl border-white/10 bg-slate-950/40 text-sm text-slate-100 outline-none"
                value={form.buildingId}
                onChange={(val) => setForm((prev) => ({ ...prev, buildingId: val }))}
                placeholder="-- Chọn tòa nhà --"
                options={[
                  { value: '', label: '-- Chọn tòa nhà --' },
                  ...(data?.buildings ?? []).map((b) => ({
                    value: b.backendId || b.id,
                    label: b.name
                  }))
                ]}
              />
            </div>
          )}
        </div>
        {(form.role === 'staff' || form.role === 'manager') && (
          <p className="mt-3 text-[11px] text-slate-400 italic">
            💡 {form.role === 'staff' ? 'Nhân viên' : 'Quản lý'} sẽ được gán vào tòa nhà đã chọn ngay khi tạo.
            Tài khoản loại này không hiển thị ở danh sách “Người dùng”.
          </p>
        )}
        {isSaving ? <p className="text-xs text-orange-500 animate-pulse mt-3 font-semibold">Đang tạo người dùng...</p> : null}
      </ModalForm>

      <ConfirmModal
        open={Boolean(pendingDeleteUser)}
        title="Xác nhận xóa người dùng"
        description={`Xóa vĩnh viễn tài khoản "${pendingDeleteUser?.name || pendingDeleteUser?.email || ''}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        isConfirming={isDeleting}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteUser(null);
        }}
        onConfirm={confirmDeleteUser}
      />
    </div>
  );
}
