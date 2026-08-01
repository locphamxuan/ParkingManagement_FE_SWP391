import type { FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import type { AuthPageFormState } from '@/hooks/useAuthPageForm';
import { MIN_PASSWORD_LENGTH } from '@/utils/constants';

type ResetPasswordFormProps = Pick<
  AuthPageFormState,
  | 'resetPasswordForm' | 'setResetPasswordForm' | 'handleResetPassword' | 'handleCancelResetPassword'
  | 'showPassword' | 'setShowPassword' | 'showConfirmPassword' | 'setShowConfirmPassword' | 'forgotEmail'
> & {
  isLoading: boolean;
};

export function ResetPasswordForm({
  resetPasswordForm,
  setResetPasswordForm,
  handleResetPassword,
  handleCancelResetPassword,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  forgotEmail,
  isLoading,
}: ResetPasswordFormProps) {
  return (
    <form onSubmit={(e: FormEvent<HTMLFormElement>) => handleResetPassword(e)} className="space-y-4">
      {/* Hidden email field: helps browser associate the new password with the right account */}
      <input type="hidden" autoComplete="username" value={forgotEmail || ''} />
      <div className="space-y-2 mb-4">
        <h3 className="text-sm font-bold text-foreground">Enter new password</h3>
        <p className="text-xs text-slate-400">
          Password must be at least {MIN_PASSWORD_LENGTH} characters.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
          New password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={resetPasswordForm.newPassword}
            onChange={(e) => setResetPasswordForm((s) => ({ ...s, newPassword: e.target.value }))}
            required
            className="block w-full rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm h-11 pl-4 pr-11 transition-all duration-300 outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] input-scan-focus"
            placeholder="At least 6 characters"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
          Confirm Password
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={resetPasswordForm.confirmPassword}
            onChange={(e) => setResetPasswordForm((s) => ({ ...s, confirmPassword: e.target.value }))}
            required
            className="block w-full rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm h-11 pl-4 pr-11 transition-all duration-300 outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] input-scan-focus"
            placeholder="Retype password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="flex gap-3 pt-3">
        <button
          type="button"
          onClick={handleCancelResetPassword}
          className="flex-1 h-11 rounded-xl border border-white/10 text-white font-black text-xs uppercase tracking-wider hover:bg-white/10 transition-all"
        >
          Cancel
        </button>
        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.96 }}
          className="flex-1 h-11 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:shadow-[0_0_25px_rgba(249,115,22,0.45)] disabled:opacity-50 transition-all"
        >
          {isLoading ? 'Processing...' : 'Reset Password'}
        </motion.button>
      </div>
    </form>
  );
}
