import React, { useEffect, useState } from 'react';
import { 
  TableProperties, 
  Plus, 
  Search, 
  QrCode, 
  Copy, 
  Check, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Copy as DuplicateIcon, 
  Lock, 
  CheckCircle2, 
  Archive, 
  Users,
  ExternalLink,
  Layers
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { getTables, createTable, updateTable, deleteTable, getStacks } from '../../services/dbService';
import { ProjectTable, TableStatus, TechStack } from '../../types';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/common/Modal';

export const Tables: React.FC = () => {
  const [tables, setTables] = useState<ProjectTable[]>([]);
  const [availableStacks, setAvailableStacks] = useState<TechStack[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedQRTable, setSelectedQRTable] = useState<ProjectTable | null>(null);
  const [editingTable, setEditingTable] = useState<ProjectTable | null>(null);
  const [tableToDelete, setTableToDelete] = useState<ProjectTable | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStackIds, setSelectedStackIds] = useState<string[]>([]);
  const [maxGroups, setMaxGroups] = useState<number | ''>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { showToast } = useToast();

  const fetchTablesAndStacks = async () => {
    try {
      setLoading(true);
      const [tableData, stackData] = await Promise.all([getTables(), getStacks()]);
      setTables(tableData);
      setAvailableStacks(stackData);
    } catch (err: any) {
      showToast('error', 'Error loading tables & stacks', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTablesAndStacks();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const payload = {
        title,
        description,
        allowedStackIds: selectedStackIds,
        maxGroups: maxGroups !== '' ? Number(maxGroups) : undefined,
      };

      if (editingTable) {
        await updateTable(editingTable.id, payload);
        showToast('success', 'Table Updated', `Updated "${title}"`);
      } else {
        await createTable({
          ...payload,
          status: 'active',
        });
        showToast('success', 'Table Created', `Created project table "${title}"`);
      }
      setIsCreateOpen(false);
      setEditingTable(null);
      resetForm();
      fetchTablesAndStacks();
    } catch (err: any) {
      showToast('error', 'Failed to save table', err.message);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedStackIds(availableStacks.map((s) => s.id));
    setMaxGroups('');
  };

  const handleOpenCreate = () => {
    setEditingTable(null);
    setTitle('');
    setDescription('');
    setSelectedStackIds(availableStacks.map((s) => s.id));
    setMaxGroups('');
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (t: ProjectTable) => {
    setEditingTable(t);
    setTitle(t.title);
    setDescription(t.description || '');
    setSelectedStackIds(t.allowedStackIds || availableStacks.map((s) => s.id));
    setMaxGroups(t.maxGroups !== undefined ? t.maxGroups : '');
    setIsCreateOpen(true);
  };

  const toggleStackSelection = (stackId: string) => {
    setSelectedStackIds((prev) =>
      prev.includes(stackId) ? prev.filter((id) => id !== stackId) : [...prev, stackId]
    );
  };

  const selectAllStacks = () => {
    setSelectedStackIds(availableStacks.map((s) => s.id));
  };

  const clearAllStacks = () => {
    setSelectedStackIds([]);
  };

  const handleStatusChange = async (tableId: string, status: TableStatus) => {
    try {
      await updateTable(tableId, { status });
      showToast('info', 'Status Updated', `Table is now ${status}`);
      fetchTablesAndStacks();
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    }
  };

  const confirmDeleteTable = async () => {
    if (!tableToDelete) return;
    try {
      await deleteTable(tableToDelete.id);
      showToast('success', 'Table Deleted', `Deleted "${tableToDelete.title}" successfully.`);
      setTableToDelete(null);
      fetchTablesAndStacks();
    } catch (err: any) {
      showToast('error', 'Error deleting table', err.message);
    }
  };

  const handleDuplicate = async (t: ProjectTable) => {
    try {
      await createTable({
        title: `${t.title} (Copy)`,
        description: t.description,
        allowedStackIds: t.allowedStackIds,
        maxGroups: t.maxGroups,
        status: 'active',
      });
      showToast('success', 'Table Duplicated', `Created copy of "${t.title}"`);
      fetchTablesAndStacks();
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    }
  };

  const copyLink = (tableId: string) => {
    const url = `${window.location.origin}/table/${tableId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(tableId);
    showToast('success', 'Link Copied', 'Student registration URL copied to clipboard.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredTables = tables.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.courseCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Table Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create project grouping sessions, generate student QR links, and monitor allocations.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Table</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title or course code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {['all', 'active', 'closed', 'archived'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider capitalize transition-all ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-6 rounded-2xl h-48 animate-pulse bg-slate-200/50 dark:bg-slate-800/50" />
          ))}
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
          <TableProperties className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Tables Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm ? 'No tables match your search criteria.' : 'Create your first project grouping table to generate QR codes for your students.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTables.map((table) => {
            const registrationUrl = `${window.location.origin}/table/${table.id}`;
            return (
              <div key={table.id} className="glass-card p-6 rounded-2xl flex flex-col justify-between space-y-4 border border-slate-200/60 dark:border-slate-800/80">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {(table.courseCode || table.semester) && (
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          {[table.courseCode, table.semester].filter(Boolean).join(' • ')}
                        </span>
                      )}
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1.5 leading-snug">
                        {table.title}
                      </h3>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        table.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : table.status === 'closed'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                      }`}
                    >
                      {table.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                    {table.description || 'No description provided.'}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {table.maxGroups && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        Target: {table.maxGroups} Groups
                      </span>
                    )}
                    {table.allowedStackIds && table.allowedStackIds.length > 0 ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center gap-1">
                        <Layers className="w-3 h-3" /> {table.allowedStackIds.length} Stacks Allowed
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                        All Stacks Enabled
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/40 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-500" />
                    <span className="font-semibold text-slate-900 dark:text-white">{table.studentCount || 0} Students</span>
                  </div>
                  <a
                    href={registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 font-medium text-xs"
                  >
                    Open Student Link <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Card Controls */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => setSelectedQRTable(table)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    QR Code
                  </button>

                  <button
                    onClick={() => copyLink(table.id)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs transition-colors"
                    title="Copy Registration Link"
                  >
                    {copiedId === table.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(table)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs transition-colors"
                    title="Edit Table"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDuplicate(table)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs transition-colors"
                    title="Duplicate Table"
                  >
                    <DuplicateIcon className="w-4 h-4" />
                  </button>

                  {table.status === 'active' ? (
                    <button
                      onClick={() => handleStatusChange(table.id, 'closed')}
                      className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs transition-colors"
                      title="Close Submissions"
                    >
                      <Lock className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(table.id, 'active')}
                      className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs transition-colors"
                      title="Activate Submissions"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => setTableToDelete(table)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs transition-colors"
                    title="Delete Table"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingTable(null);
        }}
        title={editingTable ? 'Edit Project Table' : 'Create Project Table'}
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
              Table Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Web Development Project Session 1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
              Description / Instructions
            </label>
            <textarea
              rows={2}
              placeholder="Brief instructions or purpose for students..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                Available Tech Stacks for Students <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllStacks}
                  className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Select All
                </button>
                <span className="text-slate-400 text-[10px]">•</span>
                <button
                  type="button"
                  onClick={clearAllStacks}
                  className="text-[10px] font-bold text-slate-500 hover:underline"
                >
                  Deselect All
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
              Choose which tech stacks students can pick from when registering for this table:
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1.5 rounded-xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
              {availableStacks.map((stack) => {
                const isSelected = selectedStackIds.includes(stack.id);
                return (
                  <button
                    key={stack.id}
                    type="button"
                    onClick={() => toggleStackSelection(stack.id)}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs font-medium transition-all text-left ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 hover:border-indigo-500/50'
                    }`}
                  >
                    <span className="truncate">{stack.name}</span>
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-white text-indigo-600 border-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                  </button>
                );
              })}
            </div>
            {selectedStackIds.length === 0 && (
              <p className="text-[11px] text-amber-500 font-medium mt-1">
                ⚠️ Please select at least one stack, or all stacks will be disabled for registration.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
              Number of Groups for Table <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="number"
              min={1}
              max={100}
              placeholder="e.g. 5 groups (leave empty for unlimited)"
              value={maxGroups}
              onChange={(e) => setMaxGroups(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Specifies the maximum or target number of groups allocated for this project table.
            </p>
          </div>

          <div className="sticky bottom-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-end gap-2 pt-3 pb-1 border-t border-slate-200/40 dark:border-slate-800 mt-4">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
            >
              {editingTable ? 'Save Changes' : 'Create Table'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!tableToDelete}
        onClose={() => setTableToDelete(null)}
        title="Confirm Delete Table"
      >
        {tableToDelete && (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">
                Delete "{tableToDelete.title}"?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to permanently delete this table? All associated student submissions and QR links will be unlinked.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200/40 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setTableToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteTable}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20"
              >
                Delete Table
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* QR Code Modal */}
      <Modal
        isOpen={!!selectedQRTable}
        onClose={() => setSelectedQRTable(null)}
        title="Student Registration QR Code"
      >
        {selectedQRTable && (
          <div className="text-center space-y-4">
            <div className="p-6 bg-white rounded-2xl inline-block shadow-inner border border-slate-200">
              <QRCodeSVG
                value={`${window.location.origin}/table/${selectedQRTable.id}`}
                size={200}
                level="H"
                includeMargin
              />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">{selectedQRTable.title}</h4>
              <p className="text-xs text-slate-500 mt-0.5">Students scan this QR code to select their stack and get assigned.</p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => copyLink(selectedQRTable.id)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 shadow-md inline-flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Student Link
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
