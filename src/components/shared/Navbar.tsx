import { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, Search, User, LogOut } from 'lucide-react';
import AdminUserDropdown from './AdminUserDropdown';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  title: string;
  email: string;
  onLogout: () => void;
}

export function Navbar({ title, email, onLogout }: NavbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/8 bg-slate-900/90 px-6 py-4 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-500">
            HỆ THỐNG ĐIỀU HÀNH
          </p>
          <h1 className="text-xl font-bold tracking-tight text-white mt-0.5">{title}</h1>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          {/* <div className="relative hidden w-full max-w-md md:block">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
              size={15}
            />
            <Input
              className="border-white/10 bg-slate-800/70 pl-10 text-slate-200 shadow-none placeholder:text-slate-500 rounded-full h-9.5 focus:border-orange-500/40"
              placeholder="Tìm kiếm nhanh..."
            />
          </div> */}

          <Button variant="secondary" size="sm" className="gap-2 rounded-full border border-white/10 bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 hover:text-white shadow-sm h-9.5 px-4 transition-all">
            <Bell size={14} className="text-slate-400" />
            <span className="hidden sm:inline font-medium text-xs">Thông báo</span>
          </Button>

          {/* Custom user dropdown (desktop) */}
          <AdminUserDropdown email={email} onLogout={onLogout} />
          
        </div>
      </div>
    </header>
  );
}
