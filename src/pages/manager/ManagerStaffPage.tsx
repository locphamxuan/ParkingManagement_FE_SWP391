import { staffData, shiftData } from '../../data/managerFlow';

interface ManagerStaffPageProps {
  onClose?: () => void;
}

export default function ManagerStaffPage({ onClose }: ManagerStaffPageProps = {}) {
  return (
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
          <div className="grid gap-3">
            {staffData.map((staff) => (
              <div key={staff.id} className="p-3 border border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-white">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="m-0 font-bold text-gray-900">{staff.name}</h4>
                    <p className="m-0 text-xs text-gray-600 mt-1">{staff.email}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    staff.status === 'active' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>{staff.status}</span>
                </div>
                <p className="m-0 text-xs text-gray-700 mb-2">
                  <strong>Vai tro:</strong> {staff.role}
                </p>
                <p className="m-0 text-xs text-gray-700 mb-3">
                  <strong>Ca:</strong> {staff.assignedShifts.join(', ')}
                </p>
                <div className="flex gap-2">
                  <button className="flex-1 px-2 py-1.5 rounded text-xs border border-blue-400 bg-blue-50 text-blue-600 font-bold hover:bg-blue-100">
                    Edit
                  </button>
                  <button className="flex-1 px-2 py-1.5 rounded text-xs border border-gray-300 bg-gray-100 text-gray-700 font-bold hover:bg-gray-200">
                    Xoa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article>
          <h3 className="m-0 font-bold text-gray-900 mb-4">Ca lam va Phan cong (FR-MGR-11/12)</h3>
          <div className="space-y-3">
            {shiftData.map((shift) => (
              <div key={shift.id} className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-white">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="m-0 font-bold text-gray-900">{shift.name}</h4>
                  <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-bold">{shift.status}</span>
                </div>
                <p className="m-0 text-xs text-gray-700 mb-3">
                  Nhan vien: {shift.assignedStaff}/{shift.requiredStaff}
                </p>
                <div className="relative h-3 bg-gray-300 rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-green-500 transition-all" 
                    style={{ width: `${(shift.assignedStaff / shift.requiredStaff) * 100}%` }}
                  ></div>
                </div>
                <p className="m-0 text-xs text-gray-600 mb-3">
                  {Math.round((shift.assignedStaff / shift.requiredStaff) * 100)}% - {shift.requiredStaff - shift.assignedStaff} con thieu
                </p>
                <button className="w-full px-3 py-1.5 rounded text-xs border border-blue-400 bg-blue-50 text-blue-600 font-bold hover:bg-blue-100">
                  Phan cong nhan vien
                </button>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="p-6 border border-gray-200 rounded-lg bg-gradient-to-br from-blue-50 to-white">
        <h3 className="m-0 font-bold text-gray-900 mb-3">Bang chi tiet Nhan vien - Ca lam</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-gray-900">Nhan vien</th>
                <th className="px-4 py-3 text-left font-bold text-gray-900">Vai tro</th>
                <th className="px-4 py-3 text-left font-bold text-gray-900">Ca lam</th>
                <th className="px-4 py-3 text-left font-bold text-gray-900">Trang thai</th>
              </tr>
            </thead>
            <tbody>
              {staffData.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900 font-bold">{row.name}</td>
                  <td className="px-4 py-3 text-gray-600">{row.role}</td>
                  <td className="px-4 py-3 text-gray-600">{row.assignedShifts.join(', ')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
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
    </section>
  );
}
