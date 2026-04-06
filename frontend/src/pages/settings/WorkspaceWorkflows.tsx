import React, { useState, useEffect } from 'react';
import api from '../../services/api/axios';
import { Card, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { Edit3, Save, X, Trash2, Plus } from 'lucide-react';
import { invalidateWorkflowCache } from '../../hooks/useWorkflowStatuses';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import CustomSelect from '../../components/ui/CustomSelect';

const inputClass = "w-full text-sm px-3 py-2 bg-surface border border-border rounded-lg text-text-main focus:outline-none focus:ring-1 focus:ring-primary";

const STANDARD_STATUS_OPTIONS = [
  { value: 'pending', label: 'To Do (Pending)', color: '#94a3b8' },
  { value: 'ongoing', label: 'In Progress (Ongoing)', color: '#3b82f6' },
  { value: 'in_review', label: 'Review (In Review)', color: '#f59e0b' },
  { value: 'completed', label: 'Done (Completed)', color: '#10b981' },
  { value: 'cancelled', label: 'Cancelled', color: '#ef4444' },
];

/* ─── Priorities Sub-Section ─── */
const WorkflowPrioritiesSection: React.FC = () => {
  const [priorities, setPriorities] = useState<Array<{ id: string; name: string; color: string; orderIndex: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#f59e0b');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const fetchPriorities = async () => {
    try {
      const res = await api.get('/workflow/priorities');
      setPriorities(res.data || []);
    } catch { /* fallback to empty */ }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchPriorities(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await api.post('/workflow/priorities', { name: newName.trim(), color: newColor });
      setNewName('');
      setNewColor('#f59e0b');
      toast.success('Priority created');
      invalidateWorkflowCache();
      fetchPriorities();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await api.put(`/workflow/priorities/${id}`, { name: editName.trim(), color: editColor });
      setEditingId(null);
      toast.success('Priority updated');
      invalidateWorkflowCache();
      fetchPriorities();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/workflow/priorities/${deleteTarget.id}`);
      toast.success('Priority deleted');
      invalidateWorkflowCache();
      fetchPriorities();
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-text-main">Task Priorities</h3>
          <p className="text-xs text-text-muted mt-0.5">Define priority levels for task urgency classification.</p>
        </div>
      </div>

      {/* Add new priority */}
      <div className="flex items-center gap-3 mb-4 p-3 border border-dashed border-border rounded-xl bg-background">
        <div className="relative overflow-hidden rounded-lg border border-border w-9 h-9 flex-shrink-0">
          <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="absolute -top-2 -left-2 w-14 h-14 cursor-pointer" />
        </div>
        <input
          type="text"
          placeholder="New priority name..."
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          className={`${inputClass} flex-1`}
        />
        <Button size="sm" onClick={handleCreate} disabled={!newName.trim()} leftIcon={<Plus size={14} />}>
          Add
        </Button>
      </div>

      {/* Priority list */}
      {isLoading ? (
        <div className="py-8 text-center text-text-muted text-sm animate-pulse">Loading priorities...</div>
      ) : priorities.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-border rounded-xl bg-surface/30">
          <p className="text-sm text-text-muted">No custom priorities defined.</p>
          <p className="text-xs text-text-muted/60 mt-1">Default priorities (Low, Medium, High, Urgent) will be used.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {priorities.map((item) => (
            <div key={item.id} className="flex flex-col sm:flex-row items-center gap-3 p-3 border border-border rounded-xl bg-surface hover:border-primary/20 transition-colors group">
              {editingId === item.id ? (
                <>
                  <div className="relative overflow-hidden rounded-lg border border-border w-9 h-9 flex-shrink-0">
                    <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} className="absolute -top-2 -left-2 w-14 h-14 cursor-pointer" />
                  </div>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleUpdate(item.id)}
                    className={`${inputClass} flex-1`}
                    autoFocus
                  />
                  <div className="flex gap-1">
                    <button onClick={() => handleUpdate(item.id)} className="p-1.5 text-success hover:bg-success/10 rounded-lg transition-colors"><Save size={16} /></button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 text-text-muted hover:bg-surface-hover rounded-lg transition-colors"><X size={16} /></button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-offset-2 ring-offset-surface" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-medium text-text-main flex-1 w-full text-left">{item.name}</span>
                  <span className="text-[10px] font-mono text-text-muted/50 uppercase hidden sm:inline">{item.color}</span>
                  <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity self-end sm:self-auto">
                    <button onClick={() => { setEditingId(item.id); setEditName(item.name); setEditColor(item.color); }} className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><Edit3 size={14} /></button>
                    <button onClick={() => setDeleteTarget({ id: item.id, name: item.name })} className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"><Trash2 size={14} /></button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Priority"
        message={`Delete "${deleteTarget?.name}"? Tasks using this priority will revert to Medium.`}
        confirmText="Delete"
      />
    </div>
  );
};

/* ─── Main Component ─── */
const WorkspaceWorkflows: React.FC = () => {
  const [customStatuses, setCustomStatuses] = useState<any[]>([]);
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(true);
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#6366f1');
  const [newStatusCategory, setNewStatusCategory] = useState('ongoing');
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [editingStatusName, setEditingStatusName] = useState('');
  const [editingStatusColor, setEditingStatusColor] = useState('');
  const [editingStatusCategory, setEditingStatusCategory] = useState('ongoing');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, id: string, name: string } | null>(null);

  useEffect(() => {
    fetchCustomStatuses();
  }, []);

  const fetchCustomStatuses = async () => {
    setIsLoadingStatuses(true);
    try {
      const res = await api.get('/workflow/statuses');
      setCustomStatuses(res.data || []);
    } catch (error) {
      toast.error('Failed to load custom statuses');
    } finally {
      setIsLoadingStatuses(false);
    }
  };

  const handleCreateCustomStatus = async () => {
    if (!newStatusName.trim()) return;
    try {
      await api.post('/workflow/statuses', {
        name: newStatusName,
        color: newStatusColor,
        standardStatus: newStatusCategory,
      });
      toast.success('Status created successfully');
      setNewStatusName('');
      invalidateWorkflowCache();
      fetchCustomStatuses();
    } catch (error) {
      toast.error('Failed to create status');
    }
  };

  const handleUpdateCustomStatus = async (id: string) => {
    if (!editingStatusName.trim()) return;
    try {
      await api.put(`/workflow/statuses/${id}`, {
        name: editingStatusName,
        color: editingStatusColor,
        standardStatus: editingStatusCategory,
      });
      toast.success('Status updated successfully');
      setEditingStatusId(null);
      invalidateWorkflowCache();
      fetchCustomStatuses();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteCustomStatus = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/workflow/statuses/${deleteConfirm.id}`);
      toast.success('Status deleted successfully');
      setDeleteConfirm(null);
      invalidateWorkflowCache();
      fetchCustomStatuses();
    } catch (error) {
      toast.error('Failed to delete status');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Workflow Management</h1>
        <p className="mt-1 text-sm text-text-muted">
          Define custom task statuses and priority levels for your workspace.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-8 pt-6">
          {/* ─── Task Statuses ─── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-text-main">Task Statuses</h3>
                <p className="text-xs text-text-muted mt-0.5">Define the stages tasks move through in your workflow.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4 p-3 border border-dashed border-border rounded-xl bg-background">
              <div className="relative overflow-hidden rounded-lg border border-border w-9 h-9 flex-shrink-0">
                <input type="color" value={newStatusColor} onChange={e => setNewStatusColor(e.target.value)} className="absolute -top-2 -left-2 w-14 h-14 cursor-pointer" />
              </div>
              <input
                type="text"
                placeholder="New status name..."
                value={newStatusName}
                onChange={e => setNewStatusName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateCustomStatus()}
                className={`${inputClass} flex-1`}
              />
              <CustomSelect
                value={newStatusCategory}
                onChange={setNewStatusCategory}
                options={STANDARD_STATUS_OPTIONS}
                className="w-48"
              />
              <Button size="sm" onClick={handleCreateCustomStatus} disabled={!newStatusName.trim()} leftIcon={<Plus size={14} />}>
                Add
              </Button>
            </div>

            {isLoadingStatuses ? (
              <div className="py-8 text-center text-text-muted text-sm animate-pulse">Loading statuses...</div>
            ) : customStatuses.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-border rounded-xl bg-surface/30">
                <p className="text-sm text-text-muted">No custom statuses defined.</p>
                <p className="text-xs text-text-muted/60 mt-1">Default statuses (Pending, Ongoing, In Review, Completed) will be used.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {customStatuses.map((status) => (
                  <div key={status.id} className="flex flex-col sm:flex-row items-center gap-3 p-3 border border-border rounded-xl bg-surface hover:border-primary/20 transition-colors group">
                    {editingStatusId === status.id ? (
                      <>
                        <div className="relative overflow-hidden rounded-lg border border-border w-9 h-9 flex-shrink-0">
                          <input type="color" value={editingStatusColor} onChange={e => setEditingStatusColor(e.target.value)} className="absolute -top-2 -left-2 w-14 h-14 cursor-pointer" />
                        </div>
                        <input
                          type="text"
                          value={editingStatusName}
                          onChange={e => setEditingStatusName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleUpdateCustomStatus(status.id)}
                          className={`${inputClass} flex-1`}
                          autoFocus
                        />
                        <CustomSelect
                          value={editingStatusCategory}
                          onChange={setEditingStatusCategory}
                          options={STANDARD_STATUS_OPTIONS}
                          className="w-48 shrink-0"
                        />
                        <div className="flex gap-1">
                          <button onClick={() => handleUpdateCustomStatus(status.id)} className="p-1.5 text-success hover:bg-success/10 rounded-lg transition-colors"><Save size={16} /></button>
                          <button onClick={() => setEditingStatusId(null)} className="p-1.5 text-text-muted hover:bg-surface-hover rounded-lg transition-colors"><X size={16} /></button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-offset-2 ring-offset-surface" style={{ backgroundColor: status.color }} />
                        <span className="text-sm font-medium text-text-main flex-1 w-full text-left">{status.name}</span>
                        <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-full bg-surface-hover border border-border text-[10px] text-text-muted">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STANDARD_STATUS_OPTIONS.find(o => o.value === status.standardStatus)?.color || '#94a3b8' }} />
                          {STANDARD_STATUS_OPTIONS.find(o => o.value === status.standardStatus)?.label || status.standardStatus}
                        </div>
                        <span className="text-[10px] font-mono text-text-muted/50 uppercase hidden lg:inline">{status.color}</span>
                        <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity self-end sm:self-auto">
                          <button onClick={() => { 
                            setEditingStatusId(status.id); 
                            setEditingStatusName(status.name); 
                            setEditingStatusColor(status.color);
                            setEditingStatusCategory(status.standardStatus || 'ongoing');
                          }} className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"><Edit3 size={14} /></button>
                          <button onClick={() => setDeleteConfirm({ isOpen: true, id: status.id, name: status.name })} className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Info note */}
            <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-info/5 border border-info/20">
              <span className="text-xl flex-shrink-0">💡</span>
              <div>
                <p className="text-sm font-semibold text-text-main">How custom statuses work</p>
                <p className="text-xs text-text-muted mt-0.5">
                  Custom statuses appear alongside the built-in statuses in every task dropdown.
                  If you delete a custom status, tasks using it will automatically revert to <strong>Pending</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-border/50" />

          {/* ─── Task Priorities ─── */}
          <WorkflowPrioritiesSection />

        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={deleteConfirm?.isOpen || false}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteCustomStatus}
        title="Delete Status"
        message={`Delete "${deleteConfirm?.name}"? Tasks using this status will revert to Pending.`}
        confirmText="Delete"
      />
    </div>
  );
};

export default WorkspaceWorkflows;
