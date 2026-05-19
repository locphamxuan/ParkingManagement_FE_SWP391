import type { ReactNode } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

interface ModalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  onSubmit: () => void;
}

export function ModalForm({ open, onOpenChange, title, children, onSubmit }: ModalFormProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title}>
      <div className="grid gap-4">
        {children}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={onSubmit}>Lưu</Button>
        </div>
      </div>
    </Modal>
  );
}
