import { motion } from 'framer-motion';
import { AuthPromoPanel } from '@/components/auth/AuthPromoPanel';
import { AuthFeedbackModal } from '@/components/auth/AuthFeedbackModal';
import { AuthSceneBackground } from '@/components/auth/AuthSceneBackground';
import { AuthNoticeBanner } from '@/components/auth/AuthNoticeBanner';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { LoginRegisterForm } from '@/components/auth/LoginRegisterForm';
import { RegisterOtpForm } from '@/components/auth/RegisterOtpForm';
import { useAuthPageForm } from '@/hooks/useAuthPageForm';

export type AuthMode = 'login' | 'register' | 'forgot-password' | 'reset-password';

interface AuthPageProps {
  mode: AuthMode;
  notice: { message?: string; type?: string };
  onModeChange: (mode: AuthMode) => void;
  onBackHome: () => void;
  onSubmit: (input: { mode: AuthMode; payload: Record<string, string> }) => Promise<unknown>;
  isLoading: boolean;
}

export default function AuthPage({ mode, notice, onModeChange, onSubmit, isLoading }: AuthPageProps) {
  const state = useAuthPageForm({ mode, notice, onModeChange, onSubmit });

  return (
    <main
      onMouseMove={state.handleMouseMove}
      onMouseLeave={state.handleMouseLeave}
      className="relative min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 py-12 px-4 overflow-hidden selection:bg-orange-500 selection:text-white"
      style={{ perspective: '1200px' }}
    >
      <AuthSceneBackground />

      {/* Core Center Auth Container with 3D Mouse Tilt */}
      <motion.div
        style={{
          rotateX: state.rotateX,
          rotateY: state.rotateY,
          transformStyle: 'preserve-3d',
        }}
        initial={{ opacity: 0, scale: 0.96, z: -100 }}
        animate={{ opacity: 1, scale: 1, z: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 18 }}
        className="w-full max-w-4xl glass-panel-dark border border-white/5 shadow-2xl rounded-3xl overflow-y-auto md:overflow-hidden max-h-[90vh] md:max-h-none grid grid-cols-1 md:grid-cols-2 relative z-10"
      >
        <AuthPromoPanel title={state.title} description={state.description} />

        {/* Right Input Form Column */}
        <div className="p-8 flex flex-col justify-center bg-white/[0.08] backdrop-blur-2xl border-l border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] relative">
          <AuthNoticeBanner notice={state.displayNotice} />

          {mode === 'forgot-password' ? (
            <ForgotPasswordForm
              forgotEmail={state.forgotEmail}
              setForgotEmail={state.setForgotEmail}
              handleForgotPassword={state.handleForgotPassword}
              handleCancelForgotPassword={state.handleCancelForgotPassword}
              isLoading={isLoading}
            />
          ) : mode === 'reset-password' ? (
            <ResetPasswordForm
              resetPasswordForm={state.resetPasswordForm}
              setResetPasswordForm={state.setResetPasswordForm}
              handleResetPassword={state.handleResetPassword}
              handleCancelResetPassword={state.handleCancelResetPassword}
              showPassword={state.showPassword}
              setShowPassword={state.setShowPassword}
              showConfirmPassword={state.showConfirmPassword}
              setShowConfirmPassword={state.setShowConfirmPassword}
              forgotEmail={state.forgotEmail}
              isLoading={isLoading}
            />
          ) : mode === 'register' && state.otpStep ? (
            <RegisterOtpForm
              otpCode={state.otpCode}
              setOtpCode={state.setOtpCode}
              pendingEmail={state.pendingEmail}
              handleVerifyOtp={state.handleVerifyOtp}
              handleResendOtp={state.handleResendOtp}
              handleCancelOtp={state.handleCancelOtp}
              isLoading={isLoading}
            />
          ) : (
            <LoginRegisterForm
              mode={mode}
              form={state.form}
              handleChange={state.handleChange}
              handleSubmit={state.handleSubmit}
              showPassword={state.showPassword}
              setShowPassword={state.setShowPassword}
              showConfirmPassword={state.showConfirmPassword}
              setShowConfirmPassword={state.setShowConfirmPassword}
              showDropdown={state.showDropdown}
              setShowDropdown={state.setShowDropdown}
              savedAccounts={state.savedAccounts}
              handleSelectAccount={state.handleSelectAccount}
              deleteSavedAccount={state.deleteSavedAccount}
              emailInputRef={state.emailInputRef}
              passwordInputRef={state.passwordInputRef}
              dropdownRef={state.dropdownRef}
              handleGoToForgotPassword={state.handleGoToForgotPassword}
              handleToggleLoginRegister={state.handleToggleLoginRegister}
              isLoading={isLoading}
            />
          )}
        </div>
      </motion.div>

      <AuthFeedbackModal modal={state.modal} onClose={state.closeModal} />
    </main>
  );
}
