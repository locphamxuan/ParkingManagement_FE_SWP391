import type { LegacyModule } from '../../data/mainFlow';

interface ModuleGridProps {
  modules: LegacyModule[];
  compact?: boolean;
  onAction: (module: LegacyModule) => void;
}

export default function ModuleGrid({ modules, compact = false, onAction }: ModuleGridProps) {
  return (
    <div className={`grid gap-4 ${compact ? 'grid-cols-3' : 'grid-cols-4'} max-lg:grid-cols-1`}>
      {modules.map((module) => (
        <article
          className={`p-5 rounded-lg border bg-white grid gap-3 min-h-56 ${
            module.available ? 'border-gray-200' : 'bg-slate-50 border-gray-200'
          }`}
          key={module.id}
        >
          <div className="flex justify-between gap-2.5 items-start">
            <div>
              <p className="m-0 mb-1 text-gray-500 text-xs uppercase tracking-wider">{module.available ? 'San sang' : 'Sap ra mat'}</p>
              <h3 className="m-0 text-base">{module.title}</h3>
            </div>
            <span className="px-2.5 py-1.5 rounded-full text-xs border border-orange-400/26 text-orange-700 bg-orange-100/10">
              {module.available ? 'Mo ngay' : 'Cho them'}
            </span>
          </div>

          <p className="m-0 text-gray-500 leading-relaxed">{module.description}</p>

          <button
            className={`px-3.5 py-2.75 rounded-xl border font-bold transition-colors ${
              module.available
                ? 'border-orange-400/26 bg-orange-100/12 text-orange-800 hover:bg-orange-100/20'
                : 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed'
            }`}
            type="button"
            onClick={() => onAction(module)}
            disabled={!module.available}
          >
            {module.actionLabel}
          </button>
        </article>
      ))}
    </div>
  );
}
