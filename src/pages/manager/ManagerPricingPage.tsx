import { pricingData, policyPushLogsManager } from '../../data/managerFlow';

interface ManagerPricingPageProps {
  onClose?: () => void;
}

export default function ManagerPricingPage({ onClose }: ManagerPricingPageProps = {}) {
  return (
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

      <article>
        <h3 className="m-0 font-bold text-gray-900 mb-4">Hang gia hien tai</h3>
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
      </article>

      <article className="p-6 border border-gray-200 rounded-lg bg-gradient-to-br from-blue-50 to-white">
        <h3 className="m-0 font-bold text-gray-900 mb-4">Lich su thay doi gia (FR-MGR-07)</h3>
        <div className="space-y-2">
          {policyPushLogsManager.map((row) => (
            <div key={row.id} className="flex justify-between items-center p-3 border border-gray-200 rounded bg-white">
              <div>
                <strong className="block text-gray-900">{row.policy}</strong>
                <small className="text-gray-600">{row.id}</small>
              </div>
              <div className="text-right flex-1 mx-4">
                <div className="text-xs">
                  <span className="line-through text-gray-500">{row.oldValue}</span>
                </div>
                <div className="text-xs text-green-600 font-bold">
                  → {row.newValue}
                </div>
              </div>
              <div className="text-right">
                <small className="block text-gray-600">{row.pushedAt}</small>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ml-4 ${
                row.status === 'approved' ? 'bg-green-100 text-green-800' :
                row.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>{row.status}</span>
            </div>
          ))}
        </div>
      </article>

      <article className="p-6 border border-gray-200 rounded-lg bg-gradient-to-br from-orange-50 to-white">
        <h3 className="m-0 font-bold text-gray-900 mb-3">Luu y</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li>Gia duoc quy dinh trong bien do cho phep boi Admin</li>
          <li>Thay doi gia can duoc phe duyet truoc khi co hieu luc</li>
          <li>Lich su thay doi duoc ghi lai day du de kiem toan</li>
          <li>Gia toi da duoc tinh toan tu gia/gio va so gio toi da</li>
        </ul>
      </article>
    </section>
  );
}
