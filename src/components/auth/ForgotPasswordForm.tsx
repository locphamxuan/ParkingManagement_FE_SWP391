import type { FormEvent } from 'react';
import { motion } from 'framer-motion';
import type { AuthPageFormState } from '@/hooks/useAuthPageForm';

type ForgotPasswordFormProps = Pick<AuthPageFormState, 'forgotEmail' | 'setForgotEmail' | 'handleForgotPassword' | 'handleCancelForgotPassword'> & {
  isLoading: boolean;
};

export function ForgotPasswordForm({
  forgotEmail,
  setForgotEmail,
  handleForgotPassword,
  handleCancelForgotPassword,
  isLoading,
}: ForgotPasswordFormProps) {
  return (
    <form onSubmit={(e: FormEvent<HTMLFormElement>) => handleForgotPassword(e)} className="space-y-4">
      <div className="space-y-2 mb-4">
        <h3 className="text-sm font-bold text-foreground">Recover Password</h3>
        <p className="text-xs text-slate-400">
          We will send a reset password link to your email.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
          Email
        </label>
        <input
          type="email"
          value={forgotEmail}
          onChange={(e) => setForgotEmail(e.target.value)}
          required
          className="block w-full rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm h-11 px-4 transition-all duration-300 outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] input-scan-focus"
          placeholder="user@pbms.vn"
        />
      </div>

      <div className="flex gap-3 pt-3">
        <button
          type="button"
          onClick={handleCancelForgotPassword}
          className="flex-1 h-11 rounded-xl border border-white/10 text-white font-black text-xs uppercase tracking-wider hover:bg-white/10 transition-all"
        >
          Back
        </button>
        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.96 }}
          className="flex-1 h-11 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:shadow-[0_0_25px_rgba(249,115,22,0.45)] disabled:opacity-50 transition-all"
        >
          {isLoading ? 'Sending...' : 'Send reset link'}
        </motion.button>
      </div>
    </form>
  );
}
