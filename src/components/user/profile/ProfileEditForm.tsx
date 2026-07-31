import { motion, AnimatePresence } from 'framer-motion';
import { Save, X, AlertCircle, Loader2 } from 'lucide-react';
import type { ProfileWorkflow } from '@/hooks/user/useProfileWorkflow';
import { VehicleEditor } from './VehicleEditor';
import type { Vehicle } from '@/services/vehicleService';

type ProfileEditFormProps = Pick<
  ProfileWorkflow,
  | 'user' | 'form' | 'setForm' | 'profileError' | 'apiError' | 'isSaving' | 'handleSave' | 'handleCancel'
  | 'vehicles' | 'vehiclesLoading' | 'category' | 'setCategory' | 'categoryOptions'
  | 'vehicleBrand' | 'setVehicleBrand' | 'customBrand' | 'setCustomBrand'
  | 'editingVehicleId'
  | 'vehicleBrandOptions' | 'plateInput' | 'setPlateInput' | 'plateInputRef'
  | 'plateError' | 'setPlateError' | 'plateSuccess' | 'isSavingVehicle'
  | 'handleAddVehicle' | 'handleRemoveVehicle' | 'handleSetDefaultVehicle' | 'handlePlateKeyDown'
  | 'handleStartEditVehicle' | 'handleCancelEditVehicle' | 'handleSaveVehicleEdit'
> & {
  onShowQr: (vehicle: Vehicle) => void;
};

// Form chỉnh sửa hồ sơ: họ tên, số điện thoại, và trình quản lý phương tiện.
export function ProfileEditForm({
  user, form, setForm, profileError, apiError, isSaving, handleSave, handleCancel,
  ...vehicleEditorProps
}: ProfileEditFormProps) {
  return (
    <form onSubmit={handleSave} className="space-y-5 rounded-3xl bg-slate-950/40 p-6 border border-white/5 animate-fadeIn">

      {/* Profile Error Box */}
      <AnimatePresence>
        {profileError && (
          <motion.div
            key="profile-error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-rose-500/25 bg-rose-950/20 p-4 text-xs font-black uppercase tracking-wider font-mono text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.1)] backdrop-blur-md flex items-center gap-3"
          >
            <AlertCircle size={16} />
            {profileError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* API / Network Error Box */}
      <AnimatePresence>
        {apiError && (
          <motion.div
            key="api-error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-rose-500/25 bg-rose-950/20 p-4 text-xs font-semibold font-mono text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.1)] backdrop-blur-md flex items-center gap-3"
          >
            <AlertCircle size={16} className="shrink-0" />
            <span>Connection error: {apiError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Name */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Full Name</label>
        <input
          type="text"
          value={form.fullName}
          onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))}
          required
          className="block w-full rounded-xl border border-white/10 bg-slate-950/80 text-white placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] text-sm h-11 px-4 transition-all duration-300 outline-none"
          placeholder="John Doe"
        />
      </div>

      {/* Phone */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Phone Number</label>
        <input
          type="text"
          value={form.phone}
          onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
          className="block w-full rounded-xl border border-white/10 bg-slate-950/80 text-white placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] text-sm h-11 px-4 transition-all duration-300 outline-none"
          placeholder="Example: 0901234567"
        />
      </div>

      {/* ── Quản lý phương tiện (mỗi thao tác lưu ngay) ─────────────── */}
      {user?.role === 'user' && <VehicleEditor {...vehicleEditorProps} />}

      <div className="flex gap-3 pt-3 border-t border-white/5">
        <button
          type="submit"
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(249,115,22,0.35)] inline-flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isSaving ? (
            <><Loader2 size={13} className="animate-spin stroke-[2.5]" />Saving...</>
          ) : (
            <><Save size={13} className="stroke-[2.5]" />Save Changes</>
          )}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 hover:border-white/20 inline-flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <X size={13} className="stroke-[2.5]" />
          Cancel
        </button>
      </div>
    </form>
  );
}
