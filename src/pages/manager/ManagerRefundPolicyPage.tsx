import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type RefundPolicy } from '@/services/manager/managerApi';

interface FormState {
  refundPercent: string;
  isActive: boolean;
}

const toForm = (p: RefundPolicy | null): FormState => ({
  refundPercent: String(p?.refundPercent ?? 80),
  isActive: p?.isActive ?? true,
});

// Chính sách hoàn tiền khi user hủy gói dài hạn (thay trang reservation policy cũ).
export function ManagerRefundPolicyPage() {
  const { buildingId } = useBuildingContext();
  const [policy, setPolicy] = useState<RefundPolicy | null>(null);
  const [form, setForm] = useState<FormState>(toForm(null));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    managerApi.refundPolicy
      .get(buildingId)
      .then((res) => {
        setPolicy(res.data.item);
        setForm(toForm(res.data.item));
      })
      .catch((err) => setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error' }))
      .finally(() => setLoading(false));
  }, [buildingId]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await managerApi.refundPolicy.update(buildingId, {
        refundPercent: Number(form.refundPercent),
        isActive: form.isActive,
      });
      setPolicy(res.data.item);
      setMessage({ type: 'success', text: 'Refund policy saved successfully.' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Package Refund Policy</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-1.5">
              <label className="text-xs uppercase text-muted-foreground">
                % Refund on package cancellation
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
              <p className="text-[11px] text-muted-foreground">
                When a customer cancels a long-term package, this percentage of the remaining value is refunded to their wallet.
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
              <span>Policy is active</span>
            </label>
          </div>

          {policy?._id ? (
            <p className="text-xs text-muted-foreground">
              Editing the current policy ({policy._id.slice(-6)}).
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
            <Button disabled={saving}>{saving ? 'Saving...' : 'Save policy'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
