import { useCallback, useEffect, useState } from 'react';
import { Crown, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type DataColumn } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ModalForm } from '@/components/shared/ModalForm';
import { adminApi, type AdminSubscriptionPackage } from '@/services/admin/adminApi';

interface FormState {
  name: string;
  price: string;
  durationDays: string;
  description: string;
  features: string;
  isActive: boolean;
}

const empty: FormState = {
  name: '',
  price: '0',
  durationDays: '30',
  description: '',
  features: '',
  isActive: true,
};

const fmtVnd = (n: number) => `${n.toLocaleString('vi-VN')} ₫`;

export function SubscriptionPackagesPage() {
  const [items, setItems] = useState<AdminSubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminSubscriptionPackage | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.subscriptionPackages.list();
      setItems((res as { data?: { items: AdminSubscriptionPackage[] } })?.data?.items ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tải danh sách gói thất bại');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setModalOpen(true);
  };

  const openEdit = (row: AdminSubscriptionPackage) => {
    setEditing(row);
    setForm({
      name: row.name,
      price: String(row.price),
      durationDays: String(row.durationDays),
      description: row.description ?? '',
      features: (row.features ?? []).join('\n'),
      isActive: row.isActive,
    });
    setModalOpen(true);
  };

  const onSubmit = async () => {
    if (saving) return;
    if (!form.name.trim()) {
      alert('Nhập tên gói');
      return;
    }
    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      durationDays: Number(form.durationDays),
      description: form.description.trim(),
      features: form.features
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean),
      isActive: form.isActive,
    };
    setSaving(true);
    try {
      if (editing) {
        await adminApi.subscriptionPackages.update(editing._id, payload);
      } else {
        await adminApi.subscriptionPackages.create(payload);
      }
      setModalOpen(false);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (row: AdminSubscriptionPackage) => {
    if (!window.confirm(`Xóa gói "${row.name}"?`)) return;
    try {
      await adminApi.subscriptionPackages.remove(row._id);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  };

  const columns: DataColumn<AdminSubscriptionPackage>[] = [
    { key: 'name', title: 'Tên gói' },
    { key: 'durationDays', title: 'Thời hạn (ngày)' },
    { key: 'price', title: 'Giá', render: (row) => fmtVnd(row.price) },
    {
      key: 'features',
      title: 'Quyền lợi',
      render: (row) => <span className="text-xs text-muted-foreground">{(row.features?.length ?? 0)} mục</span>,
    },
    {
      key: 'isActive',
      title: 'Trạng thái',
      render: (row) => <StatusBadge status={row.isActive ? 'active' : 'inactive'} />,
    },
    {
      key: 'actions',
      title: '',
      render: (row) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>
            <Pencil size={14} />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(row)}>
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown size={18} className="text-amber-400" />
          <div>
            <h3 className="font-semibold text-foreground">Gói dịch vụ hệ thống</h3>
            <p className="text-xs text-muted-foreground">
              Các gói thuê bao mà quản lý tòa nhà mua để sử dụng hệ thống (giống gói phần mềm theo tháng).
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={refresh} className="gap-2 text-xs">
            <RefreshCw size={13} /> Làm mới
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <Plus size={14} /> Thêm gói
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-500">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw size={14} className="animate-spin" /> Đang tải...
        </div>
      ) : (
        <DataTable title="Danh sách gói" rows={items} columns={columns} />
      )}

      <ModalForm
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Sửa gói dịch vụ' : 'Thêm gói dịch vụ'}
        onSubmit={onSubmit}
      >
        <div className="grid gap-3 md:grid-cols-2 text-slate-100">
          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Tên gói</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="VD: Gói Tiêu chuẩn / Gói Pro"
              className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-orange-500/40"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Giá (VND)</label>
            <Input
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-orange-500/40"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Thời hạn (ngày)</label>
            <Input
              type="number"
              min={1}
              value={form.durationDays}
              onChange={(e) => setForm((f) => ({ ...f, durationDays: e.target.value }))}
              className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-orange-500/40"
            />
          </div>
          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Mô tả</label>
            <Input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-orange-500/40"
            />
          </div>
          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
              Quyền lợi của gói (mỗi dòng 1 mục)
            </label>
            <textarea
              value={form.features}
              onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
              rows={4}
              placeholder={'Toàn quyền quản lý tòa nhà\nBáo cáo doanh thu chi tiết\nHỗ trợ ưu tiên'}
              className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-orange-500/40 placeholder-slate-600"
            />
          </div>
          <label className="flex items-center gap-3 text-xs font-bold text-slate-300 md:col-span-2 select-none">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="w-4 h-4 rounded border-white/10 bg-slate-950 text-orange-500 focus:ring-0 cursor-pointer"
            />
            <span>Đang mở bán</span>
          </label>
        </div>
      </ModalForm>
    </div>
  );
}
