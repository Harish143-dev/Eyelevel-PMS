import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchProjects, createProject, deleteProject } from '../../store/slices/projectSlice';
import { fetchUsers } from '../../store/slices/userSlice';
import Button from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Avatar from '../../components/Avatar';
import { Plus, CheckSquare, Trash2, Users } from 'lucide-react';
import type { Project } from '../../types';

const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name is required'),
  description: z.string().optional(),
  startDate: z.string().optional(),
  deadline: z.string().optional(),
  memberIds: z.array(z.string()).optional(),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

const ProjectsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { projects, isLoading } = useAppSelector((state) => state.projects);
  const { users } = useAppSelector((state) => state.users);
  const { user: currentUser } = useAppSelector((state) => state.auth);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchProjects());
    // Fetch users for the member selection dropdown if admin
    if (currentUser?.role === 'admin') {
      dispatch(fetchUsers());
    }
  }, [dispatch, currentUser?.role]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { memberIds: [] },
  });

  const onSubmitCreate = async (data: CreateProjectForm) => {
    const action = await dispatch(createProject({ ...data, memberIds: data.memberIds || [] }));
    if (createProject.fulfilled.match(action)) {
      setIsCreateModalOpen(false);
      reset();
    }
  };

  const handleDelete = (e: React.MouseEvent, project: Project) => {
    e.preventDefault();
    if (window.confirm(`Are you sure you want to delete project "${project.name}"? This action cannot be undone.`)) {
      dispatch(deleteProject(project.id));
    }
  };

  const statusColors = {
    planning: 'gray',
    in_progress: 'blue',
    completed: 'green',
    on_hold: 'amber',
  } as const;

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {currentUser?.role === 'admin' ? 'All Projects' : 'My Projects'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of project statuses and progress.
          </p>
        </div>
        {currentUser?.role === 'admin' && (
          <Button onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus size={18} />}>
            New Project
          </Button>
        )}
      </div>

      {isLoading && projects.length === 0 ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-xl">
          <FolderKanban size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No projects found</h3>
          <p className="mt-1 text-gray-500">
            {currentUser?.role === 'admin'
              ? 'Get started by creating a new project.'
              : "You haven't been assigned to any projects yet."}
          </p>
          {currentUser?.role === 'admin' && (
            <Button onClick={() => setIsCreateModalOpen(true)} className="mt-4">
              Create Project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`} className="block group">
              <Card className="h-full transition-all hover:shadow-md hover:border-indigo-300 flex flex-col">
                <CardHeader className="pb-3 border-none flex-none relative">
                  <div className="flex justify-between items-start">
                    <Badge variant={statusColors[project.status]}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                    {currentUser?.role === 'admin' && (
                      <button
                        onClick={(e) => handleDelete(e, project)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Project"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <CardTitle className="mt-3 group-hover:text-indigo-600 transition-colors">
                    {project.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 min-h-[40px]">
                    {project.description || 'No description provided.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-0 flex-1 flex flex-col justify-end">
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                      <span>Progress</span>
                      <span className="font-medium text-gray-900">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          project.progress === 100 ? 'bg-green-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="py-3 flex items-center justify-between text-xs text-gray-500 flex-none">
                  <div className="flex items-center gap-1.5">
                    <CheckSquare size={14} />
                    <span>
                      {project.completedTasks}/{project.totalTasks} tasks
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users size={14} />
                    <span>{project.members?.length || 0} members</span>
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {currentUser?.role === 'admin' && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            reset();
          }}
          title="Create New Project"
        >
          <form onSubmit={handleSubmit(onSubmitCreate)} className="space-y-4 text-left">
            <Input
              label="Project Name"
              placeholder="e.g., Website Redesign"
              {...register('name')}
              error={errors.name?.message}
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                {...register('description')}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
                placeholder="Briefly describe what this project is about..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                label="Start Date"
                {...register('startDate')}
              />
              <Input
                type="date"
                label="Deadline"
                {...register('deadline')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign Members</label>
              <Controller
                name="memberIds"
                control={control}
                render={({ field }) => (
                  <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto bg-gray-50 p-2 space-y-1">
                    {users
                      .filter((u) => u.isActive && u.id !== currentUser?.id)
                      .map((user) => (
                        <label key={user.id} className="flex items-center p-2 hover:bg-white rounded-md cursor-pointer transition-colors border border-transparent hover:border-gray-200">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 mr-3"
                            checked={field.value?.includes(user.id)}
                            onChange={(e) => {
                              const updated = e.target.checked
                                ? [...(field.value || []), user.id]
                                : (field.value || []).filter((id) => id !== user.id);
                              field.onChange(updated);
                            }}
                          />
                          <Avatar name={user.name} color={user.avatarColor} size={24} />
                          <span className="ml-2 text-sm text-gray-700">{user.name}</span>
                        </label>
                      ))}
                    {users.filter((u) => u.isActive && u.id !== currentUser?.id).length === 0 && (
                      <p className="text-sm text-gray-500 p-2 text-center">No other active users available.</p>
                    )}
                  </div>
                )}
              />
              <p className="mt-1 text-xs text-gray-500">You act as the owner and are automatically included.</p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Create Project
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// Also import FolderKanban at the top
import { FolderKanban } from 'lucide-react';

export default ProjectsPage;
