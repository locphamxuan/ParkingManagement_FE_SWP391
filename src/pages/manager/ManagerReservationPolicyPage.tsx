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
  depositPercent: string;
  maxAdvanceDays: string;
  maxDurationHours: string;
  overstayPenaltyPercent: string;
  isActive: boolean;
}

const toForm = (p: ReservationPolicy | null): FormState => ({
  maxHoldMinutes: String(p?.maxHoldMinutes ?? 30),
  refundPercent: String(p?.refundPercent ?? 80),
  depositPercent: String(p?.depositPercent ?? 15),
  maxAdvanceDays: String(p?.maxAdvanceDays ?? 7),
  maxDurationHours: String(p?.maxDurationHours ?? 24),
  overstayPenaltyPercent: String(p?.overstayPenaltyPercent ?? 0),
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
        depositPercent: Number(form.depositPercent),
        maxAdvanceDays: Number(form.maxAdvanceDays),
        maxDurationHours: Number(form.maxDurationHours),
        overstayPenaltyPercent: Number(form.overstayPenaltyPercent),
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
            <div className="grid gap-1.5">
              <label className="text-xs uppercase text-muted-foreground">
                % Đặt cọc khi đặt chỗ
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.depositPercent}
                onChange={(e) =>
                  setForm((f) => ({ ...f, depositPercent: e.target.value }))
                }
              />
              <p className="text-[11px] text-muted-foreground">
                Khách trả phần trăm này khi đặt chỗ.
              </p>
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs uppercase text-muted-foreground">
                % Còn lại (thu sau checkout)
              </label>
              <Input
                type="number"
                value={Math.max(0, 100 - Number(form.depositPercent || 0))}
                readOnly
                disabled
                className="cursor-not-allowed opacity-70"
              />
              <p className="text-[11px] text-muted-foreground">
                Hệ thống tự tính = 100% − % đặt cọc. Khách thanh toán phần này khi xe ra (checkout).
              </p>
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs uppercase text-muted-foreground">
                Đặt trước tối đa (ngày)
              </label>
              <Input
                type="number"
                min={1}
                value={form.maxAdvanceDays}
                onChange={(e) => setForm((f) => ({ ...f, maxAdvanceDays: e.target.value }))}
              />
              <p className="text-[11px] text-muted-foreground">
                Khách chỉ được đặt chỗ trước trong khoảng số ngày này.
              </p>
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs uppercase text-muted-foreground">
                Thời lượng tối đa / lượt (giờ)
              </label>
              <Input
                type="number"
                min={1}
                value={form.maxDurationHours}
                onChange={(e) => setForm((f) => ({ ...f, maxDurationHours: e.target.value }))}
              />
              <p className="text-[11px] text-muted-foreground">
                Mỗi lượt đặt chỗ không vượt quá số giờ này.
              </p>
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs uppercase text-muted-foreground">
                % Phạt đậu quá giờ (overstay)
              </label>
              <Input
                type="number"
                min={0}
                value={form.overstayPenaltyPercent}
                onChange={(e) =>
                  setForm((f) => ({ ...f, overstayPenaltyPercent: e.target.value }))
                }
              />
              <p className="text-[11px] text-muted-foreground">
                Phụ phí phạt áp lên phần đỗ quá giờ đặt. 0 = chỉ thu theo giá thường, không phạt.
              </p>
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
