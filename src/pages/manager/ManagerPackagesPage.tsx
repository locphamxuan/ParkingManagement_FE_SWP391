import { packageData } from '../../data/managerFlow';

interface ManagerPackagesPageProps {
  onClose?: () => void;
}

export default function ManagerPackagesPage({ onClose }: ManagerPackagesPageProps = {}) {
  const totalActiveSubscriptions = packageData.reduce((sum, pkg) => sum + pkg.activeSubscriptions, 0);
  const totalRevenue = packageData.reduce((sum, pkg) => sum + (pkg.price * pkg.activeSubscriptions), 0);

  return (
    <section className="p-6 border border-gray-200 rounded-lg bg-white grid gap-6">
      <div className="flex justify-between gap-4 items-center">
        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-blue-400 font-bold">FR-MGR-08/10</p>
          <h2 className="m-0 text-2xl font-bold">Goi dai han va chinh sach dat truoc</h2>
        </div>
        <button className="px-4 py-2.5 rounded-lg border border-blue-400/42 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors" type="button">
          Them goi moi
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-blue-50 to-white">
          <p className="m-0 text-xs text-gray-600 mb-2">Tong goi</p>
          <strong className="block text-2xl font-bold text-blue-600">{packageData.length}</strong>
          <small className="text-xs text-gray-600">Loai goi</small>
        </article>
        <article className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-green-50 to-white">
          <p className="m-0 text-xs text-gray-600 mb-2">Khach dang ky</p>
          <strong className="block text-2xl font-bold text-green-600">{totalActiveSubscriptions}</strong>
          <small className="text-xs text-gray-600">Subscriptions</small>
        </article>
        <article className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-yellow-50 to-white">
          <p className="m-0 text-xs text-gray-600 mb-2">Doanh thu goi</p>
          <strong className="block text-2xl font-bold text-yellow-600">{(totalRevenue / 1000000).toFixed(1)}B</strong>
          <small className="text-xs text-gray-600">VND</small>
        </article>
      </div>

      <div>
        <h3 className="m-0 font-bold text-gray-900 mb-4">Cac goi dat chon available (FR-MGR-08)</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {packageData.map((pkg) => {
            const pkgRevenue = pkg.price * pkg.activeSubscriptions;
            return (
              <article key={pkg.id} className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow">
                <div className="mb-3 pb-3 border-b border-gray-200">
                  <h4 className="m-0 font-bold text-gray-900">{pkg.name}</h4>
                  <p className="m-0 text-xs text-gray-600 mt-1">{pkg.description}</p>
                </div>
                <div className="space-y-2 mb-4">
                  <p className="m-0 text-sm">
                    <strong>Thoi han:</strong> <span className="text-blue-600 font-bold">{pkg.duration}</span>
                  </p>
                  <p className="m-0 text-sm">
                    <strong>Slot:</strong> <span className="text-green-600 font-bold">{pkg.slotCount}</span>
                  </p>
                  <p className="m-0 text-lg font-bold text-yellow-600">
                    {pkg.price.toLocaleString('vi-VN')}đ
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded border border-blue-200 mb-4">
                  <p className="m-0 text-xs text-blue-900">
                    <strong>Doanh thu:</strong> {(pkgRevenue / 1000000).toFixed(1)}B VND
                  </p>
                  <p className="m-0 text-xs text-blue-900 mt-1">
                    <strong>Khach dang ky:</strong> {pkg.activeSubscriptions}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 rounded text-xs border border-blue-400 bg-blue-50 text-blue-600 font-bold hover:bg-blue-100">
                    Chinh sua
                  </button>
                  <button className="flex-1 px-3 py-2 rounded text-xs border border-gray-300 bg-gray-100 text-gray-700 font-bold hover:bg-gray-200">
                    Chi tiet
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <article className="p-6 border border-gray-200 rounded-lg bg-gradient-to-br from-blue-50 to-white">
        <h3 className="m-0 font-bold text-gray-900 mb-3">Chinh sach Dat truoc (FR-MGR-10)</h3>
        <div className="grid gap-4 md:grid-cols-3 mb-4">
          <div className="p-4 bg-white rounded border border-gray-200">
            <p className="m-0 text-xs text-gray-600 mb-1"><strong>Ty le dat truoc</strong></p>
            <p className="m-0 text-lg font-bold text-blue-600">20%</p>
            <small className="text-xs text-gray-600">cua tong slot</small>
          </div>
          <div className="p-4 bg-white rounded border border-gray-200">
            <p className="m-0 text-xs text-gray-600 mb-1"><strong>Thoi gian giu slot</strong></p>
            <p className="m-0 text-lg font-bold text-green-600">30 phut</p>
            <small className="text-xs text-gray-600">Toi da</small>
          </div>
          <div className="p-4 bg-white rounded border border-gray-200">
            <p className="m-0 text-xs text-gray-600 mb-1"><strong>Chinh sach hoan tien</strong></p>
            <p className="m-0 text-lg font-bold text-yellow-600">100%</p>
            <small className="text-xs text-gray-600">neu huy truoc 30p</small>
          </div>
        </div>
        <button className="w-full px-4 py-2.5 rounded-lg border border-blue-400/42 bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors">
          Cap nhat chinh sach dat truoc
        </button>
      </article>

      <article className="p-6 border border-gray-200 rounded-lg bg-gradient-to-br from-orange-50 to-white">
        <h3 className="m-0 font-bold text-gray-900 mb-3">Luu y</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li>Goi dai han cho phep khach hang dat mot slot trong thoi gian dai han (tuan/thang/quy)</li>
          <li>Phuong thuc tinh gia: gia goi = gia hang ngay × so ngay</li>
          <li>Dat truoc chi ap dung cho khach hang khong co goi dai han</li>
          <li>Ty le dat truoc va chinh sach hoan tien duoc quy dinh boi Admin - Manager chi co the xem</li>
          <li>Doanh thu goi duoc tinh vao doanh thu hom nay cua toa nha</li>
        </ul>
      </article>
    </section>
  );
}
