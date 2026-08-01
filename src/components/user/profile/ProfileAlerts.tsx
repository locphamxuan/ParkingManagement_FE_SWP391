import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import type { ProfileWorkflow } from '@/hooks/user/useProfileWorkflow';

type ProfileAlertsProps = Pick<
  ProfileWorkflow,
  'successMessage'
>;

// Banner thông báo thành công (sau khi lưu). Cảnh báo hồ sơ thiếu thông tin đã được gỡ bỏ theo yêu cầu của người dùng.
export function ProfileAlerts({ successMessage }: ProfileAlertsProps) {
  return (
    <>
      {/* Success Alert Banner */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-4 text-xs font-black uppercase tracking-wider font-mono text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)] backdrop-blur-md flex items-center gap-3 notranslate"
          >
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
