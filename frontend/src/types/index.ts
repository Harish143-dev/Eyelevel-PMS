export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'hr' | 'employee';
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'REJECTED';
  avatarColor: string;
  designation?: string | null;
  isActive: boolean;
  monitoringConsentShown?: boolean;
  departmentId?: string | null;
  department?: Department | null;
  skills?: string[];
  joiningDate?: string | null;
  emergencyContact?: string | null;
  reportingManagerId?: string | null;
  reportingManager?: Pick<User, 'id' | 'name' | 'email'> | null;
  companyId?: string | null;
  company?: {
    id: string;
    name: string;
    setupCompleted: boolean;
    setupStep?: number;
    settings?: {
      primaryColor?: string | null;
      logoUrl?: string | null;
      city?: string | null;
      state?: string | null;
      country?: string | null;
      sessionTimeout?: number;
      require2fa?: boolean;
    } | null;
    features?: any;
  } | null;
  createdAt: string;
}

export interface ProjectMember {
  userId: string;
  isProjectManager: boolean;
  user: Pick<User, 'id' | 'name' | 'email' | 'avatarColor' | 'designation'>;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  category: string | null;
  startDate: string | null;
  deadline: string | null;
  ownerId: string;
  isArchived: boolean;
  archivedAt: string | null;
  archivedBy: string | null;
  owner: Pick<User, 'id' | 'name' | 'email' | 'avatarColor'>;
  members: ProjectMember[];
  isMember?: boolean;
  isProjectManager?: boolean;
  progress: number;
  totalTasks: number;
  completedTasks: number;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  clientId?: string | null;
  client?: any;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  projectId: string;
  createdBy: string;
  assignedTo: string | null;
  parentTaskId: string | null;
  dueDate: string | null;
  customStatusId?: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  customPriorityId?: string | null;
  status: 'pending' | 'ongoing' | 'in_review' | 'completed' | 'cancelled';
  position: number;
  creator: Pick<User, 'id' | 'name' | 'avatarColor' | 'designation'>;
  assignee: Pick<User, 'id' | 'name' | 'avatarColor' | 'designation'> | null;
  project?: Pick<Project, 'id' | 'name' | 'category'>;
  subtasks?: Partial<Task>[];
  _count?: { comments: number; attachments: number; subtasks: number };
  milestoneId?: string | null;
  milestone?: Milestone | null;
  dependsOn?: TaskDependency[];
  blockedBy?: TaskDependency[];
  customFields?: Record<string, string>;
  recurringRule?: string | null;
  lastRecurringDate?: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  customStatus?: { id: string; name: string; color: string };
  customPriority?: { id: string; name: string; color: string };
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  isEdited: boolean;
  user: Pick<User, 'id' | 'name' | 'avatarColor'>;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  taskId: string;
  uploadedBy: string;
  fileName?: string; 
  filePath: string;
  fileType: string;
  fileSize: number;
  uploader: Pick<User, 'id' | 'name'>;
  createdAt: string;
  url?: string; 
  fileUrl?: string; 
  originalName?: string; 
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string | null;
  user: Pick<User, 'id' | 'name' | 'avatarColor'>;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'TASK_ASSIGNED' | 'STATUS_CHANGED' | 'COMMENT_ADDED' | 'MENTIONED' | 'DEADLINE_REMINDER' | 'PROJECT_ADDED' | 'PROJECT_UPDATED' | 'TASK_OVERDUE' | 'MILESTONE_COMPLETED' | 'LEAVE_APPROVED' | 'LEAVE_REJECTED';
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface Todo {
  id: string;
  title: string;
  isDone: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string | null;
  createdAt: string;
}

export interface AdminDashboard {
  stats: {
    totalProjects: number;
    activeUsers: number;
    pendingUsers: number;
    tasksThisMonth: number;
    completedTasks: number;
  };
  taskStatusBreakdown: Record<string, number>;
  projectProgress: {
    id: string;
    name: string;
    status: string;
    category: string | null;
    totalTasks: number;
    completedTasks: number;
    progress: number;
  }[];
  recentActivity: ActivityLog[];
  overdueTasks: (Task & { project: Pick<Project, 'id' | 'name'> })[];
}

export interface UserDashboard {
  stats: {
    activeTasks: number;
    dueThisWeek: number;
    completedTotal: number;
  };
  myTasks: (Task & { project: Pick<Project, 'id' | 'name'> })[];
  upcomingDeadlines: (Task & { project: Pick<Project, 'id' | 'name'> })[];
  myProjects: {
    id: string;
    name: string;
    status: string;
    owner: Pick<User, 'id' | 'name' | 'avatarColor'>;
    totalTasks: number;
    completedTasks: number;
    progress: number;
  }[];
}

export interface TimeLog {
  id: string;
  taskId: string;
  userId: string;
  startTime: string;
  endTime: string | null;
  duration: number | null; // in seconds
  description: string | null;
  task?: {
    id: string;
    title: string;
    project?: { id: string; name: string };
  };
  user?: Pick<User, 'id' | 'name' | 'avatarColor'>;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  color: string;
  managerId: string | null;
  manager?: Pick<User, 'id' | 'name' | 'avatarColor'> | null;
  createdAt: string;
  _count?: { users: number; projects: number };
  users?: User[];
  projects?: Project[];
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate: string | null;
  position: number;
  createdAt: string;
  tasks?: Task[];
}

export interface TaskDependency {
  id: string;
  dependentTaskId: string;
  blockingTaskId: string;
  createdAt: string;
  blockingTask?: Task;
  dependentTask?: Task;
}

export interface ChatChannel {
  id: string;
  name: string;
  projectId: string | null;
  isDirect: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  userId: string;
  content: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'name' | 'avatarColor'>;
}
