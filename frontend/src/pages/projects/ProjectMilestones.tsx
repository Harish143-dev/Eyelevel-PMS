import React, { useState, useEffect } from 'react';
import api from '../../services/api/axios';
import type { Milestone } from '../../types';
import Button from '../../components/ui/Button';
import { Plus, Trash2, Edit2, CheckCircle2, Circle, Flag } from 'lucide-react';
import toast from 'react-hot-toast';
import CustomSelect from '../../components/ui/CustomSelect';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { 
  MILESTONE_STATUS, 
  MILESTONE_STATUS_OPTIONS,
} from '../../constants/statusConstants';
import type { MilestoneStatusValue } from '../../constants/statusConstants';

interface Props {
  projectId: string;
  isAdmin: boolean;
}

const ProjectMilestones: React.FC<Props> = ({ projectId, isAdmin }) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', status: MILESTONE_STATUS.PENDING as MilestoneStatusValue, dueDate: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchMilestones();
  }, [projectId]);

  const fetchMilestones = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/projects/${projectId}/milestones`);
      setMilestones(res.data.milestones);
    } catch (err) {
      toast.error('Failed to load milestones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (isEditing === 'new') {
        const res = await api.post(`/projects/${projectId}/milestones`, formData);
        setMilestones([...milestones, res.data.milestone]);
        toast.success('Milestone created');
      } else if (isEditing) {
        const res = await api.put(`/projects/${projectId}/milestones/${isEditing}`, formData);
        setMilestones(milestones.map(m => m.id === isEditing ? res.data.milestone : m));
        toast.success('Milestone updated');
      }
      setIsEditing(null);
    } catch (err) {
      toast.error('Failed to save milestone');
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm(id);
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/projects/${projectId}/milestones/${deleteConfirm}`);
      setMilestones(milestones.filter(m => m.id !== deleteConfirm));
      toast.success('Milestone deleted');
    } catch (err) {
      toast.error('Failed to delete milestone');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleStatusToggle = async (m: Milestone) => {
    if (!isAdmin) return;
    const newStatus = m.status === MILESTONE_STATUS.COMPLETED ? MILESTONE_STATUS.PENDING : MILESTONE_STATUS.COMPLETED;
    try {
      const res = await api.put(`/projects/${projectId}/milestones/${m.id}`, { status: newStatus });
      setMilestones(milestones.map(mil => mil.id === m.id ? res.data.milestone : mil));
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  if (isLoading) return <div className="p-8 text-center text-text-muted animate-pulse">Loading milestones...</div>;

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold text-text-main">Milestones</h3>
        {isAdmin && (
          <Button 
            onClick={() => { setIsEditing('new'); setFormData({ title: '', description: '', status: MILESTONE_STATUS.PENDING, dueDate: '' }) }} 
            leftIcon={<Plus size={15} />} 
            size="sm"
          >
            New Milestone
          </Button>
        )}
      </div>

      {isEditing && (
        <div className="border border-primary/20 bg-surface p-5 rounded-xl mb-5">
          <h4 className="font-semibold text-text-main mb-4 text-sm">
             {isEditing === 'new' ? 'New Milestone' : 'Edit Milestone'}
          </h4>
          <div className="space-y-5">
            <input
              type="text" placeholder="e.g., Phase 1 Alpha Release"
              value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all backdrop-blur-sm"
            />
            <textarea
              placeholder="Provide a short breakdown of what constitutes this milestone (optional)"
              value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all h-24 custom-scrollbar backdrop-blur-sm"
            />
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="date"
                value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                className="bg-background/50 border border-border rounded-xl px-4 py-3 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all backdrop-blur-sm sm:w-1/2"
              />
              <div className="sm:w-1/2">
                <CustomSelect
                  value={formData.status}
                  onChange={val => setFormData({ ...formData, status: val as MilestoneStatusValue })}
                  options={MILESTONE_STATUS_OPTIONS}
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <Button variant="secondary" onClick={() => setIsEditing(null)} size="sm">Cancel</Button>
              <Button onClick={handleSave} size="sm">Save</Button>
            </div>
          </div>
        </div>
      )}

      {milestones.length === 0 && !isEditing ? (
        <div className="text-center py-20 border border-dashed border-border/60 rounded-3xl text-text-muted bg-surface/30">
          <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center mx-auto mb-4">
             <Flag size={24} className="text-text-muted/60" />
          </div>
          <p className="font-bold uppercase tracking-widest text-xs mb-2">No active milestones</p>
          <p className="text-xs text-text-muted/70 max-w-xs mx-auto">Milestones help track important goals and check-ins throughout the project.</p>
        </div>
      ) : (
        <div className="relative ml-4 pl-6 pb-2 space-y-4">
          <div className="absolute left-0 top-2 bottom-2 w-px bg-border" />
          {milestones.map(m => (
            <div key={m.id} className="relative group">
              {/* Timeline dot */}
              <button 
                onClick={() => handleStatusToggle(m)} 
                disabled={!isAdmin} 
                className={`absolute -left-[13px] top-2 transition-all ${isAdmin ? 'hover:scale-110 cursor-pointer' : ''}`}
              >
                {m.status === MILESTONE_STATUS.COMPLETED ? (
                  <div className="bg-success rounded-full ring-2 ring-success/20">
                     <CheckCircle2 size={18} className="text-white bg-success rounded-full" />
                  </div>
                ) : (
                   <Circle size={18} className="fill-background text-border ring-2 ring-surface" />
                )}
              </button>

              {/* Card */}
              <div className={`p-4 rounded-xl border transition-all ${m.status === MILESTONE_STATUS.COMPLETED ? 'bg-success/[0.02] border-success/15' : 'bg-surface border-border hover:border-primary/30'}`}>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-col">
                     <h4 className={`text-sm font-semibold ${m.status === MILESTONE_STATUS.COMPLETED ? 'text-text-muted line-through opacity-70' : 'text-text-main'}`}>
                       {m.title}
                     </h4>
                     {m.dueDate && (
                        <div className={`text-[11px] font-medium mt-1 flex items-center gap-1 ${m.status === MILESTONE_STATUS.COMPLETED ? 'text-text-muted/50' : 'text-text-muted'}`}>
                          <Flag size={11} />
                          {new Date(m.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}
                        </div>
                     )}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => { setIsEditing(m.id); setFormData({ title: m.title, description: m.description || '', status: m.status, dueDate: m.dueDate ? new Date(m.dueDate).toISOString().split('T')[0] : '' }) }} className="p-1.5 bg-surface text-text-muted hover:text-primary rounded-lg shadow-sm border border-border transition-colors"><Edit2 size={14}/></button>
                       <button onClick={() => handleDelete(m.id)} className="p-1.5 bg-surface text-text-muted hover:text-danger rounded-lg shadow-sm border border-border transition-colors"><Trash2 size={14}/></button>
                    </div>
                  )}
                </div>
                {m.description && (
                  <p className={`text-sm pt-2 border-t border-border/40 ${m.status === MILESTONE_STATUS.COMPLETED ? 'text-text-muted/60' : 'text-text-muted leading-relaxed'}`}>
                    {m.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={executeDelete}
        title="Delete Milestone"
        message="Are you sure you want to permanently remove this milestone?"
        confirmText="Remove"
        variant="danger"
      />
    </div>
  );
};

export default ProjectMilestones;
