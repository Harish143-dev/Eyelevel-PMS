import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import {
  fetchUsers,
  createUser,
  updateUser,
  updateUserRole,
  updateUserStatus,
} from '../../store/slices/userSlice';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/Avatar';
import { Plus, Shield, ShieldOff, CheckCircle, XCircle, Edit, Edit2 } from 'lucide-react';
import type { User } from '../../types';

const createUserSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'user']),
  designation: z.string().max(100).optional().nullable(),
});

const updateUserSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  designation: z.string().max(100).optional().nullable(),
});

type CreateUserForm = z.infer<typeof createUserSchema>;
type UpdateUserForm = z.infer<typeof updateUserSchema>;

const UsersPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { users, isLoading } = useAppSelector((state) => state.users);
  const { user: currentUser } = useAppSelector((state) => state.auth);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    formState: { errors: createErrors, isSubmitting: isSubmittingCreate },
  } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: 'user', designation: '' },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors, isSubmitting: isSubmittingEdit },
  } = useForm<UpdateUserForm>({
    resolver: zodResolver(updateUserSchema),
  });

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const onSubmitCreate = async (data: CreateUserForm) => {
    const action = await dispatch(createUser(data));
    if (createUser.fulfilled.match(action)) {
      setIsCreateModalOpen(false);
      resetCreate();
    }
  };

  const onEditClick = (user: User) => {
    setEditingUser(user);
    resetEdit({
      name: user.name,
      email: user.email,
      designation: user.designation || '',
    });
    setIsEditModalOpen(true);
  };

  const onSubmitEdit = async (data: UpdateUserForm) => {
    if (editingUser) {
      const action = await dispatch(updateUser({ id: editingUser.id, data }));
      if (updateUser.fulfilled.match(action)) {
        setIsEditModalOpen(false);
        setEditingUser(null);
      }
    }
  };

  const toggleRole = (user: User) => {
    if (user.id === currentUser?.id) return; // Prevent changing own role
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (window.confirm(`Are you sure you want to change ${user.name}'s role to ${newRole}?`)) {
      dispatch(updateUserRole({ id: user.id, role: newRole }));
    }
  };

  const toggleStatus = (user: User) => {
    if (user.id === currentUser?.id) return; // Prevent deactivating self
    if (window.confirm(`Are you sure you want to ${user.isActive ? 'deactivate' : 'activate'} ${user.name}?`)) {
      dispatch(updateUserStatus({ id: user.id, isActive: !user.isActive }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage team members, roles, and account access.
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus size={18} />}>
          Add User
        </Button>
      </div>

      <div className="bg-white border text-left border-gray-200 rounded-xl shadow-sm overflow-hidden">
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
                <TableCell colSpan={5} className="text-center py-10">
                  <div className="flex justify-center">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={user.name} color={user.avatarColor} size={36} />
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 italic">
                    {user.designation || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'indigo' : 'gray'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? 'green' : 'red'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditClick(user)}
                      title="Edit User"
                      className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRole(user)}
                      disabled={user.id === currentUser?.id}
                      title={user.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                      className={user.role === 'admin' ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50' : 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50'}
                    >
                      {user.role === 'admin' ? <ShieldOff size={16} /> : <Shield size={16} />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStatus(user)}
                      disabled={user.id === currentUser?.id}
                      title={user.isActive ? 'Deactivate' : 'Activate'}
                      className={user.isActive ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}
                    >
                      {user.isActive ? <XCircle size={16} /> : <CheckCircle size={16} />}
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
          />
          <Input
            type="password"
            label="Temporary Password"
            placeholder="••••••••"
            {...registerCreate('password')}
            error={createErrors.password?.message}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              {...registerCreate('role')}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            {createErrors.role && <p className="mt-1 text-sm text-red-600">{createErrors.role.message}</p>}
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
          />

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
    </div>
  );
};

export default UsersPage;
