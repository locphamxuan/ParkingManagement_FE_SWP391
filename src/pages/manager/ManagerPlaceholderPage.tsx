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
          This space is reserved for an in-depth management module. It can be extended into management forms for each resource, integrating the `/manager/buildings/:buildingId/...` API and displaying data per building.
        </div>
      </CardContent>
    </Card>
  );
}
