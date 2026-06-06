import { useMemo, useState } from 'react';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { DataTable, type DataColumn } from '@/components/shared/DataTable';
import { ModalForm } from '@/components/shared/ModalForm';
import { SearchFilterBar } from '@/components/shared/SearchFilterBar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
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
    setForm({ fullName: '', email: '', password: '', phone: '' });
    setIsCreating(true);
  };

  const openEditModal = (user: UserRecord) => {
    setActionError(null);
    setForm({
      fullName: user.name,
      email: user.email,
      password: '',
      phone: user.phone || '',
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
        role: 'user',
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
        const locallyUpdatedRaw = localStorage.getItem('pbms.locallyUpdatedUsers');
        const locallyUpdated = locallyUpdatedRaw ? JSON.parse(locallyUpdatedRaw) : {};
        const targetEmail = (row.email || '').trim().toLowerCase();
        const matchingKey = Object.keys(locallyUpdated).find(
          (key) => key.trim().toLowerCase() === targetEmail,
        );
        const localUser = matchingKey ? locallyUpdated[matchingKey] : null;
        const localPlates: Array<{ plateNumber: string; vehicleType: 'car' | 'motorcycle'; isDefault?: boolean }> =
          localUser?.licensePlates || [];

        const plateMap = new Map<string, { vehicleType: 'car' | 'motorcycle'; isDefault?: boolean }>();
        localPlates.forEach((p) => {
          if (p.plateNumber) {
            plateMap.set(p.plateNumber.toUpperCase(), { vehicleType: p.vehicleType, isDefault: p.isDefault });
          }
        });
        (row.linkedPlates || []).forEach((p) => {
          const upper = p.toUpperCase();
          if (!plateMap.has(upper)) {
            plateMap.set(upper, { vehicleType: 'car', isDefault: false });
          }
        });

        const mergedPlates = Array.from(plateMap.entries()).map(([plateNumber, info]) => ({
          plateNumber,
          vehicleType: info.vehicleType,
          isDefault: info.isDefault,
        }));

        if (mergedPlates.length === 0) {
          return <span className="text-muted-foreground italic text-xs">Chưa liên kết</span>;
        }

        return (
          <div className="flex flex-wrap gap-1.5">
            {mergedPlates.map((p) => (
              <span
                key={p.plateNumber}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-mono font-black border tracking-wider ${
                  p.isDefault
                    ? 'bg-amber-500/20 border-amber-500/30 text-amber-500'
                    : p.vehicleType === 'car'
                    ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                    : 'bg-purple-500/20 border-purple-500/30 text-purple-400'
                }`}
                title={p.isDefault ? 'Biển số mặc định' : p.vehicleType === 'car' ? 'Ô tô' : 'Xe máy'}
              >
                <span>{p.vehicleType === 'car' ? '🚗' : '🏍️'}</span>
                <span>{p.plateNumber}</span>
                {p.isDefault && (
                  <span className="text-[8px] font-sans font-extrabold uppercase tracking-normal opacity-95">
                    (Mặc định)
                  </span>
                )}
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
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEditModal(row)}>
            Sửa
          </Button>
          <Button variant="secondary" size="sm" onClick={() => toggleStatus(row)}>
            {row.status === 'active' ? 'Khóa' : 'Mở'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setPendingDeleteUser(row)}>
            Xóa
          </Button>
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
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Họ tên"
            value={form.fullName}
            onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
          />
          <Input placeholder="Email" value={form.email} disabled />
          <Input
            placeholder="Số điện thoại"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          />
        </div>
        {isSaving ? <p className="text-xs text-muted-foreground">Đang lưu...</p> : null}
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
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Họ tên"
            value={form.fullName}
            onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
          />
          <Input
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          />
          <Input
            placeholder="Mật khẩu"
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          />
          <Input
            placeholder="Số điện thoại"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          />
        </div>
        {isSaving ? <p className="text-xs text-muted-foreground">Đang tạo...</p> : null}
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
