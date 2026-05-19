import {
  Bell,
  Building2,
  Calendar,
  Car,
  CreditCard,
  LogIn,
  User,
  Wallet,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const iconMap = {
  logIn: LogIn,
  user: User,
  wallet: Wallet,
  building: Building2,
  calendar: Calendar,
  car: Car,
  creditCard: CreditCard,
  bell: Bell,
};

export default function ModuleGrid({ modules, compact = false, onAction }) {
  return (
    <div
      className={cn(
        'grid gap-3',
        compact ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4'
      )}
    >
      {modules.map((module) => {
        const Icon = iconMap[module.icon] || Car;

        return (
          <Card
            key={module.id}
            className={cn('card-interactive', !module.available && 'bg-muted/20')}
          >
            <CardHeader className="space-y-3 pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background">
                  <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                </div>
                <Badge variant={module.available ? 'default' : 'secondary'}>
                  {module.available ? 'Sẵn sàng' : 'Sắp có'}
                </Badge>
              </div>
              <CardTitle className="text-sm font-medium leading-snug">{module.title}</CardTitle>
            </CardHeader>

            <CardContent className="pb-2">
              <p className="text-xs leading-relaxed text-muted-foreground">{module.description}</p>
            </CardContent>

            <CardFooter className="pt-0">
              <Button
                type="button"
                variant={module.available ? 'default' : 'outline'}
                size="sm"
                className="w-full"
                onClick={() => onAction(module)}
              >
                {module.actionLabel}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

