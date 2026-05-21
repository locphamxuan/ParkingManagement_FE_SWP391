import { feedbackData } from '../../data/managerFlow';

interface ManagerFeedbackPageProps {
  onClose?: () => void;
}

export default function ManagerFeedbackPage({ onClose }: ManagerFeedbackPageProps = {}) {
  const pendingFeedback = feedbackData.filter(f => f.status === 'pending').length;
  const resolvedFeedback = feedbackData.filter(f => f.status === 'resolved').length;
  const avgRating = (feedbackData.reduce((sum, f) => sum + f.rating, 0) / feedbackData.length).toFixed(1);

  return (
    <section className="p-6 border border-gray-200 rounded-lg bg-white grid gap-6">
      <div className="flex justify-between gap-4 items-center">
        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-blue-400 font-bold">FR-MGR-13</p>
          <h2 className="m-0 text-2xl font-bold">Phan hoi tu khach hang</h2>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-blue-50 to-white">
          <p className="m-0 text-xs text-gray-600 mb-2">Tong phan hoi</p>
          <strong className="block text-2xl font-bold text-blue-600">{feedbackData.length}</strong>
          <small className="text-xs text-gray-600">Feedback</small>
        </article>
        <article className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-yellow-50 to-white">
          <p className="m-0 text-xs text-gray-600 mb-2">Cho phan hoi</p>
          <strong className="block text-2xl font-bold text-yellow-600">{pendingFeedback}</strong>
          <small className="text-xs text-gray-600">can xu ly</small>
        </article>
        <article className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-green-50 to-white">
          <p className="m-0 text-xs text-gray-600 mb-2">Diem danh gia trung binh</p>
          <strong className="block text-2xl font-bold text-green-600">{avgRating} ⭐</strong>
          <small className="text-xs text-gray-600">out of 5</small>
        </article>
      </div>

      <div className="grid gap-4">
        {feedbackData.map((item) => (
          <article key={item.id} className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-white">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="m-0 font-bold text-gray-900">{item.subject}</h3>
                <p className="m-0 text-xs text-gray-600 mt-1">
                  <strong>{item.customerName}</strong> • {item.date}
                </p>
              </div>
              <div className="flex gap-2 items-start">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-sm ${i < item.rating ? '⭐' : '☆'}`}>★</span>
                  ))}
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${
                  item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>{item.status}</span>
              </div>
            </div>
            <p className="m-0 text-sm text-gray-700 mb-4 p-3 bg-white rounded border border-gray-200">
              "{item.message}"
            </p>
            {item.status === 'pending' && (
              <div className="flex gap-2">
                <button className="flex-1 px-4 py-2 rounded text-sm border border-green-400 bg-green-50 text-green-600 font-bold hover:bg-green-100">
                  Phan hoi khong
                </button>
                <button className="flex-1 px-4 py-2 rounded text-sm border border-blue-400 bg-blue-600 text-white font-bold hover:bg-blue-700">
                  Viet phan hoi
                </button>
              </div>
            )}
            {item.status === 'resolved' && (
              <div className="p-3 bg-green-50 rounded border border-green-200">
                <p className="m-0 text-sm text-green-800">
                  <strong>✓ Da phan hoi</strong> - Khach hang da nhan du duoc cap</p>
              </div>
            )}
          </article>
        ))}
      </div>

      <article className="p-6 border border-gray-200 rounded-lg bg-gradient-to-br from-blue-50 to-white">
        <h3 className="m-0 font-bold text-gray-900 mb-3">Huong dan phan hoi</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li>Hay doc ky phan hoi va hieu ro yeu cau cua khach hang</li>
          <li>Phan hoi nhan than, chuan xac va co thi giai phap</li>
          <li>Neu khach hang co van de, hay huong dan ho cach lien he ho tro</li>
          <li>Dap lai trong vong 24 gio de dam bao khach hang</li>
          <li>Luu lai copy cua phan hoi de kiem tra sau</li>
        </ul>
      </article>
    </section>
  );
}
