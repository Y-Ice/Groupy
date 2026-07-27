export type UserRole = 'admin';

export interface AdminUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

export type TableStatus = 'active' | 'closed' | 'archived';

export interface ProjectTable {
  id: string;
  title: string;
  description: string;
  semester?: string;
  courseCode?: string;
  status: TableStatus;
  createdAt: string; // ISO String
  updatedAt: string;
  studentCount?: number;
  groupCount?: number;
  maxPerGroup?: number;
  maxGroups?: number;
  allowedStackIds?: string[];
}

export interface TechStack {
  id: string;
  name: string;
  description?: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color or hex
  enabled: boolean;
  studentCount?: number;
}

export interface Student {
  id: string;
  tableId: string;
  fullName: string;
  studentId?: string;
  stackId: string;
  stackName: string;
  groupId: string | null;
  groupNumber: number | null;
  submittedAt: string; // ISO String
  ipHash?: string;
}

export interface Group {
  id: string;
  tableId: string;
  stackId: string;
  stackName: string;
  groupNumber: number;
  memberIds: string[];
  createdAt: string;
}

export interface TableSettings {
  maxStudentsPerGroup: number;
  allowDuplicateNames: boolean;
  enableStudentId: boolean;
  allowEditAfterSubmission: boolean;
  theme: 'light' | 'dark' | 'system';
  notificationPreferences: {
    emailAlerts: boolean;
    submissionAlerts: boolean;
  };
}

export interface ActivityLog {
  id: string;
  tableId?: string;
  action: string;
  details: string;
  timestamp: string;
  actor: string;
}
