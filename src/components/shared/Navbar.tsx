import { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, Search, User, LogOut } from 'lucide-react';
import AdminUserDropdown from './AdminUserDropdown';
import ManagerUserDropdown from './ManagerUserDropdown';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  title: string;
  email: string;
  onLogout: () => void;
  dropdownType?: 'admin' | 'manager';
}

export function Navbar({ title, email, onLogout, dropdownType = 'admin' }: NavbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-[rgba(255,250,243,0.86)] px-4 py-3 backdrop-blur-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-stone-600">
            Trung Tâm Điều Hành
          </p>
          <h1 className="text-xl font-semibold text-black">{title}</h1>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          <div className="relative hidden w-full max-w-md md:block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-500"
              size={16}
            />
            <Input
              className="border-border/80 bg-white/92 pl-9 text-black shadow-[0_8px_20px_rgba(120,83,48,0.06)] placeholder:text-stone-500"
              placeholder="Tìm tòa nhà, nhật ký, phiên..."
            />
          </div>

          <Button variant="secondary" size="sm" className="gap-2">
            <Bell size={15} />
            <span className="hidden sm:inline">Thông báo</span>
          </Button>

          {/* Custom user dropdown based on role */}
          {dropdownType === 'manager' ? (
            <ManagerUserDropdown email={email} onLogout={onLogout} />
          ) : (
            <AdminUserDropdown email={email} onLogout={onLogout} />
          )}
          
        </div>
      </div>
    </header>
  );
}
