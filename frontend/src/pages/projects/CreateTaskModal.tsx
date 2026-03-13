import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { createTask } from '../../store/slices/taskSlice';
import type { Project } from '../../types';

const taskSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  status: z.enum(['pending', 'ongoing', 'in_review', 'completed']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  dueDate: z.string().optional(),
  assignedTo: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, project }) => {
  const dispatch = useAppDispatch();
  const { user: currentUser } = useAppSelector((state) => state.auth);
  
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      status: 'pending',
      priority: 'medium',
      assignedTo: '',
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      reset({
        status: 'pending',
        priority: 'medium',
        assignedTo: '', // default to unassigned
        title: '',
        description: '',
        dueDate: '',
      });
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: TaskFormValues) => {
    // If empty string for assignedTo, send undefined
    const payload = {
      ...data,
      assignedTo: data.assignedTo || undefined,
    };

    const action = await dispatch(createTask({ projectId: project.id, data: payload }));
    if (createTask.fulfilled.match(action)) {
      onClose();
    }
  };

  const isAdmin = currentUser?.role === 'admin';
  const isOwner = project.ownerId === currentUser?.id;
  const canAssignToOthers = isAdmin || isOwner;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Task">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
        <Input
          label="Task Title"
          placeholder="e.g., Design Landing Page"
          {...register('title')}
          error={errors.title?.message}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            {...register('description')}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            rows={3}
            placeholder="Detailed description of the task..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              {...register('status')}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="pending">Pending</option>
              <option value="ongoing">Ongoing</option>
              <option value="in_review">In Review</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              {...register('priority')}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input type="date" label="Due Date" {...register('dueDate')} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
            <Controller
              name="assignedTo"
              control={control}
              render={({ field }) => (
                <select
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={field.value || ''}
                  onChange={field.onChange}
                  disabled={!canAssignToOthers && !!field.value && field.value !== currentUser?.id} 
                >
                  <option value="">Unassigned</option>
                  
                  {/* Allow assigning to self always */}
                  <option value={currentUser?.id}>Assign to me</option>
                  
                  {/* Admins/Owners can assign to anyone in the project */}
                  {canAssignToOthers && project.members.map((member) => {
                    if (member.userId === currentUser?.id) return null; // already handled
                    return (
                      <option key={member.userId} value={member.userId}>
                        {member.user.name}
                      </option>
                    );
                  })}
                </select>
              )}
            />
            {!canAssignToOthers && (
              <p className="mt-1 text-xs text-gray-500">You can only assign tasks to yourself.</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateTaskModal;
