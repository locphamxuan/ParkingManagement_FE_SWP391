import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  CarFront,
  Clock3,
  Loader2,
  MapPin,
  PhoneCall,
  Search,
  SquareParking,
} from 'lucide-react';
import { useBuildings } from '@/hooks/user';
import { userApi, type Building } from '@/services/user/userApi';

function formatHours(open?: string, close?: string): string {
  if (!open && !close) return 'Chưa cập nhật';
  if (open === '00:00' && (close === '23:59' || close === '24:00')) return '24/7';
  return `${open || '--:--'} - ${close || '--:--'}`;
}

function addressText(building: Building): string {
  if (building.address?.fullAddress) return building.address.fullAddress;
  return building.address ? JSON.stringify(building.address) : 'Chưa cập nhật địa chỉ';
}

function BuildingCard({
  building,
  selected,
  onSelect,
}: {
  building: Building;
  selected: boolean;
  onSelect: () => void;
}) {
  const hours = formatHours(building.operatingHours?.open, building.operatingHours?.close);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-2xl border p-5 text-left transition-all duration-200 ${
        selected
          ? 'border-orange-400/60 bg-orange-500/10 shadow-[0_0_24px_rgba(249,115,22,0.14)]'
          : 'border-white/10 bg-slate-900/55 hover:border-orange-400/35 hover:bg-slate-900/80'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">
            {building.code || 'BUILDING'}
          </p>
          <h2 className="mt-2 text-lg font-black text-white">{building.name}</h2>
          <p className="mt-2 flex items-start gap-2 text-xs font-semibold leading-relaxed text-slate-400">
            <MapPin size={14} className="mt-0.5 shrink-0 text-cyan-300" />
            <span>{addressText(building)}</span>
          </p>
        </div>
        <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-300">
          {building.status === 'active' ? 'Đang mở' : 'Tạm đóng'}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/10 bg-slate-950/55 p-3">
          <Clock3 size={15} className="text-orange-300" />
          <p className="mt-2 text-[10px] font-bold uppercase text-slate-500">Giờ mở cửa</p>
          <p className="mt-1 text-sm font-black text-white">{hours}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/55 p-3">
          <SquareParking size={15} className="text-emerald-300" />
          <p className="mt-2 text-[10px] font-bold uppercase text-slate-500">Bảng giá</p>
          <p className="mt-1 text-sm font-black text-emerald-300">
            {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
              maximumFractionDigits: 0,
            }).format(building.pricing?.hourlyRate || 0)}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/55 p-3">
          <Building2 size={15} className="text-cyan-300" />
          <p className="mt-2 text-[10px] font-bold uppercase text-slate-500">Số tầng</p>
          <p className="mt-1 text-sm font-black text-white">{building.totalFloors || 0}</p>
        </div>
      </div>
    </button>
  );
}

export default function BuildingsPage() {
  const navigate = useNavigate();
  const { items: buildings, isLoading } = useBuildings();
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (buildings.length > 0 && !selectedId) {
      setSelectedId(buildings[0]._id);
    }
  }, [buildings, selectedId]);

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return buildings;
    return buildings.filter((building) => {
      const haystack = [building.name, building.code, addressText(building)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [query, buildings]);

  const selectedBuilding = useMemo(
    () => filteredRows.find((b) => b._id === selectedId) || filteredRows[0] || null,
    [filteredRows, selectedId],
  );

  const currency = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-xs font-black uppercase tracking-wider text-orange-300 transition hover:border-orange-400/40"
          >
            <ArrowLeft size={14} />
            Trang chủ
          </button>
          <div className="hidden items-center gap-2 text-xs font-bold text-slate-400 sm:flex">
            <PhoneCall size={14} className="text-emerald-300" />
            Hỗ trợ 1900 636 447
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end"
        >
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-orange-300">
              FR-USR-02
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">
              Thông tin tòa nhà gửi xe
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-slate-400">
              Xem giờ mở cửa, bảng giá và số tầng trước khi di chuyển hoặc đặt chỗ.
            </p>
          </div>

          <label className="relative block">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo tên, mã hoặc địa chỉ"
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-900/80 pl-11 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-orange-400/60"
            />
          </label>
        </motion.div>

        {isLoading ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-white/10 bg-slate-900/40">
            <div className="flex items-center gap-3 text-sm font-bold text-slate-300">
              <Loader2 size={18} className="animate-spin text-orange-300" />
              Đang tải thông tin tòa nhà...
            </div>
          </div>
        ) : buildings.length === 0 ? (
          <div className="rounded-3xl border border-rose-400/25 bg-rose-500/10 p-6 text-sm font-semibold text-rose-200">
            Không có tòa nhà nào. Vui lòng thử lại sau.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-4">
              {filteredRows.map((building) => (
                <BuildingCard
                  key={building._id}
                  building={building}
                  selected={selectedBuilding?._id === building._id}
                  onSelect={() => setSelectedId(building._id)}
                />
              ))}

              {filteredRows.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-8 text-center text-sm font-semibold text-slate-400">
                  Không tìm thấy tòa nhà phù hợp.
                </div>
              ) : null}
            </div>

            {selectedBuilding ? (
              <aside className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl lg:sticky lg:top-6 lg:self-start">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                      {selectedBuilding.code || 'BUILDING'}
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-white">{selectedBuilding.name}</h2>
                    <p className="mt-2 flex items-start gap-2 text-sm font-semibold leading-relaxed text-slate-400">
                      <MapPin size={16} className="mt-0.5 shrink-0 text-orange-300" />
                      <span>{addressText(selectedBuilding)}</span>
                    </p>
                  </div>
                  <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-right">
                    <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                      {selectedBuilding.status === 'active' ? 'Đang mở' : 'Tạm đóng'}
                    </p>
                    <p className="mt-1 text-3xl font-black text-white">
                      {selectedBuilding.status === 'active' ? '✓' : '✗'}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <Clock3 size={18} className="text-orange-300" />
                    <p className="mt-3 text-xs font-bold uppercase text-slate-500">Giờ mở cửa</p>
                    <p className="mt-1 text-lg font-black text-white">
                      {formatHours(
                        selectedBuilding.operatingHours?.open,
                        selectedBuilding.operatingHours?.close,
                      )}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <CarFront size={18} className="text-cyan-300" />
                    <p className="mt-3 text-xs font-bold uppercase text-slate-500">Số tầng</p>
                    <p className="mt-1 text-lg font-black text-white">{selectedBuilding.totalFloors || 0}</p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <p className="text-xs font-bold uppercase text-slate-500">Bảng giá mỗi giờ</p>
                  <p className="mt-2 text-2xl font-black text-orange-300">
                    {currency.format(selectedBuilding.pricing?.hourlyRate || 0)}
                  </p>
                  {selectedBuilding.pricing?.dailyCap ? (
                    <p className="mt-2 text-xs font-semibold text-slate-400">
                      Trần giá hôm:{' '}
                      <span className="text-emerald-300">
                        {currency.format(selectedBuilding.pricing.dailyCap)}
                      </span>
                    </p>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate('/reservations', {
                      state: { buildingId: selectedBuilding._id },
                    })
                  }
                  className="mt-7 w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 px-5 py-3 text-sm font-black uppercase tracking-wider text-slate-950 transition hover:scale-[1.01]"
                >
                  Đặt chỗ tại tòa nhà này
                </button>
              </aside>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}
