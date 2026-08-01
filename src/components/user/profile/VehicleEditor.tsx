import { motion, AnimatePresence } from 'framer-motion';
import { Plus, AlertCircle, CheckCircle2, Car, Bike, X, QrCode, Pencil, Save } from 'lucide-react';
import { CustomSelect } from '@/components/ui/select';
import { MAX_VEHICLES, type ProfileWorkflow } from '@/hooks/user/useProfileWorkflow';
import type { Vehicle } from '@/services/vehicleService';
import { isTwoWheelCategory } from '@/utils/plate';

type VehicleEditorProps = Pick<
  ProfileWorkflow,
  | 'vehicles' | 'vehiclesLoading' | 'category' | 'setCategory' | 'categoryOptions'
  | 'vehicleBrand' | 'setVehicleBrand' | 'customBrand' | 'setCustomBrand'
  | 'editingVehicleId'
  | 'vehicleBrandOptions' | 'plateInput' | 'setPlateInput' | 'plateInputRef'
  | 'plateError' | 'setPlateError' | 'plateSuccess' | 'isSavingVehicle'
  | 'handleAddVehicle' | 'handleRemoveVehicle' | 'handleSetDefaultVehicle'
  | 'handleStartEditVehicle' | 'handleCancelEditVehicle' | 'handleSaveVehicleEdit'
  | 'handlePlateKeyDown'
> & {
  onShowQr?: (vehicle: Vehicle) => void;
};

const labelOf = (options: Array<{ value: string; label: string }>, code: string) =>
  options.find((o) => o.value === code)?.label || code;

/**
 * Quản lý phương tiện trong trang hồ sơ. Mọi thao tác ở đây gọi API ngay lập tức,
 * nên danh sách hiển thị luôn là dữ liệu server đã chấp nhận.
 */
