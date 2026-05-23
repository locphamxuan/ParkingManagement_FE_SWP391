import type { MonitoringMetric } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/StatusBadge';

interface MonitoringWidgetProps {
  metric: MonitoringMetric;
}

export function MonitoringWidget({ metric }: MonitoringWidgetProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-stone-600">{metric.label}</p>
          <p className="mt-1 text-xl font-semibold text-black">{metric.value}</p>
          <p className="text-xs text-stone-700">{metric.trend}</p>
        </div>
        <StatusBadge status={metric.status} />
      </CardContent>
    </Card>
  );
}
