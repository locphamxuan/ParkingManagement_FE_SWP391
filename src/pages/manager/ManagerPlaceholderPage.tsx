import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ManagerPlaceholderPageProps {
  title: string;
  description: string;
}

export function ManagerPlaceholderPage({ title, description }: ManagerPlaceholderPageProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-7 text-slate-600">{description}</p>
        <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-700">
          Đây là không gian dành cho module quản lý chuyên sâu. Bạn có thể mở rộng thành các biểu mẫu quản lý của từng tài nguyên, tích hợp API `/manager/buildings/:buildingId/...` và hiển thị dữ liệu theo tòa nhà.
        </div>
      </CardContent>
    </Card>
  );
}
