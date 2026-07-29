export type UserRole = 'admin';

export const SUPER_ADMIN_EMAIL = 'isaacyakubu544@gmail.com';

export type AdminApprovalStatus = 'approved' | 'pending' | 'rejected';

export interface AdminUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  isSuperAdmin?: boolean;
  approvalStatus?: AdminApprovalStatus;
}

export interface AdminAccessRequest {
  id: string; // doc ID, usually lowercased email
  email: string;
  displayName?: string;
  uid?: string;
  status: AdminApprovalStatus;
  requestedAt: string;
  updatedAt: string;
  approvedBy?: string;
  notes?: string;
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
  topic?: string;
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
