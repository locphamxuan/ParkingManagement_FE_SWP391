import { useMemo, useState } from 'react';
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
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: 'user' as UserRecord['role'],
  });

  const filtered = useMemo(() => {
    const source = data?.users ?? [];

    return source.filter((user) => {
      const q = query.trim().toLowerCase();
      const matchQuery =
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.linkedPlates.some((plate) => plate.toLowerCase().includes(q));
      const matchRole = roleFilter === 'all' || user.role === roleFilter;
      return matchQuery && matchRole;
    });
  }, [data?.users, query, roleFilter]);

    if (isLoading) {
      return <div className="text-sm text-muted-foreground">Đang tải danh sách người dùng...</div>;
    }

    if (error || !data) {
      return <div className="text-sm text-red-600">{error || 'Tải người dùng thất bại.'}</div>;
    }

  const token = session?.token || '';

  const openCreateModal = () => {
    setActionError(null);
    setForm({
      fullName: '',
      email: '',
      password: '',
      phone: '',
      role: 'user',
    });
    setIsCreating(true);
  };

  const openEditModal = (user: UserRecord) => {
    setActionError(null);
    setForm({
      fullName: user.name,
      email: user.email,
      password: '',
      phone: '',
      role: user.role,
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
        role: form.role,
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

  const removeUser = async (user: UserRecord) => {
    if (!token) return;
    if (!window.confirm(`Xóa người dùng ${user.email}?`)) return;
    try {
      setActionError(null);
      await deleteAdminUser(token, user.id);
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không thể xóa người dùng');
    }
  };

  const columns: DataColumn<UserRecord>[] = [
    { key: 'name', title: 'Người dùng' },
    { key: 'email', title: 'Email' },
    { key: 'role', title: 'Vai trò', render: (row) => <StatusBadge status={row.role} /> },
    { key: 'status', title: 'Trạng thái', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'walletBalance',
      title: 'Số dư ví',
      render: (row) => `${row.walletBalance.toLocaleString()} VND`,
    },
    {
      key: 'linkedPlates',
      title: 'Biển số liên kết',
      render: (row) => row.linkedPlates.join(', '),
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
          <Button variant="ghost" size="sm" onClick={() => removeUser(row)}>
            Xóa
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-4">
      {actionError ? <div className="text-sm text-red-600">{actionError}</div> : null}

      <div className="flex items-center justify-end">
        <Button onClick={openCreateModal}>Tạo người dùng</Button>
      </div>

      <SearchFilterBar
        query={query}
        onQueryChange={setQuery}
        filterValue={roleFilter}
        onFilterChange={setRoleFilter}
        filterOptions={['all', 'admin', 'manager', 'staff', 'user']}
      />

      <DataTable title="Người dùng" rows={filtered} columns={columns} />

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
          <select
            className="h-10 rounded-md border border-border bg-secondary px-3 text-sm text-foreground outline-none"
            value={form.role}
            onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as UserRecord['role'] }))}
          >
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
            <option value="user">User</option>
          </select>
        </div>
        {isSaving ? <p className="text-xs text-muted-foreground">Đang lưu...</p> : null}
      </ModalForm>

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
          <select
            className="h-10 rounded-md border border-border bg-secondary px-3 text-sm text-foreground outline-none md:col-span-2"
            value={form.role}
            onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as UserRecord['role'] }))}
          >
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
            <option value="user">User</option>
          </select>
        </div>
        {isSaving ? <p className="text-xs text-muted-foreground">Đang tạo...</p> : null}
      </ModalForm>
    </div>
  );
}
