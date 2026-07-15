import { Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import { useReservationBooking } from '@/hooks/user/useReservationBooking';

import { SlotSelectionModal } from '@/components/user/SlotSelectionModal';
import { BookingNotificationModal } from '@/components/user/BookingNotificationModal';
import { BookingHistoryModal } from '@/components/user/BookingHistoryModal';
import { BookingSummarySidebar } from '@/components/user/BookingSummarySidebar';

import { ReservationHeader } from '@/components/user/reservations/ReservationHeader';
import { ModeTabs } from '@/components/user/reservations/ModeTabs';
import { BasicInfoPanel } from '@/components/user/reservations/BasicInfoPanel';
import { HourlyBookingPanel } from '@/components/user/reservations/HourlyBookingPanel';
import { PackageBookingPanel } from '@/components/user/reservations/PackageBookingPanel';
import { SlotPickerPanel, PackageInfoPanel } from '@/components/user/reservations/SlotPickerPanel';
import { BookingFooter } from '@/components/user/reservations/BookingFooter';

/* ─── Main ReservationsPage ────────────────────────────────────────────────── */

export default function ReservationsPage() {
  const navigate = useNavigate();
  const b = useReservationBooking();

  if (!b.session || !b.user) return <Navigate to="/auth/login" replace />;

  return (
    <main className="min-h-screen text-slate-100 relative isolate">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-[#0d1a1a]" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(13,26,26,0.1)_0%,rgba(13,26,26,0.60)_100%)] pointer-events-none" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[55%] rounded-full bg-[radial-gradient(circle_at_center,hsla(180,70%,30%,0.08),transparent_55%)] blur-3xl" />
        <div className="absolute top-[35%] right-[-15%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle_at_center,hsla(195,80%,25%,0.06),transparent_55%)] blur-3xl" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle_at_center,hsla(170,60%,20%,0.04),transparent_50%)] blur-3xl" />
      </div>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

        <ReservationHeader onBack={() => navigate('/')} onShowHistory={() => b.setShowHistory(true)} />

        <ModeTabs mode={b.mode} onChange={b.handleModeChange} />

        {/* ── Main Wizard ── */}
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Left: Booking Form */}
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

            <AnimatePresence mode="wait">
              {b.mode === 'hourly' && (
                <HourlyBookingPanel
                  disabled={!b.selectedVehicleType}
                  selectedDate={b.selectedDate}
                  onSelectDate={b.setSelectedDate}
                  maxCalDate={b.maxCalDate}
                  selectedTime={b.selectedTime}
                  onSelectTime={b.setSelectedTime}
                  durationHours={b.durationHours}
                  onSelectDuration={b.setDurationHours}
                  maxDurationHours={b.reservationPolicy?.maxDurationHours}
                />
              )}

              {b.mode === 'package' && (
                <PackageBookingPanel
                  disabled={!b.selectedVehicleType}
                  packages={b.packages}
                  isLoading={b.isLoadingBuildings}
                  selectedPkg={b.selectedPkg}
                  onSelectPackage={b.handleSelectPackage}
                  selectedVehicleType={b.selectedVehicleType}
                  pkgStartDate={b.pkgStartDate}
                  onSelectPkgStartDate={b.setPkgStartDate}
                  maxCalDate={b.maxCalDate}
                />
              )}
            </AnimatePresence>

            {/* ── Slot Selection Button (chỉ cho đặt theo giờ) ── */}
            {b.mode === 'hourly' ? (
              <SlotPickerPanel
                disabled={!b.selectedVehicleType}
                selectedBuildingId={b.selectedBuildingId}
                selectedSlot={b.selectedSlot}
                onOpenSlotModal={() => b.setShowSlotModal(true)}
              />
            ) : (
              <PackageInfoPanel selectedPkg={b.selectedPkg} />
            )}
          </div>

          {/* Right: Summary Sidebar */}
          <BookingSummarySidebar
            selectedBuildingName={b.selectedBuilding?.building.name}
            mode={b.mode}
            selectedPkgName={b.selectedPkg?.name}
            selectedVehicleType={b.selectedVehicleType}
            selectedSlot={b.selectedSlot}
            selectedPlate={b.selectedPlate}
            startDateTime={b.startDateTime}
            endDateTime={b.endDateTime}
            estimatedAmount={b.estimatedAmount}
            depositAmount={b.liveEstimate?.depositAmount}
            depositPercent={b.liveEstimate?.depositPercent}
          />
        </div>

        <BookingFooter
          startDateTime={b.startDateTime}
          endDateTime={b.endDateTime}
          estimatedAmount={b.estimatedAmount}
          canSubmit={b.canSubmit}
          isSubmitting={b.isSubmitting}
          mode={b.mode}
          onConfirm={b.handleConfirmBooking}
        />

        {/* Extra bottom padding for sticky footer */}
        <div className="h-20" />
      </div>

      {/* ── Slot Selection Modal ── */}
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

      {/* ── History Modal ── */}
      <BookingHistoryModal isOpen={b.showHistory} onClose={() => b.setShowHistory(false)} />

      {/* ── Center Notification Popup Modal ── */}
      <BookingNotificationModal
        bookingSuccess={b.bookingSuccess}
        bookingError={b.bookingError}
        onCloseSuccess={() => b.setBookingSuccess(null)}
        onCloseError={() => b.setBookingError(null)}
      />
    </main>
  );
}
