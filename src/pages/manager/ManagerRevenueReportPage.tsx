import { revenueReportManager } from '../../data/managerFlow';

interface ManagerRevenueReportPageProps {
  onClose?: () => void;
}

export default function ManagerRevenueReportPage({ onClose }: ManagerRevenueReportPageProps = {}) {
  const totalRevenue = revenueReportManager.reduce((sum, row) => sum + row.revenue, 0);
  const totalSessions = revenueReportManager.reduce((sum, row) => sum + row.sessions, 0);
  const totalOutstanding = revenueReportManager.reduce((sum, row) => sum + row.outstanding, 0);
  const totalReconciled = revenueReportManager.reduce((sum, row) => sum + row.reconciled, 0);

  return (
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

      <div className="grid gap-4 md:grid-cols-4">
        <article className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-blue-50 to-white">
          <p className="m-0 text-xs text-gray-600 mb-2">Tong doanh thu</p>
          <strong className="block text-2xl font-bold text-blue-600">{totalRevenue.toFixed(1)}M</strong>
          <small className="text-xs text-gray-600">VND</small>
        </article>
        <article className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-green-50 to-white">
          <p className="m-0 text-xs text-gray-600 mb-2">Tong phien do</p>
          <strong className="block text-2xl font-bold text-green-600">{totalSessions}</strong>
          <small className="text-xs text-gray-600">sessions</small>
        </article>
        <article className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-orange-50 to-white">
          <p className="m-0 text-xs text-gray-600 mb-2">Cho xu ly</p>
          <strong className="block text-2xl font-bold text-orange-600">{totalOutstanding.toFixed(1)}M</strong>
          <small className="text-xs text-gray-600">VND</small>
        </article>
        <article className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-emerald-50 to-white">
          <p className="m-0 text-xs text-gray-600 mb-2">Doi soat</p>
          <strong className="block text-2xl font-bold text-emerald-600">{totalReconciled.toFixed(1)}M</strong>
          <small className="text-xs text-gray-600">VND</small>
        </article>
      </div>

      <article className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-bold text-gray-900">Ngay</th>
              <th className="px-4 py-3 text-left font-bold text-gray-900">Ca lam</th>
              <th className="px-4 py-3 text-left font-bold text-gray-900">So luot xe</th>
              <th className="px-4 py-3 text-left font-bold text-gray-900">Doanh thu</th>
              <th className="px-4 py-3 text-left font-bold text-gray-900">Cho xu ly</th>
              <th className="px-4 py-3 text-left font-bold text-gray-900">Doi soat</th>
              <th className="px-4 py-3 text-left font-bold text-gray-900">Ty le</th>
            </tr>
          </thead>
          <tbody>
            {revenueReportManager.map((row, idx) => {
              const reconcileRate = ((row.reconciled / row.revenue) * 100).toFixed(1);
              return (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{row.date}</td>
                  <td className="px-4 py-3 text-gray-600">{row.shift}</td>
                  <td className="px-4 py-3 text-gray-600">{row.sessions}</td>
                  <td className="px-4 py-3 text-gray-900 font-bold text-blue-600">{row.revenue}M</td>
                  <td className="px-4 py-3 text-orange-600 font-bold">{row.outstanding}M</td>
                  <td className="px-4 py-3 text-emerald-600 font-bold">{row.reconciled}M</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      reconcileRate === '100.0' ? 'bg-green-100 text-green-800' :
                      parseFloat(reconcileRate) > 95 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>{reconcileRate}%</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </article>

      <article className="p-6 border border-gray-200 rounded-lg bg-gradient-to-br from-blue-50 to-white">
        <h3 className="m-0 font-bold text-gray-900 mb-3">Ghi chu</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li><strong>So luot xe:</strong> Tong so phien do trong khoang thoi gian ca lam</li>
          <li><strong>Doanh thu:</strong> Tong tien thu duoc trong ca lam</li>
          <li><strong>Cho xu ly:</strong> Tien dang cho duoc xac nhan/phe duyet</li>
          <li><strong>Doi soat:</strong> Tien da duoc xac nhan va san sang phan phoi</li>
          <li><strong>Ty le:</strong> Phan tram tien da duoc doi soat so voi tong doanh thu</li>
        </ul>
      </article>
    </section>
  );
}
