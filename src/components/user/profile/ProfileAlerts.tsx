import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import type { ProfileWorkflow } from '@/hooks/user/useProfileWorkflow';

type ProfileAlertsProps = Pick<ProfileWorkflow, 'successMessage' | 'hasMissingInfo' | 'isEditing' | 'user'>;

// Banner thông báo thành công (sau khi lưu) + cảnh báo hồ sơ thiếu thông tin.
export function ProfileAlerts({ successMessage, hasMissingInfo, isEditing, user }: ProfileAlertsProps) {
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
            className="mb-6 rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-4 text-xs font-black uppercase tracking-wider font-mono text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)] backdrop-blur-md flex items-center gap-3"
          >
            <CheckCircle2 size={16} />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warning Alert Box when licensePlates is empty or phone missing */}
      <AnimatePresence>
        {hasMissingInfo && !isEditing && user && (
          <motion.div
            key="warning"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 shadow-lg shadow-amber-500/5 flex items-start gap-4"
          >
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
              <ShieldAlert size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 font-mono">Incomplete Profile Information</h4>
              <p className="text-[11px] text-amber-200/80 mt-1 font-semibold leading-relaxed">
                {!user.phone || user.phone.trim() === ''
                  ? 'Your account has no phone number.'
                  : ''}
                {user.licensePlates.length === 0
                  ? ' No license plate is linked to your account.'
                  : ''}
                {' '}Please click "Edit Profile" to update, so the PBMS system can automatically recognize you at control gates.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
