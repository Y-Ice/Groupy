import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TableProperties,
  Layers,
  Users,
  FolderGit2,
  QrCode,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GroupyLogo } from '../common/GroupyLogo';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { logout, currentUser } = useAuth();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('groupy_sidebar_collapsed') === 'true';
  });

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('groupy_sidebar_collapsed', String(next));
      return next;
    });
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Tables', path: '/admin/tables', icon: TableProperties },
    { label: 'Stacks', path: '/admin/stacks', icon: Layers },
    { label: 'Students', path: '/admin/students', icon: Users },
    { label: 'Groups', path: '/admin/groups', icon: FolderGit2 },
    { label: 'QR Codes', path: '/admin/qr-codes', icon: QrCode },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const adminName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Administrator';
  const initial = adminName.charAt(0).toUpperCase();

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen glass-panel border-r border-slate-200/50 dark:border-white/10 flex flex-col shrink-0 z-50 transition-all duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'w-64 lg:w-20' : 'w-64'}`}
      >
        {/* Brand Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-200/40 dark:border-white/10">
          <GroupyLogo size={36} showText={!collapsed} />

          {/* Desktop Collapse Toggle Button */}
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors border border-slate-200 dark:border-white/10 shadow-sm shrink-0"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {!collapsed && (
            <p className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 lg:block hidden">
              Main Menu
            </p>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 dark:shadow-indigo-500/20'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  } ${collapsed ? 'lg:justify-center lg:px-0' : 'justify-between'}`
                }
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                  <span className={`truncate ${collapsed ? 'lg:hidden' : 'block'}`}>{item.label}</span>
                </div>
                {!collapsed && (
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity lg:block hidden" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Sign Out */}
        <div className="p-3 border-t border-slate-200/40 dark:border-white/10 space-y-2">
          <div className="p-2.5 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-white/10 flex items-center justify-between overflow-hidden">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-xs shadow-md">
                  {initial}
                </div>
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              </div>
              <div className={`overflow-hidden ${collapsed ? 'lg:hidden' : 'block'}`}>
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{adminName}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Class Representative</p>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            title={collapsed ? 'Sign Out' : undefined}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors border border-transparent hover:border-rose-500/20 ${
              collapsed ? 'lg:justify-center' : 'justify-center'
            }`}
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span className={collapsed ? 'lg:hidden' : 'block'}>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

