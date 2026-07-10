import { Building2, Hash, MapPin, Layers, Coins } from 'lucide-react';
import { ModalForm } from '@/components/modals/ModalForm';
import type { BuildingsManagement } from '@/hooks/admin/useBuildingsManagement';

type BuildingFormModalProps = Pick<
  BuildingsManagement,
  'isModalOpen' | 'closeModal' | 'selectedBuilding' | 'saveBuilding' | 'form' | 'setForm' | 'isSaving'
>;

// Modal tạo/sửa tòa nhà.
export function BuildingFormModal({
  isModalOpen, closeModal, selectedBuilding, saveBuilding, form, setForm, isSaving,
}: BuildingFormModalProps) {
  return (
    <ModalForm
      open={isModalOpen}
      onOpenChange={(open) => {
        if (!open) closeModal();
      }}
      title={selectedBuilding ? 'Edit Building' : 'Create Building'}
      onSubmit={saveBuilding}
    >
      <div className="grid grid-cols-1 md:grid-cols-6 gap-5 py-2">
        {/* Tên tòa nhà */}
        <div className="space-y-2 md:col-span-4">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            Building Name <span className="text-orange-500 font-extrabold">*</span>
          </label>
          <div className="relative group">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors pointer-events-none">
              <Building2 className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Enter building name (e.g. FPT Building)"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="h-11 w-full pl-10 pr-4 rounded-xl border border-white/10 bg-slate-950/40 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-300 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
        </div>

        {/* Mã tòa nhà */}
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            Building Code <span className="text-orange-500 font-extrabold">*</span>
          </label>
          <div className="relative group">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors pointer-events-none">
              <Hash className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="e.g. F001"
              value={form.code}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
              className="h-11 w-full pl-10 pr-4 rounded-xl border border-white/10 bg-slate-950/40 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-300 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 font-mono"
            />
          </div>
        </div>

        {/* Địa chỉ */}
        <div className="space-y-2 md:col-span-6">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            Address <span className="text-orange-500 font-extrabold">*</span>
          </label>
          <div className="relative group">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors pointer-events-none">
              <MapPin className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Enter the building's detailed address"
              value={form.address}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              className="h-11 w-full pl-10 pr-4 rounded-xl border border-white/10 bg-slate-950/40 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-300 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
        </div>

        {/* Số tầng */}
        <div className="space-y-2 md:col-span-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            Number of Floors <span className="text-orange-500 font-extrabold">*</span>
          </label>
          <div className="relative group">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors pointer-events-none">
              <Layers className="w-4 h-4" />
            </span>
            <input
              type="number"
              min="1"
              placeholder="Enter number of floors"
              value={form.floors}
              onChange={(e) => setForm((prev) => ({ ...prev, floors: e.target.value }))}
              className="h-11 w-full pl-10 pr-4 rounded-xl border border-white/10 bg-slate-950/40 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-300 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
        </div>

        {/* Giá theo giờ */}
        {!selectedBuilding ? (
          <div className="space-y-2 md:col-span-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              Hourly Rate (VND) <span className="text-orange-500 font-extrabold">*</span>
            </label>
            <div className="relative group">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors pointer-events-none">
                <Coins className="w-4 h-4" />
              </span>
              <input
                type="number"
                min="0"
                placeholder="Enter the hourly rate"
                value={form.hourlyRate}
                onChange={(e) => setForm((prev) => ({ ...prev, hourlyRate: e.target.value }))}
                className="h-11 w-full pl-10 pr-4 rounded-xl border border-white/10 bg-slate-950/40 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-300 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>
        ) : null}
      </div>
      {isSaving ? <p className="text-xs text-orange-500 animate-pulse mt-3 font-semibold">Saving...</p> : null}
    </ModalForm>
  );
}
