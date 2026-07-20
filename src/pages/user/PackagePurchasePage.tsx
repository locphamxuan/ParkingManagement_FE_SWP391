import { Navigate } from 'react-router-dom';

import { usePackagePurchase } from '@/hooks/user/usePackagePurchase';

import { SlotSelectionModal } from '@/components/user/SlotSelectionModal';
import { BookingNotificationModal } from '@/components/user/BookingNotificationModal';
import { BookingSummarySidebar } from '@/components/user/BookingSummarySidebar';
import { BasicInfoPanel } from '@/components/user/reservations/BasicInfoPanel';
import { PackageBookingPanel } from '@/components/user/reservations/PackageBookingPanel';
import { SlotPickerPanel, PackageInfoPanel } from '@/components/user/reservations/SlotPickerPanel';
import { BookingFooter } from '@/components/user/reservations/BookingFooter';

/* ─── Trang mua gói dài hạn ─────────────────────────────────────────────────── */

export default function PackagePurchasePage() {
  const b = usePackagePurchase();

  if (!b.session || !b.user) return <Navigate to="/auth/login" replace />;

  return (
    <main className="relative z-10">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">Buy Long-term Package</h1>
          <p className="mt-1 text-xs font-semibold text-slate-400">Pick a building, choose a package, and optionally reserve a fixed slot.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Left: purchase form */}
          <div className="space-y-5">
            <BasicInfoPanel
              rows={b.rows}
              selectedBuildingId={b.selectedBuildingId}
              onBuildingChange={b.handleBuildingChange}
              selectedVehicleType={b.selectedVehicleType}
              onVehicleTypeChange={b.handleVehicleTypeChange}
              selectedPlate={b.selectedPlate}
              onPlateChange={b.setSelectedPlate}
              plateOptions={b.plateOptions}
            />

            <PackageBookingPanel
              disabled={!b.selectedVehicleType}
              packages={b.packages}
              isLoading={b.isLoadingBuildings}
              selectedPkg={b.selectedPkg}
              onSelectPackage={b.handleSelectPackage}
              selectedVehicleType={b.selectedVehicleType}
            />

            {/* Chọn slot cố định (tùy chọn) — chỉ hiện khi đã chọn gói. */}
            {b.selectedPkg && (
              <SlotPickerPanel
                disabled={!b.selectedVehicleType}
                selectedBuildingId={b.selectedBuildingId}
                selectedSlot={b.selectedSlot}
                onOpenSlotModal={() => b.setShowSlotModal(true)}
              />
            )}

            <PackageInfoPanel selectedPkg={b.selectedPkg} />
          </div>

          {/* Right: summary */}
          <BookingSummarySidebar
            selectedBuildingName={b.selectedBuilding?.building.name}
            mode="package"
            selectedPkgName={b.selectedPkg?.name}
            selectedVehicleType={b.selectedVehicleType}
            selectedSlot={b.selectedSlot}
            selectedPlate={b.selectedPlate}
            startDateTime={b.startDateTime}
            endDateTime={b.endDateTime}
            estimatedAmount={b.estimatedAmount}
          />
        </div>

        <BookingFooter
          startDateTime={b.startDateTime}
          endDateTime={b.endDateTime}
          estimatedAmount={b.estimatedAmount}
          canSubmit={b.canSubmit}
          isSubmitting={b.isSubmitting}
          mode="package"
          onConfirm={b.handleConfirmPurchase}
        />

        <div className="h-20" />
      </div>

      {/* Chọn slot cố định — chỉ ô dãy gói (subscriber) đúng loại xe. */}
      <SlotSelectionModal
        isOpen={b.showSlotModal}
        onClose={() => b.setShowSlotModal(false)}
        selectedFloorIdModal={b.selectedFloorIdModal}
        setSelectedFloorIdModal={b.setSelectedFloorIdModal}
        slots={b.slots}
        selectedSlot={b.selectedSlot}
        setSelectedSlot={b.setSelectedSlot}
        unavailableSlotCodes={b.unavailableSlotCodes}
        unsupportedSlotCodes={b.unsupportedSlotCodes}
        onSlotClick={b.handleSlotClick}
        isLoadingSlots={b.isLoadingSlots}
        floorsError={b.floorsError}
        floorsData={b.floorsData}
        selectedVehicleType={b.selectedVehicleType}
      />

      <BookingNotificationModal
        bookingSuccess={b.bookingSuccess}
        bookingError={b.bookingError}
        onCloseSuccess={() => b.setBookingSuccess(null)}
        onCloseError={() => b.setBookingError(null)}
      />
    </main>
  );
}
