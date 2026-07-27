import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { ProjectTable, TechStack, Student, Group, TableSettings, ActivityLog } from '../types';

// Default Stacks list
export const DEFAULT_STACKS: Omit<TechStack, 'id'>[] = [
  { name: 'Frontend', description: 'React, Vue, Web UI & UX', icon: 'Layout', color: 'indigo', enabled: true },
  { name: 'Backend', description: 'Node.js, Python, APIs & Databases', icon: 'Server', color: 'blue', enabled: true },
  { name: 'Cybersecurity', description: 'Network Security, Auditing & Defense', icon: 'Shield', color: 'rose', enabled: true },
  { name: 'Data Analysis', description: 'Data Science, Statistics & Visualization', icon: 'BarChart2', color: 'emerald', enabled: true },
  { name: 'UI/UX', description: 'Figma, Design Systems & Prototyping', icon: 'Figma', color: 'purple', enabled: true },
  { name: 'AI/ML', description: 'Machine Learning, LLMs & Neural Nets', icon: 'Cpu', color: 'amber', enabled: true },
  { name: 'Embedded Systems', description: 'IoT, Microcontrollers & Hardware', icon: 'Hardware', color: 'cyan', enabled: true },
];

// Helper: Sanitize object by removing undefined values (Firestore rejects undefined)
export const sanitizeData = <T extends Record<string, any>>(data: T): T => {
  const clean: Record<string, any> = {};
  Object.keys(data).forEach((key) => {
    if (data[key] !== undefined) {
      clean[key] = data[key];
    }
  });
  return clean as T;
};

// Helper: Seed Default Stacks if empty
export const seedDefaultStacks = async (): Promise<TechStack[]> => {
  const snapshot = await getDocs(collection(db, 'stacks'));
  await setDoc(doc(db, 'settings', 'stacks_seeded'), { seededAt: new Date().toISOString() });
  if (!snapshot.empty) {
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, any>) } as TechStack));
  }

  const createdStacks: TechStack[] = [];
  for (const stack of DEFAULT_STACKS) {
    const docRef = doc(collection(db, 'stacks'));
    const newStack: TechStack = { id: docRef.id, ...stack };
    await setDoc(docRef, { ...stack, id: docRef.id, createdAt: new Date().toISOString() });
    createdStacks.push(newStack);
  }
  return createdStacks;
};

// --- TABLES ---
export const getTables = async (): Promise<ProjectTable[]> => {
  const snapshot = await getDocs(collection(db, 'tables'));
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, any>) } as ProjectTable));
};

export const getTableById = async (tableId: string): Promise<ProjectTable | null> => {
  const snap = await getDoc(doc(db, 'tables', tableId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Record<string, any>) } as ProjectTable;
};

export const createTable = async (data: Omit<ProjectTable, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectTable> => {
  const docRef = doc(collection(db, 'tables'));
  const now = new Date().toISOString();
  const newTable: ProjectTable = {
    id: docRef.id,
    ...data,
    createdAt: now,
    updatedAt: now,
    studentCount: 0,
    groupCount: 0,
  };
  const cleanTable = sanitizeData(newTable);
  await setDoc(docRef, cleanTable);
  await logActivity(docRef.id, 'CREATE_TABLE', `Created table "${data.title}"`);
  return newTable;
};

export const updateTable = async (tableId: string, updates: Partial<ProjectTable>): Promise<void> => {
  const ref = doc(db, 'tables', tableId);
  const cleanUpdates = sanitizeData({ ...updates, updatedAt: new Date().toISOString() });
  await updateDoc(ref, cleanUpdates);
  await logActivity(tableId, 'UPDATE_TABLE', `Updated table properties`);
};

export const deleteTable = async (tableId: string): Promise<void> => {
  // Delete all groups associated with this table/team
  const groupsQuery = query(collection(db, 'groups'), where('tableId', '==', tableId));
  const groupsSnap = await getDocs(groupsQuery);
  for (const gDoc of groupsSnap.docs) {
    await deleteDoc(gDoc.ref);
  }

  // Delete all students associated with this table/team
  const studentsQuery = query(collection(db, 'students'), where('tableId', '==', tableId));
  const studentsSnap = await getDocs(studentsQuery);
  for (const sDoc of studentsSnap.docs) {
    await deleteDoc(sDoc.ref);
  }

  // Delete table document itself
  await deleteDoc(doc(db, 'tables', tableId));
  await logActivity(tableId, 'DELETE_TABLE', `Deleted table/team ${tableId} along with all its groups and members`);
};

// --- STACKS ---
export const getStacks = async (): Promise<TechStack[]> => {
  const snapshot = await getDocs(collection(db, 'stacks'));
  const seedFlag = await getDoc(doc(db, 'settings', 'stacks_seeded'));
  if (snapshot.empty && !seedFlag.exists()) {
    return await seedDefaultStacks();
  }
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, any>) } as TechStack));
};

