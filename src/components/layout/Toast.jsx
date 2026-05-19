import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const icons = {
  info: Info,
  success: CheckCircle2,
  error: XCircle,
};

const styles = {
  info: 'border-border bg-card text-foreground',
  success: 'border-border bg-card text-foreground',
  error: 'border-destructive/30 bg-destructive/5 text-destructive',
};

export default function Toast({ message, type = 'info', onDismiss }) {
  if (!message) return null;

  const Icon = icons[type] || Info;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 sm:justify-end sm:p-6"
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md border px-4 py-3 text-sm shadow-sm',
          styles[type] || styles.info
        )}
      >
        <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
        <p className="flex-1 leading-snug">{message}</p>
        {onDismiss ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={onDismiss}
            aria-label="Đóng thông báo"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
