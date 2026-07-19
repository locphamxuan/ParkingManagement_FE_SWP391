import { Navigate } from 'react-router-dom';
import { useProfileWorkflow } from '@/hooks/user/useProfileWorkflow';
import { UserQRModal } from '@/components/modals/UserQRModal';
import { PlateQRModal } from '@/components/modals/PlateQRModal';
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
          <p className="mt-1 text-xs font-semibold text-slate-400">Personal details, license plates, and account security.</p>
        </div>

        <ProfileAlerts
          successMessage={profile.successMessage}
          hasMissingInfo={profile.hasMissingInfo}
          isEditing={profile.isEditing}
          user={profile.user}
        />

        {/* Content Section layout */}
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
            editPlates={profile.editPlates}
            vehicleType={profile.vehicleType}
            setVehicleType={profile.setVehicleType}
            vehicleBrand={profile.vehicleBrand}
            setVehicleBrand={profile.setVehicleBrand}
            customBrand={profile.customBrand}
            setCustomBrand={profile.setCustomBrand}
            vehicleBrandOptions={profile.vehicleBrandOptions}
            plateInput={profile.plateInput}
            setPlateInput={profile.setPlateInput}
            plateInputRef={profile.plateInputRef}
            plateError={profile.plateError}
            setPlateError={profile.setPlateError}
            plateSuccess={profile.plateSuccess}
            handleAddPlate={profile.handleAddPlate}
            handleRemovePlate={profile.handleRemovePlate}
            handleSetDefaultEditPlate={profile.handleSetDefaultEditPlate}
            handlePlateKeyDown={profile.handlePlateKeyDown}
            plateQrToken={profile.plateQrToken}
            setPlateQrTarget={profile.setPlateQrTarget}
          />

          <ProfileSidebar user={profile.user} />
        </div>
      </div>

      <PasswordChangeSection />

      {/* QR Modal */}
      <UserQRModal
        isOpen={profile.showQRModal}
        onClose={() => profile.setShowQRModal(false)}
        userId={session?.userId || ''}
        fullName={user?.fullName}
      />

      <PlateQRModal
        isOpen={!!profile.plateQrTarget}
        onClose={() => profile.setPlateQrTarget(null)}
        qrToken={profile.plateQrTarget?.qrToken || ''}
        plateNumber={profile.plateQrTarget?.plateNumber || ''}
        brand={profile.plateQrTarget?.brand}
      />
    </main>
  );
}