export const createStack = async (stack: Omit<TechStack, 'id'>): Promise<TechStack> => {
  const ref = doc(collection(db, 'stacks'));
  const newStack = { id: ref.id, ...stack };
  await setDoc(ref, newStack);
  await logActivity('global', 'CREATE_STACK', `Created stack "${stack.name}"`);
  return newStack;
};

export const updateStack = async (stackId: string, updates: Partial<TechStack>): Promise<void> => {
  await updateDoc(doc(db, 'stacks', stackId), updates);
};

export const deleteStack = async (stackId: string): Promise<void> => {
  await deleteDoc(doc(db, 'stacks', stackId));
};

// --- SETTINGS ---
export const getTableSettings = async (): Promise<TableSettings> => {
  const snap = await getDoc(doc(db, 'settings', 'global'));
  if (snap.exists()) {
    return snap.data() as TableSettings;
  }
  const defaultSettings: TableSettings = {
    maxStudentsPerGroup: 5,
    allowDuplicateNames: false,
    enableStudentId: false,
    allowEditAfterSubmission: false,
    theme: 'system',
    notificationPreferences: { emailAlerts: true, submissionAlerts: true },
  };
  await setDoc(doc(db, 'settings', 'global'), defaultSettings);
  return defaultSettings;
};

export const updateTableSettings = async (settings: Partial<TableSettings>): Promise<void> => {
  await updateDoc(doc(db, 'settings', 'global'), settings);
  await logActivity('global', 'UPDATE_SETTINGS', 'Updated workspace settings');
};

// --- AUTOMATIC BALANCED GROUPING ALGORITHM ---
/**
 * Distributes a student into the optimal group for a given table.
 * Rules requested by user:
 * - Table has N groups (where N = table.maxGroups, or default 5).
 * - Students picking any tech stack are distributed equally across the N groups for THAT stack.
 * - Minimum stack count in group gets selected first.
 * - On tie of stack count, selection picks the lower group number (Group 1, then Group 2, etc.).
 * - Groups contain members from multiple tech stacks forming complete project teams.
 */
