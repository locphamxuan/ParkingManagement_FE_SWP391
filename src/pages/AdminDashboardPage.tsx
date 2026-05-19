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
import './AdminDashboardPage.css';

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
    <main className="workspace admin-view">
      <section className="panel admin-hero">
        <div>
          <p className="eyebrow">PBMS Admin Console</p>
          <h2>Dieu hanh da toa nha cho {displayName}</h2>
          <p className="hero-text">
            Giao dien nay tap trung vao 6 nghiep vu Admin: quan ly toa nha, gan manager, bao cao doanh thu,
            system wallet, audit logs va policy push. Toan bo bloc duoc mo ta theo BRD/schema v0.19.
          </p>
        </div>

        <div className="admin-hero-actions">
          <button className="ghost-button" type="button" onClick={onRefresh}>
            Lam moi ho so
          </button>
          <button className="primary-button danger" type="button" onClick={onLogout}>
            Dang xuat
          </button>
        </div>
      </section>

      <section className="admin-layout">
        <aside className="panel admin-sidebar" aria-label="Dieu huong quan tri">
          <div className="admin-sidebar-head">
            <p className="eyebrow">Phan he Admin</p>
            <h3>Role: ADMIN</h3>
          </div>

          <nav className="admin-tab-nav">
            {tabConfig.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`admin-tab-btn ${activeTab === tab.key ? 'is-active' : ''}`}
                onClick={() => switchTab(tab.key)}
              >
                <span>{tab.title}</span>
                <small>{tab.fr}</small>
              </button>
            ))}
          </nav>

          <div className="admin-module-list">
            {adminFlowModules.map((module) => (
              <article key={module.id}>
                <h4>{module.title}</h4>
                <p>{module.description}</p>
              </article>
            ))}
          </div>
        </aside>

        <div className="admin-content">
          {activeTab === 'overview' && (
            <section className="panel admin-section">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Tong quan van hanh</p>
                  <h2>KPI theo ngay</h2>
                </div>
              </div>

              <div className="kpi-grid">
                {adminKpis.map((item) => (
                  <article className="kpi-card" key={item.id}>
                    <p>{item.label}</p>
                    <strong>{item.value}</strong>
                    <span>{item.trend}</span>
                  </article>
                ))}
              </div>

              <article className="guardrail-panel">
                <p className="eyebrow">Quy uoc card & parking session</p>
                <h3>Systemization rule for account card and walk-in guest</h3>
                <ul>
                  {guardrails.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </article>
            </section>
          )}

          {activeTab === 'buildings' && (
            <section className="panel admin-section">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">FR-ADM-01</p>
                  <h2>Danh sach toa nha</h2>
                </div>
                <button className="primary-button" type="button">
                  Them toa nha
                </button>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Ten toa</th>
                      <th>Khu vuc</th>
                      <th>Suc chua</th>
                      <th>Gio mo cua</th>
                      <th>Manager</th>
                      <th>Trang thai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buildingRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td>{row.name}</td>
                        <td>{row.city}</td>
                        <td>{row.capacity}</td>
                        <td>{row.openHours}</td>
                        <td>{row.manager}</td>
                        <td>
                          <span className={`status-pill ${row.status}`}>{row.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'managers' && (
            <section className="panel admin-section">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">FR-ADM-02</p>
                  <h2>Gan manager vao toa nha</h2>
                </div>
                <button className="primary-button" type="button">
                  Tao phan cong
                </button>
              </div>

              <div className="assignment-grid">
                {managerAssignments.map((item) => (
                  <article className="assignment-card" key={item.account}>
                    <div>
                      <h3>{item.manager}</h3>
                      <p>{item.account}</p>
                    </div>
                    <p>
                      <strong>Toa phu trach:</strong> {item.buildings.join(', ')}
                    </p>
                    <span className={`status-pill ${item.status}`}>{item.status}</span>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'revenue' && (
            <section className="panel admin-section">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">FR-ADM-03</p>
                  <h2>Bao cao doanh thu lien toa</h2>
                </div>
              </div>

              <div className="snapshot-grid">
                {revenueSnapshots.map((row) => (
                  <article key={row.period} className="snapshot-card">
                    <h3>{row.period}</h3>
                    <p>Gross: {row.gross}</p>
                    <p>Distributed: {row.distribution}</p>
                    <p>Pending: {row.pending}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'wallet' && (
            <section className="panel admin-section">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">FR-ADM-04</p>
                  <h2>System wallet and distribution</h2>
                </div>
                <button className="primary-button" type="button">
                  Tao dot phan phoi
                </button>
              </div>

              <div className="wallet-grid">
                {walletSnapshots.map((item) => (
                  <article key={item.label} className="wallet-card">
                    <p>{item.label}</p>
                    <strong>{item.value}</strong>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'policies' && (
            <section className="panel admin-section">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">FR-ADM-06</p>
                  <h2>Policy push logs</h2>
                </div>
                <button className="primary-button" type="button">
                  Push gia moi
                </button>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Log ID</th>
                      <th>Actor</th>
                      <th>Building</th>
                      <th>Policy</th>
                      <th>Old</th>
                      <th>New</th>
                      <th>Pushed at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {policyPushLogs.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td>{row.actor}</td>
                        <td>{row.building}</td>
                        <td>{row.policy}</td>
                        <td>{row.oldValue}</td>
                        <td>{row.newValue}</td>
                        <td>{row.pushedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === 'audits' && (
            <section className="panel admin-section">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">FR-ADM-05</p>
                  <h2>Audit logs</h2>
                </div>
                <button className="ghost-button" type="button">
                  Loc nang cao
                </button>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Actor</th>
                      <th>Action</th>
                      <th>Table</th>
                      <th>Impact</th>
                      <th>At</th>
                      <th>Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td>{row.actor}</td>
                        <td>{row.action}</td>
                        <td>{row.target}</td>
                        <td>{row.impact}</td>
                        <td>{row.at}</td>
                        <td>
                          <span className={`status-pill ${row.severity}`}>{row.severity}</span>
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
