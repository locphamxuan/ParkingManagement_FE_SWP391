import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useManagerBuildings } from '@/hooks/useManagerBuildings';
import { managerApi } from '@/services/managerApi';

export function ManagerFeedbackPage() {
  const { session } = useAuth();
  const { selectedBuilding, selectedBuildingId, setSelectedBuildingId, buildings, isLoading, error } = useManagerBuildings();
  const [feedbacks, setFeedbacks] = useState<Array<{ _id: string; subject?: string; status?: string; createdAt?: string; comment?: string }>>([]);
  const [responseText, setResponseText] = useState('');
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadFeedbacks = useCallback(async () => {
    if (!selectedBuildingId || !session?.token) {
      setFeedbacks([]);
      return;
    }

    try {
      const items = await managerApi.listFeedbacks(selectedBuildingId, session.token);
      setFeedbacks(items);
      if (items.length > 0 && !selectedFeedbackId) {
        setSelectedFeedbackId(items[0]._id);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Không thể tải phản hồi.');
    }
  }, [selectedBuildingId, session?.token, selectedFeedbackId]);

  useEffect(() => {
    void loadFeedbacks();
  }, [loadFeedbacks]);

  const selectedFeedback = feedbacks.find((item) => item._id === selectedFeedbackId) ?? null;

  const sendResponse = useCallback(async () => {
    if (!selectedBuildingId || !selectedFeedbackId || !session?.token || !responseText.trim()) {
      setNotice('Vui lòng chọn phản hồi và điền nội dung trả lời.');
      return;
    }
    setIsSaving(true);
    setNotice(null);

    try {
      await managerApi.respondFeedback(selectedBuildingId, selectedFeedbackId, { response: responseText.trim() }, session.token);
      setResponseText('');
      setNotice('Đã gửi phản hồi thành công.');
      await loadFeedbacks();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Gửi phản hồi thất bại.');
    } finally {
      setIsSaving(false);
    }
  }, [selectedBuildingId, selectedFeedbackId, responseText, session?.token, loadFeedbacks]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Phản hồi</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Đang tải tòa nhà...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : buildings.length === 0 ? (
            <p>Không có tòa nhà để xem phản hồi.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-slate-700">Tòa nhà</label>
                <select
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition hover:border-slate-400"
                  value={selectedBuildingId}
                  onChange={(event) => setSelectedBuildingId(event.target.value)}
                >
                  {buildings.map((building) => (
                    <option key={building._id} value={building._id}>
                      {building.name || building.code || 'Tòa nhà không tên'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-700">Phản hồi đang chọn</label>
                <select
                  className="mt-2 w-full rounded-2xl border border-border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition hover:border-slate-400"
                  value={selectedFeedbackId}
                  onChange={(event) => setSelectedFeedbackId(event.target.value)}
                >
                  {feedbacks.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.subject || item.comment || item._id}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedFeedback ? (
        <Card>
          <CardHeader>
            <CardTitle>Chi tiết phản hồi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold text-slate-900">Tiêu đề</p>
              <p className="text-sm text-slate-600">{selectedFeedback.subject || 'Không có tiêu đề'}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Nội dung</p>
              <p className="text-sm text-slate-600">{selectedFeedback.comment || 'Không có nội dung'}</p>
            </div>
            <div className="grid gap-2">
              <label className="text-sm text-slate-600">Phản hồi của quản lý</label>
              <textarea
                value={responseText}
                onChange={(event) => setResponseText(event.target.value)}
                className="min-h-[120px] w-full rounded-2xl border border-border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition hover:border-slate-400"
                placeholder="Nhập câu trả lời cho khách hàng..."
              />
            </div>
            {notice ? <p className="text-sm text-slate-700">{notice}</p> : null}
            <Button onClick={sendResponse} disabled={isSaving || !responseText.trim()}>
              {isSaving ? 'Đang gửi...' : 'Gửi phản hồi'}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
