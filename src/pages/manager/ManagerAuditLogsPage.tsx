import { auditLogsManager } from '../../data/managerFlow';

interface ManagerAuditLogsPageProps {
  onClose?: () => void;
}

export default function ManagerAuditLogsPage({ onClose }: ManagerAuditLogsPageProps = {}) {
  const highSeverity = auditLogsManager.filter(log => log.severity === 'high').length;
  const mediumSeverity = auditLogsManager.filter(log => log.severity === 'medium').length;
  const lowSeverity = auditLogsManager.filter(log => log.severity === 'low').length;

  return (
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

      <div className="grid gap-4 md:grid-cols-4">
        <article className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-blue-50 to-white">
          <p className="m-0 text-xs text-gray-600 mb-2">Tong log</p>
          <strong className="block text-2xl font-bold text-blue-600">{auditLogsManager.length}</strong>
          <small className="text-xs text-gray-600">Records</small>
        </article>
        <article className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-red-50 to-white">
          <p className="m-0 text-xs text-gray-600 mb-2">Muc do cao</p>
          <strong className="block text-2xl font-bold text-red-600">{highSeverity}</strong>
          <small className="text-xs text-gray-600">Can chu y</small>
        </article>
        <article className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-yellow-50 to-white">
          <p className="m-0 text-xs text-gray-600 mb-2">Muc do trung</p>
          <strong className="block text-2xl font-bold text-yellow-600">{mediumSeverity}</strong>
          <small className="text-xs text-gray-600">Nhan tim</small>
        </article>
        <article className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-blue-50 to-white">
          <p className="m-0 text-xs text-gray-600 mb-2">Muc do thap</p>
          <strong className="block text-2xl font-bold text-blue-600">{lowSeverity}</strong>
          <small className="text-xs text-gray-600">Thong tin</small>
        </article>
      </div>

      <article>
        <h3 className="m-0 font-bold text-gray-900 mb-4">Lich su thay doi toa nha</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-gray-900">ID</th>
                <th className="px-4 py-3 text-left font-bold text-gray-900">Nguoi thuc hien</th>
                <th className="px-4 py-3 text-left font-bold text-gray-900">Hanh dong</th>
                <th className="px-4 py-3 text-left font-bold text-gray-900">Bang du lieu</th>
                <th className="px-4 py-3 text-left font-bold text-gray-900">Anh huong</th>
                <th className="px-4 py-3 text-left font-bold text-gray-900">Thoi gian</th>
                <th className="px-4 py-3 text-left font-bold text-gray-900">Muc do</th>
              </tr>
            </thead>
            <tbody>
              {auditLogsManager.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900 font-mono font-bold">{row.id}</td>
                  <td className="px-4 py-3 text-gray-600">{row.actor}</td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">{row.action}</td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">{row.target}</td>
                  <td className="px-4 py-3 text-gray-700">{row.impact}</td>
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
      </article>

      <article className="p-6 border border-gray-200 rounded-lg bg-gradient-to-br from-blue-50 to-white">
        <h3 className="m-0 font-bold text-gray-900 mb-3">Ghi chu</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li><strong>Muc do cao (Red):</strong> Thay doi chính sách giá, quyền hạn, hoàn tiền</li>
          <li><strong>Muc do trung (Yellow):</strong> Gán nhân viên, cập nhật ca làm, thay đổi chính sách</li>
          <li><strong>Muc do thap (Blue):</strong> Thông tin chi tiết, trạng thái bảo trì slot</li>
          <li>Mỗi thay đổi được ghi lại để ủy thác và kiểm toán</li>
          <li>Có thể lọc theo người thực hiện, hành động hoặc khoảng thời gian</li>
        </ul>
      </article>

      <article className="p-6 border border-gray-200 rounded-lg bg-gradient-to-br from-orange-50 to-white">
        <h3 className="m-0 font-bold text-gray-900 mb-3">Quyền hạn quản lý</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li>Manager chỉ có thể xem audit logs trong phạm vi tòa nhà mình quản lý</li>
          <li>Không thể xóa hay chỉnh sửa audit logs - chúng được bảo vệ toàn vẹn</li>
          <li>Admin có thể xem audit logs của toàn bộ hệ thống</li>
          <li>Mỗi hành động của manager cũng được ghi lại vào audit logs</li>
        </ul>
      </article>
    </section>
  );
}
