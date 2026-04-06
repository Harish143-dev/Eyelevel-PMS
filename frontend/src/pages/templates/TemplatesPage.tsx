import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchTemplates, createTemplate, deleteTemplate } from '../../store/slices/templateSlice';
import type { TemplateTask, TemplateMilestone } from '../../store/slices/templateSlice';
import { FileStack, Plus, Trash2, ChevronDown, ChevronUp, ListChecks, Flag } from 'lucide-react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import toast from 'react-hot-toast';
import { isAdminOrManager } from '../../constants/roles';

const TemplatesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { templates, isLoading } = useAppSelector((state) => state.templates);
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = isAdminOrManager(user?.role);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tasks, setTasks] = useState<TemplateTask[]>([{ title: '', priority: 'medium' }]);
  const [milestones, setMilestones] = useState<TemplateMilestone[]>([]);

  useEffect(() => {
    dispatch(fetchTemplates());
  }, [dispatch]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setCategory('');
    setTasks([{ title: '', priority: 'medium' }]);
    setMilestones([]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Template name is required');
      return;
    }

    const validTasks = tasks.filter((t) => t.title.trim());
    const validMilestones = milestones.filter((m) => m.title.trim());

    try {
      await dispatch(
        createTemplate({
          name: name.trim(),
          description: description.trim() || undefined,
          category: category.trim() || undefined,
          tasks: validTasks,
          milestones: validMilestones,
        })
      ).unwrap();
      toast.success('Template created');
      setIsCreateOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err || 'Failed to create template');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await dispatch(deleteTemplate(id)).unwrap();
      toast.success('Template deleted');
    } catch (err: any) {
      toast.error(err || 'Failed to delete template');
    }
  };

  const addTaskRow = () => setTasks([...tasks, { title: '', priority: 'medium' }]);
  const removeTaskRow = (i: number) => setTasks(tasks.filter((_, idx) => idx !== i));
  const updateTask = (i: number, field: keyof TemplateTask, value: string) => {
    const updated = [...tasks];
    (updated[i] as any)[field] = value;
    setTasks(updated);
  };

  const addMilestoneRow = () => setMilestones([...milestones, { title: '' }]);
  const removeMilestoneRow = (i: number) => setMilestones(milestones.filter((_, idx) => idx !== i));
  const updateMilestone = (i: number, field: keyof TemplateMilestone, value: string) => {
    const updated = [...milestones];
    (updated[i] as any)[field] = value;
    setMilestones(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-left gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
            <FileStack className="text-primary" size={24} />
            Project Templates
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Reusable blueprints to spin up new projects faster.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsCreateOpen(true)} leftIcon={<Plus size={18} />}>
            New Template
          </Button>
        )}
      </div>

      {/* Template Cards */}
      {isLoading && templates.length === 0 ? (
        <div className="flex justify-center p-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <Card className="shadow-sm border-border">
          <CardContent className="py-16 text-center text-text-muted">
            <FileStack size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium mb-1">No templates yet</p>
            <p className="text-sm">Create your first template to speed up project creation.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((tmpl) => {
            const isExpanded = expandedId === tmpl.id;
            const taskList = Array.isArray(tmpl.tasks) ? tmpl.tasks : [];
            const milestoneList = Array.isArray(tmpl.milestones) ? tmpl.milestones : [];

            return (
              <Card key={tmpl.id} className="shadow-sm border-border hover:shadow-md transition-shadow">
                <CardContent className="py-5">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-text-main text-lg">{tmpl.name}</h3>
                        {tmpl.category && <Badge variant="indigo">{tmpl.category}</Badge>}
                      </div>
                      {tmpl.description && (
                        <p className="text-sm text-text-muted mt-1 line-clamp-2">{tmpl.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <ListChecks size={14} /> {taskList.length} task{taskList.length !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Flag size={14} /> {milestoneList.length} milestone{milestoneList.length !== 1 ? 's' : ''}
                        </span>
                        <span>Created {new Date(tmpl.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : tmpl.id)}
                        className="p-2 rounded-lg text-text-muted hover:bg-background hover:text-text-main transition-colors"
                        title="Toggle details"
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(tmpl.id)}
                          className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                          title="Delete template"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border grid md:grid-cols-2 gap-6">
                      {/* Tasks */}
                      <div>
                        <h4 className="text-sm font-semibold text-text-main mb-2 flex items-center gap-1.5">
                          <ListChecks size={14} className="text-primary" /> Default Tasks
                        </h4>
                        {taskList.length === 0 ? (
                          <p className="text-xs text-text-muted italic">No default tasks</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {taskList.map((t: any, i: number) => (
                              <li key={i} className="flex items-center gap-2 text-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                <span className="text-text-main">{t.title}</span>
                                <Badge
                                  variant={
                                    t.priority === 'critical'
                                      ? 'red'
                                      : t.priority === 'high'
                                      ? 'amber'
                                      : t.priority === 'medium'
                                      ? 'indigo'
                                      : 'gray'
                                  }
                                >
                                  {t.priority}
                                </Badge>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      {/* Milestones */}
                      <div>
                        <h4 className="text-sm font-semibold text-text-main mb-2 flex items-center gap-1.5">
                          <Flag size={14} className="text-warning" /> Default Milestones
                        </h4>
                        {milestoneList.length === 0 ? (
                          <p className="text-xs text-text-muted italic">No default milestones</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {milestoneList.map((m: any, i: number) => (
                              <li key={i} className="flex items-center gap-2 text-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0" />
                                <span className="text-text-main">{m.title}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Template Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => { setIsCreateOpen(false); resetForm(); }} title="Create Project Template">
        <form onSubmit={handleCreate} className="space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
          <Input
            label="Template Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Standard Sprint Project"
            required
          />
          <div>
            <label className="block text-sm font-medium text-text-main mb-1">Description</label>
            <textarea
              className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              rows={2}
              placeholder="What is this template for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <Input
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Development, Design"
          />

          {/* Tasks Builder */}
          <div>
            <label className="block text-sm font-semibold text-text-main mb-2">Default Tasks</label>
            <div className="space-y-2">
              {tasks.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={`Task ${i + 1} title`}
                    value={t.title}
                    onChange={(e) => updateTask(i, 'title', e.target.value)}
                  />
                  <select
                    className="bg-background border border-border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={t.priority}
                    onChange={(e) => updateTask(i, 'priority', e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                  {tasks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTaskRow(i)}
                      className="p-1.5 rounded text-text-muted hover:text-danger transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addTaskRow}
              className="mt-2 text-xs text-primary font-medium hover:underline"
            >
              + Add another task
            </button>
          </div>

          {/* Milestones Builder */}
          <div>
            <label className="block text-sm font-semibold text-text-main mb-2">Default Milestones</label>
            {milestones.length === 0 ? (
              <p className="text-xs text-text-muted italic mb-1">No milestones added yet.</p>
            ) : (
              <div className="space-y-2">
                {milestones.map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder={`Milestone ${i + 1} title`}
                      value={m.title}
                      onChange={(e) => updateMilestone(i, 'title', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeMilestoneRow(i)}
                      className="p-1.5 rounded text-text-muted hover:text-danger transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={addMilestoneRow}
              className="mt-2 text-xs text-primary font-medium hover:underline"
            >
              + Add milestone
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="secondary" onClick={() => { setIsCreateOpen(false); resetForm(); }} type="button">
              Cancel
            </Button>
            <Button type="submit">Create Template</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TemplatesPage;
