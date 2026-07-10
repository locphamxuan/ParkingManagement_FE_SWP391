import { Navigate } from 'react-router-dom';
import { useProfileWorkflow } from '@/hooks/user/useProfileWorkflow';
import { UserQRModal } from '@/components/modals/UserQRModal';
import { PlateQRModal } from '@/components/modals/PlateQRModal';
import { PasswordChangeSection } from '@/components/user/PasswordChangeSection';
import { ProfileHeaderBar } from '@/components/user/profile/ProfileHeaderBar';
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
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden selection:bg-orange-500 selection:text-white">
      {/* Background Cyber Glowing Accents */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.06),transparent_60%)] pointer-events-none blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[450px] h-[450px] rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05),transparent_60%)] pointer-events-none blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 relative z-10">

        <ProfileHeaderBar onLogout={profile.handleLogout} />

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
