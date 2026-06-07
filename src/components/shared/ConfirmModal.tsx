import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isConfirming?: boolean;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Xóa',
  cancelLabel = 'Hủy',
  onOpenChange,
  onConfirm,
  isConfirming = false,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title}>
      <div className="grid gap-5">
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        <div className="flex justify-end gap-2.5 border-t border-border pt-4 mt-2">
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            className="rounded-xl px-5 py-2 font-bold text-xs"
          >
            {cancelLabel}
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={isConfirming}
            className="rounded-xl px-5 py-2 font-bold text-xs"
          >
            {isConfirming ? 'Đang xóa...' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