export const registerAndAssignStudent = async (params: {
  tableId: string;
  fullName: string;
  studentId?: string;
  stackId: string;
  stackName: string;
}): Promise<{ student: Student; groupNumber: number; groupMembers: Student[] }> => {
  const { tableId, fullName, studentId, stackId, stackName } = params;

  // 1. Fetch table details
  const tableRef = doc(db, 'tables', tableId);
  const tableSnap = await getDoc(tableRef);
  if (!tableSnap.exists()) {
    throw new Error('Project Table not found.');
  }

  const tableData = tableSnap.data();
  const maxGroups = tableData.maxGroups && tableData.maxGroups > 0 ? tableData.maxGroups : 5;

  // Query all existing groups for this table
  const groupsQuery = query(collection(db, 'groups'), where('tableId', '==', tableId));
  const groupSnaps = await getDocs(groupsQuery);
  const existingGroups: Group[] = groupSnaps.docs.map((d) => ({ id: d.id, ...d.data() } as Group));

  // Query all existing students for this table to compute stack counts per group
  const studentsQuery = query(collection(db, 'students'), where('tableId', '==', tableId));
  const studentSnaps = await getDocs(studentsQuery);
  const existingStudents: Student[] = studentSnaps.docs.map((d) => ({ id: d.id, ...d.data() } as Student));

  return await runTransaction(db, async (transaction) => {
    // READ PHASE
    const tableTxSnap = await transaction.get(tableRef);
    if (!tableTxSnap.exists()) throw new Error('Table does not exist');

    // 2. Map existing or new group refs for group numbers 1..maxGroups
    const groupMap = new Map<number, { ref: any; group: Group }>();

    for (let num = 1; num <= maxGroups; num++) {
      const match = existingGroups.find((g) => g.groupNumber === num);
      if (match) {
        const gRef = doc(db, 'groups', match.id);
        const gSnap = await transaction.get(gRef);
        if (gSnap.exists()) {
          groupMap.set(num, { ref: gRef, group: { id: gSnap.id, ...gSnap.data() } as Group });
        }
      }
    }

    // For any group number 1..maxGroups without a document yet, prepare a new doc ref
    for (let num = 1; num <= maxGroups; num++) {
      if (!groupMap.has(num)) {
        const newGRef = doc(collection(db, 'groups'));
        groupMap.set(num, {
          ref: newGRef,
          group: {
            id: newGRef.id,
            tableId,
            groupNumber: num,
            stackId,
            stackName,
            memberIds: [],
            createdAt: new Date().toISOString(),
          },
        });
      }
    }

    // Calculate stack count for chosenStackId in each group 1..maxGroups
    const groupStats: {
      groupNum: number;
      ref: any;
      group: Group;
      stackCount: number;
      totalCount: number;
    }[] = [];

    for (let num = 1; num <= maxGroups; num++) {
      const gObj = groupMap.get(num)!;
      const studentsInGroup = existingStudents.filter(
        (s) => s.groupNumber === num || (s.groupId && s.groupId === gObj.group.id)
      );
      const sameStackCount = studentsInGroup.filter((s) => s.stackId === stackId).length;

      groupStats.push({
        groupNum: num,
        ref: gObj.ref,
        group: gObj.group,
        stackCount: sameStackCount,
        totalCount: studentsInGroup.length,
      });
    }

    // 3. BALANCED SELECTION:
    // Sort groups by:
    // Primary key: ascending `stackCount` (fewer students of this stack)
    // Secondary key: ascending `groupNum` (Group 1 before Group 2)
    groupStats.sort((a, b) => {
      if (a.stackCount !== b.stackCount) {
        return a.stackCount - b.stackCount;
      }
      return a.groupNum - b.groupNum;
    });

    const chosenStats = groupStats[0];
    const targetGroup = chosenStats.group;
    const targetGroupRef = chosenStats.ref;

    const studentRef = doc(collection(db, 'students'));
    const newStudent: Student = {
      id: studentRef.id,
      tableId,
      fullName,
      studentId: studentId || '',
      stackId,
      stackName,
      groupId: targetGroup.id,
      groupNumber: targetGroup.groupNumber,
      submittedAt: new Date().toISOString(),
    };

    const isNewDoc = !existingGroups.some((g) => g.id === targetGroup.id);
    const updatedMemberIds = Array.from(new Set([...targetGroup.memberIds, newStudent.id]));

    if (isNewDoc) {
      transaction.set(
        targetGroupRef,
        sanitizeData({
          ...targetGroup,
          memberIds: updatedMemberIds,
        })
      );
    } else {
      transaction.update(
        targetGroupRef,
        sanitizeData({
          memberIds: updatedMemberIds,
          updatedAt: new Date().toISOString(),
        })
      );
    }

    transaction.set(studentRef, sanitizeData(newStudent));

    const currentStudentCount = tableTxSnap.data().studentCount || 0;
    const activeGroupNums = new Set(existingStudents.map((s) => s.groupNumber).filter(Boolean));
    activeGroupNums.add(targetGroup.groupNumber);

    transaction.update(tableRef, {
      studentCount: currentStudentCount + 1,
      groupCount: activeGroupNums.size,
      updatedAt: new Date().toISOString(),
    });

    const currentTeammates = existingStudents.filter(
      (s) => s.groupNumber === targetGroup.groupNumber || (s.groupId && s.groupId === targetGroup.id)
    );
    const groupMembers = [...currentTeammates, newStudent];

    return {
      student: newStudent,
      groupNumber: targetGroup.groupNumber,
      groupMembers,
    };
  });
};

// Fetch all students for a specific group
export const getGroupMembers = async (groupId: string): Promise<Student[]> => {
  const q = query(collection(db, 'students'), where('groupId', '==', groupId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, any>) } as Student));
};

// Fetch all students
export const getStudents = async (tableId?: string): Promise<Student[]> => {
  let q;
  if (tableId) {
    q = query(collection(db, 'students'), where('tableId', '==', tableId));
  } else {
    q = collection(db, 'students');
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, any>) } as Student));
};

// Fetch all groups
export const getStudentById = async (studentId: string): Promise<Student | null> => {
  const snap = await getDoc(doc(db, 'students', studentId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Record<string, any>) } as Student;
};

export const getGroups = async (tableId?: string): Promise<Group[]> => {
  let q;
  if (tableId) {
    q = query(collection(db, 'groups'), where('tableId', '==', tableId));
  } else {
    q = collection(db, 'groups');
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, any>) } as Group));
};

