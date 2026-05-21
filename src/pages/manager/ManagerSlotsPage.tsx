import { slotStatusData } from '../../data/managerFlow';

interface ManagerSlotsPageProps {
  onClose?: () => void;
}

export default function ManagerSlotsPage({ onClose }: ManagerSlotsPageProps = {}) {
  return (
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

      <article className="p-6 border border-gray-200 rounded-lg bg-gradient-to-br from-green-50 to-white">
        <h3 className="m-0 font-bold text-gray-900 mb-4">Thong ke slot theo tang</h3>
        <div className="space-y-3">
          {slotStatusData.map((row) => {
            const total = row.available + row.occupied + row.reserved + row.maintenance;
            return (
              <div key={row.floor} className="flex items-center gap-4">
                <span className="text-sm font-medium w-20">{row.floor}</span>
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-green-400" 
                      style={{ width: `${(row.available / total) * 100}%` }}
                      title={`Trong: ${row.available}`}
                    ></div>
                    <div 
                      className="h-full bg-orange-400"
                      style={{ width: `${(row.occupied / total) * 100}%` }}
                      title={`Dang dung: ${row.occupied}`}
                    ></div>
                    <div 
                      className="h-full bg-blue-400"
                      style={{ width: `${(row.reserved / total) * 100}%` }}
                      title={`Dat truoc: ${row.reserved}`}
                    ></div>
                    <div 
                      className="h-full bg-red-400"
                      style={{ width: `${(row.maintenance / total) * 100}%` }}
                      title={`Bao tri: ${row.maintenance}`}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-bold w-12 text-right">{total}</span>
              </div>
            );
          })}
        </div>
      </article>
    </section>
  );
}
