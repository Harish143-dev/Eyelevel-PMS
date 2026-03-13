export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatarColor: string;
  designation?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  startDate: string | null;
  deadline: string | null;
  ownerId: string;
  owner: Pick<User, 'id' | 'name' | 'avatarColor'>;
  members: { userId: string; user: Pick<User, 'id' | 'name' | 'avatarColor'> }[];
  progress: number;
  totalTasks: number;
  completedTasks: number;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  projectId: string;
  createdBy: string;
  assignedTo: string | null;
  dueDate: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'ongoing' | 'in_review' | 'completed' | 'cancelled';
  position: number;
  creator: Pick<User, 'id' | 'name' | 'avatarColor'>;
  assignee: Pick<User, 'id' | 'name' | 'avatarColor'> | null;
  project?: Pick<Project, 'id' | 'name'>;
  _count?: { comments: number; attachments: number };
  createdAt: string;
  updatedAt: string;
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
  fileName?: string; // Made optional as per instruction
  filePath: string;
  fileType: string;
  fileSize: number;
  uploader: Pick<User, 'id' | 'name'>;
  createdAt: string;
  url?: string; // Added as per instruction
  fileUrl?: string; // Added as per instruction
  originalName?: string; // Added as per instruction
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

export interface AdminDashboard {
  stats: {
    totalProjects: number;
    activeUsers: number;
    tasksThisMonth: number;
    completedTasks: number;
  };
  taskStatusBreakdown: Record<string, number>;
  projectProgress: {
    id: string;
    name: string;
    status: string;
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
