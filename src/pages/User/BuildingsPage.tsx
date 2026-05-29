import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Bike,
  Building2,
  CarFront,
  Clock3,
  Loader2,
  MapPin,
  PhoneCall,
  Search,
  SquareParking,
  Users,
  WalletCards,
} from 'lucide-react';
import {
  listUserBuildingViews,
  type UserBuildingContact,
  type UserBuildingView,
  type UserPricePolicy,
} from '@/pages/User/mockBuildingsData';

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

function formatMoney(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return 'Chưa cập nhật';
  return currency.format(value);
}

function formatHours(open?: string, close?: string): string {
  if (!open && !close) return 'Chưa cập nhật';
  if (open === '00:00' && (close === '23:59' || close === '24:00')) return '24/7';
  return `${open || '--:--'} - ${close || '--:--'}`;
}

function vehicleLabel(policy: UserPricePolicy): string {
  if (!policy.vehicleType) return 'Tất cả phương tiện';
  if (typeof policy.vehicleType === 'string') return policy.vehicleType;
  return policy.vehicleType.name || policy.vehicleType.code || 'Phương tiện';
}

function addressText(row: UserBuildingView): string {
  const address = row.building.address;
  return (
    address?.fullAddress ||
    [address?.street, address?.district, address?.city].filter(Boolean).join(', ') ||
    'Chưa cập nhật địa chỉ'
  );
}

function occupancyPercent(row: UserBuildingView): number {
  if (!row.slots.total) return 0;
  return Math.round(((row.slots.occupied + row.slots.reserved) / row.slots.total) * 100);
}

function contactText(member: UserBuildingContact): string {
  const parts: string[] = [];
  if (member.phone) parts.push(member.phone);
  if (member.email) parts.push(member.email);
  return parts.length ? parts.join(' - ') : 'Chưa cập nhật liên hệ';
}

function BuildingCard({
  row,
  selected,
  onSelect,
}: {
  row: UserBuildingView;
  selected: boolean;
  onSelect: () => void;
}) {
  const hours = formatHours(row.building.operatingHours?.open, row.building.operatingHours?.close);
  const percent = occupancyPercent(row);

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
            {row.building.code || 'PBMS'}
          </p>
          <h2 className="mt-2 text-lg font-black text-white">{row.building.name}</h2>
          <p className="mt-2 flex items-start gap-2 text-xs font-semibold leading-relaxed text-slate-400">
            <MapPin size={14} className="mt-0.5 shrink-0 text-cyan-300" />
            <span>{addressText(row)}</span>
          </p>
        </div>
        <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-300">
          Đang mở
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
          <p className="mt-2 text-[10px] font-bold uppercase text-slate-500">Slot trống</p>
          <p className="mt-1 text-sm font-black text-emerald-300">
            {row.slots.available}/{row.slots.total || 0}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-950/55 p-3">
          <Building2 size={15} className="text-cyan-300" />
          <p className="mt-2 text-[10px] font-bold uppercase text-slate-500">Số tầng</p>
          <p className="mt-1 text-sm font-black text-white">{row.building.totalFloors || 0}</p>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-950">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-300 to-orange-400"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </button>
  );
}

