import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SUPER_ADMIN_EMAIL } from '../types';
import { ShieldAlert, Clock, RefreshCw, LogOut, Lock, MailCheck } from 'lucide-react';
import { GroupyLogo } from '../components/common/GroupyLogo';

export const ProtectedRoute: React.FC = () => {
  const { currentUser, loading, logout, refreshAuthStatus } = useAuth();
  const [checking, setChecking] = useState(false);

  const handleRefresh = async () => {
    try {
      setChecking(true);
      await refreshAuthStatus();
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading Groupy Workspace...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/admin/login" replace />;
  }

  // Super Admin is always allowed
  const isApproved = currentUser.isSuperAdmin || currentUser.approvalStatus === 'approved';

  if (!isApproved) {
    const isPending = currentUser.approvalStatus === 'pending' || !currentUser.approvalStatus;

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-950">
        <div className="w-full max-w-md glass-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl space-y-6">
          <div className="flex justify-center">
            <GroupyLogo size={44} />
          </div>

          {isPending ? (
            <div className="text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="w-7 h-7 animate-pulse" />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Access Approval Pending
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Your account <span className="font-bold text-slate-900 dark:text-white">{currentUser.email}</span> has requested administrator portal access.
              </p>
              <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-left space-y-1">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                  <MailCheck className="w-4 h-4 shrink-0" />
                  <span>Approval Required</span>
                </div>
                <p className="text-[11px] text-indigo-950/80 dark:text-indigo-200/80 leading-normal">
                  Access to the admin dashboard must be approved by the primary administrator account:
                  <br />
                  <strong className="text-indigo-600 dark:text-indigo-400">{SUPER_ADMIN_EMAIL}</strong>
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Access Request Declined
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Administrator access for <span className="font-bold text-slate-900 dark:text-white">{currentUser.email}</span> was declined by the primary owner ({SUPER_ADMIN_EMAIL}).
              </p>
            </div>
          )}

          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            {isPending && (
              <button
                type="button"
                onClick={handleRefresh}
                disabled={checking}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md inline-flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
                {checking ? 'Checking Status...' : 'Check Approval Status'}
              </button>
            )}

            <button
              type="button"
              onClick={logout}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out & Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
