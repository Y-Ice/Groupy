import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save, Users, Shield, User, Lock, KeyRound, CheckCircle2 } from 'lucide-react';
import { getTableSettings, updateTableSettings } from '../../services/dbService';
import { TableSettings } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { AdminApprovalsManager } from '../../components/admin/AdminApprovalsManager';

export const Settings: React.FC = () => {
  const { currentUser, updateAdminProfile, updateAdminPassword } = useAuth();

  const [settings, setSettings] = useState<TableSettings>({
    maxStudentsPerGroup: 5,
    allowDuplicateNames: false,
    enableStudentId: false,
    allowEditAfterSubmission: false,
    theme: 'system',
    notificationPreferences: { emailAlerts: true, submissionAlerts: true },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile Name State
  const [adminName, setAdminName] = useState(currentUser?.displayName || '');
  const [updatingName, setUpdatingName] = useState(false);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    if (currentUser?.displayName) {
      setAdminName(currentUser.displayName);
    }
  }, [currentUser]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await getTableSettings();
        setSettings(data);
      } catch (err: any) {
        showToast('error', 'Error loading settings', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveWorkspaceSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateTableSettings(settings);
      showToast('success', 'Settings Saved', 'Global workspace settings updated successfully.');
    } catch (err: any) {
      showToast('error', 'Failed to save settings', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim()) {
      showToast('error', 'Invalid Name', 'Display name cannot be empty.');
      return;
    }
    try {
      setUpdatingName(true);
      await updateAdminProfile(adminName.trim());
      showToast('success', 'Profile Updated', 'Your administrator display name has been updated.');
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message || 'Could not update profile name.');
    } finally {
      setUpdatingName(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('error', 'Current Password Required', 'Please enter your current password to verify identity.');
      return;
    }
    if (newPassword.length < 6) {
      showToast('error', 'Weak Password', 'New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('error', 'Password Mismatch', 'New password and confirmation do not match.');
      return;
    }
    try {
      setUpdatingPassword(true);
      await updateAdminPassword(currentPassword, newPassword);
      showToast('success', 'Password Changed', 'Your password has been updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast('error', 'Password Update Failed', err.message || 'Incorrect current password or update error.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Workspace & Account Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your administrator profile, security credentials, and global table grouping rules.
        </p>
      </div>

      {/* Admin Access Approvals Manager */}
      <AdminApprovalsManager />

      {/* Admin Profile Details Card */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
          <User className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="font-bold text-slate-900 text-base">Administrator Profile</h3>
            <p className="text-xs text-slate-500">Update your account display name shown across the workspace.</p>
          </div>
        </div>

        <form onSubmit={handleUpdateName} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Admin Email Address
              </label>
              <input
                type="email"
                disabled
                value={currentUser?.email || ''}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 text-slate-500 text-sm border border-slate-200 cursor-not-allowed font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                required
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Class Administrator"
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={updatingName}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md inline-flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {updatingName ? 'Saving...' : 'Update Profile Name'}
            </button>
          </div>
        </form>
      </div>

      {/* Admin Password Security Card */}
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
          <Lock className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="font-bold text-slate-900 text-base">Security & Password</h3>
            <p className="text-xs text-slate-500">Change your login password securely.</p>
          </div>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={updatingPassword}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md inline-flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-3.5 h-3.5" />
              {updatingPassword ? 'Updating Password...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="glass-card p-8 rounded-2xl animate-pulse h-64 bg-slate-200/50" />
      ) : (
        <form onSubmit={handleSaveWorkspaceSettings} className="space-y-6">
          {/* Group Rules Card */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
              <Users className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-base">Grouping Rules</h3>
                <p className="text-xs text-slate-500">Controls automated equal group sizing.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                  Maximum Students Per Group
                </label>
                <input
                  type="number"
                  min={2}
                  max={20}
                  value={settings.maxStudentsPerGroup}
                  onChange={(e) => setSettings({ ...settings, maxStudentsPerGroup: parseInt(e.target.value) || 5 })}
                  className="w-full px-3.5 py-2 rounded-xl glass-input text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
                <p className="text-[11px] text-slate-500 mt-1">When a group reaches this size, new students automatically spawn Group N+1.</p>
              </div>
            </div>
          </div>

          {/* Registration Rules */}
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
              <Shield className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-base">Registration Policy</h3>
                <p className="text-xs text-slate-500">Student form behavior when scanning QR codes.</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-colors border border-slate-200/60">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Require Student ID / Matrix Number</p>
                  <p className="text-xs text-slate-500">Adds an extra Student ID input field on student registration form.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableStudentId}
                  onChange={(e) => setSettings({ ...settings, enableStudentId: e.target.checked })}
                  className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-colors border border-slate-200/60">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Allow Duplicate Names</p>
                  <p className="text-xs text-slate-500">Permit multiple submissions with identical full names.</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allowDuplicateNames}
                  onChange={(e) => setSettings({ ...settings, allowDuplicateNames: e.target.checked })}
                  className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 inline-flex items-center gap-2 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save Workspace Preferences
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
