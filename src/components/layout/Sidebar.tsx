import { NavLink } from 'react-router-dom';
import {
  Building2,
  ChevronLeft,
  CircleDollarSign,
  FileSearch,
  Fingerprint,
  LayoutDashboard,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const modules = [
  { to: '', label: 'Overview', icon: LayoutDashboard },
  { to: 'buildings', label: 'Buildings', icon: Building2 },
  { to: 'users', label: 'Users', icon: Users },
  { to: 'revenue-analytics', label: 'Revenue Analytics', icon: CircleDollarSign },
  { to: 'audit-logs', label: 'Audit Logs', icon: FileSearch },
] as const;

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen border-r border-white/8 bg-slate-900/95 p-4 shadow-[4px_0_30px_rgba(0,0,0,0.25)] backdrop-blur-xl lg:block transition-all duration-350 ease-in-out',
        collapsed ? 'w-[84px]' : 'w-[264px]'
      )}
    >
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-white/8 bg-slate-800/60 p-3 shadow-sm backdrop-blur-md">
        {!collapsed ? (
          <div className="pl-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Environment</p>
            <p className="text-xs font-extrabold text-slate-100">ADMIN PORTAL</p>
          </div>
        ) : (
          <Fingerprint className="text-primary drop-shadow-[0_0_8px_rgba(249,115,22,0.25)] h-5 w-5 mx-auto" />
        )}
        <Button size="sm" variant="ghost" onClick={onToggle} className="h-7 w-7 rounded-lg p-0 hover:bg-white/8 text-slate-400 hover:text-white">
          <ChevronLeft className={cn('h-3.5 w-3.5 transition-all duration-300', collapsed && 'rotate-180')} />
        </Button>
      </div>

      <nav className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-100px)] pr-1">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <NavLink
              key={module.label}
              to={module.to}
              end={module.to === ''}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-300',
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25 scale-[1.02]'
                    : 'text-slate-400 hover:bg-white/6 hover:text-slate-100'
                )
              }
            >
              <Icon size={15} className="shrink-0" />
              {!collapsed ? <span className="tracking-wide">{module.label}</span> : null}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
