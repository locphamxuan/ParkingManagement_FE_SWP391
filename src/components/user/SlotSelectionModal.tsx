import { motion, AnimatePresence } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { ParkingMap2D } from '@/components/map/ParkingMap2D';
import { CustomSelect } from '@/components/ui/select';
import type { FloorAvailability } from '@/services/user/userApi';
import type { VehicleKind } from '@/pages/user/reservationsHelper';

interface MappedSlot {
  _id: string;
  buildingId: string;
  code: string;
  floorCode?: string;
  vehicleType: VehicleKind | 'all';
  reservable: boolean;
  status: string;
}

interface SlotSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFloorIdModal: string;
  setSelectedFloorIdModal: (val: string) => void;
  slots: MappedSlot[];
  selectedSlot: string | null;
  setSelectedSlot: (val: string | null) => void;
  unavailableSlotCodes: string[];
  unsupportedSlotCodes: string[];
  onSlotClick: (code: string) => void;
  isLoadingSlots: boolean;
  floorsError: string;
  floorsData: FloorAvailability[];
  selectedVehicleType: VehicleKind | '';
}

export function SlotSelectionModal({
  isOpen,
  onClose,
  selectedFloorIdModal,
  setSelectedFloorIdModal,
  slots,
  selectedSlot,
  setSelectedSlot,
  unavailableSlotCodes,
  unsupportedSlotCodes,
  onSlotClick,
  isLoadingSlots,
  floorsError,
  floorsData,
  selectedVehicleType,
}: SlotSelectionModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] w-full max-w-5xl overflow-auto rounded-3xl glass-panel-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.18)] sm:p-6"
          >
            <ParkingMap2D
              interactive
              slots={
                selectedFloorIdModal
                  ? slots.map((s) => ({
                      code: s.code,
                      status: s.status === 'available' && s.reservable ? 'available' : 'unavailable',
                      vehicleType: s.vehicleType === 'all' ? undefined : s.vehicleType,
                    }))
                  : []
              }
              selectedSlot={selectedSlot}
              unavailableSlots={unavailableSlotCodes}
              unsupportedSlots={unsupportedSlotCodes}
              onSlotClick={onSlotClick}
              onConfirm={onClose}
              onClose={onClose}
              className="w-full bg-transparent p-0 border-none rounded-none shadow-none"
              placeholder={
                !selectedFloorIdModal ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <MapPin size={36} className="text-slate-400 mb-3 animate-pulse" />
                    <span className="text-sm font-semibold">Vui lòng chọn tầng để hiển thị sơ đồ ô đỗ</span>
                  </div>
                ) : isLoadingSlots ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent mb-3" />
                    <span className="text-sm font-semibold">Đang tải danh sách ô đỗ...</span>
                  </div>
                ) : null
              }
            >
              {/* Floor selector & Guide note */}
              <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="flex-1">
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Khu vực / Tầng
                  </span>
                  {floorsError ? (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                      {floorsError}
                    </div>
                  ) : (
                    <CustomSelect
                      value={selectedFloorIdModal}
                      onChange={(val) => {
                        setSelectedFloorIdModal(String(val || ''));
                        setSelectedSlot(null);
                      }}
                      options={[
                        { value: '', label: '-- Chọn tầng --' },
                        ...floorsData.map((f) => ({
                          value: f._id,
                          label: `Tầng ${f.code || f.name || ''} (${f.availableSlots}/${f.totalSlots})`,
                        })),
                      ]}
                      placeholder="-- Chọn tầng --"
                    />
                  )}
                </div>
                {selectedVehicleType && (
                  <div className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 text-xs text-slate-600 flex items-center gap-2 max-w-md shadow-sm">
                    <span>
                      Bản đồ đang lọc theo <strong>{selectedVehicleType === 'car' ? 'Ô tô' : 'Xe máy'}</strong>. Các
                      ô đỗ không phù hợp sẽ tự động mờ đi.
                    </span>
                  </div>
                )}
              </div>
            </ParkingMap2D>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
