import React from 'react';
import { Sun, Moon, Search, Bell, User, Menu } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onSearchChange?: (term: string) => void;
  onOpenMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearchChange, onOpenMobileSidebar }) => {
  const { currentUser } = useAuth();

  const adminName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Administrator';
  const initial = adminName.charAt(0).toUpperCase();

  return (
    <header className="h-16 glass-panel border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 backdrop-blur-2xl bg-white/80">
      {/* Left: Mobile Toggle & Search */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden transition-colors"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-48 sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search students, groups..."
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm rounded-full glass-input text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* User Pill */}
        <div className="flex items-center gap-2.5 pl-2 sm:pl-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 border border-indigo-400/30 flex items-center justify-center text-white font-extrabold text-xs shadow-md">
            {initial}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">
              {adminName}
            </p>
            <p className="text-[10px] text-slate-500 leading-tight font-medium">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
};

