import React, { useEffect, useState } from 'react';
import { TableProperties, Users, FolderGit2, Layers, CheckCircle2, Clock, Activity, ArrowRight, ExternalLink, Plus, QrCode, Sparkles, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getTables, getStudents, getGroups, getStacks, getActivityLogs } from '../../services/dbService';
import { ProjectTable, Student, Group, TechStack, ActivityLog } from '../../types';

export const DashboardHome: React.FC = () => {
  const [tables, setTables] = useState<ProjectTable[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [stacks, setStacks] = useState<TechStack[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [tablesData, studentsData, groupsData, stacksData, logsData] = await Promise.all([
          getTables(),
          getStudents(),
          getGroups(),
          getStacks(),
          getActivityLogs(),
        ]);
        setTables(tablesData);
        setStudents(studentsData);
        setGroups(groupsData);
        setStacks(stacksData);
        setLogs(logsData);
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const totalTables = tables.length;
  const totalStudents = students.length;
  const totalGroups = groups.length;
  const totalStacks = stacks.length;

  return (
    <div className="space-y-6">
      {/* Hero Glass Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-slate-200/60 dark:border-white/10 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-cyan-500/10">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-xs font-bold border border-indigo-500/20 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" /> Real-time Group Balancing
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Pitch Allocations Overview
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Scan student QR codes to automatically group students by tech stack with instant equal balancing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/admin/tables"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 inline-flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> New Table
            </Link>
            <Link
              to="/admin/qr-codes"
              className="px-4 py-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs border border-slate-200/60 dark:border-white/10 inline-flex items-center gap-2 transition-all active:scale-95"
            >
              <QrCode className="w-4 h-4 text-indigo-500" /> Export QR Codes
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Project Tables', count: totalTables, icon: TableProperties, color: 'from-blue-600 to-indigo-600', link: '/admin/tables', badge: 'Active' },
          { label: 'Registered Students', count: totalStudents, icon: Users, color: 'from-indigo-600 to-purple-600', link: '/admin/students', badge: 'Enrolled' },
          { label: 'Balanced Groups', count: totalGroups, icon: FolderGit2, color: 'from-purple-600 to-pink-600', link: '/admin/groups', badge: 'Formed' },
          { label: 'Tech Stacks', count: totalStacks, icon: Layers, color: 'from-emerald-600 to-teal-600', link: '/admin/stacks', badge: 'Available' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Link
              key={i}
              to={stat.link}
              className="glass-card p-5 rounded-2xl flex items-center justify-between group relative overflow-hidden border border-slate-200/60 dark:border-white/10"
            >
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                  {stat.badge}
                </span>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {loading ? '...' : stat.count}
                </p>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">{stat.label}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${stat.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Progress Meters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-6 rounded-2xl flex items-center gap-4 border-l-4 border-l-emerald-500 border-slate-200/60 dark:border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Students Assigned</p>
              <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">100%</span>
            </div>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {totalStudents} Students Allocated
            </p>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full w-full" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex items-center gap-4 border-l-4 border-l-indigo-500 border-slate-200/60 dark:border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending Queue</p>
              <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">0 Waiting</span>
            </div>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">Instant Real-time Process</p>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
              <div className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Tables & Activity Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tables */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl space-y-4 border-slate-200/60 dark:border-white/10">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/40 dark:border-white/10">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <TableProperties className="w-4 h-4 text-indigo-500" />
              Active Project Tables
            </h3>
            <Link to="/admin/tables" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
              Manage All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {tables.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">No active tables created yet.</p>
          ) : (
            <div className="space-y-3">
              {tables.slice(0, 4).map((t) => (
                <div key={t.id} className="p-3.5 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-white/10 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{t.title}</p>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        {t.courseCode}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{t.semester} • {t.description || 'No description'}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.studentCount || 0} Students</span>
                    <a
                      href={`${window.location.origin}/table/${t.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                      title="Open Student Link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Activity Feed */}
        <div className="glass-card p-6 rounded-2xl space-y-4 border-slate-200/60 dark:border-white/10">
          <div className="pb-3 border-b border-slate-200/40 dark:border-white/10">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" />
              System Log Feed
            </h3>
          </div>

          {logs.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">No activity recorded yet.</p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {logs.slice(0, 6).map((log) => (
                <div key={log.id} className="text-xs space-y-1 p-3 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-slate-200/40 dark:border-white/5">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{log.details}</p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

