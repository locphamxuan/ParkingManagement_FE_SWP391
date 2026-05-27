import * as Dialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  children: ReactNode;
  
  // legacy/alternative props
  isOpen?: boolean;
  onClose?: () => void;
}

export function Modal({ open, onOpenChange, title, children, isOpen, onClose }: ModalProps) {
  const finalOpen = open ?? isOpen ?? false;
  const finalOnOpenChange = onOpenChange ?? ((o) => { if (!o && onClose) onClose(); });

  return (
    <Dialog.Root open={finalOpen} onOpenChange={finalOnOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-stone-950/40 backdrop-blur-md transition-all duration-300 animate-fadeIn" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-[92vw] max-w-2xl rounded-3xl border border-stone-200/45 bg-white/95 p-6 shadow-2xl backdrop-blur-xl animate-modalFadeIn focus:outline-none'
          )}
        >
          {title ? (
            <div className="mb-5 flex items-center justify-between">
              <Dialog.Title className="text-lg font-black tracking-tight text-stone-850 font-sans">{title}</Dialog.Title>
              <Dialog.Close className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/30">
                <X size={16} />
              </Dialog.Close>
            </div>
          ) : (
            <Dialog.Title className="sr-only">Modal Dialog</Dialog.Title>
          )}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
