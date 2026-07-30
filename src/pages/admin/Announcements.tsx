import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Send,
  Trash2,
  Globe,
  TableProperties,
  Bell,
  Clock,
  Sparkles,
  User,
  ShieldAlert,
  Search,
  Filter,
} from 'lucide-react';
import {
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
  getTables,
} from '../../services/dbService';
import { Announcement, ProjectTable, AnnouncementType } from '../../types';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const Announcements: React.FC = () => {
  const { showToast } = useToast();
  const { currentUser } = useAuth();

  // Data states
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [tables, setTables] = useState<ProjectTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<AnnouncementType>('info');
  const [targetType, setTargetType] = useState<'all' | 'table'>('all');
  const [targetId, setTargetId] = useState('');

  // Filter/Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [annList, tableList] = await Promise.all([
        getAnnouncements(),
        getTables(),
      ]);
      setAnnouncements(annList);
      setTables(tableList);
      if (tableList.length > 0) {
        setTargetId(tableList[0].id);
      }
    } catch (err) {
      console.error('Error loading announcements page data:', err);
      showToast('error', 'Error Loading Data', 'Could not load tables or announcements.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      showToast('error', 'Validation Error', 'Please fill in both title and message.');
      return;
    }

    if (title.length > 100) {
      showToast('error', 'Validation Error', 'Title must be 100 characters or less.');
      return;
    }

    if (message.length > 500) {
      showToast('error', 'Validation Error', 'Message must be 500 characters or less.');
      return;
    }

    const adminName = currentUser?.displayName || currentUser?.email || 'Administrator';

    try {
      setSubmitting(true);
      const payload = {
        title: title.trim(),
        message: message.trim(),
        type,
        targetType,
        targetId: targetType === 'all' ? '' : targetId,
        createdBy: adminName,
      };

      await createAnnouncement(payload);
      showToast('success', 'Announcement Sent!', 'Students on matching screens will receive this alert instantly.');
      
      // Reset form
      setTitle('');
      setMessage('');
      setType('info');
      setTargetType('all');
      
      // Reload list
      const updated = await getAnnouncements();
      setAnnouncements(updated);
    } catch (err) {
      console.error('Failed to create announcement:', err);
      showToast('error', 'Submission Failed', 'Could not publish announcement to Firestore.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement? Students will no longer see it.')) {
      return;
    }

    try {
      await deleteAnnouncement(id);
      showToast('success', 'Announcement Removed', 'The announcement has been deleted from history.');
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Failed to delete announcement:', err);
      showToast('error', 'Delete Failed', 'Could not delete announcement.');
    }
  };

  // Filtered list
  const filteredAnnouncements = announcements.filter((ann) => {
    const matchesSearch =
      ann.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ann.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ann.createdBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || ann.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTargetName = (ann: Announcement) => {
    if (ann.targetType === 'all') {
      return 'Global (All Tables)';
    }
    const matchedTable = tables.find((t) => t.id === ann.targetId);
    return matchedTable ? `Table: ${matchedTable.title}` : 'Target Table (Deleted)';
  };

  const getTypeStyles = (annType: AnnouncementType) => {
    switch (annType) {
      case 'info':
        return {
          bg: 'bg-blue-50/90 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/40',
          badge: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300',
          indicator: 'bg-blue-500',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50/90 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40',
          badge: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300',
          indicator: 'bg-amber-500',
        };
      case 'success':
        return {
          bg: 'bg-emerald-50/90 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300',
          indicator: 'bg-emerald-500',
        };
      case 'alert':
        return {
          bg: 'bg-rose-50/90 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40',
          badge: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/40 dark:text-rose-300',
          indicator: 'bg-rose-500',
        };
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Hero Header */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-slate-200/60 dark:border-white/10 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-500/25 backdrop-blur-md">
            <Megaphone className="w-3.5 h-3.5 animate-bounce" /> Broadcast reminders in real-time
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Pitch Notifications Panel
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Trigger real-time push announcements and reminders to student registration screens and success pages. Let them know when pitches are starting, call up specific tables, or send general reminders.
          </p>
        </div>
      </div>

      {/* Grid: Send Form & History List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trigger form - left 5 columns */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-slate-200/60 dark:border-white/10 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200/40 dark:border-white/10">
              <Plus className="w-5 h-5 text-indigo-500" />
              <h2 className="font-bold text-slate-900 dark:text-white text-base">New Announcement</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type selector */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Announcement Level
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['info', 'success', 'warning', 'alert'] as AnnouncementType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold capitalize border transition-all cursor-pointer ${
                        type === t
                          ? t === 'info'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                            : t === 'success'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                            : t === 'warning'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/20'
                            : 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/20'
                          : 'bg-white dark:bg-slate-800 hover:bg-slate-50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Broadcast Audience
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="targetType"
                      checked={targetType === 'all'}
                      onChange={() => setTargetType('all')}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <Globe className="w-4 h-4 text-slate-400" />
                    All Tables (Global)
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="targetType"
                      checked={targetType === 'table'}
                      onChange={() => setTargetType('table')}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <TableProperties className="w-4 h-4 text-slate-400" />
                    Specific Project Table
                  </label>
                </div>

                {targetType === 'table' && (
                  <div className="mt-3.5">
                    <select
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {tables.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title} ({t.courseCode})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Title input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Notification Title ({100 - title.length} left)
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Pitch Presentation starting in 10 mins"
                  className="w-full text-xs font-medium p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400"
                  required
                />
              </div>

              {/* Message input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Broadcast Message ({500 - message.length} left)
                </label>
                <textarea
                  maxLength={500}
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g., Team pitches are commencing shortly. Please ensure your prototype or presentation slide deck is loaded and ready on your demo devices."
                  className="w-full text-xs font-medium p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400"
                  required
                />
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Publishing...' : 'Trigger Push Announcement'}
              </button>
            </form>
          </div>
        </div>

        {/* List of Sent announcements - right 7 columns */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-card p-6 rounded-2xl border border-slate-200/60 dark:border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/40 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                <h2 className="font-bold text-slate-900 dark:text-white text-base">Broadcast History</h2>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-500">
                {filteredAnnouncements.length} Sent
              </span>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search announcements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="p-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="all">All Levels</option>
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="alert">Alert</option>
                </select>
              </div>
            </div>

            {/* List */}
            {loading ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Loading announcement logs...</p>
              </div>
            ) : filteredAnnouncements.length === 0 ? (
              <div className="py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2">
                <Megaphone className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">No announcements found matching criteria.</p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredAnnouncements.map((ann) => {
                  const styles = getTypeStyles(ann.type);
                  return (
                    <div
                      key={ann.id}
                      className={`p-4 rounded-2xl border flex flex-col sm:flex-row justify-between items-start gap-4 transition-all hover:shadow-xs relative overflow-hidden ${styles.bg}`}
                    >
                      {/* Left indicator bar */}
                      <div className={`absolute top-0 bottom-0 left-0 w-1 ${styles.indicator}`} />

                      <div className="space-y-1.5 flex-1 pl-1 text-left">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${styles.badge}`}>
                            {ann.type}
                          </span>
                          <span className="text-[10px] font-bold text-indigo-950/70 bg-indigo-100/50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">
                            {getTargetName(ann)}
                          </span>
                        </div>

                        <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                          {ann.title}
                        </h3>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                          {ann.message}
                        </p>

                        <div className="flex items-center gap-3.5 pt-1 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(ann.createdAt).toLocaleDateString()} {new Date(ann.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            By {ann.createdBy}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDelete(ann.id)}
                        className="p-2 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200/60 hover:border-rose-200 shadow-3xs transition-all active:scale-90 shrink-0 cursor-pointer self-end sm:self-start"
                        title="Delete Announcement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
