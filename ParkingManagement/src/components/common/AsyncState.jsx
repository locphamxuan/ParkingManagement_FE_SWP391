import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function AsyncStateSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-11 w-full rounded-md" />
      ))}
    </div>
  );
}

export function AsyncStateEmpty({ title = 'Chưa có dữ liệu', description }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
      <Inbox className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
      <p className="text-sm font-medium">{title}</p>
      {description ? (
        <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

export function AsyncStateError({ message, onRetry }) {
  return (
    <Alert variant="destructive" className="rounded-md">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Không tải được dữ liệu</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <span className="text-sm">{message}</span>
        {onRetry ? (
          <Button type="button" variant="outline" size="sm" className="w-fit" onClick={onRetry}>
            <RefreshCw className="h-3.5 w-3.5" />
            Thử lại
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}

export default function AsyncState({
  status,
  error,
  onRetry,
  loadingRows = 4,
  emptyTitle,
  emptyDescription,
  children,
}) {
  if (status === 'loading' || status === 'idle') {
    return <AsyncStateSkeleton rows={loadingRows} />;
  }

  if (status === 'error') {
    return <AsyncStateError message={error?.message} onRetry={onRetry} />;
  }

  if (status === 'empty') {
    return <AsyncStateEmpty title={emptyTitle} description={emptyDescription} />;
  }

  return children;
}
