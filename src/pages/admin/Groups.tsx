import React, { useEffect, useState } from 'react';
import { FolderGit2, Users, Layers, ArrowRight, ArrowRightLeft, ShieldAlert, Trash2, AlertCircle, BookOpen, Edit3, Check } from 'lucide-react';
import { getGroups, getStudents, getStacks, getTables, moveStudentGroup, deleteGroup, updateGroupTopic } from '../../services/dbService';
import { Group, Student, TechStack, ProjectTable } from '../../types';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/common/Modal';

export const Groups: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [stacks, setStacks] = useState<TechStack[]>([]);
  const [tables, setTables] = useState<ProjectTable[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedTableId, setSelectedTableId] = useState<string>('all');
  const [selectedStackId, setSelectedStackId] = useState<string>('all');

  // Move Modal State
  const [movingStudent, setMovingStudent] = useState<Student | null>(null);
  const [targetGroupId, setTargetGroupId] = useState('');

  // Delete Group State
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [deletingGroup, setDeletingGroup] = useState(false);

  // Topic Editing State
  const [editingTopicKey, setEditingTopicKey] = useState<string | null>(null);
  const [topicInput, setTopicInput] = useState('');
  const [savingTopic, setSavingTopic] = useState(false);

  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [groupsData, studentsData, stacksData, tablesData] = await Promise.all([
        getGroups(),
        getStudents(),
        getStacks(),
        getTables(),
      ]);
      setGroups(groupsData);
      setStudents(studentsData);
      setStacks(stacksData);
      setTables(tablesData);
    } catch (err: any) {
      showToast('error', 'Error loading groups', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movingStudent || !targetGroupId) return;

    const targetGroup = groups.find((g) => g.id === targetGroupId);
    if (!targetGroup) return;

    try {
      await moveStudentGroup(movingStudent.id, targetGroup.id, targetGroup.groupNumber);
      showToast(
        'success',
        'Student Moved',
        `Reassigned ${movingStudent.fullName} to Group ${targetGroup.groupNumber}`
      );
      setMovingStudent(null);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Error moving student', err.message);
    }
  };

  const handleDeleteGroupConfirm = async () => {
    if (!groupToDelete) return;
    try {
      setDeletingGroup(true);
      await deleteGroup(groupToDelete.id);
      showToast(
        'success',
        'Group Deleted',
        `Group ${groupToDelete.groupNumber} has been deleted and its members are now opened to register/be assigned again.`
      );
      setGroupToDelete(null);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Failed to delete group', err.message);
    } finally {
      setDeletingGroup(false);
    }
  };

  const handleSaveTopic = async (tableId: string, groupNumber: number, groupId: string) => {
    try {
      setSavingTopic(true);
      await updateGroupTopic(tableId, groupNumber, groupId, topicInput);
      showToast(
        'success',
        'Topic Updated',
        `Project topic for Group ${groupNumber} saved successfully.`
      );
      setEditingTopicKey(null);
      fetchData();
    } catch (err: any) {
      showToast('error', 'Failed to save topic', err.message);
    } finally {
      setSavingTopic(false);
    }
  };

  // Failsafe UI deduplication for groups
  const uniqueGroupsMap = new Map<string, Group>();
  groups.forEach((g) => {
    const table = tables.find(
      (t) => t.id === g.tableId || t.title.trim().toLowerCase() === String(g.tableId).trim().toLowerCase()
    );
    const resolvedTableId = table ? table.id : g.tableId;
    const key = `${resolvedTableId}_group_${g.groupNumber}`;
    if (!uniqueGroupsMap.has(key)) {
      uniqueGroupsMap.set(key, { ...g, tableId: resolvedTableId });
    }
  });
  const uniqueGroups = Array.from(uniqueGroupsMap.values());

  const filteredGroups = uniqueGroups.filter((g) => {
    const matchesTable = selectedTableId === 'all' || g.tableId === selectedTableId;
    return matchesTable;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Group Allocations</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            View generated multi-stack project groups and manually reassign students across table groups.
          </p>
        </div>
      </div>

      {/* Toolbar Filters */}
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Table:</label>
          <select
            value={selectedTableId}
            onChange={(e) => setSelectedTableId(e.target.value)}
            className="px-3 py-1.5 rounded-xl glass-input text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Tables</option>
            {tables.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 uppercase">Filter Stack:</label>
          <select
            value={selectedStackId}
            onChange={(e) => setSelectedStackId(e.target.value)}
            className="px-3 py-1.5 rounded-xl glass-input text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Tech Stacks</option>
            {stacks.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-6 rounded-2xl h-60 animate-pulse bg-slate-200/50 dark:bg-slate-800/50" />
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
          <FolderGit2 className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Groups Generated Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Groups are automatically formed as soon as students scan registration QR codes and choose their stacks.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGroups.map((group) => {
            const table = tables.find((t) => t.id === group.tableId);
            const rawMembers = students.filter((s) => {
              const studentTableMatch =
                s.tableId === group.tableId ||
                (table && tables.find((t) => t.id === s.tableId)?.title.trim().toLowerCase() === table.title.trim().toLowerCase());

              return (s.groupId && s.groupId === group.id) || (studentTableMatch && s.groupNumber === group.groupNumber);
            });

            // Deduplicate student members by ID
            const memberMap = new Map<string, Student>();
            rawMembers.forEach((m) => {
              if (!memberMap.has(m.id)) {
                memberMap.set(m.id, m);
              }
            });
            let groupMembers = Array.from(memberMap.values()).sort((a, b) =>
              a.fullName.localeCompare(b.fullName, undefined, { sensitivity: 'base' })
            );

            if (selectedStackId !== 'all') {
              groupMembers = groupMembers.filter((s) => s.stackId === selectedStackId);
            }

            // Get stack breakdown for this group
            const stackBreakdown: Record<string, number> = {};
            groupMembers.forEach((m) => {
              stackBreakdown[m.stackName] = (stackBreakdown[m.stackName] || 0) + 1;
            });

            return (
              <div key={group.id} className="glass-card p-6 rounded-2xl flex flex-col justify-between space-y-4 border border-slate-200/60 dark:border-slate-800/80 hover:border-indigo-500/40 transition-all">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/40 dark:border-slate-800/60">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                        {table?.title || 'Project Table'}
                      </span>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        Group {group.groupNumber}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-500/20">
                        {groupMembers.length} Members
                      </span>
                      <button
                        onClick={() => setGroupToDelete(group)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete Group & Remove Members"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Stack Badges Breakdown */}
                  {Object.keys(stackBreakdown).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {Object.entries(stackBreakdown).map(([stName, cnt]) => (
                        <span
                          key={stName}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 inline-flex items-center whitespace-nowrap shrink-0"
                        >
                          {stName}: {cnt}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Project Topic Section */}
                  <div className="mt-3 p-3 rounded-xl bg-indigo-50/70 dark:bg-slate-800/60 border border-indigo-100 dark:border-slate-700/80 transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        Project Topic
                      </span>
                      {editingTopicKey !== `${group.tableId}_${group.groupNumber}` && (
                        <button
                          onClick={() => {
                            setEditingTopicKey(`${group.tableId}_${group.groupNumber}`);
                            setTopicInput(group.topic || '');
                          }}
                          className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          {group.topic ? 'Edit Topic' : '+ Assign Topic'}
                        </button>
                      )}
                    </div>

                    {editingTopicKey === `${group.tableId}_${group.groupNumber}` ? (
                      <div className="mt-2 space-y-2">
                        <input
                          type="text"
                          value={topicInput}
                          onChange={(e) => setTopicInput(e.target.value)}
                          placeholder="e.g. Smart IoT Home Automation System"
                          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveTopic(group.tableId, group.groupNumber, group.id);
                            }
                          }}
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingTopicKey(null)}
                            className="px-2.5 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={savingTopic}
                            onClick={() => handleSaveTopic(group.tableId, group.groupNumber, group.id)}
                            className="px-3 py-1 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1 disabled:opacity-50 cursor-pointer shadow-sm"
                          >
                            {savingTopic ? 'Saving...' : 'Save Topic'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 leading-snug">
                        {group.topic ? (
                          group.topic
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic font-normal">
                            No topic assigned yet
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Member List */}
                  <div className="mt-3 space-y-2 max-h-52 overflow-y-auto pr-1">
                    {groupMembers.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">No members in this group matching filter.</p>
                    ) : (
                      groupMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100/60 dark:bg-slate-800/40 text-xs font-medium text-slate-800 dark:text-slate-200"
                        >
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{member.fullName}</p>
                            <p className="text-[10px] text-indigo-500 font-semibold">{member.stackName}</p>
                          </div>
                          <button
                            onClick={() => {
                              setMovingStudent(member);
                              const available = groups.filter(
                                (g) => g.tableId === member.tableId && g.id !== group.id
                              );
                              if (available.length > 0) setTargetGroupId(available[0].id);
                            }}
                            className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                            title="Reassign to another group on this table"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-200/40 dark:border-slate-800">
                  <span>Balanced Distribution</span>
                  <span className="font-semibold text-slate-500">Group #{group.groupNumber}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Move Student Modal */}
      <Modal
        isOpen={!!movingStudent}
        onClose={() => setMovingStudent(null)}
        title="Reassign Student Group"
      >
        {movingStudent && (
          <form onSubmit={handleMove} className="space-y-4">
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>
                Moving <strong>{movingStudent.fullName}</strong> ({movingStudent.stackName}).
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Select Target Group</label>
              <select
                value={targetGroupId}
                onChange={(e) => setTargetGroupId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl glass-input text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {groups
                  .filter((g) => g.tableId === movingStudent.tableId)
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      Group {g.groupNumber} ({students.filter((s) => s.groupId === g.id || s.groupNumber === g.groupNumber).length} members)
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
                Reassign Group
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Group Modal */}
      <Modal
        isOpen={!!groupToDelete}
        onClose={() => setGroupToDelete(null)}
        title={`Delete Group ${groupToDelete?.groupNumber || ''}`}
      >
        {groupToDelete && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
              <div className="flex items-center gap-2 font-extrabold text-sm text-rose-900">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>Confirm Group Deletion</span>
              </div>
              <p className="leading-relaxed">
                Are you sure you want to delete <strong>Group {groupToDelete.groupNumber}</strong>?
              </p>
              <p className="font-semibold text-rose-700">
                All assigned students in this group will be deleted from this group and freed to scan the QR code and register again.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                disabled={deletingGroup}
                onClick={() => setGroupToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingGroup}
                onClick={handleDeleteGroupConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deletingGroup ? 'Deleting...' : 'Delete Group & Free Students'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
