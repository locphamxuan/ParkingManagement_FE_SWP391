import { vehicleTypeData } from '../../data/managerFlow';

interface ManagerVehiclesPageProps {
  onClose?: () => void;
}

export default function ManagerVehiclesPage({ onClose }: ManagerVehiclesPageProps = {}) {
  return (
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

      <div className="grid gap-4 md:grid-cols-2">
        {vehicleTypeData.map((vehicle) => (
          <article key={vehicle.id} className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-white">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="m-0 font-bold text-gray-900">{vehicle.name}</h3>
                <p className="m-0 text-xs text-gray-600 mt-1 font-mono">{vehicle.code}</p>
              </div>
              <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-bold">{vehicle.status}</span>
            </div>
            <p className="m-0 text-sm text-gray-700 mb-1">
              <strong>Chieu cao:</strong> {vehicle.maxHeight}
            </p>
            <p className="m-0 text-sm text-gray-700 mb-3">
              <strong>Chieu rong:</strong> {vehicle.maxWidth}
            </p>
            <div className="flex gap-2">
              <button className="flex-1 px-2 py-1.5 rounded text-xs border border-blue-400 bg-blue-50 text-blue-600 font-bold hover:bg-blue-100">
                Chinh sua
              </button>
              <button className="flex-1 px-2 py-1.5 rounded text-xs border border-gray-300 bg-gray-100 text-gray-700 font-bold hover:bg-gray-200">
                Xoa
              </button>
            </div>
          </article>
        ))}
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
  );
}
