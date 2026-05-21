import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  managerFlowModules,
  managerKpis,
  buildingInfo,
  floorData,
  gateData,
  vehicleTypeData,
  pricingData,
  policyPushLogsManager,
  staffData,
  shiftData,
  revenueReportManager,
  feedbackData,
  auditLogsManager,
  slotStatusData,
  packageData,
} from '../../data/managerFlow';

const tabConfig = [
  { key: 'overview', title: 'Tong quan', fr: 'FR-MGR-01' },
  { key: 'floors', title: 'Tang va cong', fr: 'FR-MGR-02/03' },
  { key: 'slots', title: 'Slot do xe', fr: 'FR-MGR-04' },
  { key: 'vehicles', title: 'Loai xe', fr: 'FR-MGR-05' },
  { key: 'pricing', title: 'Bang gia', fr: 'FR-MGR-06/07' },
  { key: 'packages', title: 'Goi & Dat truoc', fr: 'FR-MGR-08/10' },
  { key: 'staff', title: 'Nhan vien & Ca', fr: 'FR-MGR-11/12' },
  { key: 'reports', title: 'Bao cao doanh thu', fr: 'FR-MGR-12' },
  { key: 'feedback', title: 'Phan hoi khach', fr: 'FR-MGR-13' },
  { key: 'audit', title: 'Audit logs', fr: 'FR-MGR-14' },
] as const;

interface ManagerDashboardPageProps {
  user?: { fullName?: string; email?: string } | null;
  onLogout?: () => void;
  onRefresh?: () => void;
}

