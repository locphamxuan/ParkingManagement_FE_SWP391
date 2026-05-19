import type { LegacyModule } from '../../data/mainFlow';
import './ModuleGrid.css';

interface ModuleGridProps {
  modules: LegacyModule[];
  compact?: boolean;
  onAction: (module: LegacyModule) => void;
}

export default function ModuleGrid({ modules, compact = false, onAction }: ModuleGridProps) {
  return (
    <div className={`module-grid ${compact ? 'compact' : ''}`}>
      {modules.map((module) => (
        <article className={`module-card ${module.available ? 'available' : 'locked'}`} key={module.id}>
          <div className="module-card-head">
            <div>
              <p className="module-kicker">{module.available ? 'San sang' : 'Sap ra mat'}</p>
              <h3>{module.title}</h3>
            </div>
            <span className="module-badge">{module.available ? 'Mo ngay' : 'Cho them'}</span>
          </div>

          <p>{module.description}</p>

          <button className="module-button" type="button" onClick={() => onAction(module)}>
            {module.actionLabel}
          </button>
        </article>
      ))}
    </div>
  );
}