export function VehicleEditor({
  vehicles, vehiclesLoading, category, setCategory, categoryOptions,
  vehicleBrand, setVehicleBrand, customBrand, setCustomBrand,
  editingVehicleId,
  vehicleBrandOptions, plateInput, setPlateInput, plateInputRef,
  plateError, setPlateError, plateSuccess, isSavingVehicle,
  handleAddVehicle, handleRemoveVehicle, handleSetDefaultVehicle,
  handleStartEditVehicle, handleCancelEditVehicle, handleSaveVehicleEdit,
  handlePlateKeyDown, onShowQr,
}: VehicleEditorProps) {
  const isEditing = editingVehicleId !== null;
  const atLimit = vehicles.length >= MAX_VEHICLES;
  // Đang sửa thì luôn hiện form, kể cả khi đã đủ số xe tối đa.
  const showForm = isEditing || !atLimit;

  return (
    <div className="space-y-3 notranslate">
      <div className="flex items-center justify-between">
        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
          Registered vehicles
        </label>
        <span className={`text-[9px] font-black font-mono px-2 py-0.5 rounded-full ${atLimit
          ? 'bg-rose-500/15 text-rose-400'
          : 'bg-slate-800 text-slate-500'
          }`}>
          {vehicles.length}/{MAX_VEHICLES} vehicles
        </span>
      </div>

      <div className="min-h-[44px] flex flex-wrap gap-2 rounded-xl border border-white/10 bg-slate-950/80 p-2.5">
        <AnimatePresence>
          {vehicles.map((item) => {
            const twoWheel = isTwoWheelCategory(item.category);
            return (
              <motion.span
                key={item._id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, x: -8 }}
                transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                whileHover={{ scale: 1.05 }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-black text-xs tracking-wider shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] transition-all duration-300 border ${
                  item.isDefault
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : twoWheel
                      ? 'bg-purple-500/15 border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                      : 'bg-blue-500/15 border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                }`}
              >
                {item.isDefault ? (
                  <span className="text-xs animate-pulse">⭐</span>
                ) : twoWheel ? (
                  <Bike size={11} className="text-purple-400" />
                ) : (
                  <Car size={11} className="text-blue-400" />
                )}
                <span>{item.plateNumber}</span>
                <span className={`text-[8px] px-1.5 py-0.5 rounded font-sans font-extrabold tracking-normal uppercase notranslate ${
                  item.isDefault
                    ? 'bg-amber-500/25 text-amber-300'
                    : twoWheel
                      ? 'bg-purple-500/25 text-purple-300'
                      : 'bg-blue-500/25 text-blue-300'
                }`}>
                  {labelOf(categoryOptions, item.category)}
                </span>
                {item.brand && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded font-sans font-extrabold tracking-normal uppercase bg-slate-700/50 text-slate-300">
                    {item.brand}
                  </span>
                )}
                {onShowQr && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.2 }}
                    onClick={() => onShowQr(item)}
                    className="ml-1.5 rounded p-0.5 text-slate-400 transition-all duration-150 hover:bg-cyan-500/10 hover:text-cyan-400"
                    title={`Show QR code for ${item.plateNumber}`}
                  >
                    <QrCode size={11} className="stroke-[3]" />
                  </motion.button>
                )}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.2 }}
                  onClick={() => handleStartEditVehicle(item)}
                  className={`ml-1 rounded p-0.5 transition-all duration-150 hover:bg-sky-500/10 hover:text-sky-400 ${
                    editingVehicleId === item._id ? 'text-sky-400' : 'text-slate-400'
                  }`}
                  title={`Edit ${item.plateNumber}`}
                >
                  <Pencil size={11} className="stroke-[3]" />
                </motion.button>
                {!item.isDefault && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.2 }}
                    onClick={() => void handleSetDefaultVehicle(item)}
                    className="ml-1 rounded p-0.5 transition-all duration-150 hover:bg-amber-500/10 text-slate-400 hover:text-amber-400"
                    title="Set as default vehicle"
                  >
                    <span className="text-xs font-black">☆</span>
                  </motion.button>
                )}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.2 }}
                  onClick={() => void handleRemoveVehicle(item._id)}
                  className="ml-1 rounded p-0.5 text-slate-400 transition-all duration-150 hover:bg-rose-500/10 hover:text-rose-400"
                  title={`Remove ${item.plateNumber}`}
                >
                  <X size={11} className="stroke-[3]" />
                </motion.button>
              </motion.span>
            );
          })}
        </AnimatePresence>
        {vehicles.length === 0 && (
          <span className="text-[11px] text-slate-600 font-semibold italic self-center pl-1">
            {vehiclesLoading ? 'Loading vehicles…' : 'No vehicles yet…'}
          </span>
        )}
      </div>

      {showForm ? (
        <div className="space-y-3 p-4 rounded-2xl border border-white/5 bg-slate-900/20 shadow-inner">
          {isEditing && (
            <div className="flex items-center justify-between rounded-xl border border-sky-500/20 bg-sky-500/5 px-3 py-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-300 font-mono">
                Editing {vehicles.find((v) => v._id === editingVehicleId)?.plateNumber}
              </span>
              <button
                type="button"
                onClick={handleCancelEditVehicle}
                className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono shrink-0">Type:</span>
            <CustomSelect
              value={category}
              onChange={(val) => {
                setCategory(val as typeof category);
                setVehicleBrand('');
                setCustomBrand('');
              }}
              options={categoryOptions}
              placeholder="— Select vehicle type —"
              className="flex-1 h-10 text-xs sm:text-sm font-semibold"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono shrink-0">Brand:</span>
            <CustomSelect
              value={vehicleBrand}
              onChange={(val) => {
                setVehicleBrand(val);
                if (val !== 'Other') setCustomBrand('');
              }}
              options={vehicleBrandOptions}
              placeholder="— Select brand (required) —"
              className="flex-1 h-10 text-xs sm:text-sm font-semibold"
            />
          </div>

          {vehicleBrand === 'Other' && (
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono shrink-0">Custom brand:</span>
              <input
                type="text"
                value={customBrand}
                onChange={(e) => setCustomBrand(e.target.value)}
                maxLength={50}
                placeholder="Enter your vehicle brand"
                className="flex-1 rounded-xl border border-white/10 bg-slate-950/80 text-white placeholder-slate-600 text-sm h-10 px-3 outline-none transition-all duration-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                autoComplete="off"
              />
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={plateInputRef}
              type="text"
              value={isEditing ? (vehicles.find((v) => v._id === editingVehicleId)?.plateNumber ?? '') : plateInput}
              onChange={(e) => {
                setPlateInput(e.target.value.toUpperCase());
                setPlateError(null);
              }}
              onKeyDown={handlePlateKeyDown}
              // Backend không cho đổi biển số của xe đã đăng ký — xoá rồi thêm lại mới đúng quy trình.
              disabled={isEditing}
              className="flex-1 rounded-xl border border-white/10 bg-slate-950/80 text-white placeholder-slate-600 text-sm h-10 px-4 transition-all duration-300 outline-none font-mono tracking-wider focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="e.g. 59G2-038.80"
              maxLength={12}
              autoComplete="off"
              spellCheck={false}
            />
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              disabled={isSavingVehicle}
              onClick={() => void (isEditing ? handleSaveVehicleEdit() : handleAddVehicle())}
              className="px-4 h-10 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 inline-flex items-center gap-1.5 shrink-0 bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isEditing ? <Save size={14} className="stroke-[3]" /> : <Plus size={14} className="stroke-[3]" />}
              {isSavingVehicle ? 'Saving…' : isEditing ? 'Save' : 'Add'}
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-2.5">
          <AlertCircle size={14} className="text-rose-400 shrink-0" />
          <span className="text-[11px] text-rose-300 font-semibold">Vehicle limit of {MAX_VEHICLES} reached. Remove one to add another.</span>
        </div>
      )}

      <AnimatePresence>
        {plateError && (
          <motion.div
            key="plate-error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-950/20 px-3.5 py-2.5 text-[11px] font-semibold text-rose-400"
          >
            <AlertCircle size={13} className="shrink-0" />
            {plateError}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {plateSuccess && (
          <motion.div
            key="plate-success"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-950/20 px-3.5 py-2.5 text-[11px] font-semibold text-emerald-400"
          >
            <CheckCircle2 size={13} className="shrink-0" />
            {plateSuccess}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-[9px] text-slate-500 font-semibold leading-relaxed">
        * Format: 2 digits + series (<span className="font-mono text-slate-400">A</span> for cars, <span className="font-mono text-slate-400">G2</span> for motorcycles, or <span className="font-mono text-slate-400">LD</span>) + hyphen + 4–5 digits. Examples: <span className="font-mono text-slate-400">30A-97022</span>, <span className="font-mono text-slate-400">59G2-038.80</span>. Every action is saved immediately.
      </p>
    </div>
  );
}
