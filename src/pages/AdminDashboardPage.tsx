import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  adminFlowModules,
  adminKpis,
  auditRows,
  buildingRows,
  guardrails,
  managerAssignments,
  policyPushLogs,
  revenueSnapshots,
  walletSnapshots,
} from '../data/adminFlow';

const tabConfig = [
  { key: 'overview', title: 'Tong quan', fr: 'FR-ADM-03' },
  { key: 'buildings', title: 'Toa nha', fr: 'FR-ADM-01' },
  { key: 'managers', title: 'Manager', fr: 'FR-ADM-02' },
  { key: 'revenue', title: 'Doanh thu', fr: 'FR-ADM-03' },
  { key: 'wallet', title: 'System wallet', fr: 'FR-ADM-04' },
  { key: 'policies', title: 'Policy push', fr: 'FR-ADM-06' },
  { key: 'audits', title: 'Audit logs', fr: 'FR-ADM-05' },
] as const;

interface AdminDashboardPageProps {
  user?: { fullName?: string; email?: string } | null;
  onLogout: () => void;
  onRefresh: () => void;
}

export default function AdminDashboardPage({ user, onLogout, onRefresh }: AdminDashboardPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const activeTab = useMemo(
    () => (tabConfig.some((tab) => tab.key === tabParam) ? tabParam : 'overview'),
    [tabParam]
  );

  const displayName = user?.fullName || user?.email || 'System Admin';

  const switchTab = (nextTab: string) => {
    setSearchParams({ tab: nextTab });
  };

  return (
    <main className="grid gap-6 p-6">
      <section className="relative p-7 flex justify-between gap-4.5 items-start overflow-hidden border border-white/8 bg-gradient-to-br from-slate-950 to-slate-900 shadow-2xl shadow-black/26 rounded-lg">
        <div className="relative z-10">
          <p className="mb-3 text-xs uppercase tracking-wider text-orange-400 font-bold">PBMS Admin Console</p>
          <h2 className="text-2xl md:text-3xl leading-tight font-bold text-white mb-3">Dieu hanh da toa nha cho {displayName}</h2>
          <p className="text-slate-300 max-w-2xl">
            Giao dien nay tap trung vao 6 nghiep vu Admin: quan ly toa nha, gan manager, bao cao doanh thu,
            system wallet, audit logs va policy push. Toan bo bloc duoc mo ta theo BRD/schema v0.19.
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
        <aside className="p-5 grid gap-4 content-start border border-gray-200 rounded-lg bg-white" aria-label="Dieu huong quan tri">
          <div>
            <p className="mb-3.5 text-xs uppercase tracking-wider text-orange-400 font-bold">Phan he Admin</p>
            <h3 className="m-0 text-lg font-bold">Role: ADMIN</h3>
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
                <span className="font-medium">{tab.title}</span>
                <small className="text-gray-500 font-bold text-xs">{tab.fr}</small>
              </button>
            ))}
          </nav>

          <div className="grid gap-2.5">
            {adminFlowModules.map((module) => (
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
                  <p className="mb-2 text-xs uppercase tracking-wider text-orange-400 font-bold">Tong quan van hanh</p>
                  <h2 className="m-0 text-2xl font-bold">KPI theo ngay</h2>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                {adminKpis.map((item) => (
                  <article className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-white" key={item.id}>
                    <p className="m-0 text-xs text-gray-600 mb-2">{item.label}</p>
                    <strong className="block text-2xl font-bold text-gray-900 mb-1">{item.value}</strong>
                    <span className="text-xs text-green-600">{item.trend}</span>
                  </article>
                ))}
              </div>

              <article className="p-6 border border-gray-200 rounded-lg bg-gradient-to-br from-blue-50 to-white">
                <p className="m-0 mb-2 text-xs uppercase tracking-wider text-orange-400 font-bold">Quy uoc card & parking session</p>
                <h3 className="m-0 text-lg font-bold mb-3">Systemization rule for account card and walk-in guest</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  {guardrails.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </article>
            </section>
          )}

          {activeTab === 'buildings' && (
            <section className="p-6 border border-gray-200 rounded-lg bg-white grid gap-6">
              <div className="flex justify-between gap-4 items-center">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-orange-400 font-bold">FR-ADM-01</p>
                  <h2 className="m-0 text-2xl font-bold">Danh sach toa nha</h2>
                </div>
                <button className="px-4 py-2.5 rounded-lg border border-blue-400/42 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors" type="button">
                  Them toa nha
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Code</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Ten toa</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Khu vuc</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Suc chua</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Gio mo cua</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Manager</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Trang thai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buildingRows.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">{row.id}</td>
                        <td className="px-4 py-3 text-gray-900">{row.name}</td>
                        <td className="px-4 py-3 text-gray-600">{row.city}</td>
                        <td className="px-4 py-3 text-gray-600">{row.capacity}</td>
                        <td className="px-4 py-3 text-gray-600">{row.openHours}</td>
                        <td className="px-4 py-3 text-gray-600">{row.manager}</td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            row.status === 'active' ? 'bg-green-100 text-green-800' :
                            row.status === 'paused' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>{row.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'managers' && (
            <section className="p-6 border border-gray-200 rounded-lg bg-white grid gap-6">
              <div className="flex justify-between gap-4 items-center">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-orange-400 font-bold">FR-ADM-02</p>
                  <h2 className="m-0 text-2xl font-bold">Gan manager vao toa nha</h2>
                </div>
                <button className="px-4 py-2.5 rounded-lg border border-blue-400/42 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors" type="button">
                  Tao phan cong
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {managerAssignments.map((item) => (
                  <article key={item.account} className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-white">
                    <div className="mb-3">
                      <h3 className="m-0 font-bold text-gray-900">{item.manager}</h3>
                      <p className="m-0 text-sm text-gray-600 mt-1">{item.account}</p>
                    </div>
                    <p className="m-0 text-sm text-gray-700 mb-3">
                      <strong>Toa phu trach:</strong> {item.buildings.join(', ')}
                    </p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      item.status === 'active' ? 'bg-green-100 text-green-800' :
                      item.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>{item.status}</span>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'revenue' && (
            <section className="p-6 border border-gray-200 rounded-lg bg-white grid gap-6">
              <div>
                <p className="mb-2 text-xs uppercase tracking-wider text-orange-400 font-bold">FR-ADM-03</p>
                <h2 className="m-0 text-2xl font-bold">Bao cao doanh thu lien toa</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {revenueSnapshots.map((row) => (
                  <article key={row.period} className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-white">
                    <h3 className="m-0 font-bold text-gray-900 mb-2">{row.period}</h3>
                    <p className="m-0 text-sm text-gray-700 mb-1">Gross: {row.gross}</p>
                    <p className="m-0 text-sm text-gray-700 mb-1">Distributed: {row.distribution}</p>
                    <p className="m-0 text-sm text-gray-700">Pending: {row.pending}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'wallet' && (
            <section className="p-6 border border-gray-200 rounded-lg bg-white grid gap-6">
              <div className="flex justify-between gap-4 items-center">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-orange-400 font-bold">FR-ADM-04</p>
                  <h2 className="m-0 text-2xl font-bold">System wallet and distribution</h2>
                </div>
                <button className="px-4 py-2.5 rounded-lg border border-blue-400/42 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors" type="button">
                  Tao dot phan phoi
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                {walletSnapshots.map((item) => (
                  <article key={item.label} className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-blue-50 to-white">
                    <p className="m-0 text-xs text-gray-600 mb-2">{item.label}</p>
                    <strong className="block text-2xl font-bold text-gray-900">{item.value}</strong>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'policies' && (
            <section className="p-6 border border-gray-200 rounded-lg bg-white grid gap-6">
              <div className="flex justify-between gap-4 items-center">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-orange-400 font-bold">FR-ADM-06</p>
                  <h2 className="m-0 text-2xl font-bold">Policy push logs</h2>
                </div>
                <button className="px-4 py-2.5 rounded-lg border border-blue-400/42 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors" type="button">
                  Push gia moi
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Log ID</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Actor</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Building</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Policy</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Old</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">New</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Pushed at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {policyPushLogs.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">{row.id}</td>
                        <td className="px-4 py-3 text-gray-600">{row.actor}</td>
                        <td className="px-4 py-3 text-gray-600">{row.building}</td>
                        <td className="px-4 py-3 text-gray-600">{row.policy}</td>
                        <td className="px-4 py-3 text-gray-600">{row.oldValue}</td>
                        <td className="px-4 py-3 text-gray-600">{row.newValue}</td>
                        <td className="px-4 py-3 text-gray-600">{row.pushedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'audits' && (
            <section className="p-6 border border-gray-200 rounded-lg bg-white grid gap-6">
              <div className="flex justify-between gap-4 items-center">
                <div>
                  <p className="mb-2 text-xs uppercase tracking-wider text-orange-400 font-bold">FR-ADM-05</p>
                  <h2 className="m-0 text-2xl font-bold">Audit logs</h2>
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
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Actor</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Action</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Table</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Impact</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">At</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-900">Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditRows.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">{row.id}</td>
                        <td className="px-4 py-3 text-gray-600">{row.actor}</td>
                        <td className="px-4 py-3 text-gray-600">{row.action}</td>
                        <td className="px-4 py-3 text-gray-600">{row.target}</td>
                        <td className="px-4 py-3 text-gray-600">{row.impact}</td>
                        <td className="px-4 py-3 text-gray-600">{row.at}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
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
