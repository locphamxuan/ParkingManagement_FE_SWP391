import type { FormEvent } from 'react';
import { motion } from 'framer-motion';
import type { AuthPageFormState } from '@/hooks/useAuthPageForm';

type RegisterOtpFormProps = Pick<
  AuthPageFormState,
  'otpCode' | 'setOtpCode' | 'pendingEmail' | 'handleVerifyOtp' | 'handleResendOtp' | 'handleCancelOtp'
> & {
  isLoading: boolean;
};

/**
 * Bước 2 của đăng ký. Tài khoản CHƯA tồn tại ở bước này — nó chỉ được tạo khi mã
 * khớp, nên rời màn hình mà chưa nhập mã thì không để lại tài khoản treo nào.
 */
export function RegisterOtpForm({
  otpCode,
  setOtpCode,
  pendingEmail,
  handleVerifyOtp,
  handleResendOtp,
  handleCancelOtp,
  isLoading,
}: RegisterOtpFormProps) {
  return (
    <form onSubmit={(e: FormEvent<HTMLFormElement>) => handleVerifyOtp(e)} className="space-y-4">
      <div className="space-y-2 mb-4">
        <h3 className="text-sm font-bold text-foreground">Verify Your Email</h3>
        <p className="text-xs text-slate-400">
          We sent a 6-digit code to{' '}
          <span className="text-orange-400 font-semibold break-all">{pendingEmail}</span>. The code
          expires shortly — check your spam folder if it does not arrive.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
          Verification code
        </label>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
          required
          className="block w-full rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-center text-lg font-mono tracking-[0.5em] h-11 px-4 transition-all duration-300 outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] input-scan-focus"
          placeholder="000000"
        />
      </div>

      <div className="flex gap-3 pt-3">
        <button
          type="button"
          onClick={handleCancelOtp}
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
          {isLoading ? 'Verifying...' : 'Create account'}
        </motion.button>
      </div>

      <button
        type="button"
        onClick={handleResendOtp}
        disabled={isLoading}
        className="w-full text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-orange-400 disabled:opacity-50 transition-colors"
      >
        Resend code
      </button>
    </form>
  );
}