function TeamList({
  title,
  members,
}: {
  title: string;
  members: UserBuildingContact[];
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <p className="text-xs font-black uppercase tracking-wider text-slate-300">{title}</p>

      {members.length > 0 ? (
        <div className="mt-3 space-y-3">
          {members.map((member) => (
            <div key={member._id} className="rounded-xl bg-white/5 px-3 py-2">
              <p className="text-sm font-black text-white">{member.fullName}</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">{contactText(member)}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs font-semibold text-slate-500">Chưa cập nhật danh sách.</p>
      )}
    </div>
  );
}

export default function BuildingsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<UserBuildingView[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadBuildings() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listUserBuildingViews();
        if (ignore) return;
        setRows(data);
        setSelectedId(data[0]?.building._id || '');
      } catch (err) {
        if (ignore) return;
        setError(err instanceof Error ? err.message : 'Không thể tải thông tin tòa nhà.');
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadBuildings();
    return () => {
      ignore = true;
    };
  }, []);

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return rows;
    return rows.filter((row) => {
      const haystack = [row.building.name, row.building.code, addressText(row)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [query, rows]);

  const selectedRow = useMemo(
    () => filteredRows.find((row) => row.building._id === selectedId) || filteredRows[0] || null,
    [filteredRows, selectedId],
  );

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
              Xem giờ mở cửa, bảng giá và số slot còn trống trước khi di chuyển hoặc đặt chỗ.
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
        ) : error ? (
          <div className="rounded-3xl border border-rose-400/25 bg-rose-500/10 p-6 text-sm font-semibold text-rose-200">
            {error}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-4">
              {filteredRows.map((row) => (
                <BuildingCard
                  key={row.building._id}
                  row={row}
                  selected={selectedRow?.building._id === row.building._id}
                  onSelect={() => setSelectedId(row.building._id)}
                />
              ))}

              {filteredRows.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-slate-900/50 p-8 text-center text-sm font-semibold text-slate-400">
                  Không tìm thấy tòa nhà phù hợp.
                </div>
              ) : null}
            </div>

            {selectedRow ? (
              <aside className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl lg:sticky lg:top-6 lg:self-start">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                      {selectedRow.building.code || 'BUILDING'}
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-white">{selectedRow.building.name}</h2>
                    <p className="mt-2 flex items-start gap-2 text-sm font-semibold leading-relaxed text-slate-400">
                      <MapPin size={16} className="mt-0.5 shrink-0 text-orange-300" />
                      <span>{addressText(selectedRow)}</span>
                    </p>
                  </div>
                  <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-right">
                    <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Slot trống</p>
                    <p className="mt-1 text-3xl font-black text-white">{selectedRow.slots.available}</p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <Clock3 size={18} className="text-orange-300" />
                    <p className="mt-3 text-xs font-bold uppercase text-slate-500">Giờ mở cửa</p>
                    <p className="mt-1 text-lg font-black text-white">
                      {formatHours(
                        selectedRow.building.operatingHours?.open,
                        selectedRow.building.operatingHours?.close,
                      )}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <CarFront size={18} className="text-cyan-300" />
                    <p className="mt-3 text-xs font-bold uppercase text-slate-500">Tổng slot</p>
                    <p className="mt-1 text-lg font-black text-white">{selectedRow.slots.total || 0}</p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-4 gap-3">
                  {[
                    ['Trống', selectedRow.slots.available, 'text-emerald-300'],
                    ['Đang đỗ', selectedRow.slots.occupied, 'text-orange-300'],
                    ['Đã giữ', selectedRow.slots.reserved, 'text-purple-300'],
                    ['Bảo trì', selectedRow.slots.maintenance, 'text-rose-300'],
                  ].map(([label, value, color]) => (
                    <div key={String(label)} className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
                      <p className="text-[10px] font-bold uppercase text-slate-500">{label}</p>
                      <p className={`mt-1 text-lg font-black ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>

                

                <div className="mt-7">
                  <div className="mb-3 flex items-center gap-2">
                    <WalletCards size={18} className="text-orange-300" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">Bảng giá</h3>
                  </div>

                  <div className="space-y-3">
                    {selectedRow.pricePolicies.length > 0 ? (
                      selectedRow.pricePolicies.map((policy) => (
                        <div
                          key={policy._id}
                          className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="flex items-center gap-2 text-sm font-black text-white">
                                {vehicleLabel(policy).toLowerCase().includes('xe may') ? (
                                  <Bike size={16} className="text-purple-300" />
                                ) : (
                                  <CarFront size={16} className="text-cyan-300" />
                                )}
                                {policy.name}
                              </p>
                              <p className="mt-1 text-xs font-semibold text-slate-400">{vehicleLabel(policy)}</p>
                            </div>
                            <p className="text-right text-sm font-black text-orange-300">
                              {formatMoney(policy.hourlyRate)}
                              <span className="block text-[10px] font-bold uppercase text-slate-500">/ giờ</span>
                            </p>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold text-slate-300">
                            <span className="rounded-full bg-white/5 px-3 py-1">
                              Trần ngày: {formatMoney(policy.dailyCap)}
                            </span>
                            <span className="rounded-full bg-white/5 px-3 py-1">
                              Khung giờ: {formatHours(policy.timeWindow?.from, policy.timeWindow?.to)}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm font-semibold text-slate-400">
                        Chưa có chính sách giá riêng. Giá mặc định:{' '}
                        <span className="font-black text-orange-300">
                          {formatMoney(selectedRow.building.pricing?.hourlyRate)}/giờ
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate('/reservations', {
                      state: { buildingId: selectedRow.building._id },
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
