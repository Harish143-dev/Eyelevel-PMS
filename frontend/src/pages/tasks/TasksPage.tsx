import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchMyTasks, updateTaskStatus } from '../../store/slices/taskSlice';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Calendar, AlertCircle, Search, MessageSquare, Paperclip, CheckSquare } from 'lucide-react';
import type { Task } from '../../types';
import TaskDetailModal from '../projects/TaskDetailModal';

const priorityToBadge = {
  low: 'gray',
  medium: 'blue',
  high: 'amber',
  critical: 'red',
} as const;

const TasksPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tasks, isLoading } = useAppSelector((state) => state.tasks);
  
  const [filter, setFilter] = useState<'all' | 'pending' | 'ongoing' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<{id: string, projectId: string} | null>(null);

  useEffect(() => {
    dispatch(fetchMyTasks());
  }, [dispatch]);

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    dispatch(updateTaskStatus({ id: taskId, status: newStatus }));
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'pending' ? task.status === 'pending' :
      filter === 'ongoing' ? (task.status === 'ongoing' || task.status === 'in_review') :
      task.status === 'completed';
    
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.project?.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const stats = {
    pending: tasks.filter(t => t.status === 'pending').length,
    ongoing: tasks.filter(t => t.status === 'ongoing' || t.status === 'in_review').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
          <p className="mt-1 text-gray-600">
            You have <span className="font-semibold text-indigo-600">{stats.ongoing}</span> active tasks across all projects.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search tasks or projects..."
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none w-full sm:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex bg-gray-100 p-1 rounded-xl space-x-1">
            {(['all', 'pending', 'ongoing', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  filter === f
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {f.toUpperCase()} 
                {f !== 'all' && (
                  <span className="ml-1.5 opacity-50 px-1">
                    {f === 'ongoing' ? stats.ongoing : f === 'pending' ? stats.pending : stats.completed}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading && tasks.length === 0 ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-20 bg-white border border-dashed border-gray-300 rounded-3xl">
          <CheckSquare size={48} className="mx-auto text-gray-200 mb-4" />
          <h3 className="text-lg font-bold text-gray-900">No tasks found</h3>
          <p className="mt-1 text-gray-500">
            {searchQuery ? "No tasks match your search." : "You're all caught up! No tasks here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTasks.map((task) => {
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
            
            return (
              <Card 
                key={task.id} 
                className="flex flex-col h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer border-transparent hover:border-indigo-100"
                onClick={() => setSelectedTask({ id: task.id, projectId: task.projectId })}
              >
                <CardHeader className="pb-3 border-none flex-none relative">
                   <div className="flex justify-between items-start mb-3">
                    <Badge variant={priorityToBadge[task.priority]}>
                      {task.priority.toUpperCase()}
                    </Badge>
                     <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-full uppercase tracking-tighter truncate max-w-[120px]">
                      {task.project?.name}
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors">
                    {task.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-0 flex-1 flex flex-col pt-2">
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                    {task.description || <span className="italic opacity-50">No description</span>}
                  </p>
                  
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest mt-auto border-t border-gray-50 pt-4 mb-2">
                    <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                      {isOverdue ? <AlertCircle size={14} /> : <Calendar size={14} />}
                      <span>
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'NO DEADLINE'}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="py-3 px-4 flex items-center justify-between bg-gray-50/50 group-hover:bg-indigo-50/30 transition-colors">
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <select 
                      className="text-[10px] font-bold uppercase border-none bg-white shadow-sm ring-1 ring-gray-200 rounded-lg py-1 px-2 focus:ring-indigo-500 cursor-pointer"
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value as Task['status'])}
                    >
                      <option value="pending">Pending</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="in_review">In Review</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-gray-400" title="Comments">
                       <MessageSquare size={12} />
                       <span className="text-[10px] font-bold">{task._count?.comments || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400" title="Attachments">
                       <Paperclip size={12} />
                       <span className="text-[10px] font-bold">{task._count?.attachments || 0}</span>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

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
