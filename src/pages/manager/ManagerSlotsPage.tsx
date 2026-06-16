import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, Layers, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type DataColumn } from '@/components/common/DataTable';
import { ModalForm } from '@/components/modals/ModalForm';
import { CustomSelect } from '@/components/ui/select';
import { MultiSlotForm, type SlotFormRow } from '@/components/manager/MultiSlotForm';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import {
  managerApi,
  type Floor,
  type ParkingSlot,
  type VehicleType,
} from '@/services/manager/managerApi';

interface FormState {
  code: string;
  floor: string;
  vehicleType: string;
  status: ParkingSlot['status'];
  reservable: boolean;
  note: string;
}

const empty: FormState = {
  code: '',
  floor: '',
  vehicleType: '',
  status: 'available',
  reservable: true,
  note: '',
};

const SLOT_STATUSES: ParkingSlot['status'][] = ['available', 'occupied', 'reserved', 'maintenance'];

// Interactive 3D Extruded Slot Block Component
function Slot3DBox({ 
  slot, 
  onClick, 
  statusFilter,
  vehicleTypes 
}: { 
  slot: ParkingSlot; 
  onClick: () => void; 
  statusFilter: string;
  vehicleTypes: VehicleType[];
}) {
  const [hovered, setHovered] = useState(false);

  // Status-based coloring and lighting profiles — enhanced neon glow
  const config = {
    available: {
      faceColor: 'bg-emerald-500/25 border-emerald-500/40 text-emerald-300',
      label: 'Trống',
      glow: 'shadow-[0_0_14px_rgba(16,185,129,0.25),0_0_4px_rgba(16,185,129,0.1)] hover:shadow-[0_0_28px_rgba(16,185,129,0.6),0_0_8px_rgba(16,185,129,0.3)]'
    },
    occupied: {
      faceColor: 'bg-red-500/25 border-red-500/45 text-red-300',
      label: 'Có xe',
      glow: 'shadow-[0_0_14px_rgba(239,68,68,0.35),0_0_4px_rgba(239,68,68,0.15)] hover:shadow-[0_0_28px_rgba(239,68,68,0.65),0_0_8px_rgba(239,68,68,0.3)]'
    },
    reserved: {
      faceColor: 'bg-purple-500/25 border-purple-500/45 text-purple-300',
      label: 'Đã đặt',
      glow: 'shadow-[0_0_14px_rgba(168,85,247,0.35),0_0_4px_rgba(168,85,247,0.15)] hover:shadow-[0_0_28px_rgba(168,85,247,0.65),0_0_8px_rgba(168,85,247,0.3)]'
    },
    maintenance: {
      faceColor: 'bg-amber-500/20 border-amber-500/35 text-amber-300 bg-[repeating-linear-gradient(45deg,rgba(245,158,11,0.12),rgba(245,158,11,0.12)_6px,rgba(0,0,0,0.4)_6px,rgba(0,0,0,0.4)_12px)]',
      label: 'Bảo trì',
      glow: 'shadow-[0_0_14px_rgba(245,158,11,0.2),0_0_4px_rgba(245,158,11,0.1)] hover:shadow-[0_0_28px_rgba(245,158,11,0.55),0_0_8px_rgba(245,158,11,0.25)]'
    }
  }[slot.status];

  // Respect status filters by dimming slots that do not match the filter
  const isFilteredOut = statusFilter && slot.status !== statusFilter;

  // Resolve vehicle type name
  const vtName = useMemo(() => {
    if (!slot.vehicleType) return '— Không cố định —';
    if (typeof slot.vehicleType === 'object') return slot.vehicleType.name;
    const found = vehicleTypes.find(v => v._id === slot.vehicleType);
    return found ? found.name : 'Loại xe';
  }, [slot.vehicleType, vehicleTypes]);

  return (
    <div 
      className={`relative cursor-pointer transition-all duration-300 ${isFilteredOut ? 'opacity-25 scale-95 blur-[0.5px]' : 'opacity-100'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        width: '60px',
        height: '40px',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Extruded CSS 3D Box Container */}
      <div 
        className={`box-3d w-full h-full rounded transition-all duration-300 ${config.glow}`}
        style={{
          '--box-w': '60px',
          '--box-d': '40px',
          '--box-h': hovered ? '20px' : '10px',
          transform: hovered ? 'translateZ(10px)' : 'translateZ(0px)',
          transformStyle: 'preserve-3d'
        } as React.CSSProperties}
      >
        {/* Top Face */}
        <div className={`box-3d-face box-3d-top rounded border-t border-x ${config.faceColor} flex items-center justify-center font-mono text-[9px] font-black uppercase tracking-wider`}>
          {slot.code}
          {slot.status === 'occupied' && (
            <div className="absolute w-5 h-2.5 rounded bg-orange-400/30 border border-orange-400/50 -bottom-0.5 preserve-3d" style={{ transform: 'translateZ(4px)' }} />
          )}
        </div>
        
        {/* Front Face */}
        <div className={`box-3d-face box-3d-front border-b border-x ${config.faceColor}`} />
        
        {/* Right Face */}
        <div className={`box-3d-face box-3d-right border-y border-r ${config.faceColor}`} />
        
        {/* Back Face */}
        <div className={`box-3d-face box-3d-back ${config.faceColor}`} />
        
        {/* Left Face */}
        <div className={`box-3d-face box-3d-left ${config.faceColor}`} />
      </div>

      {/* Floating Glassmorphic Tooltip (Counter-Rotated dynamically) */}
      <AnimatePresence>
        {hovered && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, z: 20 }}
            animate={{ opacity: 1, scale: 1, z: 35 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute z-50 pointer-events-none w-44 glass-panel-dark border border-white/10 rounded-2xl p-3 shadow-2xl"
            style={{
              bottom: '120%',
              left: '50%',
              transform: 'translateX(-50%) translateZ(35px) rotateZ(45deg) rotateX(-60deg)',
              transformOrigin: 'bottom center'
            }}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-black text-white font-mono">{slot.code}</span>
              <span className={`text-[8px] font-black uppercase font-mono px-1.5 py-0.5 rounded ${
                slot.status === 'available' ? 'bg-emerald-500/10 text-emerald-400' :
                slot.status === 'occupied' ? 'bg-orange-500/10 text-orange-400' :
                slot.status === 'reserved' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
              }`}>
                {config.label}
              </span>
            </div>
            <div className="space-y-1 text-[9px] text-slate-400 font-semibold leading-relaxed">
              <p>Loại: <span className="text-white font-black">{vtName}</span></p>
              <p>Đặt chỗ: <span className="text-white font-black">{slot.reservable ? 'Có' : 'Khóa'}</span></p>
              {slot.note && <p className="border-t border-white/5 pt-1 mt-1 text-slate-500 italic">Note: {slot.note}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ManagerSlotsPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<ParkingSlot[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [floorFilter, setFloorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ParkingSlot | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [multiSlotModalOpen, setMultiSlotModalOpen] = useState(false);

  // High-fidelity View mode toggle
  const [viewMode, setViewMode] = useState<'list' | '3d'>('3d');

  // Interactive cockpit rotation state values for 3D stacks
  const [rx, setRx] = useState(60);
  const [rz, setRz] = useState(-45);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [slotsRes, floorsRes, vtRes] = await Promise.all([
        managerApi.slots.list(buildingId, {
          floor: floorFilter || undefined,
          status: statusFilter || undefined,
        }),
        managerApi.floors.list(buildingId),
        managerApi.vehicleTypes.list(buildingId),
      ]);
      setItems(slotsRes.data.items);
      setFloors(floorsRes.data.items);
      setVehicleTypes(vtRes.data.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tải thất bại');
    } finally {
      setLoading(false);
    }
  }, [buildingId, floorFilter, statusFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const floorMap = useMemo(() => {
    const map = new Map<string, Floor>();
    floors.forEach((f) => map.set(f._id, f));
    return map;
  }, [floors]);

  // Group slots by floor plate for vertical 3D rendering
  const slotsByFloor = useMemo(() => {
    const grouped: Record<string, ParkingSlot[]> = {};
    floors.forEach((f) => {
      grouped[f._id] = [];
    });
    items.forEach((item) => {
      const fId = typeof item.floor === 'string' ? item.floor : item.floor._id;
      if (grouped[fId]) {
        grouped[fId].push(item);
      } else {
        grouped[fId] = [item];
      }
    });
    return grouped;
  }, [items, floors]);

  const openCreate = () => {
    setMultiSlotModalOpen(true);
  };

  const openEdit = (row: ParkingSlot) => {
    const floorId = typeof row.floor === 'string' ? row.floor : row.floor._id;
    const vtId = !row.vehicleType
      ? ''
      : typeof row.vehicleType === 'string'
        ? row.vehicleType
        : row.vehicleType._id;
    setEditing(row);
    setForm({
      code: row.code,
      floor: floorId,
      vehicleType: vtId,
      status: row.status,
      reservable: row.reservable,
      note: row.note ?? '',
    });
    setModalOpen(true);
  };

  const onSubmit = async () => {
    if (!form.floor) {
      alert('Chọn tầng trước');
      return;
    }
    const payload = {
      code: form.code.trim().toUpperCase(),
      floor: form.floor,
      status: form.status,
      reservable: form.reservable,
      note: form.note.trim(),
    };
    try {
      if (editing) {
        await managerApi.slots.update(buildingId, editing._id, payload as Partial<ParkingSlot>);
      } else {
        await managerApi.slots.create(buildingId, payload as Partial<ParkingSlot> & { floor: string });
      }
      setModalOpen(false);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lưu thất bại');
    }
  };

  const onDelete = async (row: ParkingSlot) => {
    if (!window.confirm(`Xóa ô ${row.code}?`)) return;
    try {
      await managerApi.slots.remove(buildingId, row._id);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Xóa thất bại');
    }
  };

  const onMultiSlotSubmit = async (rows: SlotFormRow[]) => {
    for (const row of rows) {
      const payload = {
        code: row.code.trim().toUpperCase(),
        floor: row.floor,
        status: row.status,
        reservable: row.reservable,
        note: row.note.trim(),
      };
      await managerApi.slots.create(buildingId, payload as Partial<ParkingSlot> & { floor: string });
    }
    refresh();
  };

  const onStatusChange = async (row: ParkingSlot, status: ParkingSlot['status']) => {
    try {
      await managerApi.slots.updateStatus(buildingId, row._id, status);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Cập nhật thất bại');
    }
  };

  const columns: DataColumn<ParkingSlot>[] = [
    { key: 'code', title: 'Mã ô' },
    {
      key: 'floor',
      title: 'Tầng',
      render: (row) => {
        const id = typeof row.floor === 'string' ? row.floor : row.floor._id;
        const fl = floorMap.get(id);
        return fl ? fl.code : '?';
      },
    },
    {
      key: 'vehicleType',
      title: 'Loại xe (theo tầng)',
      render: (row) => {
        const id = typeof row.floor === 'string' ? row.floor : row.floor._id;
        const fl = floorMap.get(id);
        const types = (fl?.allowedVehicleTypes ?? []) as Array<{ code?: string } | string>;
        if (!types.length) return 'Mọi loại';
        return types.map((t) => (typeof t === 'object' ? t.code : t)).filter(Boolean).join(', ');
      },
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (row) => (
        <CustomSelect
          value={row.status}
          onChange={(val) => onStatusChange(row, val as ParkingSlot['status'])}
          options={SLOT_STATUSES.map((s) => ({
            value: s,
            label: s === 'available' ? 'Trống' : s === 'occupied' ? 'Đầy' : s === 'reserved' ? 'Đặt chỗ' : 'Bảo trì',
          }))}
          className="h-8 w-28 text-xs font-semibold"
        />
      ),
    },
    {
      key: 'reservable',
      title: 'Cho đặt',
      render: (row) => (row.reservable ? 'Có' : 'Không'),
    },
    {
      key: 'actions',
      title: '',
      render: (row) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(row)} className="hover:bg-orange-500/10 hover:text-orange-400">
            <Pencil size={14} />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(row)} className="hover:bg-rose-500/10 hover:text-rose-400">
            <Trash2 size={14} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-6 animate-fadeIn">
      
      {/* Sci-fi Controller & Toggle Row */}
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-4 glass-panel-dark p-4 rounded-3xl border border-white/5">
        <div className="flex flex-wrap items-center gap-3">
          <CustomSelect
            value={floorFilter}
            onChange={setFloorFilter}
            options={[
              { value: '', label: 'Tất cả tầng' },
              ...floors.map((f) => ({
                value: f._id,
                label: f.code,
              })),
            ]}
            className="w-40"
          />
          
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: '', label: 'Tất cả trạng thái' },
              ...SLOT_STATUSES.map((s) => ({
                value: s,
                label: s === 'available' ? 'Trống (Green)' : s === 'occupied' ? 'Đầy (Orange)' : s === 'reserved' ? 'Đặt chỗ (Blue)' : 'Bảo trì (Amber)',
              })),
            ]}
            className="w-48"
          />
        </div>

        {/* View Toggle */}
        <div className="inline-flex rounded-xl bg-slate-950/80 border border-white/5 p-1 backdrop-blur-md">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              viewMode === 'list' 
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-[0_0_10px_rgba(249,115,22,0.25)]' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Danh sách bảng
          </button>
          <button
            onClick={() => setViewMode('3d')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              viewMode === '3d' 
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-[0_0_10px_rgba(249,115,22,0.25)]' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Bản đồ 3D Hologram
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={openCreate} className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] gap-2">
            <Plus size={14} className="stroke-[3]" /> Thêm ô đỗ
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-400 flex items-center justify-center p-24 glass-panel-dark rounded-3xl border border-white/5">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent mr-2" />
          Đang tải dữ liệu ô đỗ...
        </div>
      ) : error ? (
        <div className="text-sm text-rose-400 glass-panel-dark p-6 rounded-3xl border border-rose-500/10 bg-rose-950/15">{error}</div>
      ) : (
        <div>
          {viewMode === 'list' ? (
            <div className="glass-panel-dark rounded-3xl border border-white/5 p-6 backdrop-blur-md shadow-2xl">
              <DataTable title={`Ô đỗ (${items.length})`} rows={items} columns={columns} />
            </div>
          ) : (
            /* Sci-Fi 3D Visual Map Mode */
            <div className="grid gap-6 xl:grid-cols-[1fr,300px]">
              
              {/* 3D Map Viewport */}
              <div className="h-[620px] relative rounded-3xl border border-orange-500/15 bg-slate-950 shadow-[0_0_60px_rgba(0,0,0,0.9),inset_0_0_30px_rgba(0,0,0,0.6)] overflow-hidden flex items-center justify-center glass-premium cyber-scanline">
                
                {/* Multi-layer space backing grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.018)_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />
                {/* Radial dot texture */}
                <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />
                {/* Central orange halo */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.07),rgba(168,85,247,0.035)_50%,transparent_75%)] pointer-events-none" />
                
                {/* 3D Render Stack Container */}
                <div className="perspective-1000 w-full h-full flex items-center justify-center preserve-3d">
                  <motion.div
                    style={{
                      rotateX: rx,
                      rotateZ: rz,
                      transformStyle: 'preserve-3d',
                    }}
                    className="isometric-mesh relative w-[500px] h-[400px] preserve-3d transition-transform duration-200"
                  >
                    {/* Render Floors stacked dynamically */}
                    {floors.map((floor, fIdx) => {
                      // Apply filter check
                      if (floorFilter && floor._id !== floorFilter) return null;
                      
                      const floorSlots = slotsByFloor[floor._id] || [];
                      // Vertical offset layout for vertical stacking
                      const zOffset = floorFilter ? 0 : (fIdx * 130);

                      return (
                        <motion.div
                          key={floor._id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: fIdx * 0.06, type: 'spring', stiffness: 120, damping: 18 }}
                          style={{
                            transform: `translateZ(${zOffset}px)`,
                            transformStyle: 'preserve-3d',
                          }}
                          className="absolute inset-0 rounded-3xl border border-cyan-500/25 bg-slate-900/55 shadow-[0_0_30px_rgba(6,182,212,0.08),0_8px_32px_rgba(0,0,0,0.6)] preserve-3d p-6 flex flex-col justify-between overflow-hidden"
                        >
                          {/* Floor plate cyan scan stripe — stays behind content */}
                          <div className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none"
                            style={{ top: `${((fIdx % 3) + 1) * 25}%` }}
                          />
                          {/* Floor label badge */}
                          <div className="flex justify-between items-center mb-4 z-10 preserve-3d" style={{ transform: 'translateZ(15px)' }}>
                            <span className="text-[10px] font-black tracking-widest text-orange-400 uppercase font-mono bg-slate-950/80 px-2.5 py-1 rounded-lg border border-white/5">
                              TẦNG {floor.code}
                            </span>
                            <span className="text-[9px] font-bold text-slate-500 font-mono">
                              CÔNG SUẤT: {floorSlots.filter(s => s.status === 'occupied').length}/{floorSlots.length} SLOT
                            </span>
                          </div>

                          {/* Grid Layout of Slot blocks */}
                          <div className="grid grid-cols-4 sm:grid-cols-5 gap-6 my-auto items-center justify-items-center preserve-3d" style={{ transform: 'translateZ(10px)' }}>
                            {floorSlots.length === 0 ? (
                              <div className="col-span-full text-center text-slate-600 text-xs py-10 uppercase tracking-widest font-mono">Chưa cấu hình ô đỗ</div>
                            ) : (
                              floorSlots.map((slot) => (
                                <Slot3DBox 
                                  key={slot._id} 
                                  slot={slot} 
                                  onClick={() => openEdit(slot)} 
                                  statusFilter={statusFilter}
                                  vehicleTypes={vehicleTypes}
                                />
                              ))
                            )}
                          </div>

                          <div className="text-[8px] text-slate-600 font-black tracking-widest uppercase font-mono text-right preserve-3d mt-4" style={{ transform: 'translateZ(5px)' }}>
                            {floor.code} ARCHITECTURE
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>

                {/* Ambient occlusion glow labels */}
                <div className="absolute left-6 top-6 flex flex-col gap-1.5 z-20 pointer-events-none">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <Layers size={12} className="text-orange-400" />
                    <span>Sơ đồ 3D Phân Khu ({items.length} Ô đỗ)</span>
                  </div>
                </div>
              </div>

              {/* Sci-Fi Right Cockpit Control Panel */}
              <div className="glass-premium glow-border-pulse rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-white font-mono mb-4 flex items-center gap-1.5 pb-2.5 border-b border-white/5">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
                    Góc nhìn Không Gian
                  </h3>
                  
                  {/* Cockpit Angle Tilt Controls */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
                        <span>Độ Nghiêng X</span>
                        <span className="text-orange-400 font-mono">{rx}°</span>
                      </div>
                      <input 
                        type="range" 
                        min="20" 
                        max="85" 
                        value={rx} 
                        onChange={(e) => setRx(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-orange-500 border border-white/5"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
                        <span>Góc Xoay Z</span>
                        <span className="text-orange-400 font-mono">{rz}°</span>
                      </div>
                      <input 
                        type="range" 
                        min="-180" 
                        max="180" 
                        value={rz} 
                        onChange={(e) => setRz(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-orange-500 border border-white/5"
                      />
                    </div>

                    <button 
                      onClick={() => { setRx(60); setRz(-45); }}
                      className="w-full py-2.5 rounded-xl border border-white/10 hover:border-orange-500/30 text-white font-mono text-[9px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 hover:bg-slate-950/50"
                    >
                      <RotateCcw size={12} /> Reset View
                    </button>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-white/5 space-y-3">
                  <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono mb-2">Chú thích trạng thái</div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
                    <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/40" /> Trống</span>
                    <span className="font-mono text-emerald-400 font-black">
                      {items.filter(s => s.status === 'available').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
                    <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-red-500/20 border border-red-500/40" /> Có xe đỗ</span>
                    <span className="font-mono text-red-400 font-black">
                      {items.filter(s => s.status === 'occupied').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
                    <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-purple-500/20 border border-purple-500/40" /> Đã đặt</span>
                    <span className="font-mono text-purple-400 font-black">
                      {items.filter(s => s.status === 'reserved').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
                    <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-amber-500/20 border border-amber-500/30" /> Bảo trì</span>
                    <span className="font-mono text-amber-400 font-black">
                      {items.filter(s => s.status === 'maintenance').length}
                    </span>
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>
      )}

      {/* Standard modal form for adding/editing slots */}
      <ModalForm
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? 'Sửa ô đỗ' : 'Thêm ô đỗ'}
        onSubmit={onSubmit}
      >
        <div className="grid gap-4 md:grid-cols-2 text-slate-100">
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Mã ô</label>
            <Input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-orange-500/40"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Tầng</label>
            <CustomSelect
              value={form.floor}
              onChange={(val) => setForm((f) => ({ ...f, floor: val }))}
              options={[
                { value: '', label: 'Chọn tầng' },
                ...floors.map((fl) => ({
                  value: fl._id,
                  label: fl.code,
                })),
              ]}
              placeholder="Chọn tầng..."
            />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <p className="rounded-xl border border-sky-500/20 bg-sky-500/5 px-3 py-2 text-[11px] text-sky-300">
              Loại xe của ô đỗ <strong>tự lấy theo loại xe cho phép của tầng</strong> (cấu hình ở tab Tầng), không cần set ở đây.
            </p>
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Trạng thái</label>
            <CustomSelect
              value={form.status}
              onChange={(val) => setForm((f) => ({ ...f, status: val as ParkingSlot['status'] }))}
              options={SLOT_STATUSES.map((s) => ({
                value: s,
                label: s === 'available' ? 'Trống' : s === 'occupied' ? 'Đầy' : s === 'reserved' ? 'Đặt chỗ' : 'Bảo trì',
              }))}
            />
          </div>
          <label className="flex items-center gap-3 text-xs font-bold text-slate-300 md:col-span-2 select-none">
            <input
              type="checkbox"
              checked={form.reservable}
              onChange={(e) => setForm((f) => ({ ...f, reservable: e.target.checked }))}
              className="w-4 h-4 rounded border-white/10 bg-slate-950 text-orange-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span>Cho phép đặt chỗ trước</span>
          </label>
          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Ghi chú</label>
            <Input
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              className="bg-slate-950 border-white/10 text-white rounded-xl focus:border-orange-500/40"
            />
          </div>
        </div>
      </ModalForm>

      {/* Multi-slot form for batch creation */}
      <MultiSlotForm
        isOpen={multiSlotModalOpen}
        onClose={() => setMultiSlotModalOpen(false)}
        onSubmit={onMultiSlotSubmit}
        floors={floors}
      />
    </div>
  );
}
