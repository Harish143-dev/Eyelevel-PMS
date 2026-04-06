import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Avatar from '../../components/Avatar';
import Badge from '../../components/ui/Badge';
import CustomSelect from '../../components/ui/CustomSelect';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { deleteTask, updateTaskStatus, fetchSubtasks, createSubtask, updateTask } from '../../store/slices/taskSlice';
import api from '../../services/api/axios';
import {
  Calendar, MessageSquare, Send, Trash2, ListChecks, Plus, Clock, Play, Square, Timer,
  Link2, X, AlertTriangle, Save, Edit3,
} from 'lucide-react';
import type { Task, Comment, TaskDependency } from '../../types';
import { socketService } from '../../services/socket/socketService';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { fetchTimeLogs, startTimer, stopTimer, logTimeManual } from '../../store/slices/timeSlice';
import { isAdminOrManager } from '../../constants/roles';
import { RichTextEditor } from '../../components/ui/RichTextEditor';
import {
  TASK_STATUS,
  TASK_STATUS_CONFIG,
} from '../../constants/statusConstants';
import type { TaskStatusValue } from '../../constants/statusConstants';
import { useWorkflowStatuses } from '../../hooks/useWorkflowStatuses';

/* ─── helpers ──────────────────────────────────────────────── */

const statusDot: Record<string, string> = {
  pending: 'bg-gray-400',
  ongoing: 'bg-blue-500',
  in_review: 'bg-amber-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-500',
};

/* ─── component ────────────────────────────────────────────── */

