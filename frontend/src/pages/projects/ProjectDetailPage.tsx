import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchProjectById, updateProject } from '../../store/slices/projectSlice';
import { Card, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/Avatar';
import { Calendar, Users, Target, ArrowLeft, Settings, Plus } from 'lucide-react';
import KanbanBoard from '../../components/kanban/KanbanBoard';
import { fetchProjectTasks, updateTaskPosition } from '../../store/slices/taskSlice';
import { socketService } from '../../services/socket/socketService';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { useForm } from 'react-hook-form';
import CreateTaskModal from './CreateTaskModal';
import TaskDetailModal from './TaskDetailModal';

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { currentProject: project, isLoading: isProjectLoading } = useAppSelector((state) => state.projects);
  const { projectTasks, isLoading: isTasksLoading } = useAppSelector((state) => state.tasks);
  const { user: currentUser } = useAppSelector((state) => state.auth);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      dispatch(fetchProjectById(id));
      dispatch(fetchProjectTasks(id));

      // Connect to socket for real-time updates
      socketService.connect();
      socketService.joinProject(id);
    }
    return () => {
      if (id) {
        socketService.leaveProject(id);
      }
    };
  }, [id, dispatch]);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: project?.name || '',
      description: project?.description || '',
      status: project?.status || 'planning',
    },
  });

  // Re-sync form when project loads
  useEffect(() => {
    if (project) {
      reset({
        name: project.name,
        description: project.description || '',
        status: project.status,
      });
    }
  }, [project, reset]);

  const onEditSubmit = async (data: any) => {
    if (id) {
      const action = await dispatch(updateProject({ id, data }));
      if (updateProject.fulfilled.match(action)) {
        setIsEditModalOpen(false);
      }
    }
  };

  if ((isProjectLoading && !project) || isTasksLoading || !project) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statusColors = {
    planning: 'gray',
    in_progress: 'blue',
    completed: 'green',
    on_hold: 'amber',
  } as const;

  return (
    <div className="space-y-6 text-left">
      {/* Header section */}
      <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
        <Link to="/projects" className="flex items-center hover:text-gray-900 transition-colors">
          <ArrowLeft size={16} className="mr-1" /> Back to Projects
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <Badge variant={statusColors[project.status]}>
              {project.status.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-gray-600 max-w-3xl whitespace-pre-wrap">
            {project.description || 'No description provided.'}
          </p>
        </div>

        {currentUser?.role === 'admin' && (
          <Button variant="secondary" onClick={() => setIsEditModalOpen(true)} leftIcon={<Settings size={18} />}>
            Project Settings
          </Button>
        )}
      </div>

      {/* Progress & Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardContent className="h-full flex flex-col justify-center">
            <div className="flex justify-between items-end mb-2">
              <div>
                <span className="block text-sm font-medium text-gray-500 mb-1">Overall Progress</span>
                <span className="text-2xl font-bold text-gray-900">{project.progress}%</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-gray-900">{project.completedTasks}</span>
                <span className="text-sm text-gray-500"> / {project.totalTasks} tasks completed</span>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  project.progress === 100 ? 'bg-green-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Target size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Project Owner</p>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar name={project.owner.name} color={project.owner.avatarColor} size={20} />
                  <span className="text-sm font-medium text-gray-900">{project.owner.name}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Timeline</p>
                <div className="text-sm font-medium text-gray-900 mt-1">
                  {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'} -{' '}
                  {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Team Members</p>
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  {project.members?.map((m) => (
                    <div key={m.userId} title={m.user.name}>
                       <Avatar name={m.user.name} color={m.user.avatarColor} size={24} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task List / Kanban Board */}
      <div className="mt-8 flex-1 overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Project Tasks</h2>
          <Button 
            onClick={() => setIsCreateTaskModalOpen(true)} 
            leftIcon={<Plus size={16} />}
          >
            New Task
          </Button>
        </div>
        
        <div className="h-[600px] bg-white border border-gray-200 rounded-xl overflow-hidden p-4 overflow-x-auto">
          <KanbanBoard 
            tasks={projectTasks} 
            onTaskMove={(taskId, newStatus, newPosition) => {
              dispatch(updateTaskPosition({ id: taskId, status: newStatus, position: newPosition }));
            }} 
            onTaskClick={(task) => {
              setSelectedTaskId(task.id);
            }} 
          />
        </div>
      </div>

      <CreateTaskModal 
        isOpen={isCreateTaskModalOpen} 
        onClose={() => setIsCreateTaskModalOpen(false)} 
        project={project}
      />

      <TaskDetailModal 
        isOpen={Boolean(selectedTaskId)} 
        onClose={() => setSelectedTaskId(null)} 
        taskId={selectedTaskId}
        projectId={project.id}
      />

      {/* Admin Edit Modal */}
      {currentUser?.role === 'admin' && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Project Settings"
        >
          <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4">
            <Input label="Project Name" {...register('name')} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                {...register('description')}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                {...register('status')}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="planning">Planning</option>
                <option value="in_progress">In Progress</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ProjectDetailPage;
