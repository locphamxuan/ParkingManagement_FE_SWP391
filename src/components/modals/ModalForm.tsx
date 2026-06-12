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
      <div className="grid gap-5">
        <div className="text-slate-200 text-sm leading-relaxed">{children}</div>
        <div className="flex justify-end gap-2.5 border-t border-white/10 pt-4 mt-2">
          <Button 
            variant="secondary" 
            onClick={() => onOpenChange(false)}
            className="rounded-xl px-5 py-2 font-bold text-xs transition-all duration-200"
          >
            Hủy
          </Button>
          <Button 
            onClick={onSubmit}
            className="rounded-xl px-5 py-2 font-bold text-xs bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/10 transition-all duration-200 hover:scale-[1.01]"
          >
            Lưu
          </Button>
        </div>
      </div>
    </Modal>
  );
}
