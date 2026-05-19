import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ActivityTimelineProps {
  title: string;
  items: string[];
}

export function ActivityTimeline({ title, items }: ActivityTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li
              key={item}
              className="relative border-l border-primary/18 pl-4 text-[0.92rem] leading-6 text-black"
            >
              <span className="absolute -left-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_0_4px_rgba(249,115,22,0.14)]" />
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
