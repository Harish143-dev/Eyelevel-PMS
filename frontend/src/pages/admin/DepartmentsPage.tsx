import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchDepartments, createDepartment, updateDepartment, deleteDepartment } from '../../store/slices/departmentSlice';
import { fetchUsers } from '../../store/slices/userSlice';
import { Plus, Edit2, Trash2, Building, Users, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Avatar from '../../components/Avatar';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const DepartmentsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { departments, loading } = useAppSelector((state) => state.departments);
  const { users } = useAppSelector((state) => state.users);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string } | null>(null);
  
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '', 
    color: '#6366f1',
    managerId: '' as string | null,
    userIds: [] as string[] 
  });

  useEffect(() => {
    dispatch(fetchDepartments());
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Name is required');

    const nameExists = departments.some(d => d.name.toLowerCase() === formData.name.trim().toLowerCase() && d.id !== editingId);
    if (nameExists) return toast.error('A department with this name already exists');

    const colorExists = departments.some(d => d.color.toLowerCase() === formData.color.toLowerCase() && d.id !== editingId);
    if (colorExists) return toast.error('This theme color is already used by another department');

    try {
      if (editingId) {
        await dispatch(updateDepartment({ id: editingId, data: formData })).unwrap();
        toast.success('Department updated');
      } else {
        await dispatch(createDepartment(formData)).unwrap();
        toast.success('Department created');
      }
      dispatch(fetchUsers()); // Refresh users to get latest department assignments
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err || 'Failed to save department');
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await dispatch(deleteDepartment(deleteConfirm.id)).unwrap();
      toast.success('Department deleted');
    } catch (err: any) {
      toast.error(err || 'Failed to delete');
    } finally {
      setDeleteConfirm(null);
    }
  };
  const openEdit = (dept: any) => {
    // Collect IDs of users currently assigned to this department
    const currentMemberIds = users
      .filter(u => (u as any).departmentId === dept.id)
      .map(u => u.id);

    setFormData({ 
      name: dept.name, 
      description: dept.description || '', 
      color: dept.color,
      managerId: dept.managerId || '',
      userIds: currentMemberIds
    });
    setEditingId(dept.id);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', color: '#6366f1', managerId: '', userIds: [] });
    setEditingId(null);
    setUserSearchTerm('');
  };

  const toggleUser = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      userIds: prev.userIds.includes(userId)
        ? prev.userIds.filter(id => id !== userId)
        : [...prev.userIds, userId]
    }));
  };

  const filteredUsers = users.filter(u => 
    u.isActive && (
      u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
            <Building size={28} className="text-primary" />
            Departments
          </h1>
          <p className="text-sm text-text-muted mt-1">Manage company departments and assign team members</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} /> New Department
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : departments.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center text-text-muted">
          No departments found. Create one to get started!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map(dept => (
            <div key={dept.id} className="bg-surface border border-border rounded-xl p-5 hover:border-primary/50 transition-colors shadow-sm relative group overflow-hidden">
              <div
                className="absolute top-0 left-0 w-1 h-full"
                style={{ backgroundColor: dept.color }}
              />
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-text-main pr-12 truncate">{dept.name}</h3>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4">
                   <button onClick={() => openEdit(dept)} className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                     <Edit2 size={14} />
                   </button>
                   <button onClick={() => handleDelete(dept.id)} className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors">
                     <Trash2 size={14} />
                   </button>
                </div>
              </div>
              
              <p className="text-sm text-text-muted mb-4 line-clamp-2 min-h-[40px]">
                {dept.description || 'No description provided.'}
              </p>

              {dept.manager && (
                <div className="flex items-center gap-2 mb-4 p-2 bg-background/50 rounded-lg border border-border/50">
                  <Avatar name={dept.manager.name} color={dept.manager.avatarColor} size={24} />
                  <div className="text-xs">
                    <p className="text-text-muted font-medium">Department Manager</p>
                    <p className="text-text-main font-semibold">{dept.manager.name}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 text-sm pt-4 border-t border-border">
                <div className="flex items-center gap-1.5 text-text-main font-medium">
                  <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <Users size={14} />
                  </span>
                  {dept._count?.users || 0} Members
                </div>
                <div className="flex items-center gap-1.5 text-text-main font-medium">
                   <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                     <Building size={14} />
                   </span>
                   {dept._count?.projects || 0} Projects
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-surface rounded-2xl w-full max-w-lg relative animate-in fade-in zoom-in duration-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-border flex justify-between items-center bg-background/50">
              <h2 className="text-xl font-bold text-text-main">
                {editingId ? 'Edit Department' : 'Create Department'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-text-main p-1">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-text-main mb-1.5">Department Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                    placeholder="e.g. Engineering, Marketing..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-main mb-1.5">Description (Optional)</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                    placeholder="What does this team do?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-main mb-1.5">Theme Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-background border border-border"
                    />
                    <span className="text-sm text-text-muted font-mono uppercase tracking-wider">{formData.color}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-main mb-1.5">Department Manager</label>
                  <select
                    value={formData.managerId || ''}
                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value || null })}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                  >
                    <option value="">-- Select Manager --</option>
                    {users.filter(u => u.isActive && (u.role === 'manager' || u.role === 'admin')).map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 border-t border-border">
                  <label className="block text-sm font-semibold text-text-main mb-3">Team Members ({formData.userIds.length})</label>
                  
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={16} />
                    <input 
                      type="text"
                      placeholder="Search users to add..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-xs text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-1 max-h-56 overflow-y-auto pr-1 custom-scrollbar scroll-smooth">
                    {filteredUsers.map(user => {
                      const isSelected = formData.userIds.includes(user.id);
                      return (
                        <div 
                          key={user.id} 
                          className={`flex items-center justify-between p-2 rounded-xl transition-all border cursor-pointer ${
                            isSelected ? 'bg-primary/5 border-primary/20' : 'hover:bg-background border-transparent'
                          }`}
                          onClick={() => toggleUser(user.id)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar name={user.name} color={user.avatarColor} size={32} />
                            <div>
                               <p className="text-sm font-semibold text-text-main leading-tight">{user.name}</p>
                               <p className="text-[10px] text-text-muted font-medium">{user.email}</p>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                             isSelected ? 'bg-primary border-primary' : 'border-border'
                          }`}>
                             {isSelected && <Plus size={14} className="text-white rotate-45" />}
                          </div>
                        </div>
                      );
                    })}
                    {filteredUsers.length === 0 && (
                      <div className="py-8 text-center text-text-muted text-sm italic">
                        No users found matching your search.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </form>

            <div className="p-6 border-t border-border bg-background/50 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 text-sm font-bold text-text-muted hover:text-text-main transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-md active:scale-[0.98]"
              >
                {editingId ? 'Save Changes' : 'Create Department'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteConfirm?.isOpen || false}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={executeDelete}
        title="Delete Department"
        message="Are you sure you want to delete this department? This will also remove all members from this department."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default DepartmentsPage;

