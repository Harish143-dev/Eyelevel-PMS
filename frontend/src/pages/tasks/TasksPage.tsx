import React, { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchMyTasks, updateTask } from '../../store/slices/taskSlice';
import Badge from '../../components/ui/Badge';
import {
  Calendar,
  Search,
  MessageSquare,
  Paperclip,
  CheckCircle2,
  LayoutGrid,
  List as ListIcon,
  X,
  CircleDot,
  Clock,
  AlertTriangle,
  FolderOpen,
  SlidersHorizontal,
} from 'lucide-react';
import type { Task } from '../../types';
import TaskDetailModal from '../projects/TaskDetailModal';
import CustomSelect from '../../components/ui/CustomSelect';
import {
  TASK_STATUS,
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
} from '../../constants/statusConstants';
import type { TaskStatusValue, TaskPriorityValue } from '../../constants/statusConstants';
import { useWorkflowStatuses } from '../../hooks/useWorkflowStatuses';

/* ─── helpers ──────────────────────────────────────────────── */

const priorityBorder: Record<string, string> = {
  critical: 'border-l-[3px] border-l-red-500',
  high: 'border-l-[3px] border-l-amber-500',
  medium: 'border-l-[3px] border-l-blue-500',
  low: 'border-l-[3px] border-l-emerald-500',
};

const statusIcon: Record<string, React.ReactNode> = {
  pending: <Clock size={14} className="text-text-muted" />,
  ongoing: <CircleDot size={14} className="text-info" />,
  in_review: <AlertTriangle size={14} className="text-warning" />,
  completed: <CheckCircle2 size={14} className="text-success" />,
  cancelled: <X size={14} className="text-danger" />,
};

/* ─── component ────────────────────────────────────────────── */

const TasksPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tasks, isLoading } = useAppSelector((state) => state.tasks);
  const { statusOptions: workflowStatusOptions } = useWorkflowStatuses();

  /* persisted UI state */
  const [filter, setFilter] = useState<Task['status'] | 'all'>(
    (sessionStorage.getItem('tasks_filter_status') as any) || 'all',
  );
  const [searchQuery, setSearchQuery] = useState(
    sessionStorage.getItem('tasks_filter_search') || '',
  );
  const [projectFilter, setProjectFilter] = useState<string>(
    sessionStorage.getItem('tasks_filter_project') || 'all',
  );
  const [deadlineFilter, setDeadlineFilter] = useState<string>(
    sessionStorage.getItem('tasks_filter_deadline') || 'all',
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(
    (sessionStorage.getItem('tasks_view_mode') as 'grid' | 'list') || 'grid',
  );
  const [selectedTask, setSelectedTask] = useState<{ id: string; projectId: string } | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  /* persist on change */
  useEffect(() => {
    sessionStorage.setItem('tasks_filter_status', filter);
    sessionStorage.setItem('tasks_filter_search', searchQuery);
    sessionStorage.setItem('tasks_filter_project', projectFilter);
    sessionStorage.setItem('tasks_filter_deadline', deadlineFilter);
    sessionStorage.setItem('tasks_view_mode', viewMode);
  }, [filter, searchQuery, projectFilter, deadlineFilter, viewMode]);

  /* fetch */
  useEffect(() => {
    dispatch(fetchMyTasks());
  }, [dispatch]);

  /* derived data */
  const uniqueProjects = useMemo(
    () =>
      Array.from(new Set(tasks.map((t) => t.project?.id).filter((id): id is string => !!id))).map(
        (id) => {
          const task = tasks.find((t) => t.project?.id === id);
          return { id, name: task?.project?.name };
        },
      ),
    [tasks],
  );

  const stats = useMemo(
    () =>
      tasks.reduce(
        (acc, t) => {
          acc[t.status] = (acc[t.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    [tasks],
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filter !== 'all' && task.status !== filter) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          task.title.toLowerCase().includes(q) ||
          task.description?.toLowerCase().includes(q) ||
          task.project?.name.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      if (projectFilter !== 'all' && task.projectId !== projectFilter) return false;

      if (deadlineFilter !== 'all') {
        if (!task.dueDate) return deadlineFilter === 'no-deadline';
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
        if (deadlineFilter === 'today' && !(dueDate >= today && dueDate < tomorrow)) return false;
        if (deadlineFilter === 'this-week' && !(dueDate >= today && dueDate <= endOfWeek))
          return false;
        if (deadlineFilter === 'overdue' && !(dueDate < today && task.status !== 'completed'))
          return false;
      }

      return true;
    });
  }, [tasks, filter, searchQuery, projectFilter, deadlineFilter]);

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(newStatus);
    if (isUUID) {
      dispatch(updateTask({ id: taskId, data: { customStatusId: newStatus, status: 'ongoing' } as any }));
    } else {
      dispatch(updateTask({ id: taskId, data: { status: newStatus as any, customStatusId: null } as any }));
    }
  };

  const hasActiveFilters = projectFilter !== 'all' || deadlineFilter !== 'all' || searchQuery;

  const clearAllFilters = () => {
    setProjectFilter('all');
    setDeadlineFilter('all');
    setSearchQuery('');
    setFilter('all');
  };

  /* ─── summary cards data ─────────────────────────────────── */
  const summaryCards = [
    {
      label: 'Total',
      count: tasks.length,
      icon: <FolderOpen size={18} />,
      color: 'text-text-muted',
      bg: 'bg-background',
    },
    {
      label: 'In Progress',
      count: (stats[TASK_STATUS.ONGOING] || 0),
      icon: <CircleDot size={18} />,
      color: 'text-info',
      bg: 'bg-info/5',
    },
    {
      label: 'In Review',
      count: (stats[TASK_STATUS.IN_REVIEW] || 0),
      icon: <AlertTriangle size={18} />,
      color: 'text-warning',
      bg: 'bg-warning/5',
    },
    {
      label: 'Completed',
      count: (stats[TASK_STATUS.COMPLETED] || 0),
      icon: <CheckCircle2 size={18} />,
      color: 'text-success',
      bg: 'bg-success/5',
    },
  ];

  /* ─── render ─────────────────────────────────────────────── */
  return (
    <div className="space-y-6 animate-fade-in-up pb-8">
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-text-main tracking-tight">My Tasks</h1>
        <p className="text-sm text-text-muted">
          Manage and track your assigned tasks across all projects.
        </p>
      </div>

      {/* ── Summary Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className={`${card.bg} border border-border rounded-xl p-4 flex items-center gap-3 transition-colors`}
          >
            <div className={`${card.color} shrink-0`}>{card.icon}</div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-text-main leading-none">{card.count}</p>
              <p className="text-xs text-text-muted mt-0.5 truncate">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Row 1: Search + View + Filters toggle */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input
              type="text"
              placeholder="Search tasks..."
              className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-main placeholder:text-text-muted/60 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Filters toggle (mobile-friendly) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                showFilters || hasActiveFilters
                  ? 'bg-primary/5 border-primary/30 text-primary'
                  : 'bg-surface border-border text-text-muted hover:text-text-main hover:border-border'
              }`}
            >
              <SlidersHorizontal size={15} />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>

            {/* View Toggle */}
            <div className="flex items-center bg-surface border border-border rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-background text-text-main shadow-sm'
                    : 'text-text-muted hover:text-text-main'
                }`}
                title="Grid View"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-background text-text-main shadow-sm'
                    : 'text-text-muted hover:text-text-main'
                }`}
                title="List View"
              >
                <ListIcon size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar -mx-1 px-1">
          {(['all', ...Object.values(TASK_STATUS)] as const).map((f) => {
            const isActive = filter === f;
            const count = f === 'all' ? tasks.length : stats[f] || 0;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-muted hover:text-text-main hover:bg-surface'
                }`}
              >
                {f !== 'all' && statusIcon[f]}
                {f === 'all' ? 'All' : TASK_STATUS_CONFIG[f as TaskStatusValue]?.label}
                <span
                  className={`text-[11px] ml-0.5 px-1.5 py-0.5 rounded-md font-normal ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'bg-background text-text-muted'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Row 3: Filters (collapsible) */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 pt-1 animate-fade-in-up">
            <CustomSelect
              value={projectFilter}
              onChange={setProjectFilter}
              options={[
                { value: 'all', label: 'All Projects' },
                ...uniqueProjects.map((p) => ({ value: p.id, label: p.name || 'Unknown' })),
              ]}
              className="w-44"
            />
            <CustomSelect
              value={deadlineFilter}
              onChange={setDeadlineFilter}
              options={[
                { value: 'all', label: 'Any Deadline' },
                { value: 'today', label: 'Due Today' },
                { value: 'this-week', label: 'Due This Week' },
                { value: 'overdue', label: 'Overdue' },
              ]}
              className="w-40"
            />
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-text-muted hover:text-danger transition-colors flex items-center gap-1"
              >
                <X size={14} />
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Content ──────────────────────────────────────────── */}
      {isLoading && tasks.length === 0 ? (
        /* Loading */
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-text-muted">Loading tasks…</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        /* Empty */
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <div className="p-3 rounded-full bg-surface border border-border mb-1">
            <CheckCircle2 size={28} className="text-text-muted/30" />
          </div>
          <h3 className="text-base font-semibold text-text-main">No tasks found</h3>
          <p className="text-sm text-text-muted text-center max-w-xs">
            {hasActiveFilters
              ? 'Try adjusting your filters or search query.'
              : "You're all caught up — no tasks assigned yet."}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="mt-2 text-sm text-primary hover:text-primary-hover font-medium transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* ── Grid View ──────────────────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTasks.map((task) => {
            const isOverdue =
              task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
            const prio = task.priority as TaskPriorityValue;

            return (
              <div
                key={task.id}
                onClick={() => setSelectedTask({ id: task.id, projectId: task.projectId })}
                className={`group flex flex-col bg-surface border border-border rounded-xl cursor-pointer transition-all hover:shadow-lg hover:shadow-black/5 hover:border-primary/30 dark:hover:shadow-black/20 ${
                  priorityBorder[prio] || 'border-l-[3px] border-l-transparent'
                }`}
              >
                {/* Card body */}
                <div className="p-4 flex flex-col flex-1 gap-3">
                  {/* Top row: project + priority */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-[11px] font-medium text-text-muted truncate"
                      title={task.project?.name}
                    >
                      {task.project?.name}
                    </span>
                    <Badge
                      variant={
                        (task.customPriority
                          ? 'indigo'
                          : TASK_PRIORITY_CONFIG[prio]?.badgeVariant || 'gray') as any
                      }
                      className="text-[10px] px-1.5 py-0 shrink-0"
                    >
                      {task.customPriority?.name || TASK_PRIORITY_CONFIG[prio]?.label}
                    </Badge>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-semibold text-text-main leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {task.title}
                  </h3>

                  {/* Due date */}
                  <div className="flex items-center gap-1.5 text-xs text-text-muted mt-auto">
                    <Calendar size={13} className={isOverdue ? 'text-danger' : ''} />
                    <span className={`font-medium ${isOverdue ? 'text-danger' : ''}`}>
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'No due date'}
                    </span>
                    {isOverdue && (
                      <span className="ml-1 text-[10px] text-danger font-semibold bg-danger/10 px-1.5 py-0.5 rounded">
                        Overdue
                      </span>
                    )}
                  </div>
                </div>

                {/* Card footer */}
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-background/50">
                  <div onClick={(e) => e.stopPropagation()} className="w-[140px]">
                    <CustomSelect
                      value={task.customStatusId || task.status}
                      onChange={(val) => handleStatusChange(task.id, val as Task['status'])}
                      options={workflowStatusOptions}
                      className="w-full text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-3 text-text-muted">
                    <span className="flex items-center gap-1 text-[11px]" title="Comments">
                      <MessageSquare size={12} />
                      {task._count?.comments || 0}
                    </span>
                    <span className="flex items-center gap-1 text-[11px]" title="Attachments">
                      <Paperclip size={12} />
                      {task._count?.attachments || 0}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── List View ──────────────────────────────────────── */
        <div className="bg-surface border border-border rounded-xl divide-y divide-border">
          {filteredTasks.map((task) => {
            const isOverdue =
              task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
            const prio = task.priority as TaskPriorityValue;

            return (
              <div
                key={task.id}
                onClick={() => setSelectedTask({ id: task.id, projectId: task.projectId })}
                className={`group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 py-3 cursor-pointer transition-colors hover:bg-background/60 ${
                  priorityBorder[prio] || 'border-l-[3px] border-l-transparent'
                }`}
              >
                {/* Left: title & meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {statusIcon[task.status] || <CircleDot size={14} className="text-text-muted" />}
                    <h3 className="text-sm font-medium text-text-main truncate group-hover:text-primary transition-colors">
                      {task.title}
                    </h3>
                    <Badge
                      variant={
                        (task.customPriority
                          ? 'indigo'
                          : TASK_PRIORITY_CONFIG[prio]?.badgeVariant || 'gray') as any
                      }
                      className="text-[10px] px-1.5 py-0 shrink-0 hidden sm:inline-flex"
                    >
                      {task.customPriority?.name || TASK_PRIORITY_CONFIG[prio]?.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-muted pl-[22px]">
                    <span className="truncate max-w-[140px]">{task.project?.name}</span>
                    <span className="w-0.5 h-0.5 rounded-full bg-text-muted/40 shrink-0" />
                    <span className={`flex items-center gap-1 ${isOverdue ? 'text-danger font-medium' : ''}`}>
                      <Calendar size={12} />
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'No due date'}
                    </span>
                    {isOverdue && (
                      <span className="text-[10px] text-danger font-semibold bg-danger/10 px-1.5 py-0.5 rounded">
                        Overdue
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: counts + status */}
                <div className="flex items-center gap-4 pl-[22px] sm:pl-0">
                  <div className="flex items-center gap-3 text-text-muted text-xs">
                    <span className="flex items-center gap-1" title="Comments">
                      <MessageSquare size={13} />
                      {task._count?.comments || 0}
                    </span>
                    <span className="flex items-center gap-1" title="Attachments">
                      <Paperclip size={13} />
                      {task._count?.attachments || 0}
                    </span>
                  </div>
                  <div className="w-[140px] shrink-0" onClick={(e) => e.stopPropagation()}>
                    <CustomSelect
                      value={task.customStatusId || task.status}
                      onChange={(val) => handleStatusChange(task.id, val as Task['status'])}
                      options={workflowStatusOptions}
                      className="w-full text-xs"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Task Detail Modal ────────────────────────────────── */}
      {selectedTask && (
        <TaskDetailModal
          isOpen={true}
          onClose={() => setSelectedTask(null)}
          taskId={selectedTask.id}
          projectId={selectedTask.projectId}
        />
      )}
    </div>
  );
};

export default TasksPage;