// Manual Move Student (Only inside SAME stack)
export const moveStudentGroup = async (
  studentId: string,
  targetGroupId: string,
  targetGroupNumber: number
): Promise<void> => {
  const studentRef = doc(db, 'students', studentId);
  const studentSnap = await getDoc(studentRef);
  if (!studentSnap.exists()) throw new Error('Student not found');

  const student = studentSnap.data() as Student;
  const oldGroupId = student.groupId;

  await runTransaction(db, async (transaction) => {
    const oldGroupRef = oldGroupId ? doc(db, 'groups', oldGroupId) : null;
    const targetGroupRef = doc(db, 'groups', targetGroupId);

    // READ PHASE FIRST
    const oldGroupSnap = oldGroupRef ? await transaction.get(oldGroupRef) : null;
    const targetGroupSnap = await transaction.get(targetGroupRef);

    // WRITE PHASE SECOND
    transaction.update(studentRef, { groupId: targetGroupId, groupNumber: targetGroupNumber });

    if (oldGroupSnap && oldGroupSnap.exists()) {
      const oldGroup = oldGroupSnap.data() as Group;
      transaction.update(oldGroupRef!, {
        memberIds: oldGroup.memberIds.filter((id) => id !== studentId),
      });
    }

    if (targetGroupSnap && targetGroupSnap.exists()) {
      const targetGroup = targetGroupSnap.data() as Group;
      if (!targetGroup.memberIds.includes(studentId)) {
        transaction.update(targetGroupRef, {
          memberIds: [...targetGroup.memberIds, studentId],
        });
      }
    }
  });

  await logActivity(
    student.tableId,
    'MOVE_STUDENT',
    `Moved ${student.fullName} to ${student.stackName} Group ${targetGroupNumber}`
  );
};

export const updateStudent = async (studentId: string, fullName: string): Promise<void> => {
  await updateDoc(doc(db, 'students', studentId), { fullName });
};

export const deleteStudent = async (studentId: string): Promise<void> => {
  const snap = await getDoc(doc(db, 'students', studentId));
  if (snap.exists()) {
    const s = snap.data() as Student;
    if (s.groupId) {
      const groupRef = doc(db, 'groups', s.groupId);
      const groupSnap = await getDoc(groupRef);
      if (groupSnap.exists()) {
        const g = groupSnap.data() as Group;
        await updateDoc(groupRef, {
          memberIds: g.memberIds.filter((id) => id !== studentId),
        });
      }
    }
    if (s.tableId) {
      const tableRef = doc(db, 'tables', s.tableId);
      const tableSnap = await getDoc(tableRef);
      if (tableSnap.exists()) {
        const currentCount = tableSnap.data().studentCount || 0;
        await updateDoc(tableRef, {
          studentCount: Math.max(0, currentCount - 1),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }
  await deleteDoc(doc(db, 'students', studentId));
};

export const deleteGroup = async (groupId: string): Promise<void> => {
  const groupRef = doc(db, 'groups', groupId);
  const groupSnap = await getDoc(groupRef);
  if (!groupSnap.exists()) return;

  const groupData = groupSnap.data() as Group;
  const { tableId, groupNumber } = groupData;

  // Query students assigned to this group by tableId & groupNumber or groupId
  const studentsQuery = query(
    collection(db, 'students'),
    where('tableId', '==', tableId),
    where('groupNumber', '==', groupNumber)
  );
  const studentsSnap = await getDocs(studentsQuery);

  const studentsByGroupQuery = query(
    collection(db, 'students'),
    where('groupId', '==', groupId)
  );
  const studentsByGroupSnap = await getDocs(studentsByGroupQuery);

  const studentDocsToDelete = new Map<string, any>();
  studentsSnap.docs.forEach((d) => studentDocsToDelete.set(d.id, d));
  studentsByGroupSnap.docs.forEach((d) => studentDocsToDelete.set(d.id, d));

  let deletedCount = 0;
  for (const [sId] of studentDocsToDelete.entries()) {
    await deleteDoc(doc(db, 'students', sId));
    deletedCount++;
  }

  if (tableId && deletedCount > 0) {
    const tableRef = doc(db, 'tables', tableId);
    const tableSnap = await getDoc(tableRef);
    if (tableSnap.exists()) {
      const currentCount = tableSnap.data().studentCount || 0;
      await updateDoc(tableRef, {
        studentCount: Math.max(0, currentCount - deletedCount),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  await deleteDoc(groupRef);

  await logActivity(
    tableId || 'GLOBAL',
    'DELETE_GROUP',
    `Deleted Group ${groupNumber} and unassigned/removed ${deletedCount} member(s) so they can re-register.`
  );
};

// Activity Log
export const logActivity = async (tableId: string, action: string, details: string) => {
  try {
    await addDoc(collection(db, 'activityLogs'), {
      tableId,
      action,
      details,
      timestamp: new Date().toISOString(),
      actor: 'Administrator',
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};

export const getActivityLogs = async (): Promise<ActivityLog[]> => {
  const snap = await getDocs(collection(db, 'activityLogs'));
  const logs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, any>) } as ActivityLog));
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};
