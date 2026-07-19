import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown, ChevronLeft, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

export interface PortalNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export interface PortalNavGroup {
  label: string;
  icon: LucideIcon;
  children: readonly PortalNavItem[];
}

export type PortalNavEntry = PortalNavItem | PortalNavGroup;

const isGroup = (entry: PortalNavEntry): entry is PortalNavGroup => 'children' in entry;

interface PortalSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  /** Tên portal hiển thị ở header sidebar (vd: "ADMIN PORTAL") */
  portalLabel: string;
  items: readonly PortalNavEntry[];
  /** Prefix route của portal (vd: "/manager") — dùng để xác định group đang active */
  basePath?: string;
}

const linkClass = (isActive: boolean, nested = false) =>
  cn(
    'flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-300',
    nested && 'py-2',
    isActive
      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25 scale-[1.02]'
      : 'text-slate-400 hover:bg-white/6 hover:text-slate-100',
  );

// Sidebar dùng chung cho các portal quản trị (admin/manager) — hỗ trợ cả mục
// đơn lẻ lẫn nhóm collapsible để tránh danh sách quá dài.
export function PortalSidebar({ collapsed, onToggle, portalLabel, items, basePath = '' }: PortalSidebarProps) {
  const location = useLocation();

  const groupHasActiveChild = (group: PortalNavGroup) =>
    group.children.some((child) => location.pathname === `${basePath}/${child.to}`);

  // Mặc định mở nhóm chứa route hiện tại để người dùng không mất ngữ cảnh.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const entry of items) {
      if (isGroup(entry)) initial[entry.label] = groupHasActiveChild(entry);
    }
    return initial;
  });

  const toggleGroup = (group: PortalNavGroup) => {
    if (collapsed) {
      // Sidebar đang thu gọn: mở rộng lại và mở luôn nhóm được bấm.
      onToggle();
      setOpenGroups((prev) => ({ ...prev, [group.label]: true }));
      return;
    }
    setOpenGroups((prev) => ({ ...prev, [group.label]: !prev[group.label] }));
  };

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen border-r border-white/8 bg-slate-900/95 p-4 shadow-[4px_0_30px_rgba(0,0,0,0.25)] backdrop-blur-xl lg:block transition-all duration-350 ease-in-out',
        collapsed ? 'w-[84px]' : 'w-[264px]',
      )}
    >
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-white/8 bg-slate-800/60 p-3 shadow-sm backdrop-blur-md">
        {!collapsed ? (
          <div className="pl-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Environment</p>
            <p className="text-xs font-extrabold text-slate-100">{portalLabel}</p>
          </div>
        ) : (
          <Fingerprint className="text-primary drop-shadow-[0_0_8px_rgba(249,115,22,0.25)] h-5 w-5 mx-auto" />
        )}
        <Button size="sm" variant="ghost" onClick={onToggle} className="h-7 w-7 rounded-lg p-0 hover:bg-white/8 text-slate-400 hover:text-white">
          <ChevronLeft className={cn('h-3.5 w-3.5 transition-all duration-300', collapsed && 'rotate-180')} />
        </Button>
      </div>

      <nav className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-100px)] pr-1">
        {items.map((entry) => {
          const Icon = entry.icon;

          if (!isGroup(entry)) {
            return (
              <NavLink
                key={entry.label}
                to={entry.to}
                end={entry.to === ''}
                className={({ isActive }) => linkClass(isActive)}
              >
                <Icon size={15} className="shrink-0" />
                {!collapsed ? <span className="tracking-wide">{entry.label}</span> : null}
              </NavLink>
            );
          }

          const isOpen = Boolean(openGroups[entry.label]);
          const hasActive = groupHasActiveChild(entry);

          return (
            <div key={entry.label}>
              <button
                type="button"
                onClick={() => toggleGroup(entry)}
                className={cn(
                  'w-full flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-300',
                  hasActive && !isOpen
                    ? 'text-orange-400 bg-white/4'
                    : 'text-slate-400 hover:bg-white/6 hover:text-slate-100',
                )}
              >
                <Icon size={15} className="shrink-0" />
                {!collapsed ? (
                  <>
                    <span className="tracking-wide flex-1 text-left">{entry.label}</span>
                    <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-300', isOpen && 'rotate-180')} />
                  </>
                ) : null}
              </button>

              {!collapsed && isOpen ? (
                <div className="mt-1 mb-1.5 ml-4 space-y-1 border-l border-white/8 pl-2.5">
                  {entry.children.map((child) => {
                    const ChildIcon = child.icon;
                    return (
                      <NavLink
                        key={child.label}
                        to={child.to}
                        end={child.to === ''}
                        className={({ isActive }) => linkClass(isActive, true)}
                      >
                        <ChildIcon size={14} className="shrink-0" />
                        <span className="tracking-wide">{child.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
