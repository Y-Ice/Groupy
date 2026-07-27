import React, { useEffect, useState } from 'react';
import { Users, Search, Filter, Trash2, Edit3, ArrowRightLeft, Clock, Layers, TableProperties, Download } from 'lucide-react';
import { getStudents, getStacks, getTables, getGroups, deleteStudent, updateStudent, moveStudentGroup } from '../../services/dbService';
import { Student, TechStack, ProjectTable, Group } from '../../types';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/common/Modal';

export const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [stacks, setStacks] = useState<TechStack[]>([]);
  const [tables, setTables] = useState<ProjectTable[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTableId, setSelectedTableId] = useState<string>('all');
  const [selectedStackId, setSelectedStackId] = useState<string>('all');

  // Modals
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [movingStudent, setMovingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [editName, setEditName] = useState('');
  const [targetGroupId, setTargetGroupId] = useState('');

  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsData, stacksData, tablesData, groupsData] = await Promise.all([
        getStudents(),
        getStacks(),
        getTables(),
        getGroups(),
      ]);
      setStudents(studentsData);
      setStacks(stacksData);
      setTables(tablesData);
      setGroups(groupsData);
    } catch (err: any) {
      showToast('error', 'Error loading student directory', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      await deleteStudent(studentToDelete.id);
      showToast('success', 'Student Removed', `Deleted ${studentToDelete.fullName}`);
      setStudentToDelete(null);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Error deleting student', err.message);
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !editName.trim()) return;
    try {
      await updateStudent(editingStudent.id, editName.trim());
      showToast('success', 'Name Updated', `Updated to ${editName}`);
      setEditingStudent(null);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    }
  };

  const handleMoveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movingStudent || !targetGroupId) return;

    const targetGroup = groups.find((g) => g.id === targetGroupId);
    if (!targetGroup) return;

    try {
      await moveStudentGroup(movingStudent.id, targetGroup.id, targetGroup.groupNumber);
      showToast('success', 'Group Reassigned', `Moved ${movingStudent.fullName} to Group ${targetGroup.groupNumber}`);
      setMovingStudent(null);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Error moving student', err.message);
    }
  };

  const exportCSV = () => {
    if (filteredStudents.length === 0) {
      showToast('info', 'No Data', 'No students available to export.');
      return;
    }
    const headers = ['Full Name', 'Student ID', 'Tech Stack', 'Group Number', 'Table ID', 'Submission Time'];
    const rows = filteredStudents.map((s) => [
      `"${s.fullName.replace(/"/g, '""')}"`,
      `"${(s.studentId || '').replace(/"/g, '""')}"`,
      `"${s.stackName.replace(/"/g, '""')}"`,
      `"Group ${s.groupNumber || 'Unassigned'}"`,
      `"${s.tableId}"`,
      `"${s.submittedAt}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `groupy_students_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'Exported CSV', `Exported ${filteredStudents.length} student records.`);
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.studentId && s.studentId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      s.stackName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTable = selectedTableId === 'all' || s.tableId === selectedTableId;
    const matchesStack = selectedStackId === 'all' || s.stackId === selectedStackId;
    return matchesSearch && matchesTable && matchesStack;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Student Directory</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitor all student registrations, edit student details, and reassign group allocations.
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs border border-slate-200/60 dark:border-white/10 transition-all active:scale-95 shrink-0"
        >
          <Download className="w-4 h-4 text-indigo-500" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search student name or matrix ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Table Filter */}
          <select
            value={selectedTableId}
            onChange={(e) => setSelectedTableId(e.target.value)}
            className="px-3 py-2 rounded-xl glass-input text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Tables</option>
            {tables.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.courseCode})
              </option>
            ))}
          </select>

          {/* Stack Filter */}
          <select
            value={selectedStackId}
            onChange={(e) => setSelectedStackId(e.target.value)}
            className="px-3 py-2 rounded-xl glass-input text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Stacks</option>
            {stacks.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="glass-card p-8 rounded-2xl animate-pulse h-64 bg-slate-200/50 dark:bg-slate-800/50" />
      ) : filteredStudents.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
          <Users className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Students Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm ? 'No student records match your query.' : 'Students will appear here as soon as they scan QR codes and register.'}
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-800/80">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200/50 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Tech Stack</th>
                  <th className="py-3 px-4">Assigned Group</th>
                  <th className="py-3 px-4">Submission Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-sm">
                      {student.fullName}
                      {student.studentId && (
                        <span className="block text-[10px] text-slate-500 font-mono mt-0.5">ID: {student.studentId}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-500/20">
                        {student.stackName}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      Group {student.groupNumber || 'Unassigned'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {new Date(student.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                      {new Date(student.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setMovingStudent(student);
                            const available = groups.filter(
                              (g) => g.tableId === student.tableId && g.stackId === student.stackId
                            );
                            if (available.length > 0) setTargetGroupId(available[0].id);
                          }}
                          className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                          title="Move Group"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingStudent(student);
                            setEditName(student.fullName);
                          }}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Edit Name"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setStudentToDelete(student)}
                          className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete Student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Name Modal */}
      <Modal
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        title="Edit Student Name"
      >
        <form onSubmit={handleSaveName} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl glass-input text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200/40 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setEditingStudent(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-md">
              Save Name
            </button>
          </div>
        </form>
      </Modal>

      {/* Move Group Modal */}
      <Modal
        isOpen={!!movingStudent}
        onClose={() => setMovingStudent(null)}
        title="Move Student Group"
      >
        {movingStudent && (
          <form onSubmit={handleMoveGroup} className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Reassigning <strong className="text-slate-900 dark:text-white">{movingStudent.fullName}</strong> inside the{' '}
              <strong className="text-indigo-600">{movingStudent.stackName}</strong> stack.
            </p>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Target Group</label>
              <select
                value={targetGroupId}
                onChange={(e) => setTargetGroupId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {groups
                  .filter((g) => g.tableId === movingStudent.tableId && g.stackId === movingStudent.stackId)
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {movingStudent.stackName} - Group {g.groupNumber} ({g.memberIds.length} members)
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200/40 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setMovingStudent(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-md">
                Confirm Move
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        title="Confirm Student Deletion"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Are you sure you want to remove student{' '}
            <strong className="text-slate-900 dark:text-white font-bold">{studentToDelete?.fullName}</strong>?
          </p>
          <p className="text-xs text-rose-500 dark:text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
            ⚠️ This will unassign them from their group and remove their registration record.
          </p>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200/40 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setStudentToDelete(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDeleteStudent}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md"
            >
              Delete Student
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
