import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import CustomSelect from '../../components/ui/CustomSelect';
import type { SelectOption } from '../../components/ui/CustomSelect';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { createTask } from '../../store/slices/taskSlice';
import type { Project } from '../../types';
import { isAdminOrManager } from '../../constants/roles';
import toast from 'react-hot-toast';
import { RichTextEditor } from '../../components/ui/RichTextEditor';
import api from '../../services/api/axios';
import { 
  TASK_STATUS, 
  TASK_PRIORITY, 
} from '../../constants/statusConstants';
import { useWorkflowStatuses } from '../../hooks/useWorkflowStatuses';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  customStatusId: z.string().optional(),
  customPriorityId: z.string().optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  assignedTo: z.string().optional(),
  recurringRule: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

const recurringOptions: SelectOption[] = [
  { value: '', label: 'No Recurrence', color: '#94a3b8' },
  { value: 'daily', label: 'Daily', color: '#3b82f6' },
  { value: 'weekly', label: 'Weekly', color: '#8b5cf6' },
  { value: 'monthly', label: 'Monthly', color: '#6366f1' },
];

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
      status: TASK_STATUS.PENDING,
      priority: TASK_PRIORITY.MEDIUM,
      assignedTo: '',
      recurringRule: '',
      customStatusId: '',
      customPriorityId: '',
    },
  });

  const [customFields, setCustomFields] = React.useState<any[]>([]);
  const [customFieldValues, setCustomFieldValues] = React.useState<any[]>([]);

  const { statusOptions, priorityOptions, hasCustomWorkflow } = useWorkflowStatuses();

  useEffect(() => {
    api.get('/custom-fields?module=task').then((res: any) => {
      setCustomFields(res.data.fields || []);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (isOpen) {
      reset({
        status: hasCustomWorkflow ? '' : TASK_STATUS.PENDING,
        priority: hasCustomWorkflow ? '' : TASK_PRIORITY.MEDIUM,
        customStatusId: hasCustomWorkflow ? (statusOptions[0]?.value || '') : '',
        customPriorityId: hasCustomWorkflow ? (priorityOptions[0]?.value || '') : '',
        assignedTo: '',
        title: '',
        description: '',
        dueDate: '',
        recurringRule: '',
      });
      setCustomFieldValues([]);
    }
  }, [isOpen, reset, statusOptions, priorityOptions, hasCustomWorkflow]);

  const handleCustomFieldChange = (fieldId: string, value: any, fieldType: string) => {
    const existingIndex = customFieldValues.findIndex(v => v.fieldDefId === fieldId);
    const newVal = { fieldDefId: fieldId } as any;
    
    if (fieldType === 'number') newVal.valueNumber = Number(value);
    else if (fieldType === 'date') newVal.valueDate = value;
    else if (fieldType === 'checkbox') newVal.valueBoolean = value;
    else newVal.valueText = value;

    if (existingIndex >= 0) {
      const newVals = [...customFieldValues];
      newVals[existingIndex] = newVal;
      setCustomFieldValues(newVals);
    } else {
      setCustomFieldValues([...customFieldValues, newVal]);
    }
  };

  const onSubmit = async (data: TaskFormValues) => {
    // Important: Determine if we are sending standard or custom fields
    const payload = {
      ...data,
      assignedTo: data.assignedTo || undefined,
      recurringRule: data.recurringRule || undefined,
      // If NOT using custom workflow, the values are strings like 'pending'
      // These should go in status/priority, NOT customStatusId/customPriorityId (which are UUIDs)
      status: !hasCustomWorkflow ? (data.customStatusId || data.status) : undefined,
      priority: !hasCustomWorkflow ? (data.customPriorityId || data.priority) : undefined,
      customStatusId: (hasCustomWorkflow && data.customStatusId) ? data.customStatusId : undefined,
      customPriorityId: (hasCustomWorkflow && data.customPriorityId) ? data.customPriorityId : undefined,
    };

    const action = await dispatch(createTask({ projectId: project.id, data: payload as any }));
    if (createTask.fulfilled.match(action)) {
      const taskId = (action.payload as any).id;
      if (customFieldValues.length > 0 && taskId) {
        try {
          await api.post(`/custom-fields/values/${taskId}`, { values: customFieldValues });
        } catch (e) {
          console.error('Failed to save custom fields', e);
        }
      }
      toast.success('Task created successfully');
      onClose();
    } else if (createTask.rejected.match(action)) {
      toast.error(action.payload as string || 'Failed to create task');
    }
  };

  const isAdmin = isAdminOrManager(currentUser?.role);
  const isProjectManager = project.members?.some(m => m.userId === currentUser?.id && m.isProjectManager);
  const isOwner = project.ownerId === currentUser?.id;
  const canAssignToOthers = isAdmin || isOwner || isProjectManager;

  // Build assignee options
  const assigneeOptions: SelectOption[] = [
    { value: '', label: 'Unassigned', color: '#94a3b8' },
    { value: currentUser?.id || '', label: 'Assign to me', color: '#6366f1' },
  ];

  if (canAssignToOthers) {
    project.members.forEach((member) => {
      if (member.userId !== currentUser?.id) {
        assigneeOptions.push({
          value: member.userId,
          label: member.user.name,
          color: (member.user as any).avatarColor || '#3b82f6',
        });
      }
    });
  } else {
    // For employees, they can only assign to themselves. 
    // They must assign it to themselves if they create it (according to user request "assign to me only")
    // We remove the "Unassigned" option for them to enforce self-assignment.
    assigneeOptions.shift(); 
  }


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
          <label className="block text-sm font-medium text-text-main mb-1">Description</label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                content={field.value || ''}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            name="customStatusId"
            control={control}
            render={({ field }) => (
              <CustomSelect
                label="Status"
                options={statusOptions}
                value={field.value || statusOptions[0]?.value || ''}
                onChange={field.onChange}
                error={errors.customStatusId?.message}
              />
            )}
          />
          <Controller
            name="customPriorityId"
            control={control}
            render={({ field }) => (
              <CustomSelect
                label="Priority"
                options={priorityOptions}
                value={field.value || priorityOptions[0]?.value || ''}
                onChange={field.onChange}
                error={errors.customPriorityId?.message}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input 
            type="date" 
            label="Due Date" 
            error={errors.dueDate?.message}
            {...register('dueDate')} 
            max={project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : undefined}
          />
          <Controller
            name="assignedTo"
            control={control}
            render={({ field }) => (
              <CustomSelect
                label="Assignee"
                options={assigneeOptions}
                value={field.value || ''}
                onChange={field.onChange}
                disabled={!canAssignToOthers && !!field.value && field.value !== currentUser?.id}
              />
            )}
          />
          {!canAssignToOthers && (
            <p className="mt-1 text-xs text-text-muted sm:col-span-2">You can only assign tasks to yourself.</p>
          )}
        </div>

        {customFields.length > 0 && (
          <div className="pt-4 border-t border-border mt-4">
            <h4 className="text-sm font-semibold mb-3 text-text-main">Custom Fields</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {customFields.map(cf => (
                <div key={cf.id} className="col-span-1">
                  {cf.fieldType === 'text' || cf.fieldType === 'url' ? (
                     <div>
                       <label className="block text-sm font-medium mb-1 text-text-main">{cf.fieldName} {cf.isRequired && '*'}</label>
                       <input 
                         type="text" 
                         required={cf.isRequired}
                         className="w-full p-2 border rounded border-border bg-background focus:ring-1 focus:ring-primary"
                         onChange={(e) => handleCustomFieldChange(cf.id, e.target.value, cf.fieldType)}
                       />
                     </div>
                  ) : cf.fieldType === 'number' ? (
                    <div>
                       <label className="block text-sm font-medium mb-1 text-text-main">{cf.fieldName} {cf.isRequired && '*'}</label>
                       <input 
                         type="number" 
                         required={cf.isRequired}
                         className="w-full p-2 border rounded border-border bg-background focus:ring-1 focus:ring-primary"
                         onChange={(e) => handleCustomFieldChange(cf.id, e.target.value, cf.fieldType)}
                       />
                     </div>
                  ) : cf.fieldType === 'date' ? (
                    <div>
                       <label className="block text-sm font-medium mb-1 text-text-main">{cf.fieldName} {cf.isRequired && '*'}</label>
                       <input 
                         type="date" 
                         required={cf.isRequired}
                         className="w-full p-2 border rounded border-border bg-background focus:ring-1 focus:ring-primary"
                         onChange={(e) => handleCustomFieldChange(cf.id, e.target.value, cf.fieldType)}
                       />
                     </div>
                  ) : cf.fieldType === 'dropdown' ? (
                    <div>
                       <label className="block text-sm font-medium mb-1 text-text-main">{cf.fieldName} {cf.isRequired && '*'}</label>
                       <select 
                         required={cf.isRequired}
                         className="w-full p-2 border rounded border-border bg-background focus:ring-1 focus:ring-primary"
                         onChange={(e) => handleCustomFieldChange(cf.id, e.target.value, cf.fieldType)}
                       >
                         <option value="">Select option...</option>
                         {Array.isArray(cf.options) && cf.options.map((opt: string) => (
                           <option key={opt} value={opt}>{opt}</option>
                         ))}
                       </select>
                     </div>
                  ) : cf.fieldType === 'checkbox' ? (
                    <div className="flex flex-col justify-end h-full py-1">
                       <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-text-main">
                         <input 
                           type="checkbox" 
                           required={cf.isRequired}
                           className="w-4 h-4 text-primary rounded border-border bg-background"
                           onChange={(e) => handleCustomFieldChange(cf.id, e.target.checked, cf.fieldType)}
                         />
                         {cf.fieldName} {cf.isRequired && '*'}
                       </label>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}

        <Controller
          name="recurringRule"
          control={control}
          render={({ field }) => (
            <CustomSelect
              label="Recurring"
              options={recurringOptions}
              value={field.value || ''}
              onChange={field.onChange}
            />
          )}
        />
        {/* Note about recurring */}
        {/* Intentionally blank line if no recurring selected */}

        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-border">
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
