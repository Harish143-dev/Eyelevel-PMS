import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchRoles, createRole, updateRole, deleteRole } from '../../store/slices/roleSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Shield, Plus, Pencil, Trash2, ChevronRight, ChevronDown, Users, X } from 'lucide-react';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

// Permission groups for the UI matrix
const PERMISSION_GROUPS = [
  {
    label: 'Projects',
    permissions: [
      { key: 'project:view', label: 'View' },
      { key: 'project:create', label: 'Create' },
      { key: 'project:edit', label: 'Edit' },
      { key: 'project:delete', label: 'Delete' },
      { key: 'project:archive', label: 'Archive' },
      { key: 'project:manage_members', label: 'Members' },
    ],
  },
  {
    label: 'Tasks',
    permissions: [
      { key: 'task:view', label: 'View' },
      { key: 'task:create', label: 'Create' },
      { key: 'task:edit', label: 'Edit' },
      { key: 'task:delete', label: 'Delete' },
      { key: 'task:assign', label: 'Assign' },
    ],
  },
  {
    label: 'Users',
    permissions: [
      { key: 'user:view', label: 'View' },
      { key: 'user:create', label: 'Create' },
      { key: 'user:edit', label: 'Edit' },
      { key: 'user:delete', label: 'Delete' },
      { key: 'user:approve', label: 'Approve' },
      { key: 'user:manage_roles', label: 'Manage Roles' },
    ],
  },
  {
    label: 'Departments',
    permissions: [
      { key: 'department:view', label: 'View' },
      { key: 'department:create', label: 'Create' },
      { key: 'department:edit', label: 'Edit' },
      { key: 'department:delete', label: 'Delete' },
    ],
  },
  {
    label: 'Roles',
    permissions: [
      { key: 'role:view', label: 'View' },
      { key: 'role:create', label: 'Create' },
      { key: 'role:edit', label: 'Edit' },
      { key: 'role:delete', label: 'Delete' },
    ],
  },
  {
    label: 'HR & Leave',
    permissions: [
      { key: 'leave:view', label: 'View Leaves' },
      { key: 'leave:manage', label: 'Manage Leaves' },
      { key: 'payroll:view', label: 'View Payroll' },
      { key: 'payroll:manage', label: 'Manage Payroll' },
      { key: 'performance:view', label: 'View Performance' },
      { key: 'performance:manage', label: 'Manage Performance' },
    ],
  },
  {
    label: 'Other',
    permissions: [
      { key: 'analytics:view', label: 'Analytics' },
      { key: 'activity_log:view', label: 'Activity Logs' },
      { key: 'client:view', label: 'View Clients' },
      { key: 'client:create', label: 'Create Clients' },
      { key: 'client:edit', label: 'Edit Clients' },
      { key: 'client:delete', label: 'Delete Clients' },
      { key: 'company:manage', label: 'Company Settings' },
      { key: 'feature:toggle', label: 'Feature Toggles' },
    ],
  },
];

const RolesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { roles, isLoading } = useAppSelector((state) => state.roles);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
  const [expandedGroup, setExpandedGroup] = useState<string | null>('Projects');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string } | null>(null);

  useEffect(() => {
    dispatch(fetchRoles());
  }, [dispatch]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setRoleName('');
    setSelectedPerms(new Set());
  };

  const handleEdit = (role: any) => {
    setEditingId(role.id);
    setRoleName(role.name);
    // permissions array comes back as objects from DB schema relation
    const permsList = role.permissions?.map((p: any) => (typeof p === 'object' && p !== null) ? p.permission : p) || [];
    setSelectedPerms(new Set(permsList));
    setShowForm(true);
    // Auto-scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await dispatch(deleteRole(deleteConfirm.id));
    setDeleteConfirm(null);
  };

  const handleSave = async () => {
    if (!roleName.trim()) return;
    const perms = Array.from(selectedPerms);
    if (editingId) {
      await dispatch(updateRole({ id: editingId, name: roleName, permissions: perms }));
    } else {
      await dispatch(createRole({ name: roleName, permissions: perms }));
    }
    resetForm();
  };

  const togglePerm = (key: string) => {
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleGroup = (permissions: { key: string }[]) => {
    const keys = permissions.map((p) => p.key);
    const allSelected = keys.every((k) => selectedPerms.has(k));
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      keys.forEach((k) => allSelected ? next.delete(k) : next.add(k));
      return next;
    });
  };

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto">
      <div className="flex sm:flex-row flex-col sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" /> Roles & Permissions
          </h1>
          <p className="mt-1 text-sm text-text-muted">Manage fine-grained access control for your team.</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} leftIcon={<Plus size={16} />}>
            New Role
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CardHeader className="flex flex-row items-start justify-between border-b border-border bg-surface pb-4 rounded-t-xl">
            <div>
              <CardTitle>{editingId ? 'Edit Role' : 'Create New Role'}</CardTitle>
              <CardDescription>Configure role details and specific permissions.</CardDescription>
            </div>
            <button onClick={resetForm} className="text-text-muted hover:text-text-main p-1.5 rounded-lg hover:bg-background transition-colors">
              <X size={20} />
            </button>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-1.5">
              <label htmlFor="role-name" className="text-sm font-medium text-text-main">Role Name <span className="text-danger">*</span></label>
              <input 
                id="role-name" 
                type="text" 
                value={roleName} 
                onChange={(e) => setRoleName(e.target.value)} 
                placeholder="e.g. Team Lead" 
                className="w-full sm:w-96 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main"
                autoFocus 
              />
            </div>

            <div>
              <h3 className="text-sm font-bold text-text-main mb-3">Permission Matrix</h3>
              <div className="border border-border rounded-xl bg-background divide-y divide-border overflow-hidden">
                {PERMISSION_GROUPS.map((group) => {
                  const allSelected = group.permissions.every((p) => selectedPerms.has(p.key));
                  const isExpanded = expandedGroup === group.label;
                  const selectedCount = group.permissions.filter((p) => selectedPerms.has(p.key)).length;

                  return (
                    <div key={group.label} className="flex flex-col group">
                      <div 
                        className={`flex items-center justify-between p-3 cursor-pointer hover:bg-surface/50 transition-colors ${isExpanded ? 'bg-surface/50' : ''}`}
                        onClick={() => setExpandedGroup(isExpanded ? null : group.label)}
                      >
                        <div className="flex items-center gap-3">
                          <button className="p-1 rounded-md bg-transparent text-text-muted group-hover:bg-background transition-colors">
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                          <span className="text-sm font-medium text-text-main">{group.label}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${selectedCount > 0 ? 'bg-primary/10 text-primary' : 'bg-surface text-text-muted border border-border'}`}>
                            {selectedCount}/{group.permissions.length}
                          </span>
                        </div>
                        <button 
                          type="button" 
                          className={`text-xs font-semibold px-2 py-1.5 rounded transition-colors ${allSelected ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-surface text-text-muted hover:bg-background border border-border'}`}
                          onClick={(e) => { e.stopPropagation(); toggleGroup(group.permissions); }}
                        >
                          {allSelected ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      
                      {isExpanded && (
                        <div className="bg-surface/30 p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 border-t border-border/50">
                          {group.permissions.map((perm) => {
                            const isSelected = selectedPerms.has(perm.key);
                            return (
                              <label key={perm.key} className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all border ${isSelected ? 'bg-primary/5 border-primary/30 shadow-sm' : 'bg-background border-border hover:border-text-muted'}`}>
                                <input 
                                  type="checkbox" 
                                  className="mt-0.5 rounded border-border text-primary focus:ring-primary/50"
                                  checked={isSelected} 
                                  onChange={() => togglePerm(perm.key)} 
                                />
                                <div className="flex flex-col">
                                  <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-text-main'}`}>{perm.label}</span>
                                  <span className="text-[10px] uppercase text-text-muted font-mono mt-0.5">{perm.key}</span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-surface border-t border-border flex justify-end gap-3 rounded-b-xl py-4">
            <Button variant="ghost" onClick={resetForm}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} disabled={!roleName.trim()}>
              {editingId ? 'Save Changes' : 'Create Role'}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-text-muted animate-pulse">
             <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
             Loading roles...
          </div>
        ) : roles.length === 0 ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl bg-surface/50">
             <Shield className="w-12 h-12 text-border mb-3" />
             <p className="text-text-muted font-medium">No custom roles yet.</p>
             <p className="text-sm text-text-muted mt-1">Create a role to define granular permissions.</p>
          </div>
        ) : (
          roles.map((role) => (
            <Card key={role.id} className={`flex flex-col transition-all hover:shadow-md ${role.isSystemRole ? 'border-primary/20 bg-primary/5' : ''}`}>
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                       {role.name}
                       {role.isSystemRole && <span className="text-[10px] uppercase bg-primary text-white px-2 py-0.5 rounded-full font-bold shadow-sm">System</span>}
                    </CardTitle>
                  </div>
                  <div className="flex gap-1 -mr-2">
                    <button className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" onClick={() => handleEdit(role)} title="Edit Role">
                      <Pencil size={16} />
                    </button>
                    {!role.isSystemRole && (
                      <button className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors" onClick={() => setDeleteConfirm({ isOpen: true, id: role.id, name: role.name })} title="Delete Role">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="py-4 flex-1">
                 <div className="flex flex-col gap-3">
                   <div className="flex items-center gap-3 text-sm text-text-muted">
                     <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center flex-shrink-0">
                       <Shield size={14} className="text-primary" />
                     </div>
                     <span><strong className="text-text-main">{role.permissions?.length || 0}</strong> permissions assigned</span>
                   </div>
                   <div className="flex items-center gap-3 text-sm text-text-muted">
                     <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center flex-shrink-0">
                       <Users size={14} className="text-emerald-500" />
                     </div>
                     <span><strong className="text-text-main">{role._count?.users !== undefined ? role._count.users : 0}</strong> users via this role</span>
                   </div>
                 </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm?.isOpen || false}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Role"
        message={`Delete role "${deleteConfirm?.name}"? Users with this role will lose their assigned permissions.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default RolesPage;