export default function ManagerDashboardPage({ user, onLogout, onRefresh }: ManagerDashboardPageProps = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const activeTab = useMemo(
    () => (tabConfig.some((tab) => tab.key === tabParam) ? tabParam : 'overview'),
    [tabParam]
  );

  const displayName = user?.fullName || user?.email || 'Manager';

  const switchTab = (nextTab: string) => {
    setSearchParams({ tab: nextTab });
  };

  return (
    <main className="grid gap-6 p-6">
      <section className="relative p-7 flex justify-between gap-4.5 items-start overflow-hidden border border-white/8 bg-gradient-to-br from-slate-950 to-slate-900 shadow-2xl shadow-black/26 rounded-lg">
        <div className="relative z-10">
          <p className="mb-3 text-xs uppercase tracking-wider text-blue-400 font-bold">PBMS Manager Console</p>
          <h2 className="text-2xl md:text-3xl leading-tight font-bold text-white mb-3">Quan ly {buildingInfo.name} cho {displayName}</h2>
          <p className="text-slate-300 max-w-2xl">
            Giao dien nay tap trung vao quan ly chi tiet toa nha: tang, cong, slot, hang gia, nhan vien,
            ca lam, doanh thu va phan hoi khach hang.
          </p>
        </div>

        <div className="absolute inset-0 opacity-50 pointer-events-none">
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-gradient-radial from-blue-400/28 to-transparent -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute inset-0 opacity-50 bg-gradient-to-r from-white/3 to-transparent via-gradient-to-b from-white/2 to-transparent"></div>
        </div>

        <div className="flex gap-2.5 flex-wrap">
          <button className="relative z-10 px-3.5 py-2.5 rounded-lg border border-gray-600 bg-gray-900 text-gray-300 font-bold hover:bg-gray-800 transition-colors" type="button" onClick={onRefresh}>
            Lam moi ho so
          </button>
          <button className="relative z-10 px-3.5 py-2.5 rounded-lg border border-red-600 bg-gradient-to-br from-red-500 to-red-600 text-white font-bold hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/20" type="button" onClick={onLogout}>
            Dang xuat
          </button>
        </div>
      </section>

      <section className="grid grid-cols-[minmax(260px,320px)_minmax(0,1fr)] gap-4.5">
        <aside className="p-5 grid gap-4 content-start border border-gray-200 rounded-lg bg-white" aria-label="Dieu huong quan li">
          <div>
            <p className="mb-3.5 text-xs uppercase tracking-wider text-blue-400 font-bold">Toa nha</p>
            <h3 className="m-0 text-lg font-bold">{buildingInfo.name}</h3>
            <p className="m-0 text-xs text-gray-600 mt-1">{buildingInfo.address}</p>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="m-0 text-xs text-gray-700 mb-1"><strong>Trang thai:</strong> {buildingInfo.status}</p>
            <p className="m-0 text-xs text-gray-700 mb-1"><strong>Gio mo cua:</strong> {buildingInfo.openHours}</p>
            <p className="m-0 text-xs text-gray-700"><strong>Slot:</strong> {buildingInfo.availableSlots}/{buildingInfo.totalSlots}</p>
          </div>

          <nav className="grid gap-2">
            {tabConfig.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`px-3.5 py-3 rounded-3xl text-left flex justify-between items-center gap-3 border transition-all ${
                  activeTab === tab.key
                    ? 'border-blue-400/42 bg-gradient-to-br from-blue-800/30 to-slate-950/92 shadow-lg shadow-blue-400/10 text-blue-300'
                    : 'border-gray-200 bg-blue-50 text-gray-900 hover:bg-blue-100'
                }`}
                onClick={() => switchTab(tab.key)}
              >
                <span className="font-medium text-sm">{tab.title}</span>
                <small className="text-gray-500 font-bold text-xs">{tab.fr}</small>
              </button>
            ))}
          </nav>

          <div className="grid gap-2.5">
            {managerFlowModules.map((module) => (
              <article key={module.id}>
                <h4 className="m-0 font-bold text-sm">{module.title}</h4>
                <p className="m-0 text-xs text-gray-600 mt-1">{module.description}</p>
              </article>
            ))}
          </div>
        </aside>

        <div>
          {activeTab === 'overview' && (
            <section className="p-6 border border-gray-200 rounded-lg bg-white grid gap-6">
              <div className="flex justify-between gap-4 items-start">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-blue-400 font-bold">Tong quan van hanh</p>
                  <h2 className="m-0 text-2xl font-bold">KPI hom nay</h2>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                {managerKpis.map((item) => (
                  <article className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-white" key={item.id}>
                    <p className="m-0 text-xs text-gray-600 mb-2">{item.label}</p>
                    <strong className="block text-2xl font-bold text-gray-900 mb-1">{item.value}</strong>
                    <span className="text-xs text-green-600">{item.trend}</span>
                  </article>
                ))}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <article className="p-6 border border-gray-200 rounded-lg bg-gradient-to-br from-green-50 to-white">
                  <h3 className="m-0 text-lg font-bold mb-4">Trang thai Slot theo Tang</h3>
                  <div className="space-y-3">
                    {slotStatusData.map((row) => (
                      <div key={row.floor} className="flex items-center gap-4">
                        <span className="text-sm font-medium w-20">{row.floor}</span>
                        <div className="flex-1 flex gap-2">
                          <div className="flex-1 text-center">
                            <div className="h-6 bg-green-400 rounded text-xs font-bold text-white flex items-center justify-center">{row.available}</div>
                            <small className="text-gray-600">Trong</small>
                          </div>
                          <div className="flex-1 text-center">
                            <div className="h-6 bg-orange-400 rounded text-xs font-bold text-white flex items-center justify-center">{row.occupied}</div>
                            <small className="text-gray-600">Dung</small>
                          </div>
                          <div className="flex-1 text-center">
                            <div className="h-6 bg-blue-400 rounded text-xs font-bold text-white flex items-center justify-center">{row.reserved}</div>
                            <small className="text-gray-600">Dat</small>
                          </div>
                          <div className="flex-1 text-center">
                            <div className="h-6 bg-red-400 rounded text-xs font-bold text-white flex items-center justify-center">{row.maintenance}</div>
                            <small className="text-gray-600">Bao tri</small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="p-6 border border-gray-200 rounded-lg bg-gradient-to-br from-blue-50 to-white">
                  <p className="m-0 mb-2 text-xs uppercase tracking-wider text-blue-400 font-bold">Thong tin toa nha</p>
                  <h3 className="m-0 text-lg font-bold mb-4">Chi tiet hoat dong</h3>
                  <ul className="space-y-2 text-sm">
                    <li><strong>Tong so tang:</strong> {buildingInfo.totalFloors}</li>
                    <li><strong>Tong so slot:</strong> {buildingInfo.totalSlots}</li>
                    <li><strong>Ty le chiem dung:</strong> {buildingInfo.occupancyRate}%</li>
                    <li><strong>Gio mo cua:</strong> {buildingInfo.openHours}</li>
                    <li><strong>Slot trong:</strong> {buildingInfo.availableSlots}</li>
                  </ul>
                </article>
              </div>
            </section>
          )}

          {activeTab === 'floors' && (
            <section className="p-6 border border-gray-200 rounded-lg bg-white grid gap-6">
              <div className="flex justify-between gap-4 items-center">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-blue-400 font-bold">FR-MGR-02/03</p>
                  <h2 className="m-0 text-2xl font-bold">Quan ly tang va cong</h2>
                </div>
                <button className="px-4 py-2.5 rounded-lg border border-blue-400/42 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors" type="button">
                  Them tang
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {floorData.map((floor) => (
                  <article key={floor.id} className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-white">
                    <div className="mb-3 flex justify-between items-start">
                      <div>
                        <h3 className="m-0 font-bold text-gray-900">{floor.name}</h3>
                        <p className="m-0 text-xs text-gray-600 mt-1">Slot: {floor.availableSlots}/{floor.totalSlots}</p>
                      </div>
                      <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-bold">{floor.occupancy}%</span>
                    </div>
                    <p className="m-0 text-sm text-gray-700 mb-2">
                      <strong>Loai xe:</strong> {floor.vehicleTypes.join(', ')}
                    </p>
                    <p className="m-0 text-sm text-gray-700 mb-3">
                      <strong>Cong:</strong> {floor.gates.join(', ')}
                    </p>
                    <div className="flex gap-2">
                      <button className="flex-1 px-2 py-1.5 rounded text-xs border border-blue-400 bg-blue-50 text-blue-600 font-bold hover:bg-blue-100">Chinh sua</button>
                      <button className="flex-1 px-2 py-1.5 rounded text-xs border border-gray-300 bg-gray-100 text-gray-700 font-bold hover:bg-gray-200">Xem chi tiet</button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Cong</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Tang</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Loai</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Xe duoc phep</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Trang thai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gateData.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900 font-bold">{row.name}</td>
                        <td className="px-4 py-3 text-gray-600">{row.floor}</td>
                        <td className="px-4 py-3 text-gray-600">{row.type}</td>
                        <td className="px-4 py-3 text-gray-600">{row.allowedVehicles.join(', ')}</td>
                        <td className="px-4 py-3">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">{row.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'slots' && (
            <section className="p-6 border border-gray-200 rounded-lg bg-white grid gap-6">
              <div className="flex justify-between gap-4 items-center">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-blue-400 font-bold">FR-MGR-04</p>
                  <h2 className="m-0 text-2xl font-bold">Quan ly slot do xe</h2>
                </div>
                <button className="px-4 py-2.5 rounded-lg border border-blue-400/42 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors" type="button">
                  Loc nang cao
                </button>
              </div>

              <div className="grid gap-4">
                {slotStatusData.map((row) => (
                  <article key={row.floor} className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="m-0 font-bold text-gray-900 mb-3">{row.floor}</h3>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="p-3 bg-green-50 rounded text-center">
                        <strong className="block text-2xl text-green-600">{row.available}</strong>
                        <small className="text-gray-600">Trong</small>
                      </div>
                      <div className="p-3 bg-orange-50 rounded text-center">
                        <strong className="block text-2xl text-orange-600">{row.occupied}</strong>
                        <small className="text-gray-600">Dang dung</small>
                      </div>
                      <div className="p-3 bg-blue-50 rounded text-center">
                        <strong className="block text-2xl text-blue-600">{row.reserved}</strong>
                        <small className="text-gray-600">Dat truoc</small>
                      </div>
                      <div className="p-3 bg-red-50 rounded text-center">
                        <strong className="block text-2xl text-red-600">{row.maintenance}</strong>
                        <small className="text-gray-600">Bao tri</small>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'vehicles' && (
            <section className="p-6 border border-gray-200 rounded-lg bg-white grid gap-6">
              <div className="flex justify-between gap-4 items-center">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-blue-400 font-bold">FR-MGR-05</p>
                  <h2 className="m-0 text-2xl font-bold">Loai phuong tien duoc phep</h2>
                </div>
                <button className="px-4 py-2.5 rounded-lg border border-blue-400/42 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors" type="button">
                  Them loai xe
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">ID</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Ten</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Code</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Chieu cao toi da</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Chieu rong toi da</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Trang thai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicleTypeData.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">{row.id}</td>
                        <td className="px-4 py-3 text-gray-600">{row.name}</td>
                        <td className="px-4 py-3 text-gray-600 font-mono">{row.code}</td>
                        <td className="px-4 py-3 text-gray-600">{row.maxHeight}</td>
                        <td className="px-4 py-3 text-gray-600">{row.maxWidth}</td>
                        <td className="px-4 py-3">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">{row.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'pricing' && (
            <section className="p-6 border border-gray-200 rounded-lg bg-white grid gap-6">
              <div className="flex justify-between gap-4 items-center">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-blue-400 font-bold">FR-MGR-06/07</p>
                  <h2 className="m-0 text-2xl font-bold">Bang gia va chinh sach</h2>
                </div>
                <button className="px-4 py-2.5 rounded-lg border border-blue-400/42 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors" type="button">
                  Them bang gia
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Loai xe</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Khung gio</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Gia/gio</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Gia toi da</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Cap nhat luc</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Boi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricingData.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900 font-bold">{row.vehicleType}</td>
                        <td className="px-4 py-3 text-gray-600">{row.timeSlot}</td>
                        <td className="px-4 py-3 text-gray-600">{row.pricePerHour.toLocaleString('vi-VN')}đ</td>
                        <td className="px-4 py-3 text-gray-600">{row.maxPrice.toLocaleString('vi-VN')}đ</td>
                        <td className="px-4 py-3 text-gray-600">{row.lastUpdated}</td>
                        <td className="px-4 py-3 text-gray-600">{row.updatedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <article className="p-6 border border-gray-200 rounded-lg bg-gradient-to-br from-blue-50 to-white">
                <h3 className="m-0 font-bold text-gray-900 mb-4">Lich su thay doi gia</h3>
                <div className="space-y-2">
                  {policyPushLogsManager.map((row) => (
                    <div key={row.id} className="flex justify-between items-center p-3 border border-gray-200 rounded bg-white">
                      <div>
                        <strong className="block text-gray-900">{row.policy}</strong>
                        <small className="text-gray-600">{row.id}</small>
                      </div>
                      <div className="text-right">
                        <div className="text-xs">
                          <span className="line-through text-gray-500">{row.oldValue}</span> → <span className="text-green-600 font-bold">{row.newValue}</span>
                        </div>
                        <small className="text-gray-600">{row.pushedAt}</small>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        row.status === 'approved' ? 'bg-green-100 text-green-800' :
                        row.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>{row.status}</span>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          )}

          {activeTab === 'packages' && (
            <section className="p-6 border border-gray-200 rounded-lg bg-white grid gap-6">
              <div className="flex justify-between gap-4 items-center">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-blue-400 font-bold">FR-MGR-08/10</p>
                  <h2 className="m-0 text-2xl font-bold">Goi dai han va chinh sach dat truoc</h2>
                </div>
                <button className="px-4 py-2.5 rounded-lg border border-blue-400/42 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors" type="button">
                  Them goi
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {packageData.map((pkg) => (
                  <article key={pkg.id} className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-white">
                    <h3 className="m-0 font-bold text-gray-900 mb-2">{pkg.name}</h3>
                    <p className="m-0 text-sm text-gray-700 mb-1"><strong>Thoi han:</strong> {pkg.duration}</p>
                    <p className="m-0 text-sm text-gray-700 mb-1"><strong>Slot:</strong> {pkg.slotCount}</p>
                    <p className="m-0 text-lg font-bold text-blue-600 mb-2">{pkg.price.toLocaleString('vi-VN')}đ</p>
                    <p className="m-0 text-xs text-gray-600 mb-3">{pkg.description}</p>
                    <p className="m-0 text-xs text-green-600 font-bold">Hoat dong: {pkg.activeSubscriptions}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'staff' && (
            <section className="p-6 border border-gray-200 rounded-lg bg-white grid gap-6">
              <div className="flex justify-between gap-4 items-center">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-blue-400 font-bold">FR-MGR-11/12</p>
                  <h2 className="m-0 text-2xl font-bold">Quan ly nhan vien va ca lam</h2>
                </div>
                <button className="px-4 py-2.5 rounded-lg border border-blue-400/42 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors" type="button">
                  Them nhan vien
                </button>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <article>
                  <h3 className="m-0 font-bold text-gray-900 mb-4">Danh sach nhan vien</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead className="bg-gray-100 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left font-bold text-gray-900">Ten</th>
                          <th className="px-4 py-3 text-left font-bold text-gray-900">Vai tro</th>
                          <th className="px-4 py-3 text-left font-bold text-gray-900">Trang thai</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffData.map((row) => (
                          <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-900 font-bold">{row.name}</td>
                            <td className="px-4 py-3 text-gray-600">{row.role}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                row.status === 'active' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>{row.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>

                <article>
                  <h3 className="m-0 font-bold text-gray-900 mb-4">Ca lam</h3>
                  <div className="space-y-3">
                    {shiftData.map((shift) => (
                      <div key={shift.id} className="p-3 border border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-white">
                        <h4 className="m-0 font-bold text-gray-900">{shift.name}</h4>
                        <p className="m-0 text-xs text-gray-600 mt-1">Can: {shift.requiredStaff} | Da phan cong: {shift.assignedStaff}</p>
                        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500" 
                            style={{ width: `${(shift.assignedStaff / shift.requiredStaff) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            </section>
          )}

          {activeTab === 'reports' && (
            <section className="p-6 border border-gray-200 rounded-lg bg-white grid gap-6">
              <div className="flex justify-between gap-4 items-center">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-blue-400 font-bold">FR-MGR-12</p>
                  <h2 className="m-0 text-2xl font-bold">Bao cao doanh thu theo ca</h2>
                </div>
                <button className="px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-100 text-gray-900 font-bold hover:bg-gray-200 transition-colors" type="button">
                  Xuat bao cao
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Ngay</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Ca lam</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">So luot xe</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Doanh thu</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Cho xu ly</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Doi soat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueReportManager.map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">{row.date}</td>
                        <td className="px-4 py-3 text-gray-600">{row.shift}</td>
                        <td className="px-4 py-3 text-gray-600">{row.sessions}</td>
                        <td className="px-4 py-3 text-gray-900 font-bold">{row.revenue}M</td>
                        <td className="px-4 py-3 text-orange-600 font-bold">{row.outstanding}M</td>
                        <td className="px-4 py-3 text-green-600 font-bold">{row.reconciled}M</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'feedback' && (
            <section className="p-6 border border-gray-200 rounded-lg bg-white grid gap-6">
              <div className="flex justify-between gap-4 items-center">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-blue-400 font-bold">FR-MGR-13</p>
                  <h2 className="m-0 text-2xl font-bold">Phan hoi tu khach hang</h2>
                </div>
              </div>

              <div className="grid gap-4">
                {feedbackData.map((item) => (
                  <article key={item.id} className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-white">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="m-0 font-bold text-gray-900">{item.subject}</h3>
                        <p className="m-0 text-xs text-gray-600 mt-1">
                          <strong>{item.customerName}</strong> - {item.date}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-sm ${i < item.rating ? '⭐' : '☆'}`}>★</span>
                        ))}
                      </div>
                    </div>
                    <p className="m-0 text-sm text-gray-700 mb-3">{item.message}</p>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>{item.status}</span>
                      {item.status === 'pending' && (
                        <button className="px-3 py-1 rounded text-xs border border-blue-400 bg-blue-50 text-blue-600 font-bold hover:bg-blue-100">
                          Phan hoi
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'audit' && (
            <section className="p-6 border border-gray-200 rounded-lg bg-white grid gap-6">
              <div className="flex justify-between gap-4 items-center">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-blue-400 font-bold">FR-MGR-14</p>
                  <h2 className="m-0 text-2xl font-bold">Audit logs toa nha</h2>
                </div>
                <button className="px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-100 text-gray-900 font-bold hover:bg-gray-200 transition-colors" type="button">
                  Loc nang cao
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">ID</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Nguoi thuc hien</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Hanh dong</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Anh huong</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Thoi gian</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Muc do</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogsManager.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">{row.id}</td>
                        <td className="px-4 py-3 text-gray-600">{row.actor}</td>
                        <td className="px-4 py-3 text-gray-600">{row.action}</td>
                        <td className="px-4 py-3 text-gray-600">{row.impact}</td>
                        <td className="px-4 py-3 text-gray-600">{row.at}</td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            row.severity === 'high' ? 'bg-red-100 text-red-800' :
                            row.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>{row.severity}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
