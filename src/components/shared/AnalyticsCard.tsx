import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalyticsCardProps {
  label: string;
  value: string;
  delta: string;
  index?: number;
}

export function AnalyticsCard({ label, value, delta, index = 0 }: AnalyticsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.04 }}
    >
      <Card className="h-full">
        <CardHeader className="pb-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-stone-600">{label}</p>
          <CardTitle className="mt-1 text-[1.9rem] leading-none tracking-[-0.05em] text-black">{value}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs font-medium text-primary/90">{delta}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
