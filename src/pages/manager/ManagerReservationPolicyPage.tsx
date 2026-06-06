import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type ReservationPolicy } from '@/services/manager/managerApi';

interface FormState {
  maxHoldMinutes: string;
  refundPercent: string;
  isActive: boolean;
}

const toForm = (p: ReservationPolicy | null): FormState => ({
  maxHoldMinutes: String(p?.maxHoldMinutes ?? 30),
  refundPercent: String(p?.refundPercent ?? 80),
  isActive: p?.isActive ?? true,
});

export function ManagerReservationPolicyPage() {
  const { buildingId } = useBuildingContext();
  const [policy, setPolicy] = useState<ReservationPolicy | null>(null);
  const [form, setForm] = useState<FormState>(toForm(null));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    managerApi.reservationPolicy
      .get(buildingId)
      .then((res) => {
        setPolicy(res.data.item);
        setForm(toForm(res.data.item));
      })
      .catch((err) => setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Lỗi' }))
      .finally(() => setLoading(false));
  }, [buildingId]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await managerApi.reservationPolicy.update(buildingId, {
        maxHoldMinutes: Number(form.maxHoldMinutes),
        refundPercent: Number(form.refundPercent),
        isActive: form.isActive,
      });
      setPolicy(res.data.item);
      setMessage({ type: 'success', text: 'Lưu chính sách đặt chỗ thành công.' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Lưu thất bại',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-sm text-muted-foreground">Đang tải...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chính sách đặt chỗ trước</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-1.5">
              <label className="text-xs uppercase text-muted-foreground">
                Thời gian giữ tối đa (phút)
              </label>
              <Input
                type="number"
                min={0}
                value={form.maxHoldMinutes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, maxHoldMinutes: e.target.value }))
                }
              />
              <p className="text-[11px] text-muted-foreground">
                Đặt chỗ tự hủy nếu khách không check-in trong khoảng này.
              </p>
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs uppercase text-muted-foreground">
                % Hoàn tiền khi hủy
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.refundPercent}
                onChange={(e) =>
                  setForm((f) => ({ ...f, refundPercent: e.target.value }))
                }
              />
            </div>
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isActive: e.target.checked }))
                }
              />
              <span>Cho phép khách đặt chỗ trước</span>
            </label>
          </div>

          {policy?._id ? (
            <p className="text-xs text-muted-foreground">
              Đang chỉnh sửa chính sách hiện hành ({policy._id.slice(-6)}).
            </p>
          ) : null}

          {message ? (
            <p
              className={`text-sm ${
                message.type === 'success' ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {message.text}
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu chính sách'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
