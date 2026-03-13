import React, { useEffect, useState, useRef } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Avatar from '../../components/Avatar';
import Badge from '../../components/ui/Badge';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { deleteTask, updateTaskStatus } from '../../store/slices/taskSlice';
import api from '../../services/api/axios';
import { Calendar, Paperclip, MessageSquare, Send, Trash2, Download } from 'lucide-react';
import type { Task, Comment, Attachment } from '../../types';
import { socketService } from '../../services/socket/socketService';

interface TaskDetailModalProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  projectId: string; // Ensure this is always passed
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ taskId, isOpen, onClose, projectId }) => {
  const dispatch = useAppDispatch();
  const { projectTasks } = useAppSelector((state) => state.tasks);
  const { currentProject } = useAppSelector((state) => state.projects);
  const { user: currentUser } = useAppSelector((state) => state.auth);

  const [comments, setComments] = useState<Comment[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const task = projectTasks.find((t) => t.id === taskId);

  useEffect(() => {
    if (isOpen && taskId && projectId) {
      fetchComments();
      fetchAttachments();

      // Socket integration
      socketService.connect();
      socketService.joinProject(projectId);

      const socket = socketService.socket;
      if (socket) {
        socket.on('comment:created', (data: { taskId: string; comment: Comment }) => {
          if (data.taskId === taskId) {
            setComments(prev => [...prev, data.comment]);
          }
        });

        socket.on('comment:deleted', (data: { taskId: string; commentId: string }) => {
          if (data.taskId === taskId) {
            setComments(prev => prev.filter(c => c.id !== data.commentId));
          }
        });

        socket.on('attachment:uploaded', (data: { taskId: string; attachment: Attachment }) => {
          if (data.taskId === taskId) {
            setAttachments(prev => [data.attachment, ...prev]);
          }
        });

        socket.on('attachment:deleted', (data: { taskId: string; attachmentId: string }) => {
          if (data.taskId === taskId) {
            setAttachments(prev => prev.filter(a => a.id !== data.attachmentId));
          }
        });
      }

      return () => {
        if (socket) {
          socket.off('comment:created');
          socket.off('comment:deleted');
          socket.off('attachment:uploaded');
          socket.off('attachment:deleted');
        }
      };
    }
  }, [isOpen, taskId, projectId]);

  const fetchComments = async () => {
    try {
      const { data } = await api.get(`/tasks/${taskId}/comments`);
      setComments(data.comments);
    } catch (err) {
      console.error('Failed to fetch comments', err);
    }
  };

  const fetchAttachments = async () => {
    try {
      const { data } = await api.get(`/tasks/${taskId}/attachments`);
      setAttachments(data.attachments);
    } catch (err) {
      console.error('Failed to fetch attachments', err);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !taskId) return;

    setIsSubmittingComment(true);
    try {
      await api.post(`/tasks/${taskId}/comments`, { content: newComment });
      setNewComment('');
      fetchComments(); // Reload comments
    } catch (err) {
      console.error('Failed to post comment', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !taskId) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      await api.post(`/tasks/${taskId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      fetchAttachments(); // Reload attachments
    } catch (err) {
       console.error('Failed to upload file', err);
       alert('Failed to upload file. Ensure it is < 5MB and a supported format.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
         fileInputRef.current.value = '';
      }
    }
  };

  const handleStatusChange = (newStatus: Task['status']) => {
    if (taskId) {
      dispatch(updateTaskStatus({ id: taskId, status: newStatus }));
    }
  };

  if (!task) return null;

  const isAdmin = currentUser?.role === 'admin';
  const isOwner = currentProject?.ownerId === currentUser?.id;
  const isAssignee = task.assignedTo === currentUser?.id;
  const isCreator = task.createdBy === currentUser?.id;
  const canEdit = isAdmin || isOwner || isAssignee || isCreator;
  const canDelete = isAdmin || isOwner || isCreator;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Task Details: ${task.title}`}>
       <div className="flex flex-col md:flex-row gap-6 text-left max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          
          {/* Main Content Area (Left) */}
          <div className="flex-1 space-y-6">
             
             {/* Description */}
             <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Description</h4>
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">
                   {task.description || <span className="text-gray-400 italic">No description provided.</span>}
                </div>
             </div>

             {/* Attachments */}
             <div>
                <div className="flex justify-between items-center mb-2">
                   <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                      <Paperclip size={14} /> Attachments
                   </h4>
                   <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                   >
                      {isUploading ? 'Uploading...' : 'Add File'}
                   </Button>
                   <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleFileUpload} 
                   />
                </div>
                
                {attachments.length > 0 ? (
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {attachments.map(att => (
                         <div key={att.id} className="flex items-center justify-between border border-gray-200 p-2 rounded-lg bg-white">
                            <div className="flex items-center gap-2 overflow-hidden">
                               <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded">
                                  <Paperclip size={14} />
                               </div>
                               <div className="truncate text-xs">
                                  <span className="block font-medium text-gray-900 truncate" title={att.fileName}>
                                    {att.fileName}
                                  </span>
                                  <span className="text-gray-500">{(att.fileSize / 1024).toFixed(1)} KB</span>
                               </div>
                            </div>
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               onClick={() => window.open(`/api/attachments/${att.id}/download`, '_blank')}
                               title="Download"
                               className="p-1 h-auto"
                            >
                               <Download size={14} />
                            </Button>
                         </div>
                      ))}
                   </div>
                ) : (
                   <p className="text-sm text-gray-500 italic">No attachments.</p>
                )}
             </div>

             {/* Comments */}
             <div>
                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-1 mb-3">
                   <MessageSquare size={14} /> Comments
                </h4>
                
                <div className="space-y-4 mb-4">
                   {comments.map(comment => (
                      <div key={comment.id} className="flex gap-3">
                         <Avatar name={comment.user.name} color={comment.user.avatarColor} size={28} />
                         <div className="flex-1">
                            <div className="bg-white border border-gray-200 rounded-lg rounded-tl-none p-3 shadow-sm">
                               <div className="flex justify-between items-start mb-1">
                                  <span className="text-xs font-semibold text-gray-900">{comment.user.name}</span>
                                  <span className="text-[10px] text-gray-500">
                                     {new Date(comment.createdAt).toLocaleString()}
                                  </span>
                               </div>
                               <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                            </div>
                         </div>
                      </div>
                   ))}
                   {comments.length === 0 && (
                      <p className="text-sm text-center text-gray-500 italic py-4">No comments yet.</p>
                   )}
                </div>

                {/* Comment Input */}
                <form onSubmit={handlePostComment} className="flex gap-2">
                   <div className="flex-1">
                      <input
                         type="text"
                         value={newComment}
                         onChange={(e) => setNewComment(e.target.value)}
                         placeholder="Write a comment..."
                         className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                   </div>
                   <Button type="submit" disabled={!newComment.trim() || isSubmittingComment} className="px-3">
                      <Send size={16} />
                   </Button>
                </form>
             </div>
          </div>

          {/* Sidebar / Meta Information (Right) */}
          <div className="w-full md:w-64 shrink-0 space-y-6 px-4 py-4 bg-gray-50 rounded-xl max-h-min border border-gray-100">
             
             <div>
                <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Status</span>
                <select 
                   className="w-full text-sm font-medium border-gray-300 rounded-lg py-1.5 focus:ring-indigo-500 disabled:opacity-75 disabled:bg-gray-100"
                   value={task.status}
                   onChange={(e) => handleStatusChange(e.target.value as Task['status'])}
                   disabled={!canEdit}
                >
                   <option value="pending">Pending</option>
                   <option value="ongoing">Ongoing</option>
                   <option value="in_review">In Review</option>
                   <option value="completed">Completed</option>
                </select>
             </div>

             <div>
                <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Priority</span>
                <Badge variant={task.priority === 'critical' ? 'red' : task.priority === 'high' ? 'amber' : task.priority === 'medium' ? 'blue' : 'gray'}>
                   {task.priority.toUpperCase()}
                </Badge>
             </div>

             <div>
                <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Assignee</span>
                {task.assignee ? (
                   <div className="flex items-center gap-2">
                      <Avatar name={task.assignee.name} color={task.assignee.avatarColor} size={24} />
                      <span className="text-sm font-medium text-gray-900">{task.assignee.name}</span>
                   </div>
                ) : (
                   <span className="text-sm text-gray-500 italic">Unassigned</span>
                )}
             </div>

             <div>
                <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Due Date</span>
                {task.dueDate ? (
                   <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                      <Calendar size={14} className="text-gray-400" />
                      {new Date(task.dueDate).toLocaleDateString()}
                   </div>
                ) : (
                   <span className="text-sm text-gray-500 italic">None set</span>
                )}
             </div>

             {/* Delete Task button for Admins/Owners/Creators */}
             {canDelete && (
                <div className="pt-4 mt-4 border-t border-gray-200">
                   <Button 
                      variant="ghost" 
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 justify-start"
                      onClick={() => {
                         if (window.confirm('Are you sure you want to delete this task?')) {
                            dispatch(deleteTask(task.id));
                            onClose();
                         }
                      }}
                      leftIcon={<Trash2 size={16} />}
                   >
                      Archive Task
                   </Button>
                </div>
             )}

          </div>
       </div>
    </Modal>
  );
};

export default TaskDetailModal;
