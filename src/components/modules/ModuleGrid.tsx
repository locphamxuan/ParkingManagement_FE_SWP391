import type { LegacyModule } from '../../data/mainFlow';

interface ModuleGridProps {
  modules: LegacyModule[];
  compact?: boolean;
  onAction: (module: LegacyModule) => void;
}

export default function ModuleGrid({ modules, compact = false, onAction }: ModuleGridProps) {
  return (
    <div className={`grid ${compact ? 'grid-cols-1 gap-4' : 'grid-cols-4 gap-4'} w-full`}> 
      {modules.map((module) => (
        <article
          key={module.id}
          className={`p-5 rounded-lg border ${module.available ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-80'}`}
        >
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="text-xs uppercase text-gray-500">{module.available ? 'Sẵn sàng' : 'Sắp ra mắt'}</p>
              <h3 className="mt-1 text-lg font-semibold">{module.title}</h3>
            </div>
            <span className="px-3 py-1 rounded-full text-sm font-semibold text-orange-700 bg-orange-100">
              {module.available ? 'Mở ngay' : 'Chờ thêm'}
            </span>
          </div>

          <p className="mt-3 text-sm text-gray-600">{module.description}</p>

          <div className="mt-4">
            <button
              className={`px-3 py-2 rounded-md font-semibold ${module.available ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-400'}`}
              type="button"
              onClick={() => onAction(module)}
              disabled={!module.available}
            >
              {module.actionLabel}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
