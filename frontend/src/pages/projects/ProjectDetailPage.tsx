import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { isAdmin, isAdminOrManager } from '../../constants/roles';
import { fetchProjectById, updateProject, archiveProject, unarchiveProject, addProjectMember, removeProjectMember, addDepartmentToProject } from '../../store/slices/projectSlice';
import { createTemplateFromProject } from '../../store/slices/templateSlice';
import { fetchUsers, fetchActiveUsers } from '../../store/slices/userSlice';
import { fetchDepartments } from '../../store/slices/departmentSlice';
import { fetchClients } from '../../store/slices/clientSlice';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Card, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/Avatar';
import { Calendar, Users, Shield, ArrowLeft, Settings, Plus, Archive, Tag, UserPlus, Trash2, Search, LayoutGrid, List as ListIcon, Flag, MessageCircle, Network, FileStack, FileText } from 'lucide-react';
import CustomSelect from '../../components/ui/CustomSelect';
import ProjectMilestones from './ProjectMilestones';
import ProjectChat from './ProjectChat';
import ProjectDocuments from './ProjectDocuments';
import DependencyGraph from './DependencyGraph';
import { ProjectGanttView } from './ProjectGanttView';
import KanbanBoard from '../../components/kanban/KanbanBoard';
import { fetchProjectTasks, updateTaskPosition } from '../../store/slices/taskSlice';
import { socketService } from '../../services/socket/socketService';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { useForm, Controller } from 'react-hook-form';
import CreateTaskModal from './CreateTaskModal';
import TaskDetailModal from './TaskDetailModal';
import api from '../../services/api/axios';
import {
  TASK_STATUS_CONFIG,
  PROJECT_STATUS_CONFIG,
  PROJECT_STATUS_OPTIONS,
} from '../../constants/statusConstants';
import type { TaskStatusValue, ProjectStatusValue } from '../../constants/statusConstants';

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { currentProject: project, isLoading: isProjectLoading } = useAppSelector((state) => state.projects);
  const { projectTasks, isLoading: isTasksLoading } = useAppSelector((state) => state.tasks);
  const { users } = useAppSelector((state) => state.users);
  const { departments } = useAppSelector((state) => state.departments);
  const { clients } = useAppSelector((state) => state.clients);
  const { user: currentUser } = useAppSelector((state) => state.auth);

  // BUG-001 Fix: Read sub-feature flags to conditionally hide tabs/sections
  const companyFeatures = (currentUser as any)?.company?.features as Record<string, boolean> | undefined;
  const isSubFeatureEnabled = (key: string): boolean => {
    if (companyFeatures && companyFeatures[key] === false) return false;
    return true; // Default: enabled if not explicitly set to false
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [memberDeptFilter, setMemberDeptFilter] = useState('all');
  const [isMemberLoading, setIsMemberLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; type: 'member' | 'project'; id: string } | null>(null);

  const [taskSearchQuery, setTaskSearchQuery] = useState('');

  // Calculate project stats locally for instant feedback
  const totalTasksCount = projectTasks.length || project?.totalTasks || 0;
  const completedTasksCount = projectTasks.length > 0
    ? projectTasks.filter(t => t.status === 'completed').length
    : project?.completedTasks || 0;
  const currentProgress = totalTasksCount > 0
    ? Math.round((completedTasksCount / totalTasksCount) * 100)
    : project?.progress || 0;
  const [taskUserFilter, setTaskUserFilter] = useState<string>('all');
  const [taskDeadlineFilter, setTaskDeadlineFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [activeTab, setActiveTab] = useState<'tasks' | 'milestones' | 'chat' | 'gantt' | 'documents'>('tasks');

  const isAdminOrSuper = isAdminOrManager(currentUser?.role);

  useEffect(() => {
    if (id) {
      dispatch(fetchProjectById(id));
      dispatch(fetchProjectTasks(id));

      if (isAdminOrSuper) {
        dispatch(fetchUsers({}));
        dispatch(fetchClients());
      } else {
        dispatch(fetchActiveUsers());
      }

      dispatch(fetchDepartments());

      socketService.connect();
      socketService.joinProject(id);
    }
    return () => {
      if (id) {
        socketService.leaveProject(id);
      }
    };
  }, [id, dispatch, isAdminOrSuper]);

  const { register, handleSubmit, reset, control } = useForm({
    defaultValues: {
      name: project?.name || '',
      category: project?.category || '',
      description: project?.description || '',
      status: project?.status || 'planning',
      clientId: project?.clientId || '',
      ownerId: project?.ownerId || '',
      startDate: project?.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
      deadline: project?.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '',
    },
  });

  useEffect(() => {
    if (project) {
      reset({
        name: project.name,
        category: project.category || '',
        description: project.description || '',
        status: project.status,
        clientId: project.clientId || '',
        ownerId: project.ownerId,
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
        deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '',
      });
    }
  }, [project, reset]);

  const onEditSubmit = async (data: any) => {
    if (id) {
      const action = await dispatch(updateProject({ id, data }));
      if (updateProject.fulfilled.match(action)) {
        setIsEditModalOpen(false);
        toast.success('Project details updated');
      } else {
        toast.error('Failed to update project');
      }
    }
  };

  const handleArchiveMerge = () => {
    if (id) {
      if (project?.isArchived) {
        dispatch(unarchiveProject(id)).then(() => toast.success('Project unarchived'));
      } else {
        setDeleteConfirm({ isOpen: true, type: 'project', id });
      }
    }
  };

  const setProjectManager = async (userId: string, isProjectManager: boolean) => {
    if (!id) return;
    try {
      await api.patch(`/projects/${id}/manager`, { userId, isProjectManager });
      dispatch(fetchProjectById(id)); // Refresh project state
      toast.success(isProjectManager ? 'Promoted to Project Manager' : 'Removed from Project Managers');
    } catch (error) {
      console.error('Failed to set project manager', error);
      toast.error('Failed to update project manager');
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!id) return;
    setIsMemberLoading(true);
    try {
      await dispatch(addProjectMember({ projectId: id, userId })).unwrap();
      toast.success('Member added successfully');
    } catch (error) {
      console.error('Failed to add member', error);
      toast.error('Failed to add member');
    } finally {
      setIsMemberLoading(false);
    }
  };

  const handleBulkAddDepartment = async () => {
    if (!id || memberDeptFilter === 'all') {
      toast.error('Please select a specific department first.');
      return;
    }
    setIsMemberLoading(true);
    try {
      const res: any = await dispatch(addDepartmentToProject({ projectId: id, departmentId: memberDeptFilter })).unwrap();
      toast.success(`Successfully added ${res.addedCount || 'all'} members from the department.`);
    } catch (error: any) {
      console.error('Failed to add department members', error);
      toast.error(typeof error === 'string' ? error : 'Failed to add department members');
    } finally {
      setIsMemberLoading(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!id || !project) return;
    const name = prompt('Enter a name for the new template:', `${project.name} Template`);
    if (!name) return;

    try {
      await dispatch(createTemplateFromProject({ projectId: id, name })).unwrap();
      toast.success('Project saved as template!');
      // Assuming you might want to redirect, or just show the toast
    } catch (err: any) {
      toast.error(err || 'Failed to save as template');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!id) return;
    setDeleteConfirm({ isOpen: true, type: 'member', id: userId });
  };

  const handleConfirmAction = async () => {
    if (!id || !deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'member') {
        await dispatch(removeProjectMember({ projectId: id, userId: deleteConfirm.id })).unwrap();
        toast.success('Member removed');
      } else if (deleteConfirm.type === 'project') {
        await dispatch(archiveProject(id)).unwrap();
        toast.success('Project archived');
      }
    } catch (error) {
      toast.error('Action failed');
    } finally {
      setDeleteConfirm(null);
    }
  };

  if ((isProjectLoading && !project) || isTasksLoading || !project) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isPrimaryManager = currentUser?.id === project.ownerId;
  const isMemberPM = project.isProjectManager;


  // Filtering logic for tasks
  const filteredTasks = projectTasks.filter(task => {
    // Search filter
    const matchesSearch = task.title.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(taskSearchQuery.toLowerCase());

    // User filter
    const matchesUser = taskUserFilter === 'all' ? true : task.assignedTo === taskUserFilter;

    // Deadline filter
    let matchesDeadline = true;
    if (taskDeadlineFilter !== 'all') {
      if (!task.dueDate) {
        matchesDeadline = taskDeadlineFilter === 'no-deadline';
      } else {
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (7 - today.getDay()));

        if (taskDeadlineFilter === 'today') {
          matchesDeadline = dueDate >= today && dueDate < tomorrow;
        } else if (taskDeadlineFilter === 'this-week') {
          matchesDeadline = dueDate >= today && dueDate <= endOfWeek;
        } else if (taskDeadlineFilter === 'overdue') {
          matchesDeadline = dueDate < today && task.status !== 'completed';
        }
      }
    }

    return matchesSearch && matchesUser && matchesDeadline;
  });

  return (
    <div className="space-y-5 text-left">
      {project.isArchived && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400">
          <div className="flex items-center gap-2">
            <Archive size={16} />
            <span className="text-sm font-medium">This project is archived and read-only.</span>
          </div>
          {isAdminOrSuper && (
            <Button variant="secondary" onClick={handleArchiveMerge} size="sm" className="text-xs">
              Unarchive
            </Button>
          )}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px] text-text-muted">
        <Link to="/pm/projects" className="flex items-center gap-1 hover:text-primary transition-colors font-medium">
          <ArrowLeft size={14} />
          Projects
        </Link>
        <span className="text-text-muted/40">/</span>
        <span className="text-text-main font-semibold truncate max-w-[260px]">{project.name}</span>
      </div>

      {/* ─── Header Card ─── */}
      <div className="rounded-2xl border border-border bg-surface p-6 md:p-7">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
          <div className="min-w-0 flex-1 space-y-3">
            {/* Title row */}
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[22px] font-bold text-text-main tracking-tight leading-tight">{project.name}</h1>
              <Badge
                variant={PROJECT_STATUS_CONFIG[project.status as ProjectStatusValue]?.badgeVariant || 'gray'}
                className="text-[11px] font-semibold capitalize"
              >
                {PROJECT_STATUS_CONFIG[project.status as ProjectStatusValue]?.label || project.status}
              </Badge>
              {project.category && (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                  {project.category}
                </span>
              )}
            </div>

            {/* Description */}
            {project.description && (
              <p className="text-[13px] text-text-muted leading-relaxed max-w-2xl">{project.description}</p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
              {/* Owner */}
              <div className="flex items-center gap-2">
                <Avatar name={project.owner.name} color={project.owner.avatarColor} size={22} className="ring-1 ring-border" />
                <span className="text-xs text-text-muted">
                  Owner: <span className="font-semibold text-text-main">{project.owner.name}</span>
                </span>
              </div>
              {/* Client */}
              {project.client && (
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Shield size={12} className="text-primary" />
                  Client: <span className="font-semibold text-text-main">{project.client.name}</span>
                </div>
              )}
              {/* Dates */}
              {project.startDate && (
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Calendar size={12} />
                  {new Date(project.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  {project.deadline && (
                    <> → <span className="font-semibold text-text-main">{new Date(project.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span></>
                  )}
                </div>
              )}
              {/* Members */}
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-1.5">
                  {project.members?.slice(0, 5).map((m) => (
                    <Avatar key={m.userId} name={m.user.name} color={m.user.avatarColor} size={20} className="ring-[1.5px] ring-surface" />
                  ))}
                  {(project.members?.length || 0) > 5 && (
                    <span className="w-5 h-5 rounded-full bg-background border-[1.5px] border-surface flex items-center justify-center text-[8px] font-bold text-text-muted">
                      +{(project.members?.length || 0) - 5}
                    </span>
                  )}
                </div>
                <span className="text-xs text-text-muted">{project.members?.length || 0} members</span>
                {isAdminOrSuper && !project.isArchived && (
                  <button onClick={() => setIsAddMemberModalOpen(true)} className="ml-0.5 w-5 h-5 rounded-full border border-dashed border-text-muted/30 flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/50 transition-colors">
                    <Plus size={10} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {(isAdminOrSuper || isMemberPM || isPrimaryManager) && !project.isArchived && (
            <div className="flex items-center gap-2 shrink-0">
              {isAdminOrSuper && (
                <Button variant="secondary" onClick={handleSaveAsTemplate} leftIcon={<FileStack size={14} />} size="sm">
                  Template
                </Button>
              )}
              <Button
                variant="primary"
                onClick={() => { if (isAdminOrSuper) dispatch(fetchUsers({})); setIsEditModalOpen(true); }}
                leftIcon={<Settings size={14} />}
                size="sm"
              >
                Settings
              </Button>
            </div>
          )}
        </div>

        {/* ─── Progress + Quick Stats ─── */}
        <div className="mt-6 pt-5 border-t border-border">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            {/* Progress */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Flag size={16} className="text-primary" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-lg font-bold text-text-main leading-none">{currentProgress}%</span>
                <span className="text-[11px] text-text-muted font-medium mt-0.5">Progress</span>
              </div>
            </div>

            {/* Tasks */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <LayoutGrid size={16} className="text-blue-500" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-lg font-bold text-text-main leading-none">{completedTasksCount}<span className="text-text-muted font-normal text-sm">/{totalTasksCount}</span></span>
                <span className="text-[11px] text-text-muted font-medium mt-0.5">Tasks Done</span>
              </div>
            </div>

            {/* Deadline */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <Calendar size={16} className="text-amber-500" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-text-main leading-none">
                  {project.deadline ? new Date(project.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No deadline'}
                </span>
                <span className="text-[11px] text-text-muted font-medium mt-0.5">Deadline</span>
              </div>
            </div>

            {/* Team */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Users size={16} className="text-emerald-500" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-lg font-bold text-text-main leading-none">{project.members?.length || 0}</span>
                <span className="text-[11px] text-text-muted font-medium mt-0.5">Team Members</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-background overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${currentProgress === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
              style={{ width: `${currentProgress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[11px] text-text-muted font-medium">{completedTasksCount} completed</span>
            <span className="text-[11px] text-text-muted font-medium">{totalTasksCount - completedTasksCount} remaining</span>
          </div>
        </div>
      </div>

      {/* ─── Tab Navigation ─── */}
      <div className="flex items-center gap-1 border-b border-border mb-2 overflow-x-auto">
        {[
          { key: 'tasks' as const, label: 'Tasks', icon: <LayoutGrid size={15} />, show: true },
          { key: 'gantt' as const, label: 'Roadmap', icon: <Network size={15} />, show: isSubFeatureEnabled('gantt') },
          { key: 'milestones' as const, label: 'Milestones', icon: <Flag size={15} />, show: isSubFeatureEnabled('milestones') },
          { key: 'documents' as const, label: 'Documents', icon: <FileText size={15} />, show: true },
          { key: 'chat' as const, label: 'Chat', icon: <MessageCircle size={15} />, show: isSubFeatureEnabled('teamChat') },
        ].filter(tab => tab.show).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text-main hover:border-border'
              }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Tab Content: Tasks ─── */}
      {activeTab === 'tasks' && (
        <div className={`flex-1 overflow-hidden ${project.isArchived ? 'opacity-70 pointer-events-none' : ''}`}>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {/* View Toggle */}
            <div className="flex bg-background border border-border rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-surface text-primary shadow-sm' : 'text-text-muted hover:text-text-main'}`}
                title="Kanban View"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-surface text-primary shadow-sm' : 'text-text-muted hover:text-text-main'}`}
                title="List View"
              >
                <ListIcon size={16} />
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={taskSearchQuery}
                onChange={(e) => setTaskSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-text-main placeholder:text-text-muted/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>

            {/* Filters */}
            <CustomSelect
              value={taskUserFilter}
              onChange={setTaskUserFilter}
              options={[
                { value: 'all', label: 'All Members' },
                ...(project.members?.map(m => ({ value: m.userId, label: m.user.name })) || [])
              ]}
              className="min-w-[130px]"
            />
            <CustomSelect
              value={taskDeadlineFilter}
              onChange={setTaskDeadlineFilter}
              options={[
                { value: 'all', label: 'All Deadlines' },
                { value: 'today', label: 'Due Today' },
                { value: 'this-week', label: 'This Week' },
                { value: 'overdue', label: 'Overdue' },
                { value: 'no-deadline', label: 'No Deadline' },
              ]}
              className="min-w-[130px]"
            />

            {!project.isArchived && (
              <Button
                onClick={() => setIsCreateTaskModalOpen(true)}
                leftIcon={<Plus size={15} />}
                size="sm"
                className="ml-auto"
              >
                New Task
              </Button>
            )}
          </div>

          {/* Board / List Container */}
          <div className="h-[600px] rounded-xl border border-border bg-surface overflow-hidden">
            {viewMode === 'kanban' ? (
              <div className="h-full overflow-x-auto p-4">
                <KanbanBoard
                  tasks={filteredTasks}
                  onTaskMove={(taskId, newStatus, newPosition) => {
                    if (project.isArchived) return;
                    dispatch(updateTaskPosition({ id: taskId, status: newStatus, position: newPosition }));
                  }}
                  onTaskClick={(task) => {
                    setSelectedTaskId(task.id);
                  }}
                />
              </div>
            ) : (
              <div className="overflow-auto w-full h-full">
                <table className="w-full text-left">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-background">
                      <th className="px-5 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider border-b border-border">Task</th>
                      <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider border-b border-border text-center w-[120px]">Status</th>
                      <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider border-b border-border text-center w-[100px]">Priority</th>
                      <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider border-b border-border w-[160px]">Assignee</th>
                      <th className="px-4 py-3 text-[11px] font-semibold text-text-muted uppercase tracking-wider border-b border-border text-right w-[120px]">Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task) => (
                      <tr
                        key={task.id}
                        className="group border-b border-border/50 last:border-b-0 hover:bg-primary/[0.02] transition-colors cursor-pointer"
                        onClick={() => setSelectedTaskId(task.id)}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col gap-0.5 max-w-md">
                            <span className="text-[13px] font-medium text-text-main group-hover:text-primary transition-colors">{task.title}</span>
                            {task.description && <span className="text-[11px] text-text-muted line-clamp-1">{task.description}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <Badge
                            variant={(task.customStatus ? 'indigo' : TASK_STATUS_CONFIG[task.status as TaskStatusValue]?.badgeVariant) as any}
                            className="text-[10px] font-semibold"
                          >
                            {task.customStatus?.name || TASK_STATUS_CONFIG[task.status as TaskStatusValue]?.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold capitalize px-2.5 py-1 rounded-full ${
                            task.customPriority ? 'bg-primary/10 text-primary' :
                            task.priority === 'critical' ? 'bg-red-500/10 text-red-500' :
                            task.priority === 'high' ? 'bg-amber-500/10 text-amber-500' :
                            task.priority === 'medium' ? 'bg-blue-500/10 text-blue-500' :
                            'bg-gray-500/10 text-text-muted'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              task.customPriority ? 'bg-primary' :
                              task.priority === 'critical' ? 'bg-red-500' :
                              task.priority === 'high' ? 'bg-amber-500' :
                              task.priority === 'medium' ? 'bg-blue-500' :
                              'bg-gray-400'
                            }`} />
                            {task.customPriority?.name || task.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {task.assignee ? (
                            <div className="flex items-center gap-2">
                              <Avatar name={task.assignee.name} color={task.assignee.avatarColor} size={22} />
                              <span className="text-xs font-medium text-text-main">{task.assignee.name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-text-muted/50">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {task.dueDate ? (
                            <span className="text-xs text-text-muted">{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          ) : (
                            <span className="text-xs text-text-muted/30">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredTasks.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-2 text-text-muted/40">
                            <Search size={36} />
                            <p className="text-sm font-medium">No tasks found</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: Milestones */}
      {activeTab === 'milestones' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <ProjectMilestones projectId={id!} isAdmin={isAdminOrSuper || !!isMemberPM || isPrimaryManager} />
        </div>
      )}

      {/* Tab Content: Team Chat */}
      {activeTab === 'chat' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <ProjectChat projectId={id!} />
        </div>
      )}

      {/* Tab Content: Timeline / Gantt */}
      {activeTab === 'gantt' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
          <ProjectGanttView tasks={projectTasks} project={project} />

          <div className="pt-8 border-t border-border">
            <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
              <Network size={20} className="text-primary" /> Task Dependencies Visualization
            </h3>
            <DependencyGraph tasks={projectTasks} />
          </div>
        </div>
      )}

      {/* Tab Content: Wiki / Docs */}
      {activeTab === 'documents' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <ProjectDocuments projectId={id!} />
        </div>
      )}

      {!project.isArchived && (
        <CreateTaskModal
          isOpen={isCreateTaskModalOpen}
          onClose={() => setIsCreateTaskModalOpen(false)}
          project={project}
        />
      )}

      <TaskDetailModal
        isOpen={Boolean(selectedTaskId)}
        onClose={() => setSelectedTaskId(null)}
        taskId={selectedTaskId}
        projectId={project.id}
      />

      {/* Admin Edit Modal */}
      {(isAdminOrSuper || isMemberPM || isPrimaryManager) && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Project Settings"
        >
          <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-6 text-left">
            <div className="space-y-5">
              <Input label="Project Name" {...register('name')} />
              <Input label="Category" placeholder="e.g., Development" {...register('category')} />
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Description</label>
                <textarea
                  {...register('description')}
                  className="appearance-none block w-full px-4 py-3 bg-background border border-border rounded-xl text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all custom-scrollbar"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Status</label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={PROJECT_STATUS_OPTIONS}
                    />
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input type="date" label="Start Date" {...register('startDate')} />
                <Input type="date" label="Deadline" {...register('deadline')} />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Client Relationship</label>
                <Controller
                  name="clientId"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      options={[{ value: '', label: '-- Internal / No Client --' }, ...clients.map((c: any) => ({ value: c.id, label: c.name }))]}
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              {isAdmin(currentUser?.role) && (
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Primary Manager</label>
                  <Controller
                    name="ownerId"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={[
                          { value: project.ownerId, label: `${project.owner.name} (Current)` },
                          ...users
                            .filter(u => u.isActive && u.id !== project.ownerId)
                            .map(u => ({ value: u.id, label: `${u.name} (${u.role})` }))
                        ]}
                      />
                    )}
                  />
                  <p className="mt-1 text-[10px] uppercase font-bold text-warning/80">Only Super Admins can reassign.</p>
                </div>
              )}
            </div>

            {isAdminOrSuper && (
              <div className="p-4 rounded-xl border border-danger/20 bg-danger/5 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-danger">Archive Data</h4>
                  <p className="text-xs text-danger/70">Freezes tasks and locks editing.</p>
                </div>
                <Button type="button" variant="secondary" onClick={() => { setIsEditModalOpen(false); handleArchiveMerge(); }} className="text-danger border-danger/20 hover:bg-danger/10 hover:text-danger shadow-sm">
                  <Archive size={14} className="mr-2 inline" /> Archive
                </Button>
              </div>
            )}

            <div className="pt-6 border-t border-border flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="shadow-lg shadow-primary/20 hover-lift">Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Member Modal */}
      <Modal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        title="Workforce Management"
      >
        <div className="space-y-8">
          {/* Current Members Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-text-muted uppercase tracking-widest flex items-center gap-2">
              <Users size={14} /> Assigned Members ({project.members?.length || 0})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
              {project.members?.map((m) => (
                <div key={m.userId} className="flex flex-col gap-3 p-3 bg-surface/50 border border-border rounded-xl hover:border-primary/30 transition-colors shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.user.name} color={m.user.avatarColor} size={36} className="ring-2 ring-primary/5" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-text-main flex items-center gap-1.5 truncate">
                          {m.user.name}
                          {m.isProjectManager && <Shield size={12} className="text-primary shrink-0" />}
                        </span>
                        <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider truncate">{m.user.designation || 'Specialist'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-auto justify-end border-t border-border/50 pt-2">
                    {isAdminOrSuper && m.userId !== project.ownerId && (
                      <button
                        onClick={() => setProjectManager(m.userId, !m.isProjectManager)}
                        className={`text-[10px] uppercase font-black px-2 py-1 rounded-md transition-all ${m.isProjectManager ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-surface text-text-muted hover:bg-surface-hover border border-border shadow-sm'}`}
                      >
                        {m.isProjectManager ? 'Revoke PM' : 'Make PM'}
                      </button>
                    )}
                    {(isAdminOrSuper || isMemberPM || isPrimaryManager) && m.userId !== project.ownerId && (
                      <button
                        onClick={() => handleRemoveMember(m.userId)}
                        className="p-1 text-text-muted/50 hover:text-danger hover:bg-danger/10 rounded-md transition-all"
                        title="Remove member"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {(isAdminOrSuper || isMemberPM || isPrimaryManager) && !project.isArchived && (
            <div className="pt-6 border-t border-border">
              <h3 className="text-xs font-black text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                <UserPlus size={14} /> Invite New Talent
              </h3>
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1 group">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={memberSearchTerm}
                      onChange={(e) => setMemberSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-surface/50 border border-border rounded-xl text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <div className="w-full md:w-48">
                      <CustomSelect
                        value={memberDeptFilter}
                        onChange={setMemberDeptFilter}
                        options={[
                          { value: 'all', label: 'All Departments' },
                          ...departments.map(d => ({ value: d.id, label: d.name }))
                        ]}
                      />
                    </div>
                  </div>
                </div>

                {memberDeptFilter !== 'all' && (
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleBulkAddDepartment}
                      isLoading={isMemberLoading}
                      className="px-4 py-1 text-xs font-bold hover-lift text-primary border-primary/20 bg-primary/5"
                    >
                      <UserPlus size={14} className="mr-1 inline" /> Invite Department
                    </Button>
                  </div>
                )}

                <div className="max-h-48 overflow-y-auto rounded-xl border border-border/50 bg-background/50 p-2 space-y-1.5 custom-scrollbar shadow-inner">
                  {users
                    .filter(u => u.isActive && !project.members.some(m => m.userId === u.id))
                    .filter(u => memberDeptFilter === 'all' || u.departmentId === memberDeptFilter)
                    .filter(u => u.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) || u.email.toLowerCase().includes(memberSearchTerm.toLowerCase()))
                    .map(user => (
                      <div key={user.id} className="flex items-center justify-between p-2.5 bg-surface rounded-lg border border-transparent hover:border-border shadow-sm transition-all group">
                        <div className="flex items-center gap-3">
                          <Avatar name={user.name} color={user.avatarColor} size={32} />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-text-main">{user.name}</span>
                            <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">{user.designation || 'Specialist'}</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleAddMember(user.id)}
                          isLoading={isMemberLoading}
                          className="h-8 text-xs font-bold shadow-sm opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                        >
                          Invite
                        </Button>
                      </div>
                    ))}
                  {users.filter(u => u.isActive && !project.members.some(m => m.userId === u.id)).filter(u => memberDeptFilter === 'all' || u.departmentId === memberDeptFilter).length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-xs font-bold uppercase tracking-widest text-text-muted/50">No candidates found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-border">
            <Button variant="primary" onClick={() => setIsAddMemberModalOpen(false)} className="hover-lift shadow-md shadow-primary/20">
              Complete Assignment
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm?.isOpen || false}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleConfirmAction}
        title={deleteConfirm?.type === 'member' ? 'Remove Team Member' : 'Archive Project'}
        message={deleteConfirm?.type === 'member' ? 'Are you sure you want to remove this member? They will lose access to this project.' : 'Are you sure you want to archive this project? It will become read-only.'}
        confirmText={deleteConfirm?.type === 'member' ? 'Remove' : 'Archive'}
        variant={deleteConfirm?.type === 'member' ? 'danger' : 'info'}
      />
    </div>
  );
};

export default ProjectDetailPage;
