import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchClients, createClient, updateClient, deleteClient } from '../../store/slices/clientSlice';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/Avatar';
import toast from 'react-hot-toast';
import { Briefcase, Building2, Search, Plus, Trash2, Edit, Mail, Phone } from 'lucide-react';
import { useForm } from 'react-hook-form';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

interface ClientForm {
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
}

const ClientsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { clients, isLoading } = useAppSelector((state) => state.clients);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string; name: string } | null>(null);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<ClientForm>();

  useEffect(() => {
    dispatch(fetchClients());
  }, [dispatch]);

  const onAddClient = () => {
    setEditingClient(null);
    reset({ name: '', company: '', email: '', phone: '', address: '', status: 'active' });
    setIsModalOpen(true);
  };

  const onEditClient = (client: any) => {
    setEditingClient(client);
    reset({
      name: client.name,
      company: client.company || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      status: client.status
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: ClientForm) => {
    let action;
    if (editingClient) {
      action = await dispatch(updateClient({ id: editingClient.id, data }));
    } else {
      action = await dispatch(createClient(data));
    }

    if (createClient.fulfilled.match(action) || updateClient.fulfilled.match(action)) {
      toast.success(`Client ${editingClient ? 'updated' : 'created'} successfully`);
      setIsModalOpen(false);
    } else {
      toast.error(`Failed to ${editingClient ? 'update' : 'create'} client`);
    }
  };

  const onDelete = async () => {
    if (!deleteConfirm) return;
    const action = await dispatch(deleteClient(deleteConfirm.id));
    if (deleteClient.fulfilled.match(action)) {
      toast.success('Client deleted');
      setDeleteConfirm(null);
    } else {
      toast.error('Failed to delete client');
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/20">
            <Briefcase size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-main">Client Management</h1>
            <p className="text-text-muted text-lg">Manage your project clients and external stakeholders</p>
          </div>
        </div>
        
        <Button onClick={onAddClient}>
          <Plus size={18} className="mr-2" />
          Add Client
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4">
          <div>
            <CardTitle>All Clients</CardTitle>
            <CardDescription>View and manage client details</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main placeholder:text-text-muted transition-all"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client / Company</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2 text-text-muted">
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        Loading clients...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-text-muted">
                      No clients found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar name={client.name} color="#3b82f6" size={40} />
                          <div>
                            <p className="font-semibold text-text-main">
                              {client.name}
                            </p>
                            {client.company && (
                              <p className="text-xs text-text-muted flex items-center gap-1.5 mt-0.5">
                                <Building2 size={12} className="text-primary/60" />
                                {client.company}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-text-main">
                            <Mail size={14} className="text-text-muted" />
                            {client.email || '—'}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-text-main">
                            <Phone size={14} className="text-text-muted" />
                            {client.phone || '—'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={client.status === 'active' ? 'green' : 'gray'}>
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => onEditClient(client)}>
                            <Edit size={16} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm({ isOpen: true, id: client.id, name: client.name })} className="text-danger hover:text-danger hover:bg-danger/10">
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingClient ? 'Edit Client' : 'Add New Client'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input 
            label="Contact Name" 
            placeholder="John Doe" 
            required 
            {...register('name')} 
          />
          <Input 
            label="Company Name" 
            placeholder="Acme Corp" 
            {...register('company')} 
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Email Address" 
              type="email" 
              placeholder="john@acme.com" 
              {...register('email')} 
            />
            <Input 
              label="Phone Number" 
              placeholder="+1 234 567 890" 
              {...register('phone')} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-main mb-1">Status</label>
            <select
              className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main appearance-none"
              {...register('status')}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingClient ? 'Save Changes' : 'Create Client'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm?.isOpen || false}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={onDelete}
        title="Delete Client"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
};

export default ClientsPage;
