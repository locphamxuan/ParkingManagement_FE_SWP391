import { motion } from 'framer-motion';
import { ShieldAlert, Car, Bike, QrCode } from 'lucide-react';
import type { ProfileWorkflow } from '@/hooks/user/useProfileWorkflow';

type ProfileViewCardProps = Pick<ProfileWorkflow, 'user' | 'plateQrToken' | 'setPlateQrTarget'>;

// Chế độ chỉ xem: hiển thị thông tin hồ sơ (tên, email, sđt, biển số, vai trò).
export function ProfileViewCard({ user, plateQrToken, setPlateQrTarget }: ProfileViewCardProps) {
  if (!user) return null;

  return (
    <div className="grid gap-4 rounded-3xl bg-slate-950/40 p-6 border border-white/5 animate-fadeIn">
      {[
        { label: 'Name', value: user.fullName },
        { label: 'Email', value: user.email },
        { label: 'Phone Number', value: user.phone },
        ...(user.role === 'user' ? [{
          label: 'Linked License Plates',
          value:
            user.licensePlates.length > 0 ? (
              <div className="flex flex-wrap gap-2.5 mt-1.5">
                {user.licensePlates.map((item) => (
                  <div
                    key={item.plateNumber}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono font-black text-xs tracking-wider shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] animate-fadeIn border ${item.isDefault
                      ? 'border border-amber-500/40 bg-amber-500/10 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                      : item.vehicleType === 'car'
                        ? 'bg-blue-500/5 border border-blue-500/20 text-blue-400/80'
                        : 'bg-purple-500/5 border border-purple-500/20 text-purple-400/80'
                      }`}
                  >
                    {item.isDefault ? (
                      <span className="text-xs">⭐</span>
                    ) : item.vehicleType === 'car' ? (
                      <Car size={11} />
                    ) : (
                      <Bike size={11} />
                    )}
                    <span>{item.plateNumber}</span>
                    <span className={`text-[8px] px-1.5 py-0.2 rounded font-sans font-extrabold tracking-normal uppercase ${item.isDefault
                      ? 'bg-amber-500/20 text-amber-300'
                      : item.vehicleType === 'car'
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-purple-500/20 text-purple-300'
                      }`}>
                      {item.isDefault
                        ? 'Default'
                        : item.vehicleType === 'car'
                          ? 'Car'
                          : 'Motorcycle'}
                    </span>
                    {plateQrToken(item.plateNumber) && (
                      <button
                        type="button"
                        onClick={() => setPlateQrTarget({
                          qrToken: plateQrToken(item.plateNumber)!,
                          plateNumber: item.plateNumber,
                          brand: (item as { brand?: string | null }).brand ?? null,
                        })}
                        className="ml-1 rounded p-0.5 text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors"
                        title="View vehicle QR code"
                      >
                        <QrCode size={12} className="stroke-[2.5]" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-amber-400 font-bold text-xs flex items-center gap-1.5 mt-1 animate-pulse">
                <ShieldAlert size={14} /> No linked license plates
              </span>
            ),
          isCustom: true,
        }] : []),
        { label: 'Role', value: user.role, uppercase: true },
      ].map((field, idx) => (
        <motion.div
          key={field.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + idx * 0.06 }}
          className="grid gap-1.5 rounded-2xl border border-white/5 bg-slate-950/70 p-5 shadow-inner transition-all duration-300 hover:border-orange-500/15"
        >
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 font-mono">{field.label}</p>
          {field.isCustom ? (
            <div>{field.value}</div>
          ) : (
            <p className={`text-base font-black text-slate-200 ${field.uppercase ? 'uppercase font-mono text-orange-400 text-sm' : ''}`}>
              {field.value || '— Not updated —'}
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
}