interface TaskDetailModalProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ taskId, isOpen, onClose, projectId }) => {
  const dispatch = useAppDispatch();
  const { projectTasks, tasks: allMyTasks, currentTaskSubtasks } = useAppSelector((state) => state.tasks);
  const { currentProject } = useAppSelector((state) => state.projects);
  const { user: currentUser } = useAppSelector((state) => state.auth);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingSubtask, setIsSubmittingSubtask] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; type: 'task' | 'subtask'; id: string } | null>(null);
  const [showManualLog, setShowManualLog] = useState(false);
  const [manualDuration, setManualDuration] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearchTerm, setMentionSearchTerm] = useState('');
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [showAddDep, setShowAddDep] = useState(false);
  const [depSearchTerm, setDepSearchTerm] = useState('');

  const [task, setTask] = useState<Task | null>(null);
  const [isFetchingTask, setIsFetchingTask] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [, setIsSavingTitle] = useState(false);

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [, setIsSavingDescription] = useState(false);

  const { statusOptions, priorityOptions } = useWorkflowStatuses();

  /* ── Fetch task + socket ── */
  useEffect(() => {
    if (isOpen && taskId && projectId) {
      fetchAllTaskDetails();
      dispatch(fetchSubtasks(taskId));
      dispatch(fetchTimeLogs({ taskId }));

      socketService.connect();
      socketService.joinProject(projectId);

      const socket = socketService.socket;
      if (socket) {
        socket.on('comment:created', (data: { taskId: string; comment: Comment }) => {
          if (data.taskId === taskId) setComments((prev) => [...prev, data.comment]);
        });
        socket.on('comment:deleted', (data: { taskId: string; commentId: string }) => {
          if (data.taskId === taskId) setComments((prev) => prev.filter((c) => c.id !== data.commentId));
        });
      }

      return () => {
        if (socket) {
          socket.off('comment:created');
          socket.off('comment:deleted');
        }
      };
    }
  }, [isOpen, taskId, projectId, dispatch]);

  useEffect(() => {
    if (task) {
      setEditedDescription(task.description || '');
      setEditedTitle(task.title || '');
    }
  }, [task]);

  const fetchAllTaskDetails = async () => {
    if (!taskId) return;
    setIsFetchingTask(true);
    try {
      const [taskRes, commentsRes] = await Promise.all([
        api.get(`/tasks/${taskId}`),
        api.get(`/tasks/${taskId}/comments`),
      ]);
      const fullTask = taskRes.data.task || taskRes.data;
      setTask(fullTask);
      setDependencies(fullTask.dependsOn || []);
      setComments(commentsRes.data.comments || []);
    } catch (err) {
      console.error('Failed to fetch full task details', err);
      const fromStore = projectTasks.find((t) => t.id === taskId) || allMyTasks.find((t) => t.id === taskId);
      if (fromStore) setTask(fromStore);
    } finally {
      setIsFetchingTask(false);
    }
  };

  /* ── Handlers ── */

  const handleAddDependency = async (blockingTaskId: string) => {
    if (!taskId) return;
    try {
      await api.post(`/tasks/${taskId}/dependencies`, { blockingTaskId });
      toast.success('Dependency added');
      fetchAllTaskDetails();
      setShowAddDep(false);
      setDepSearchTerm('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add dependency');
    }
    fetchAllTaskDetails();
  };

  const handleRemoveDependency = async (blockingTaskId: string) => {
    if (!taskId) return;
    try {
      await api.delete(`/tasks/${taskId}/dependencies/${blockingTaskId}`);
      toast.success('Dependency removed');
      fetchAllTaskDetails();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove dependency');
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewComment(val);
    const words = val.split(' ');
    const lastWord = words[words.length - 1];
    if (lastWord.startsWith('@')) {
      setMentionSearchTerm(lastWord.slice(1).toLowerCase());
      setShowMentionDropdown(true);
    } else {
      setShowMentionDropdown(false);
    }
  };

  const handleMentionSelect = (user: { userId: string; user: { name: string } }) => {
    const words = newComment.split(' ');
    words.pop();
    const finalComment = words.length > 0 ? words.join(' ') + ` @${user.user.name} ` : `@${user.user.name} `;
    setNewComment(finalComment);
    if (!mentionedUserIds.includes(user.userId)) {
      setMentionedUserIds((prev) => [...prev, user.userId]);
    }
    setShowMentionDropdown(false);
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !taskId) return;
    setIsSubmittingComment(true);
    try {
      await api.post(`/tasks/${taskId}/comments`, { content: newComment, mentions: mentionedUserIds });
      setNewComment('');
      setMentionedUserIds([]);
      setShowMentionDropdown(false);
      fetchAllTaskDetails();
      toast.success('Comment added');
    } catch (err) {
      console.error('Failed to post comment', err);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCreateSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !taskId) return;
    setIsSubmittingSubtask(true);
    const action = await dispatch(createSubtask({ taskId, data: { title: newSubtaskTitle, status: 'pending', priority: task?.priority || 'medium' } }));
    if (createSubtask.fulfilled.match(action)) {
      setNewSubtaskTitle('');
      toast.success('Subtask created');
    } else {
      toast.error('Failed to create subtask');
    }
    setIsSubmittingSubtask(false);
  };

  const handleSaveDescription = async () => {
    if (!taskId) return;
    setIsSavingDescription(true);
    try {
      await dispatch(updateTask({ id: taskId, data: { description: editedDescription } })).unwrap();
      setTask((prev) => (prev ? { ...prev, description: editedDescription } : null));
      setIsEditingDescription(false);
      toast.success('Description updated');
    } catch (err: any) {
      toast.error(typeof err === 'string' ? err : 'Failed to update description');
    } finally {
      setIsSavingDescription(false);
    }
  };

  const handleSaveTitle = async () => {
    if (!taskId || !editedTitle.trim()) return;
    setIsSavingTitle(true);
    try {
      await dispatch(updateTask({ id: taskId, data: { title: editedTitle } })).unwrap();
      setTask((prev) => (prev ? { ...prev, title: editedTitle } : null));
      setIsEditingTitle(false);
      toast.success('Title updated');
    } catch (err: any) {
      toast.error(typeof err === 'string' ? err : 'Failed to update title');
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleStatusChange = async (val: string) => {
    if (!taskId) return;
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
      if (isUUID) {
        await dispatch(updateTask({ id: taskId, data: { customStatusId: val, status: TASK_STATUS.ONGOING } as any })).unwrap();
      } else {
        await dispatch(updateTask({ id: taskId, data: { status: val as any, customStatusId: null } as any })).unwrap();
      }
      toast.success('Status updated');
      fetchAllTaskDetails();
    } catch {
      toast.error('Failed to change status');
    }
  };

  const handlePriorityChange = async (val: string) => {
    if (!taskId) return;
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
      if (isUUID) {
        await dispatch(updateTask({ id: taskId, data: { customPriorityId: val, priority: 'medium' } as any })).unwrap();
      } else {
        await dispatch(updateTask({ id: taskId, data: { priority: val as any, customPriorityId: null } as any })).unwrap();
      }
      toast.success('Priority updated');
      fetchAllTaskDetails();
    } catch {
      toast.error('Failed to update priority');
    }
  };

  const handleSubtaskStatusChange = (subtaskId: string, isCompleted: boolean) => {
    dispatch(updateTaskStatus({ id: subtaskId, status: isCompleted ? 'completed' : 'pending' }));
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await dispatch(deleteTask(deleteConfirm.id)).unwrap();
      toast.success(deleteConfirm.type === 'task' ? 'Task deleted' : 'Subtask deleted');
      if (deleteConfirm.type === 'task') onClose();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleStartTimer = () => {
    if (!taskId) return;
    dispatch(startTimer({ taskId }));
    toast.success('Timer started');
  };

  const handleStopTimer = () => {
    dispatch(stopTimer());
    toast.success('Timer stopped. Time logged.');
  };

  const handleManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskId || !manualDuration) return;
    dispatch(logTimeManual({ taskId, duration: parseInt(manualDuration) * 60, description: manualDesc }));
    setShowManualLog(false);
    setManualDuration('');
    setManualDesc('');
    toast.success('Time logged manually');
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const { logs: timeLogs, runningTimer } = useAppSelector((state: any) => state.time);
  const isRunningThisTask = runningTimer?.taskId === taskId;
  const taskTimeLogs = timeLogs.filter((l: any) => l.taskId === taskId);

  /* ── Loading gate ── */
  if (isFetchingTask && !task) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Loading Task..." size="xl">
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Modal>
    );
  }

  if (!task) return null;

  /* ── Permissions ── */
  const isAdmin = isAdminOrManager(currentUser?.role);
  const isProjectManager = currentProject?.members?.some((m) => m.userId === currentUser?.id && m.isProjectManager);
  const isOwner = currentProject?.ownerId === currentUser?.id;
  const isAssignee = task.assignedTo === currentUser?.id;
  const isCreator = task.createdBy === currentUser?.id;
  const canEdit = isAdmin || isProjectManager || isOwner || isAssignee || isCreator;
  const canDelete = isAdmin || isProjectManager || isOwner || isCreator;
  const canManageAssignment = isAdmin || isProjectManager || isOwner || isCreator;

  /* ── Resolve display status ── */
  const resolvedStatus = (task as any).customStatusId
    ? (task.customStatus?.name || 'Custom')
    : (TASK_STATUS_CONFIG[task.status as TaskStatusValue]?.label || task.status);
  const resolvedStatusColor = statusDot[task.status] || 'bg-gray-400';

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

  /* ── subtask progress ── */
  const subtaskTotal = currentTaskSubtasks.length;
  const subtaskDone = currentTaskSubtasks.filter((s) => s.status === 'completed').length;
  const subtaskPercent = subtaskTotal > 0 ? Math.round((subtaskDone / subtaskTotal) * 100) : 0;

  /* ════════════════════════════════════════════════════════════ */
  /* ── RENDER ─────────────────────────────────────────────── */
  /* ════════════════════════════════════════════════════════════ */

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="" size="xl">
        {/* ── Compact header inside modal body ──────────────── */}
        <div className="mb-5">
          {/* Project breadcrumb */}
          <p className="text-xs text-text-muted mb-2 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${resolvedStatusColor}`} />
            {resolvedStatus}
            <span className="mx-1">·</span>
            {task.project?.name || 'Unknown Project'}
          </p>

          {/* Title (editable) */}
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="flex-1 text-xl font-bold bg-background border border-border rounded-lg px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
              <Button size="sm" onClick={handleSaveTitle}>
                <Save size={14} />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsEditingTitle(false)}>
                <X size={14} />
              </Button>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2 group">
              <h2 className="text-xl font-bold text-text-main leading-tight">{task.title}</h2>
              {canEdit && (
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-primary transition-all p-1 rounded-md hover:bg-primary/5"
                >
                  <Edit3 size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6 text-left">
          {/* ════════════════════════════════════ */}
          {/* ── LEFT: Main Content ──────────── */}
          {/* ════════════════════════════════════ */}
          <div className="flex-1 space-y-6 min-w-0">

            {/* ── Description ── */}
            <section>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Description</h4>
                {canEdit && (
                  <button
                    onClick={() => {
                      if (isEditingDescription) handleSaveDescription();
                      else setIsEditingDescription(true);
                    }}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary-hover font-medium transition-colors"
                  >
                    {isEditingDescription ? <Save size={13} /> : <Edit3 size={13} />}
                    {isEditingDescription ? 'Save' : 'Edit'}
                  </button>
                )}
              </div>
              <div className="bg-background/50 border border-border rounded-lg p-1 text-sm text-text-main min-h-[80px]">
                <RichTextEditor
                  content={isEditingDescription ? editedDescription : task.description || ''}
                  readOnly={!isEditingDescription}
                  onChange={setEditedDescription}
                />
              </div>
            </section>

            {/* ── Subtasks ── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <ListChecks size={14} /> Subtasks
                  {subtaskTotal > 0 && (
                    <span className="text-text-muted font-normal">
                      ({subtaskDone}/{subtaskTotal})
                    </span>
                  )}
                </h4>
              </div>

              {/* Progress bar */}
              {subtaskTotal > 0 && (
                <div className="mb-3">
                  <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${subtaskPercent}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1 mb-3">
                {currentTaskSubtasks.filter((s) => s && s.id).map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex items-center justify-between group py-1.5 px-2 hover:bg-background/50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={subtask.status === 'completed'}
                        onChange={(e) => handleSubtaskStatusChange(subtask.id, e.target.checked)}
                        className="w-4 h-4 text-primary border-border rounded focus:ring-primary cursor-pointer bg-background accent-primary"
                      />
                      <span className={`text-sm ${subtask.status === 'completed' ? 'text-text-muted line-through' : 'text-text-main'}`}>
                        {subtask.title}
                      </span>
                    </div>
                    <button
                      onClick={() => setDeleteConfirm({ isOpen: true, type: 'subtask', id: subtask.id })}
                      className="text-text-muted opacity-0 group-hover:opacity-100 hover:text-danger transition-opacity p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                {currentTaskSubtasks.length === 0 && (
                  <p className="text-sm text-text-muted py-2 pl-1">No subtasks yet.</p>
                )}
              </div>

              {canEdit && (
                <form onSubmit={handleCreateSubtask} className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Add a subtask..."
                    className="flex-1 text-sm px-3 py-1.5 border border-border rounded-lg bg-background text-text-main placeholder:text-text-muted/60 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Button type="submit" size="sm" disabled={!newSubtaskTitle.trim() || isSubmittingSubtask} className="px-2 h-auto">
                    <Plus size={16} />
                  </Button>
                </form>
              )}
            </section>

            {/* ── Dependencies ── */}
            <section>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <Link2 size={14} /> Dependencies
              </h4>
              <div className="space-y-2 mb-3">
                {dependencies.length > 0 ? (
                  dependencies.map((dep) => (
                    <div
                      key={dep.id}
                      className="flex items-center justify-between group p-2.5 bg-warning/5 border border-warning/15 rounded-lg hover:border-warning/30 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <AlertTriangle size={14} className="text-warning shrink-0" />
                        <div className="min-w-0">
                          <span className="text-sm text-text-main font-medium block truncate">
                            {dep.blockingTask?.title || 'Unknown task'}
                          </span>
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${dep.blockingTask?.status === 'completed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                            {dep.blockingTask?.status?.replace('_', ' ') || 'unknown'}
                          </span>
                        </div>
                      </div>
                      {canEdit && (
                        <button
                          onClick={() => handleRemoveDependency(dep.blockingTaskId)}
                          className="text-text-muted opacity-0 group-hover:opacity-100 hover:text-danger transition-opacity p-1"
                          title="Remove dependency"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-text-muted pl-1">No dependencies.</p>
                )}
              </div>
              {canEdit && (
                <div>
                  {showAddDep ? (
                    <div className="space-y-2 animate-fade-in-up">
                      <input
                        type="text"
                        value={depSearchTerm}
                        onChange={(e) => setDepSearchTerm(e.target.value)}
                        placeholder="Search tasks to add as blocker..."
                        className="w-full text-sm px-3 py-1.5 border border-border rounded-lg bg-background text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <div className="max-h-32 overflow-y-auto border border-border rounded-lg bg-background p-1 space-y-0.5 custom-scrollbar">
                        {projectTasks
                          .filter((t) => t.id !== taskId && !dependencies.some((d) => d.blockingTaskId === t.id))
                          .filter((t) => t.title.toLowerCase().includes(depSearchTerm.toLowerCase()))
                          .slice(0, 8)
                          .map((t) => (
                            <button
                              key={t.id}
                              onClick={() => handleAddDependency(t.id)}
                              className="w-full text-left flex items-center justify-between p-2 hover:bg-primary/5 rounded-md transition-colors text-sm"
                            >
                              <span className="text-text-main truncate">{t.title}</span>
                              <span className={`text-[10px] font-bold uppercase ml-2 shrink-0 px-1.5 py-0.5 rounded ${t.status === 'completed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                                {t.status.replace('_', ' ')}
                              </span>
                            </button>
                          ))}
                        {projectTasks.filter((t) => t.id !== taskId && !dependencies.some((d) => d.blockingTaskId === t.id)).length === 0 && (
                          <p className="text-xs text-center text-text-muted py-2">No available tasks</p>
                        )}
                      </div>
                      <button onClick={() => { setShowAddDep(false); setDepSearchTerm(''); }} className="text-xs text-text-muted hover:text-text-main">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddDep(true)}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary-hover font-medium transition-colors"
                    >
                      <Plus size={14} /> Add Blocker
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* ── Time Tracking ── */}
            <section>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <Clock size={14} /> Time Tracking
              </h4>

              <div className="flex flex-wrap gap-2 mb-4">
                {isRunningThisTask ? (
                  <Button variant="danger" size="sm" onClick={handleStopTimer} className="gap-1.5">
                    <Square size={13} fill="currentColor" /> Stop
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleStartTimer}
                    className="gap-1.5"
                    disabled={!!runningTimer || !canEdit}
                  >
                    <Play size={13} fill="currentColor" /> Start
                  </Button>
                )}
                <Button variant="secondary" size="sm" onClick={() => setShowManualLog(!showManualLog)} className="gap-1.5">
                  <Timer size={13} /> Manual
                </Button>
              </div>

              {showManualLog && (
                <form onSubmit={handleManualLog} className="bg-background/40 p-3 rounded-lg border border-border mb-4 animate-fade-in-up">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] uppercase font-bold text-text-muted mb-1 block">Mins</label>
                      <input
                        type="number"
                        value={manualDuration}
                        onChange={(e) => setManualDuration(e.target.value)}
                        placeholder="60"
                        className="w-full text-sm px-3 py-1.5 border border-border rounded-lg bg-background text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                      />
                    </div>
                    <div className="flex-[2]">
                      <label className="text-[10px] uppercase font-bold text-text-muted mb-1 block">Description</label>
                      <input
                        type="text"
                        value={manualDesc}
                        onChange={(e) => setManualDesc(e.target.value)}
                        placeholder="What did you do?"
                        className="w-full text-sm px-3 py-1.5 border border-border rounded-lg bg-background text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button type="submit" size="sm">Log</Button>
                    </div>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {taskTimeLogs.slice(0, 4).map((log: any) => (
                  <div key={log.id} className="flex flex-col p-2.5 bg-surface border border-border rounded-lg text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-text-main">{new Date(log.startTime).toLocaleDateString()}</span>
                      <span className="font-mono font-bold text-primary">{formatDuration(log.duration)}</span>
                    </div>
                    <span className="text-text-muted truncate">{log.description || 'No description'}</span>
                  </div>
                ))}
                {taskTimeLogs.length === 0 && (
                  <p className="text-sm text-text-muted col-span-2">No time logged yet.</p>
                )}
              </div>
              {taskTimeLogs.length > 4 && (
                <Link to="/pm/time-reports" className="text-xs text-primary hover:underline mt-2 block text-center">
                  View all time logs →
                </Link>
              )}
            </section>

            {/* ── Comments ── */}
            <section>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <MessageSquare size={14} /> Comments ({comments.length})
              </h4>

              <div className="space-y-3 mb-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2.5">
                    <Avatar name={comment.user.name} color={comment.user.avatarColor} size={28} />
                    <div className="flex-1 min-w-0">
                      <div className="bg-background border border-border rounded-lg rounded-tl-none p-3">
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <span className="text-xs font-semibold text-text-main">{comment.user.name}</span>
                          <span className="text-[10px] text-text-muted whitespace-nowrap">
                            {new Date(comment.createdAt).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-text-main whitespace-pre-wrap break-words">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-sm text-center text-text-muted py-4">No comments yet. Start the conversation!</p>
                )}
              </div>

              {/* Comment Input */}
              <form onSubmit={handlePostComment} className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newComment}
                    onChange={handleCommentChange}
                    placeholder="Write a comment... (use @ to mention)"
                    className="w-full text-sm px-3 py-2 border border-border rounded-lg bg-background text-text-main placeholder:text-text-muted/60 focus:outline-none focus:ring-1 focus:ring-primary"
                  />

                  {/* Mention Dropdown */}
                  {showMentionDropdown && currentProject?.members && (
                    <div className="absolute bottom-full left-0 mb-1 w-64 bg-surface border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto z-50 p-1 custom-scrollbar">
                      {currentProject.members
                        .filter((m) => m.user.name.toLowerCase().includes(mentionSearchTerm) && m.userId !== currentUser?.id)
                        .map((m) => (
                          <button
                            key={m.userId}
                            type="button"
                            onClick={() => handleMentionSelect(m)}
                            className="w-full text-left flex items-center gap-2 p-2 hover:bg-primary/5 rounded-md transition-colors"
                          >
                            <Avatar name={m.user.name} color={m.user.avatarColor} size={24} />
                            <span className="text-sm font-medium text-text-main">{m.user.name}</span>
                          </button>
                        ))}
                      {currentProject.members.filter((m) => m.user.name.toLowerCase().includes(mentionSearchTerm) && m.userId !== currentUser?.id).length === 0 && (
                        <p className="text-xs text-text-muted p-2 text-center">No team members found</p>
                      )}
                    </div>
                  )}
                </div>
                <Button type="submit" disabled={!newComment.trim() || isSubmittingComment} className="px-3">
                  <Send size={16} />
                </Button>
              </form>
            </section>
          </div>

          {/* ════════════════════════════════════ */}
          {/* ── RIGHT: Sidebar / Meta ────────── */}
          {/* ════════════════════════════════════ */}
          <div className="w-full lg:w-56 shrink-0 space-y-5">
            {/* Status */}
            <div>
              <CustomSelect
                label="Status"
                options={statusOptions}
                value={(task as any).customStatusId || task.status}
                onChange={handleStatusChange}
                disabled={!canEdit}
              />
            </div>

            {/* Priority */}
            <div>
              <CustomSelect
                label="Priority"
                options={priorityOptions}
                value={(task as any).customPriorityId || task.priority}
                onChange={handlePriorityChange}
                disabled={!canEdit}
              />
            </div>

            {/* Assignee */}
            <div>
              <span className="block text-sm font-medium text-text-main mb-1.5">Assignee</span>
              {canManageAssignment ? (
                <CustomSelect
                  options={[
                    { value: '', label: 'Unassigned', color: '#94a3b8' },
                    ...(currentProject?.members?.map((m) => ({
                      value: m.userId,
                      label: m.user.name,
                      color: m.user.avatarColor || '#3b82f6',
                    })) || []),
                  ]}
                  value={task.assignedTo || ''}
                  onChange={async (val) => {
                    try {
                      await dispatch(updateTask({ id: task.id, data: { assignedTo: val || null } as any })).unwrap();
                      toast.success('Assignee updated');
                    } catch (err: any) {
                      toast.error(err || 'Failed to update assignee');
                    }
                  }}
                />
              ) : task.assignee ? (
                <div className="flex items-center gap-2">
                  <Avatar name={task.assignee.name} color={task.assignee.avatarColor} size={24} />
                  <span className="text-sm font-medium text-text-main">{task.assignee.name}</span>
                </div>
              ) : (
                <span className="text-sm text-text-muted">Unassigned</span>
              )}
            </div>

            {/* Due Date */}
            <div>
              <span className="block text-sm font-medium text-text-main mb-1.5">Due Date</span>
              {canEdit ? (
                <input
                  type="date"
                  defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                  max={currentProject?.deadline ? new Date(currentProject.deadline).toISOString().split('T')[0] : undefined}
                  onChange={async (e) => {
                    const newVal = e.target.value;
                    try {
                      await dispatch(updateTask({ id: task.id, data: { dueDate: newVal || null } as any })).unwrap();
                      toast.success('Due date updated');
                    } catch (err: any) {
                      toast.error(err || 'Failed to update due date');
                    }
                  }}
                  className="w-full text-sm bg-surface border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                />
              ) : task.dueDate ? (
                <div className={`flex items-center gap-1.5 text-sm font-medium ${isOverdue ? 'text-danger' : 'text-text-main'}`}>
                  <Calendar size={14} className="text-text-muted" />
                  {new Date(task.dueDate).toLocaleDateString()}
                  {isOverdue && <Badge variant="red" className="text-[10px] px-1 py-0">Overdue</Badge>}
                </div>
              ) : (
                <span className="text-sm text-text-muted">Not set</span>
              )}
            </div>

            {/* Recurring */}
            <div>
              <span className="block text-sm font-medium text-text-main mb-1.5">Recurring</span>
              {canEdit ? (
                <CustomSelect
                  options={[
                    { value: '', label: 'No Recurrence', color: '#94a3b8' },
                    { value: 'daily', label: '🔄 Daily', color: '#3b82f6' },
                    { value: 'weekly', label: '🔄 Weekly', color: '#8b5cf6' },
                    { value: 'monthly', label: '🔄 Monthly', color: '#6366f1' },
                  ]}
                  value={task.recurringRule || ''}
                  onChange={async (val) => {
                    try {
                      await dispatch(updateTask({ id: task.id, data: { recurringRule: val || null } as any })).unwrap();
                      toast.success(val ? `Set to ${val} recurrence` : 'Recurrence removed');
                    } catch (err: any) {
                      toast.error(err || 'Failed to update recurrence');
                    }
                  }}
                />
              ) : (
                <span className="text-sm text-text-main">
                  {task.recurringRule ? (
                    <Badge variant="blue">🔄 {task.recurringRule.charAt(0).toUpperCase() + task.recurringRule.slice(1)}</Badge>
                  ) : (
                    <span className="text-text-muted">None</span>
                  )}
                </span>
              )}
            </div>

            {/* Created by */}
            <div className="pt-3 border-t border-border">
              <span className="block text-xs text-text-muted mb-1">Created by</span>
              <div className="flex items-center gap-2">
                <Avatar name={task.creator.name} color={task.creator.avatarColor} size={22} />
                <span className="text-xs font-medium text-text-main">{task.creator.name}</span>
              </div>
            </div>

            {/* Meta */}
            <div className="text-[11px] text-text-muted space-y-0.5">
              <p>Created {new Date(task.createdAt).toLocaleDateString()}</p>
              <p>Updated {new Date(task.updatedAt).toLocaleDateString()}</p>
            </div>

            {/* Delete */}
            {canDelete && (
              <div className="pt-3 border-t border-border">
                <button
                  onClick={() => setDeleteConfirm({ isOpen: true, type: 'task', id: task.id })}
                  className="w-full flex items-center justify-center gap-1.5 text-sm text-danger hover:bg-danger/5 py-2 rounded-lg font-medium transition-colors"
                >
                  <Trash2 size={14} /> Archive Task
                </button>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm?.isOpen || false}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={executeDelete}
        title={deleteConfirm?.type === 'task' ? 'Delete Task' : 'Delete Subtask'}
        message={
          deleteConfirm?.type === 'task'
            ? 'Are you sure you want to delete this task? This action cannot be undone.'
            : 'Are you sure you want to delete this subtask?'
        }
        confirmText="Delete"
      />
    </>
  );
};

export default TaskDetailModal;
