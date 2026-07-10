import type { FormEvent, ChangeEvent } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { motion } from 'framer-motion';
import type { AuthMode } from '@/pages/AuthPage';
import type { AuthPageFormState } from '@/hooks/useAuthPageForm';
import { AuthSocialButtons } from '@/components/auth/AuthSocialButtons';

type LoginRegisterFormProps = Pick<
  AuthPageFormState,
  | 'form' | 'handleChange' | 'handleSubmit' | 'showPassword' | 'setShowPassword'
  | 'showConfirmPassword' | 'setShowConfirmPassword' | 'showDropdown' | 'setShowDropdown'
  | 'savedAccounts' | 'handleSelectAccount' | 'deleteSavedAccount'
  | 'emailInputRef' | 'passwordInputRef' | 'dropdownRef'
  | 'handleGoToForgotPassword' | 'handleToggleLoginRegister'
> & {
  mode: AuthMode;
  isLoading: boolean;
};

// Form đăng nhập/đăng ký (mode 'login' | 'register') — mặc định của AuthPage.
export function LoginRegisterForm({
  mode,
  form,
  handleChange,
  handleSubmit,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  showDropdown,
  setShowDropdown,
  savedAccounts,
  handleSelectAccount,
  deleteSavedAccount,
  emailInputRef,
  passwordInputRef,
  dropdownRef,
  handleGoToForgotPassword,
  handleToggleLoginRegister,
  isLoading,
}: LoginRegisterFormProps) {
  return (
    <form onSubmit={(e: FormEvent<HTMLFormElement>) => handleSubmit(e)} className="space-y-4">
      {mode === 'register' && (
        <>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Full Name</label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange as (e: ChangeEvent<HTMLInputElement>) => void}
              required
              className="block w-full rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm h-11 px-4 transition-all duration-300 outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] input-scan-focus"
              placeholder="John Doe"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Phone Number</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange as (e: ChangeEvent<HTMLInputElement>) => void}
              required
              className="block w-full rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm h-11 px-4 transition-all duration-300 outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] input-scan-focus"
              placeholder="0901234567"
            />
          </div>
        </>
      )}

      <div className="space-y-1.5 relative">
        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Email</label>
        {/* Hidden input to hold username for browser password manager association */}
        <input
          type="text"
          name="username"
          autoComplete="username"
          value={form.email}
          readOnly
          tabIndex={-1}
          aria-hidden="true"
          style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1, pointerEvents: 'none' }}
        />
        <input
          ref={emailInputRef}
          name="email"
          value={form.email}
          onChange={handleChange as (e: ChangeEvent<HTMLInputElement>) => void}
          type="email"
          required
          autoComplete="one-time-code"
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setShowDropdown(false)}
          className="block w-full rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm h-11 px-4 transition-all duration-300 outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] input-scan-focus"
          placeholder="user@pbms.vn"
        />

        {/* Custom Cyberpunk Saved Accounts Dropdown */}
        {showDropdown && savedAccounts.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute left-0 right-0 top-[68px] z-50 rounded-xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-md overflow-hidden py-1.5 animate-fadeIn"
          >
            <div className="px-3.5 py-1.5 border-b border-white/5 text-[9px] font-mono text-slate-500 tracking-wider uppercase font-black">
              Saved Accounts
            </div>
            {savedAccounts.map((acc) => (
              <div
                key={acc.email}
                onMouseDown={(e) => handleSelectAccount(e, acc)}
                className="flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-900 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer group"
              >
                <span className="font-medium tracking-wide truncate max-w-[85%]">{acc.email}</span>
                <button
                  type="button"
                  onMouseDown={(e) => deleteSavedAccount(e, acc.email)}
                  className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200"
                  title="Delete this account"
                >
                  <X size={12} className="stroke-[3]" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Password</label>
        <div className="relative">
          <input
            ref={passwordInputRef}
            name="password"
            value={form.password}
            onChange={handleChange as (e: ChangeEvent<HTMLInputElement>) => void}
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
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

      {mode === 'login' && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleGoToForgotPassword}
            className="text-xs font-semibold text-slate-400 hover:text-orange-400 transition-colors"
          >
            Forgot password?
          </button>
        </div>
      )}

      {mode === 'register' && (
        <div className="space-y-1.5 animate-fadeIn">
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Confirm Password</label>
          <div className="relative">
            <input
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange as (e: ChangeEvent<HTMLInputElement>) => void}
              type={showConfirmPassword ? 'text' : 'password'}
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
      )}

      <div className="flex flex-col gap-4 pt-3">
        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.96 }}
          className="w-full h-11 rounded-xl text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:shadow-[0_0_25px_rgba(249,115,22,0.45)] disabled:opacity-50"
        >
          {isLoading
            ? 'Processing...'
            : mode === 'login'
            ? 'Login'
            : 'Register'}
        </motion.button>

        <div className="text-center">
          <button
            type="button"
            onClick={handleToggleLoginRegister}
            className="text-xs font-bold text-slate-400 hover:text-orange-400 underline transition-colors"
          >
            {mode === 'login' ? 'Create new account' : 'Already have an account? Login'}
          </button>
        </div>

        {mode === 'login' && (
          <div className="mt-2 space-y-4 animate-fadeIn">
            {/* Divider */}
            <div className="flex items-center my-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="px-3 text-[9px] font-mono text-slate-500 tracking-widest uppercase font-black">
                Or sign in with
              </span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <AuthSocialButtons />
          </div>
        )}
      </div>
    </form>
  );
}
