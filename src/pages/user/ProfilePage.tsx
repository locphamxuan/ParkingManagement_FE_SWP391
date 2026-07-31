import { Navigate } from 'react-router-dom';
import { useProfileWorkflow } from '@/hooks/user/useProfileWorkflow';
import { UserQRModal } from '@/components/modals/UserQRModal';
import { VehicleQRModal } from '@/components/modals/VehicleQRModal';
import { PasswordChangeSection } from '@/components/user/PasswordChangeSection';
import { ProfileAlerts } from '@/components/user/profile/ProfileAlerts';
import { ProfileInfoCard } from '@/components/user/profile/ProfileInfoCard';
import { ProfileSidebar } from '@/components/user/profile/ProfileSidebar';

export default function ProfilePage() {
  const profile = useProfileWorkflow();
  const { session, user } = profile;

  if (!session || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <main className="relative z-10">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">My Profile</h1>
          <p className="mt-1 text-xs font-semibold text-slate-400">Personal details, vehicles and account security.</p>
        </div>

        <ProfileAlerts
          successMessage={profile.successMessage}
          hasMissingInfo={profile.hasMissingInfo}
          isEditing={profile.isEditing}
          user={profile.user}
          hasVehicles={profile.vehicles.length > 0}
        />

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <ProfileInfoCard
            user={profile.user}
            isEditing={profile.isEditing}
            setShowQRModal={profile.setShowQRModal}
            handleStartEdit={profile.handleStartEdit}
            form={profile.form}
            setForm={profile.setForm}
            profileError={profile.profileError}
            apiError={profile.apiError}
            isSaving={profile.isSaving}
            handleSave={profile.handleSave}
            handleCancel={profile.handleCancel}
            vehicles={profile.vehicles}
            vehiclesLoading={profile.vehiclesLoading}
            category={profile.category}
            setCategory={profile.setCategory}
            categoryOptions={profile.categoryOptions}
            vehicleBrand={profile.vehicleBrand}
            setVehicleBrand={profile.setVehicleBrand}
            customBrand={profile.customBrand}
            setCustomBrand={profile.setCustomBrand}
            editingVehicleId={profile.editingVehicleId}
            vehicleBrandOptions={profile.vehicleBrandOptions}
            plateInput={profile.plateInput}
            setPlateInput={profile.setPlateInput}
            plateInputRef={profile.plateInputRef}
            plateError={profile.plateError}
            setPlateError={profile.setPlateError}
            plateSuccess={profile.plateSuccess}
            isSavingVehicle={profile.isSavingVehicle}
            handleAddVehicle={profile.handleAddVehicle}
            handleStartEditVehicle={profile.handleStartEditVehicle}
            handleCancelEditVehicle={profile.handleCancelEditVehicle}
            handleSaveVehicleEdit={profile.handleSaveVehicleEdit}
            handleRemoveVehicle={profile.handleRemoveVehicle}
            handleSetDefaultVehicle={profile.handleSetDefaultVehicle}
            handlePlateKeyDown={profile.handlePlateKeyDown}
            onShowQr={profile.setQrVehicle}
          />

          <ProfileSidebar user={profile.user} vehicles={profile.vehicles} />
        </div>
      </div>

      <PasswordChangeSection />

      <UserQRModal
        isOpen={profile.showQRModal}
        onClose={() => profile.setShowQRModal(false)}
        userId={session.userId}
        fullName={user.fullName}
      />

      <VehicleQRModal
        isOpen={!!profile.qrVehicle}
        onClose={() => profile.setQrVehicle(null)}
        vehicle={profile.qrVehicle}
        qrTtlDays={profile.qrTtlDays}
        onRefreshQr={profile.handleRefreshQr}
      />
    </main>
  );
}
