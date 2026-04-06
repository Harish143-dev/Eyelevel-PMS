import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Plus, Edit2, Trash2, Settings, Type, AlignLeft, Calendar, CheckSquare, Hash, Link as LinkIcon, ChevronDown } from 'lucide-react';
import api from '../../services/api/axios';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

interface CustomField {
  id: string;
  module: string;
  fieldName: string;
  fieldType: string;
  options: any;
  isRequired: boolean;
  showInList: boolean;
  orderIndex: number;
}

const CustomFieldsPage: React.FC = () => {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<CustomField | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<CustomField | null>(null);
  const [activeTab, setActiveTab] = useState('task'); // task, project, user

  const [formData, setFormData] = useState<Partial<CustomField>>({
    module: 'task',
    fieldName: '',
    fieldType: 'text',
    isRequired: false,
    showInList: false,
  });

  const [optionsStr, setOptionsStr] = useState('');

  const fetchFields = async () => {
    try {
      setLoading(true);
      const res = await api.get('/custom-fields');
      setFields(res.data.fields || []);
    } catch (error) {
      toast.error('Failed to load custom fields');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, []);

  const openAddModal = () => {
    setSelectedField(null);
    setFormData({ module: activeTab, fieldName: '', fieldType: 'text', isRequired: false, showInList: false });
    setOptionsStr('');
    setIsModalOpen(true);
  };

  const openEditModal = (field: CustomField) => {
    setSelectedField(field);
    setFormData({ ...field });
    if (field.fieldType === 'dropdown' && field.options) {
      setOptionsStr(Array.isArray(field.options) ? field.options.join(', ') : '');
    } else {
      setOptionsStr('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fieldName || !formData.fieldType) {
      toast.error('Please fill in required fields');
      return;
    }

    const payload: any = { ...formData };
    if (formData.fieldType === 'dropdown') {
      payload.options = optionsStr.split(',').map(s => s.trim()).filter(s => s);
      if (payload.options.length === 0) {
        toast.error('Dropdown requires at least one option');
        return;
      }
    } else {
      payload.options = null;
    }

    try {
      if (selectedField) {
        await api.put(`/custom-fields/${selectedField.id}`, payload);
        toast.success('Field updated');
      } else {
        await api.post('/custom-fields', payload);
        toast.success('Field created');
      }
      setIsModalOpen(false);
      fetchFields();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/custom-fields/${deleteConfirm.id}`);
      toast.success('Field deleted');
      setDeleteConfirm(null);
      fetchFields();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const filteredFields = fields.filter(f => f.module === activeTab);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'text': return <AlignLeft size={16} />;
      case 'number': return <Hash size={16} />;
      case 'date': return <Calendar size={16} />;
      case 'dropdown': return <ChevronDown size={16} />;
      case 'checkbox': return <CheckSquare size={16} />;
      case 'url': return <LinkIcon size={16} />;
      default: return <Type size={16} />;
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-main flex items-center gap-2">
            <Settings className="text-primary" size={32} />
            Custom Fields
          </h1>
          <p className="text-text-muted mt-1 text-lg">Extend entities with custom data attributes</p>
        </div>
        <Button leftIcon={<Plus size={18} />} onClick={openAddModal}>Add New Field</Button>
      </div>

      <div className="flex border-b border-border">
        {['task', 'project', 'user'].map((mod) => (
          <button
            key={mod}
            onClick={() => setActiveTab(mod)}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors capitalize ${
              activeTab === mod 
                ? 'border-primary text-primary' 
                : 'border-transparent text-text-muted hover:text-text-main hover:border-border'
            }`}
          >
            {mod}s
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface/50 border-b border-border text-xs uppercase text-text-muted">
                <tr>
                  <th className="px-6 py-4 font-semibold">Field Name</th>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Required</th>
                  <th className="px-6 py-4 font-semibold">Show in List</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-text-muted">Loading fields...</td></tr>
                ) : filteredFields.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-text-muted">No custom fields defined for {activeTab}s.</td></tr>
                ) : (
                  filteredFields.map(field => (
                    <tr key={field.id} className="hover:bg-surface/30">
                      <td className="px-6 py-4 font-medium text-text-main">{field.fieldName}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-text-muted bg-background px-2 py-1 rounded inline-flex text-xs capitalize border border-border">
                          {getIconForType(field.fieldType)}
                          {field.fieldType}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {field.isRequired ? <span className="text-danger font-medium text-sm">Yes</span> : <span className="text-text-muted text-sm">No</span>}
                      </td>
                      <td className="px-6 py-4">
                        {field.showInList ? <span className="text-success font-medium text-sm">Yes</span> : <span className="text-text-muted text-sm">No</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEditModal(field)} className="p-2 text-text-muted hover:text-primary transition-colors bg-surface rounded"><Edit2 size={16} /></button>
                          <button onClick={() => setDeleteConfirm(field)} className="p-2 text-text-muted hover:text-danger transition-colors bg-surface rounded"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedField ? 'Edit Custom Field' : 'New Custom Field'}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group col-span-2">
              <label className="block text-sm font-medium mb-1">Field Name *</label>
              <input type="text" className="w-full p-2 border rounded focus:ring-2 focus:ring-primary outline-none" required
                value={formData.fieldName || ''} onChange={e => setFormData({...formData, fieldName: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="block text-sm font-medium mb-1">Entity Module *</label>
              <select className="w-full p-2 border rounded" required
                value={formData.module || ''} onChange={e => setFormData({...formData, module: e.target.value})} disabled={!!selectedField}>
                <option value="task">Task</option>
                <option value="project">Project</option>
                <option value="user">User</option>
              </select>
            </div>
            <div className="form-group">
              <label className="block text-sm font-medium mb-1">Field Type *</label>
              <select className="w-full p-2 border rounded" required
                value={formData.fieldType || ''} onChange={e => setFormData({...formData, fieldType: e.target.value})}>
                <option value="text">Short Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="dropdown">Dropdown Options</option>
                <option value="checkbox">Checkbox (Boolean)</option>
                <option value="url">URL Link</option>
              </select>
            </div>
          </div>

          {formData.fieldType === 'dropdown' && (
            <div className="form-group">
              <label className="block text-sm font-medium mb-1">Dropdown Options (comma separated) *</label>
              <input type="text" className="w-full p-2 border rounded placeholder-gray-400" required placeholder="Option 1, Option A, Option XYZ"
                value={optionsStr} onChange={e => setOptionsStr(e.target.value)} />
            </div>
          )}

          <div className="flex gap-6 mt-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
              <input type="checkbox" className="w-4 h-4 text-primary rounded border-gray-300" 
                checked={formData.isRequired || false} onChange={e => setFormData({...formData, isRequired: e.target.checked})} />
              Is Required?
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
              <input type="checkbox" className="w-4 h-4 text-primary rounded border-gray-300" 
                checked={formData.showInList || false} onChange={e => setFormData({...formData, showInList: e.target.checked})} />
              Show in List Views?
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">{selectedField ? 'Update Field' : 'Create Field'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Custom Field"
        message={`Are you sure you want to delete "${deleteConfirm?.fieldName}"? All data entered in this field by users will be permanently lost.`}
        confirmText="Delete Field"
        variant="danger"
      />
    </div>
  );
};

export default CustomFieldsPage;
