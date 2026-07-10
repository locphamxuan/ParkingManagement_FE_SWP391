import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import type { ProfileWorkflow } from '@/hooks/user/useProfileWorkflow';
import { MAX_PLATES } from '@/hooks/user/useProfileWorkflow';

type ProfileSidebarProps = Pick<ProfileWorkflow, 'user'>;

// Cột phải: thẻ tài khoản nhanh, thông tin chi tiết, và chỉ báo số biển số đã liên kết.
export function ProfileSidebar({ user }: ProfileSidebarProps) {
  if (!user) return null;

  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 90, damping: 16, delay: 0.1 }}
      className="rounded-3xl border border-white/5 bg-slate-900/20 p-8 backdrop-blur-md shadow-2xl flex flex-col gap-6 justify-between animate-fadeIn"
    >
      <div className="space-y-6">

        {/* Account Quick Header card */}
        <div className="flex items-center gap-4 rounded-3xl bg-slate-950/60 border border-white/5 p-5 shadow-md">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-slate-950 shadow-[0_0_15px_rgba(249,115,22,0.25)]">
            <User size={24} className="stroke-[2.5]" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 font-mono">Account</p>
            <p className="text-lg font-black text-white leading-tight mt-0.5">{user.fullName || 'New User'}</p>
          </div>
        </div>

        {/* Quick Details List */}
        <div className="space-y-4 rounded-3xl bg-slate-950/40 border border-white/5 p-6 shadow-md">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono">Quick Details</h2>
          <div className="grid gap-3 text-xs text-slate-400">
            <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
              <p className="text-[10px] font-black uppercase text-slate-500 font-mono">Email</p>
              <p className="mt-1 text-slate-200 font-bold">{user.email || 'Not updated'}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
              <p className="text-[10px] font-black uppercase text-slate-500 font-mono">Phone Number</p>
              <p className="mt-1 text-slate-200 font-bold">{user.phone || '— Not updated —'}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
              <p className="text-[10px] font-black uppercase text-slate-500 font-mono">Role</p>
              <p className="mt-1 font-mono uppercase text-orange-400 font-black">{user.role || 'user'}</p>
            </div>
            {user.role === 'user' && (
              <div className="rounded-2xl border border-white/5 bg-slate-950/70 p-4">
                <p className="text-[10px] font-black uppercase text-slate-500 font-mono">Linked Plates</p>
                <p className={`mt-1 font-mono font-black text-sm ${user.licensePlates.length > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {user.licensePlates.length > 0 ? `${user.licensePlates.length}/${MAX_PLATES} plates` : 'None'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Plate count visual indicator */}
        {user.role === 'user' && (
          <div className="rounded-3xl bg-slate-950/40 border border-white/5 p-6 shadow-md space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono">License Plate Slots</h2>
            <div className="flex gap-2">
              {Array.from({ length: MAX_PLATES }).map((_, idx) => {
                const hasPl = idx < user.licensePlates.length;
                return (
                  <div
                    key={idx}
                    className={`flex-1 h-2 rounded-full transition-all duration-500 ${hasPl
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]'
                      : 'bg-slate-800'
                      }`}
                  />
                );
              })}
            </div>
            <p className="text-[9px] text-slate-500 font-semibold">
              {user.licensePlates.length === 0
                ? 'No license plates linked yet.'
                : user.licensePlates.length < MAX_PLATES
                  ? `${MAX_PLATES - user.licensePlates.length} empty slots remaining.`
                  : 'Maximum limit reached.'}
            </p>
          </div>
        )}

      </div>

    </motion.aside>
  );
}
