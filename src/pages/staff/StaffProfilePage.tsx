import { useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  Edit,
  LogOut,
  Save,
  User,
  X,
  Mail,
  Phone,
  Shield,
  Fingerprint
} from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { Button } from '@/components/ui/button';

export function StaffProfilePage() {
  const { session, user, logout, updateProfile } = useAuth();
  const { building } = useBuildingContext();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!session || session.role !== 'staff') {
    return <Navigate to="/auth/login" replace />;
  }

  const displayName = session.displayName || user?.fullName || '';
  const initials = (displayName || session.email || 'S')[0]?.toUpperCase();

  const handleStartEdit = () => {
    setFullName(displayName);
    setPhone(session.phone || '');
    setNameError(null);
    setPhoneError(null);
    setSuccess(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNameError(null);
    setPhoneError(null);
    setSuccess(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setPhoneError(null);
    setSuccess(null);
    const trimmedName = fullName.trim();
    const newPhone = phone.trim();
    if (!trimmedName) { setNameError('Please enter your full name.'); return; }
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(newPhone)) {
      setPhoneError('Phone number must start with 0 and contain exactly 10 digits.');
      return;
    }
    updateProfile({ fullName: trimmedName, phone: newPhone, licensePlates: session.licensePlates || [] });
    setIsEditing(false);
    setSuccess('Profile updated successfully.');
    setTimeout(() => setSuccess(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Success Notification Alert */}
      {success && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-950/20 px-4 py-3.5 text-sm font-bold text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)] animate-fadeIn">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* Profile Page Header */}
      <div className="relative overflow-hidden flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/8 bg-slate-900/40 p-6 backdrop-blur-md shadow-lg">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 w-40 h-40 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06),transparent_65%)] pointer-events-none blur-xl" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
            <User size={20} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 font-mono">Operations System</p>
            <h1 className="text-xl font-bold text-white mt-0.5 tracking-tight">Personal Profile</h1>
          </div>
        </div>
        <div className="flex gap-2.5 relative z-10">
          {!isEditing && (
            <Button
              variant="secondary"
              onClick={handleStartEdit}
              className="gap-2 rounded-xl border border-white/10 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white px-6 h-11 text-xs font-black uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] cursor-pointer"
            >
              <Edit size={14} className="text-emerald-400" /> Edit
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => { logout(); navigate('/auth/login', { replace: true }); }}
            className="gap-2 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 px-6 h-11 text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer"
          >
            <LogOut size={14} /> Sign Out
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_310px]">
        {/* Left Side: Detail Fields or Edit Form */}
        <div className="rounded-3xl border border-white/8 bg-slate-900/40 p-6 shadow-lg backdrop-blur-md relative overflow-hidden">
          {/* Decorative Corner Glow */}
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.04),transparent_60%)] pointer-events-none blur-2xl" />

          <p className="mb-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 font-mono">Account Information</p>

          {isEditing ? (
            <form onSubmit={handleSave} className="grid gap-5 md:grid-cols-2 relative z-10">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User size={15} />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => { setFullName(e.target.value); setNameError(null); }}
                    required
                    className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-300"
                    placeholder="John Doe"
                  />
                </div>
                {nameError && (
                  <p className="flex items-center gap-1.5 text-xs text-rose-400 mt-1 font-semibold">
                    <AlertCircle size={13} /> {nameError}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5 opacity-60">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail size={15} />
                  </div>
                  <input
                    type="email"
                    value={session.email}
                    disabled
                    className="h-11 w-full rounded-xl border border-white/5 bg-slate-950/20 pl-10 pr-4 text-sm text-slate-400 outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Phone size={15} />
                  </div>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value.replace(/[^0-9]/g, '')); setPhoneError(null); }}
                    maxLength={10}
                    required
                    className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-300"
                    placeholder="0901234567"
                  />
                </div>
                {phoneError && (
                  <p className="flex items-center gap-1.5 text-xs text-rose-400 mt-1 font-semibold leading-normal">
                    <AlertCircle size={13} /> {phoneError}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-end gap-3 pt-3 md:col-span-2">
                <Button
                  type="submit"
                  className="gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-xs uppercase tracking-wider px-6 h-11 hover:shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all duration-300 hover:scale-[1.01] cursor-pointer"
                >
                  <Save size={14} className="text-white" /> Save Changes
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancel}
                  className="gap-2 rounded-xl border border-white/10 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-6 h-11 font-black text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer"
                >
                  <X size={14} className="text-slate-400" /> Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 relative z-10">
              {[
                { label: 'Full Name', value: displayName || 'Not updated', icon: User },
                { label: 'Email', value: session.email, icon: Mail },
                { label: 'Phone Number', value: session.phone || 'Not updated', icon: Phone },
                { label: 'Role', value: 'STAFF', icon: Shield },
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.label}
                    className="flex items-center gap-4 rounded-2xl border border-white/5 bg-slate-950/40 p-4 transition-all duration-300 hover:border-emerald-500/20 hover:bg-slate-950/60 hover:shadow-[0_4px_20px_rgba(0,0,0,0.15)] group"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 group-hover:scale-105 transition-all duration-300">
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 font-mono">{f.label}</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-200 truncate">{f.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Identity Card Badge & Assigned Building */}
        <div className="space-y-4">
          {/* Identity Employee Badge */}
          <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-slate-900/40 p-5 shadow-lg backdrop-blur-md text-center flex flex-col items-center">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent blur-xl pointer-events-none" />

            {/* Avatar container with hover glow */}
            <div className="relative mt-2 group">
              <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 blur-md opacity-40 group-hover:opacity-80 transition-all duration-500" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-emerald-400/40 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-2xl font-black text-emerald-400 shadow-md">
                {initials}
              </div>
            </div>

            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/20 font-mono">
              <Fingerprint size={10} /> Staff Portal
            </span>

            <h2 className="mt-3 text-base font-extrabold text-white tracking-tight leading-snug truncate max-w-full">
              {displayName || 'Staff'}
            </h2>
            <p className="text-xs text-slate-400 truncate max-w-full mt-0.5 font-medium">{session.email}</p>
          </div>

          {/* Assigned Building Card */}
          {building && (
            <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-slate-900/40 p-5 shadow-lg backdrop-blur-md">
              <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tr from-emerald-500/5 to-transparent blur-xl pointer-events-none" />

              <div className="flex items-center gap-2 mb-3.5 relative z-10">
                <Building2 size={14} className="text-emerald-400" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 font-mono">Assigned Building</p>
              </div>

              <div className="space-y-3 relative z-10">
                <div className="rounded-2xl border border-white/5 bg-slate-950/35 px-4 py-3 hover:border-emerald-500/10 transition-all">
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 font-mono">Building Name</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-200">{building.name}</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-slate-950/35 px-4 py-3 hover:border-emerald-500/10 transition-all">
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500 font-mono">Building Code</p>
                  <p className="mt-0.5 font-mono text-sm text-emerald-400 font-extrabold">{building.code}</p>
                </div>
                {building.operatingHours && (
                  <div className="flex items-center gap-2.5 rounded-2xl border border-white/5 bg-slate-950/35 px-4 py-3 hover:border-emerald-500/10 transition-all">
                    <Clock size={13} className="text-emerald-400" />
                    <p className="text-xs font-bold text-slate-300 font-sans">
                      {building.operatingHours.open} – {building.operatingHours.close}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
