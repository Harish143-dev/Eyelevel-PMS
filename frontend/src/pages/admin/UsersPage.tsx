import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import {
  fetchUsers,
  createUser,
  updateUser,
  updateUserRole,
  updateUserStatus,
  deleteUser,
} from '../../store/slices/userSlice';
import { fetchPendingUsers, approveUser, rejectUser } from '../../store/slices/adminSlice';
import toast from 'react-hot-toast';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/Avatar';
import CustomSelect from '../../components/ui/CustomSelect';
import { Plus, Shield, ShieldOff, CheckCircle, XCircle, Edit, UserCheck, UserX, Search as SearchIcon, Trash2, ExternalLink } from 'lucide-react';
import type { User } from '../../types';
import { Role, isAdmin, isManager, isHR, isAdminOrManager, isStaff } from '../../constants/roles';

const createUserSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'manager', 'hr', 'employee']),
  designation: z.string().max(100).optional().nullable(),
});

const updateUserSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'manager', 'hr', 'employee']).optional(),
  designation: z.string().max(100).optional().nullable(),
  skillsString: z.string().optional().nullable(),
  joiningDate: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  reportingManagerId: z.string().uuid().optional().nullable().or(z.literal('')),
});

type CreateUserForm = z.infer<typeof createUserSchema>;
type UpdateUserForm = z.infer<typeof updateUserSchema>;

const UsersPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { users, isLoading } = useAppSelector((state) => state.users);
  const { pendingUsers, pendingCount } = useAppSelector((state) => state.admin);
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'warning' | 'info';
    confirmText: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'info',
    confirmText: 'Confirm'
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    control: controlCreate,
    formState: { errors: createErrors, isSubmitting: isSubmittingCreate },
  } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: 'employee', designation: '' },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    control: controlEdit,
    formState: { errors: editErrors, isSubmitting: isSubmittingEdit },
  } = useForm<UpdateUserForm>({
    resolver: zodResolver(updateUserSchema),
  });

  useEffect(() => {
    dispatch(fetchPendingUsers());
  }, [dispatch]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      dispatch(fetchUsers({ 
        search: searchTerm, 
        role: roleFilter, 
        status: statusFilter
      }));
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [dispatch, searchTerm, roleFilter, statusFilter]);

  const onSubmitCreate = async (data: CreateUserForm) => {
    const action = await dispatch(createUser(data));
    if (createUser.fulfilled.match(action)) {
      setIsCreateModalOpen(false);
      resetCreate();
      toast.success('User created successfully');
    } else {
      toast.error(action.payload as string || 'Failed to create user');
    }
  };

  const onEditClick = (user: User) => {
    setEditingUser(user);
    resetEdit({
      name: user.name,
      email: user.email,
      role: user.role as any,
      designation: user.designation || '',
      skillsString: user.skills ? user.skills.join(', ') : '',
      joiningDate: user.joiningDate ? new Date(user.joiningDate).toISOString().split('T')[0] : '',
      emergencyContact: user.emergencyContact || '',
      reportingManagerId: user.reportingManagerId || '',
    });
    setIsEditModalOpen(true);
  };

  const onSubmitEdit = async (data: UpdateUserForm) => {
    if (editingUser) {
      const skills = data.skillsString ? data.skillsString.split(',').map(s => s.trim()).filter(Boolean) : [];
      const payload = {
        name: data.name,
        email: data.email,
        role: isAdmin(currentUser?.role) ? data.role : undefined, // Only Admin can pass role
        designation: data.designation,
        skills,
        joiningDate: data.joiningDate || null,
        emergencyContact: data.emergencyContact || null,
        reportingManagerId: data.reportingManagerId || null,
      };

      const action = await dispatch(updateUser({ id: editingUser.id, data: payload }));
      if (updateUser.fulfilled.match(action)) {
        setIsEditModalOpen(false);
        setEditingUser(null);
        toast.success('User updated successfully');
      } else {
        toast.error(action.payload as string || 'Failed to update user');
      }
    }
  };

  const toggleRole = (user: User) => {
    if (user.id === currentUser?.id) return;
    if (!isAdmin(currentUser?.role)) {
      toast.error('Only administrators can change user roles');
      return;
    }
    
    const newRole = isManager(user.role) ? Role.EMPLOYEE : Role.MANAGER;
    setConfirmConfig({
      isOpen: true,
      title: 'Change User Role',
      message: `Are you sure you want to change ${user.name}'s role to ${newRole}?`,
      variant: 'info',
      confirmText: 'Change Role',
      onConfirm: () => {
        dispatch(updateUserRole({ id: user.id, role: newRole })).then(() => {
          toast.success(`Role changed to ${newRole}`);
        });
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const toggleStatus = (user: User) => {
    if (user.id === currentUser?.id) return;
    setConfirmConfig({
      isOpen: true,
      title: user.isActive ? 'Deactivate User' : 'Activate User',
      message: `Are you sure you want to ${user.isActive ? 'deactivate' : 'activate'} ${user.name}?`,
      variant: user.isActive ? 'danger' : 'info',
      confirmText: user.isActive ? 'Deactivate' : 'Activate',
      onConfirm: () => {
        dispatch(updateUserStatus({ id: user.id, isActive: !user.isActive })).then(() => {
          toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
        });
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDeleteUser = (user: User) => {
    if (user.id === currentUser?.id) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Delete User Confirmation',
      message: `Are you absolutely sure you want to completely delete ${user.name}? This action cannot be undone. Note: Users with existing historical data (tasks, time logs) cannot be hard-deleted and must be deactivated instead.`,
      variant: 'danger',
      confirmText: 'Delete User permanently',
      onConfirm: async () => {
        const action = await dispatch(deleteUser(user.id));
        if (deleteUser.fulfilled.match(action)) {
          toast.success(`User ${user.name} was deleted permanently`);
        } else {
          toast.error(action.payload as string || 'Cannot delete user');
        }
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleApprove = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Approve User',
      message: 'Are you sure you want to approve this user request?',
      variant: 'info',
      confirmText: 'Approve',
      onConfirm: async () => {
        const action = await dispatch(approveUser(id));
        if (approveUser.fulfilled.match(action)) {
          toast.success('User approved');
          dispatch(fetchUsers({ search: searchTerm, role: roleFilter, status: statusFilter }));
        }
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleReject = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Reject User',
      message: 'Are you sure you want to reject this user request? This action cannot be undone.',
      variant: 'danger',
      confirmText: 'Reject',
      onConfirm: async () => {
        const action = await dispatch(rejectUser(id));
        if (rejectUser.fulfilled.match(action)) {
          toast.success('User rejected');
        }
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-left">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Users</h1>
          <p className="mt-1 text-sm text-text-muted">
            Manage team members, roles, and account access.
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus size={18} />}>
          Add User
        </Button>
      </div>

      {pendingCount > 0 && (
         <div className="bg-warning/10 border border-warning/20 rounded-xl shadow-sm overflow-hidden mb-6 text-left">
           <div className="p-4 border-b border-warning/20 bg-warning/10">
              <h3 className="font-semibold text-warning flex items-center gap-2">
                Pending Approvals ({pendingCount})
              </h3>
           </div>
           <Table>
             <TableHeader>
               <TableRow className="bg-transparent hover:bg-transparent border-warning/20">
                 <TableHead className="text-warning font-medium">User</TableHead>
                 <TableHead className="text-warning font-medium">Requested Role</TableHead>
                 <TableHead className="text-warning font-medium">Applied Date</TableHead>
                 <TableHead className="text-right text-warning font-medium">Actions</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {pendingUsers.map(user => (
                 <TableRow key={user.id} className="border-warning/10 hover:bg-warning/5">
                   <TableCell>
                     <div className="flex items-center gap-3">
                       <Avatar name={user.name} color={user.avatarColor} size={36} />
                       <div>
                         <div className="font-medium text-text-main">{user.name}</div>
                         <div className="text-sm text-text-muted">{user.email}</div>
                       </div>
                     </div>
                   </TableCell>
                   <TableCell>
                     <Badge variant="amber">{user.role}</Badge>
                   </TableCell>
                   <TableCell className="text-sm text-text-muted">
                     {new Date(user.createdAt).toLocaleDateString()}
                   </TableCell>
                   <TableCell className="text-right space-x-2">
                     <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => handleReject(user.id)}
                        className="text-danger bg-danger/10 hover:bg-danger/20 border-border shadow-none"
                     >
                        <UserX size={16} className="mr-1" /> Reject
                     </Button>
                     <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={() => handleApprove(user.id)}
                        className="bg-success hover:bg-success-hover text-white shadow-none"
                     >
                        <UserCheck size={16} className="mr-1" /> Approve
                     </Button>
                   </TableCell>
                 </TableRow>
               ))}
             </TableBody>
           </Table>
         </div>
      )}

      {/* Filter Bar */}
      <div className="bg-surface p-4 rounded-xl border border-border shadow-sm flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-text-muted"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <CustomSelect
            value={roleFilter}
            onChange={setRoleFilter}
            options={[
              { value: '', label: 'All Roles' },
              { value: 'employee', label: 'Employee' },
              { value: 'hr', label: 'HR', color: 'pink' },
              { value: 'manager', label: 'Manager', color: 'indigo' },
              { value: 'admin', label: 'Admin', color: 'red' },
            ]}
            className="w-44"
          />

          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'ACTIVE', label: 'Active', color: 'green' },
              { value: 'INACTIVE', label: 'Inactive', color: 'gray' },
              { value: 'PENDING', label: 'Pending', color: 'amber' },
              { value: 'REJECTED', label: 'Rejected', color: 'red' },
            ]}
            className="w-44"
          />
        </div>
      </div>

      <div className="bg-surface border text-left border-border rounded-xl shadow-sm overflow-hidden mb-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <div className="flex justify-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-text-muted">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                   <TableCell>
                    <Link to={`/hr/employees/${user.id}`} className="flex items-center gap-3 group">
                      <Avatar name={user.name} color={user.avatarColor} size={36} className="group-hover:ring-2 group-hover:ring-primary transition-all" />
                      <div>
                        <div className="font-medium text-text-main group-hover:text-primary transition-colors">{user.name}</div>
                        <div className="text-sm text-text-muted">{user.email}</div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-text-muted italic">
                    {user.designation || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={isAdmin(user.role) ? 'red' : isManager(user.role) ? 'indigo' : isHR(user.role) ? 'pink' : 'gray'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'REJECTED' ? 'red' : user.isActive ? 'green' : 'gray'}>
                      {user.status === 'REJECTED' ? 'Rejected' : user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-text-muted">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/hr/employees/${user.id}`)}
                      title="View Profile"
                      className="text-text-muted hover:text-primary hover:bg-primary/10"
                    >
                      <ExternalLink size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditClick(user)}
                      title="Edit User"
                      className="text-primary hover:text-primary-hover hover:bg-primary/10"
                      disabled={!isAdmin(currentUser?.role) && isAdmin(user.role)}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRole(user)}
                      disabled={user.id === currentUser?.id || (!isAdmin(currentUser?.role) && isAdmin(user.role))}
                      title={isAdminOrManager(user.role) ? 'Revoke Manager' : 'Make Manager'}
                      className={isAdminOrManager(user.role) ? 'text-warning hover:text-warning hover:bg-warning/10' : 'text-primary hover:text-primary-hover hover:bg-primary/10'}
                    >
                      {isAdminOrManager(user.role) ? <ShieldOff size={16} /> : <Shield size={16} />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStatus(user)}
                      disabled={user.id === currentUser?.id || (!isAdmin(currentUser?.role) && isAdmin(user.role))}
                      title={user.isActive ? 'Deactivate' : 'Activate'}
                      className={user.isActive ? 'text-danger hover:text-danger hover:bg-danger/10' : 'text-success hover:text-success hover:bg-success/10'}
                    >
                      {user.isActive ? <XCircle size={16} /> : <CheckCircle size={16} />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(user)}
                      disabled={user.id === currentUser?.id || !isAdmin(currentUser?.role)}
                      title="Delete User completely"
                      className="text-danger hover:text-danger hover:bg-danger/10"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetCreate();
        }}
        title="Create New User"
      >
        <form id="create-user-form" onSubmit={handleSubmitCreate(onSubmitCreate)} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Jane Doe"
            {...registerCreate('name')}
            error={createErrors.name?.message}
          />
          <Input
            type="email"
            label="Email Address"
            placeholder="jane@example.com"
            {...registerCreate('email')}
            error={createErrors.email?.message}
          />
          <Input
            label="Designation"
            placeholder="Project Manager"
            {...registerCreate('designation')}
            error={createErrors.designation?.message}
            disabled={isManager(currentUser?.role) && !isAdmin(currentUser?.role) && !isHR(currentUser?.role)}
          />
          <Input
            type="password"
            label="Temporary Password"
            placeholder="••••••••"
            {...registerCreate('password')}
            error={createErrors.password?.message}
          />
          <div>
            <label className="block text-sm font-medium text-text-main mb-1">Role</label>
            <Controller
              name="role"
              control={controlCreate}
              render={({ field }) => (
                <CustomSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: Role.EMPLOYEE, label: 'Employee' },
                    ...(isAdmin(currentUser?.role) ? [
                      { value: Role.MANAGER, label: 'Manager' },
                      { value: Role.HR, label: 'HR' },
                      { value: Role.ADMIN, label: 'Admin' }
                    ] : []),
                  ]}
                />
              )}
            />
            {createErrors.role && <p className="mt-1 text-sm text-danger">{createErrors.role.message}</p>}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmittingCreate}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
        }}
        title="Edit User"
      >
        <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Jane Doe"
            {...registerEdit('name')}
            error={editErrors.name?.message}
          />
          <Input
            type="email"
            label="Email Address"
            placeholder="jane@example.com"
            {...registerEdit('email')}
            error={editErrors.email?.message}
          />
          <Input
            label="Designation"
            placeholder="Project Manager"
            {...registerEdit('designation')}
            error={editErrors.designation?.message}
            disabled={isManager(currentUser?.role) && !isAdmin(currentUser?.role) && !isHR(currentUser?.role)}
          />

          {/* Admin-only Role Selection */}
          {isAdmin(currentUser?.role) && editingUser?.id !== currentUser?.id && (
            <div className="pt-2">
              <label className="block text-sm font-medium text-text-main mb-1">Account Role (Admin Only)</label>
              <Controller
                name="role"
                control={controlEdit}
                render={({ field }) => (
                  <CustomSelect
                    value={field.value || ''}
                    onChange={field.onChange}
                    options={[
                      { value: Role.EMPLOYEE, label: 'Employee' },
                      { value: Role.HR, label: 'HR' },
                      { value: Role.MANAGER, label: 'Manager' },
                      { value: Role.ADMIN, label: 'Administrator' },
                    ]}
                  />
                )}
              />
              <p className="mt-1.5 text-xs text-text-muted italic">
                * Promoting to Administrator grants full system access.
              </p>
            </div>
          )}

          {/* HR Core Employee Fields */}
          {isStaff(currentUser?.role) && (
            <div className="pt-4 mt-6 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Skills (comma-separated)"
                placeholder="React, Node.js, Design"
                {...registerEdit('skillsString')}
                error={editErrors.skillsString?.message}
              />
              <Input
                type="date"
                label="Joining Date"
                {...registerEdit('joiningDate')}
                error={editErrors.joiningDate?.message}
              />
              <Input
                label="Emergency Contact"
                placeholder="+1 234 567 8900"
                {...registerEdit('emergencyContact')}
                error={editErrors.emergencyContact?.message}
              />
              <div>
                <label className="block text-sm font-medium text-text-main mb-1">Reporting Manager</label>
                <Controller
                  name="reportingManagerId"
                  control={controlEdit}
                  render={({ field }) => (
                    <CustomSelect
                      value={field.value || ''}
                      onChange={field.onChange}
                      options={[
                        { value: '', label: '-- None --' },
                        ...users
                          .filter(u => u.isActive && u.id !== editingUser?.id)
                          .map(u => ({ value: u.id, label: u.name }))
                      ]}
                    />
                  )}
                />
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmittingEdit}>
              Update User
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant={confirmConfig.variant}
        confirmText={confirmConfig.confirmText}
      />
    </div>
  );
};

export default UsersPage;
