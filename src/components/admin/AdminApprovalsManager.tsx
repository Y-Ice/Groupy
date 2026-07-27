import React, { useEffect, useState } from 'react';
import { ShieldCheck, UserCheck, UserX, Clock, Plus, Check, X, Shield, Lock, Mail, AlertCircle } from 'lucide-react';
import { getAdminRequests, updateAdminApprovalStatus, preApproveAdminEmail } from '../../services/dbService';
import { AdminAccessRequest, SUPER_ADMIN_EMAIL } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const AdminApprovalsManager: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [requests, setRequests] = useState<AdminAccessRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [preApproveEmail, setPreApproveEmail] = useState<string>('');
  const [submittingPreApprove, setSubmittingPreApprove] = useState<boolean>(false);
  const [processingEmail, setProcessingEmail] = useState<string | null>(null);

  const isSuperAdmin = currentUser?.isSuperAdmin;

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await getAdminRequests();
      setRequests(data);
    } catch (err: any) {
      showToast('error', 'Error loading admin requests', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handlePreApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preApproveEmail.trim()) return;

    try {
      setSubmittingPreApprove(true);
      await preApproveAdminEmail(preApproveEmail.trim(), currentUser?.email || SUPER_ADMIN_EMAIL);
      showToast('success', 'Admin Pre-Approved', `${preApproveEmail.trim()} can now log in to access the admin portal.`);
      setPreApproveEmail('');
      fetchRequests();
    } catch (err: any) {
      showToast('error', 'Pre-approval failed', err.message);
    } finally {
      setSubmittingPreApprove(false);
    }
  };

  const handleStatusChange = async (targetEmail: string, newStatus: 'approved' | 'rejected') => {
    try {
      setProcessingEmail(targetEmail);
      await updateAdminApprovalStatus(
        targetEmail,
        newStatus,
        currentUser?.email || SUPER_ADMIN_EMAIL
      );
      showToast(
        'success',
        `Admin ${newStatus.toUpperCase()}`,
        `Access for ${targetEmail} has been ${newStatus}.`
      );
      fetchRequests();
    } catch (err: any) {
      showToast('error', 'Status update failed', err.message);
    } finally {
      setProcessingEmail(null);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const approvedAdmins = requests.filter((r) => r.status === 'approved' && r.email.toLowerCase() !== SUPER_ADMIN_EMAIL.toLowerCase());
  const rejectedRequests = requests.filter((r) => r.status === 'rejected');

  return (
    <div className="glass-card p-6 rounded-2xl space-y-6 border border-slate-200 dark:border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              Admin Access & Authorization
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Only approved emails can access the admin dashboard. Managed by primary email: <strong className="text-indigo-600 dark:text-indigo-400">{SUPER_ADMIN_EMAIL}</strong>
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold inline-flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          Super Admin Enforcement Active
        </span>
      </div>

      {/* Pre-Approve New Admin Form */}
      {isSuperAdmin ? (
        <form onSubmit={handlePreApprove} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>Pre-Approve New Administrator Email</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={preApproveEmail}
                onChange={(e) => setPreApproveEmail(e.target.value)}
                placeholder="newadmin@school.edu"
                className="w-full pl-10 pr-3.5 py-2 rounded-xl text-xs font-medium glass-input text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={submittingPreApprove}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              <UserCheck className="w-3.5 h-3.5" />
              {submittingPreApprove ? 'Authorizing...' : 'Pre-Approve Email'}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <Lock className="w-4 h-4 shrink-0" />
          <span>Admin approval authority is restricted to the primary owner <strong>{SUPER_ADMIN_EMAIL}</strong>.</span>
        </div>
      )}

      {/* Pending Requests Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Pending Approval Requests ({pendingRequests.length})
          </h4>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            No pending access requests.
          </div>
        ) : (
          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20"
              >
                <div>
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
                    <span>{req.email}</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold border border-amber-500/20">
                      Pending
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Requested on {req.requestedAt ? new Date(req.requestedAt).toLocaleDateString() : 'Recent'}
                  </p>
                </div>

                {isSuperAdmin && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={processingEmail === req.email}
                      onClick={() => handleStatusChange(req.email, 'approved')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={processingEmail === req.email}
                      onClick={() => handleStatusChange(req.email, 'rejected')}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      Decline
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved Administrators List */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-emerald-500" />
          Authorized Admin Accounts
        </h4>

        <div className="space-y-2">
          {/* Primary Owner Row */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
                <span>{SUPER_ADMIN_EMAIL}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                  Primary Owner / Super Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Primary administrator with root authorization authority</p>
            </div>
          </div>

          {/* Additional Approved Admins */}
          {approvedAdmins.map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
            >
              <div>
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
                  <span>{req.email}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                    Approved Admin
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Approved by {req.approvedBy || SUPER_ADMIN_EMAIL}
                </p>
              </div>

              {isSuperAdmin && (
                <button
                  type="button"
                  disabled={processingEmail === req.email}
                  onClick={() => handleStatusChange(req.email, 'rejected')}
                  className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <UserX className="w-3.5 h-3.5" />
                  Revoke Access
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Declined / Revoked Requests */}
      {rejectedRequests.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <UserX className="w-4 h-4 text-rose-500" />
            Declined / Revoked Admin Accounts ({rejectedRequests.length})
          </h4>

          <div className="space-y-2">
            {rejectedRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">{req.email}</span>
                  <span className="ml-2 text-[10px] text-rose-600 font-extrabold">Declined</span>
                </div>

                {isSuperAdmin && (
                  <button
                    type="button"
                    disabled={processingEmail === req.email}
                    onClick={() => handleStatusChange(req.email, 'approved')}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Re-Approve Access
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
