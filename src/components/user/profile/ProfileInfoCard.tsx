import { motion } from 'framer-motion';
import { Edit, QrCode } from 'lucide-react';
import type { ProfileWorkflow } from '@/hooks/user/useProfileWorkflow';
import { ProfileEditForm } from './ProfileEditForm';
import { ProfileViewCard } from './ProfileViewCard';

type ProfileInfoCardProps = Pick<
  ProfileWorkflow,
  | 'user' | 'isEditing' | 'setShowQRModal' | 'handleStartEdit'
  | 'form' | 'setForm' | 'profileError' | 'apiError' | 'isSaving' | 'handleSave' | 'handleCancel'
  | 'editPlates' | 'vehicleType' | 'setVehicleType' | 'vehicleBrand' | 'setVehicleBrand'
  | 'customBrand' | 'setCustomBrand' | 'vehicleBrandOptions' | 'plateInput' | 'setPlateInput'
  | 'plateInputRef' | 'plateError' | 'setPlateError' | 'plateSuccess' | 'handleAddPlate' | 'handleRemovePlate'
  | 'handleSetDefaultEditPlate' | 'handlePlateKeyDown' | 'plateQrToken' | 'setPlateQrTarget'
>;

// Khối thông tin hồ sơ người dùng (bên trái): tiêu đề + nút Edit/QR + form chỉnh sửa hoặc bảng chỉ xem.
export function ProfileInfoCard({
  user, isEditing, setShowQRModal, handleStartEdit,
  ...formProps
}: ProfileInfoCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 90, damping: 16 }}
      className="space-y-6 rounded-3xl border border-white/5 bg-slate-900/40 p-8 backdrop-blur-md shadow-2xl relative overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-400 font-mono">User Profile</p>
          <h1 className="text-3xl font-black tracking-tight text-white">
            Personal <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-blue-400 bg-clip-text text-transparent">Account Information</span>
          </h1>
        </div>

        {!isEditing && (
          <div className="flex gap-3 items-center self-start flex-wrap">
            <button
              type="button"
              onClick={() => setShowQRModal(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(34,211,238,0.35)] inline-flex items-center gap-1.5 animate-fadeIn"
            >
              <QrCode size={13} className="stroke-[2.5]" />
              My QR
            </button>
            <button
              type="button"
              onClick={handleStartEdit}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(249,115,22,0.35)] inline-flex items-center gap-1.5 animate-fadeIn"
            >
              <Edit size={13} className="stroke-[2.5]" />
              Edit Profile
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <ProfileEditForm user={user} {...formProps} />
      ) : (
        <ProfileViewCard user={user} plateQrToken={formProps.plateQrToken} setPlateQrTarget={formProps.setPlateQrTarget} />
      )}
    </motion.section>
  );
}
