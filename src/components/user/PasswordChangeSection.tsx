import { useState } from 'react';
import { AlertCircle, CheckCircle2, KeyRound, Loader2 } from 'lucide-react';
import { userApi } from '@/services/user/userApi';

export function PasswordChangeSection() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.currentPassword || !form.newPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (form.newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setSaving(true);
      await userApi.profile.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSuccess('Password changed successfully!');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password change failed. Check your current password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8 relative z-10">
      <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-md">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound size={16} className="text-orange-400" />
          <h3 className="text-sm font-bold text-white">Change Password</h3>
        </div>
        <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Current Password
            </label>
            <input
              type="password"
              value={form.currentPassword}
              onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))}
              placeholder="••••••••"
              className="h-10 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              New Password
            </label>
            <input
              type="password"
              value={form.newPassword}
              onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
              placeholder="Min 6 characters"
              className="h-10 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Confirm Password
            </label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              placeholder="Retype new password"
              className="h-10 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20"
            />
          </div>
          <div className="sm:col-span-3 flex items-center gap-3 flex-wrap">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2 text-xs font-black uppercase tracking-wider text-slate-950 hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <KeyRound size={12} />}
              {saving ? 'Saving...' : 'Change Password'}
            </button>
            {error && (
              <p className="flex items-center gap-1 text-xs text-rose-400">
                <AlertCircle size={12} /> {error}
              </p>
            )}
            {success && (
              <p className="flex items-center gap-1 text-xs text-emerald-400">
                <CheckCircle2 size={12} /> {success}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
