import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks/useRedux';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  User as UserIcon, 
  Mail, 
  MapPin, 
  Briefcase, 
  Calendar, 
  Shield, 
  Phone, 
  Award, 
  DollarSign,
  ChevronLeft,
  ExternalLink,
  Github,
  Twitter,
  Linkedin,
  Heart,
  Info,
  Lock,
  Link,
  Target as TargetIcon,
  Star as StarIcon
} from 'lucide-react';
import api from '../../services/api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/Avatar';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import CustomSelect from '../../components/ui/CustomSelect';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import toast from 'react-hot-toast';
import { isAdminOrManager, isHR, isAdmin, isManager } from '../../constants/roles';
import { updateUser, fetchActiveUsers } from '../../store/slices/userSlice';

type Tab = 'overview' | 'work' | 'performance' | 'financials';

const updateUserSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  designation: z.string().max(100).optional().nullable(),
  skillsString: z.string().optional().nullable(),
  joiningDate: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  reportingManagerId: z.string().uuid().optional().nullable().or(z.literal('')),
  
  // New Fields
  phoneNumber: z.string().max(20).optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  bloodGroup: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  
  githubUrl: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
  twitterUrl: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
  linkedinUrl: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),
  portfolioUrl: z.string().url('Invalid URL').optional().nullable().or(z.literal('')),

  employeeId: z.string().max(20).optional().nullable(),
  employmentType: z.string().optional().nullable(),
  workLocation: z.string().optional().nullable(),

  bankName: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  ifscCode: z.string().optional().nullable(),
  panNumber: z.string().optional().nullable(),
});

type UpdateUserForm = z.infer<typeof updateUserSchema>;

const EmployeeProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const { users: allUsers } = useAppSelector((state) => state.users);
  
  const [employee, setEmployee] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editModalTab, setEditModalTab] = useState<'account' | 'personal' | 'employment' | 'financial'>('account');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  
  // Data for tabs
  const [okrs, setOkrs] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  // Form hook
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<UpdateUserForm>({
    resolver: zodResolver(updateUserSchema),
  });

  useEffect(() => {
    dispatch(fetchActiveUsers());
  }, [dispatch]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const userRes = await api.get(`/users/${id}`);
        setEmployee(userRes.data.user);
        
        // Fetch tab-specific data based on permissions
        const [okrRes, revRes, taskRes] = await Promise.all([
          api.get(`/performance/okrs?userId=${id}`).catch(() => ({ data: { okrs: [] } })),
          api.get(`/performance/reviews?revieweeId=${id}`).catch(() => ({ data: { reviews: [] } })),
          api.get(`/tasks?assignedTo=${id}`).catch(() => ({ data: { tasks: [] } }))
        ]);
        
        setOkrs(okrRes.data.okrs || []);
        setReviews(revRes.data.reviews || []);
        setTasks(taskRes.data.tasks || []);

        // Only HR/Admin or self can see financials
        if (isAdminOrManager(currentUser?.role) || isHR(currentUser?.role) || currentUser?.id === id) {
          try {
            const payslipRes = await api.get(`/payroll/payslips/${id}`);
            setPayslips(payslipRes.data.payslips || []);
          } catch (e) {
            console.error("Failed to fetch payslips", e);
          }
        }
      } catch (error) {
        console.error('Failed to fetch employee details', error);
        toast.error('Could not load employee profile');
        navigate('/hr/employees');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, currentUser, navigate]);

  const onEditClick = () => {
    if (employee) {
      reset({
        name: employee.name,
        email: employee.email,
        designation: employee.designation || '',
        skillsString: employee.skills ? employee.skills.join(', ') : '',
        joiningDate: employee.joiningDate ? new Date(employee.joiningDate).toISOString().split('T')[0] : '',
        emergencyContact: employee.emergencyContact || '',
        reportingManagerId: employee.reportingManagerId || '',
        phoneNumber: employee.phoneNumber || '',
        bio: employee.bio || '',
        dateOfBirth: employee.dateOfBirth ? new Date(employee.dateOfBirth).toISOString().split('T')[0] : '',
        gender: employee.gender || '',
        bloodGroup: employee.bloodGroup || '',
        address: employee.address || '',
        githubUrl: employee.githubUrl || '',
        twitterUrl: employee.twitterUrl || '',
        linkedinUrl: employee.linkedinUrl || '',
        portfolioUrl: employee.portfolioUrl || '',
        employeeId: employee.employeeId || '',
        employmentType: employee.employmentType || '',
        workLocation: employee.workLocation || '',
        bankName: employee.bankName || '',
        accountNumber: employee.accountNumber || '',
        ifscCode: employee.ifscCode || '',
        panNumber: employee.panNumber || '',
      });
      setIsEditModalOpen(true);
    }
  };

  const onSubmitEdit = async (data: UpdateUserForm) => {
    if (employee) {
      const skills = data.skillsString ? data.skillsString.split(',').map(s => s.trim()).filter(Boolean) : [];
      const payload = {
        name: data.name,
        email: data.email,
        designation: data.designation,
        skills,
        joiningDate: data.joiningDate || null,
        emergencyContact: data.emergencyContact || null,
        reportingManagerId: data.reportingManagerId || null,
        phoneNumber: data.phoneNumber || null,
        bio: data.bio || null,
        dateOfBirth: data.dateOfBirth || null,
        gender: data.gender || null,
        bloodGroup: data.bloodGroup || null,
        address: data.address || null,
        githubUrl: data.githubUrl || null,
        twitterUrl: data.twitterUrl || null,
        linkedinUrl: data.linkedinUrl || null,
        portfolioUrl: data.portfolioUrl || null,
        employeeId: data.employeeId || null,
        employmentType: data.employmentType || null,
        workLocation: data.workLocation || null,
        bankName: data.bankName || null,
        accountNumber: data.accountNumber || null,
        ifscCode: data.ifscCode || null,
        panNumber: data.panNumber || null,
      };

      const action = await dispatch(updateUser({ id: employee.id, data: payload }));
      if (updateUser.fulfilled.match(action)) {
        setIsEditModalOpen(false);
        toast.success('Profile updated successfully');
        // Reload employee data
        const userRes = await api.get(`/users/${id}`);
        setEmployee(userRes.data.user);
      } else {
        toast.error('Failed to update profile');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!employee) return null;

  const isOwnProfile = currentUser?.id === id;
  const canEdit = isAdminOrManager(currentUser?.role) || isHR(currentUser?.role);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      {/* Breadcrumbs & Actions */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-text-muted hover:text-text-main transition-colors group"
        >
          <div className="p-2 rounded-full group-hover:bg-surface border border-transparent group-hover:border-border transition-all">
            <ChevronLeft size={20} />
          </div>
          <span className="font-medium">Back to Team</span>
        </button>
        
        <div className="flex items-center gap-3">
            {canEdit && (
                <Button 
                    variant="secondary" 
                    className="border-border shadow-none"
                    onClick={onEditClick}
                >
                    Edit Profile
                </Button>
            )}
            {isOwnProfile && (
                <Button variant="primary" className="shadow-lg shadow-primary/20">
                    Request Leave
                </Button>
            )}
        </div>
      </div>

      {/* Header Profile Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-surface to-surface border border-border shadow-premium p-8 lg:p-10">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative flex flex-col lg:flex-row gap-10 items-start lg:items-center">
            <div className="relative group">
                <Avatar 
                    name={employee.name} 
                    color={employee.avatarColor} 
                    size={140} 
                    className="border-8 border-surface shadow-2xl transition-transform group-hover:scale-105" 
                />
                <div className={`absolute bottom-3 right-3 w-6 h-6 rounded-full border-4 border-surface ${employee.isActive ? 'bg-emerald-500' : 'bg-gray-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'}`}></div>
            </div>

            <div className="flex-1 space-y-4">
                <div>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h1 className="text-4xl font-extrabold text-text-main tracking-tight">{employee.name}</h1>
                        <Badge variant={employee.isActive ? 'green' : 'gray'} className="text-xs uppercase tracking-widest px-3 py-1">
                            {employee.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="indigo" className="text-xs uppercase tracking-widest px-3 py-1">
                           {employee.role}
                        </Badge>
                    </div>
                    <p className="text-xl text-text-muted font-medium flex items-center gap-2">
                        <Briefcase size={20} className="text-primary/60" />
                        {employee.designation || 'Specialist'} • {employee.department?.name || 'Departmental Team'}
                    </p>
                </div>

                <div className="flex flex-wrap gap-6 pt-2">
                    <div className="flex items-center gap-2 text-text-muted">
                        <Mail size={16} className="text-primary/40" />
                        <span className="text-sm">{employee.email}</span>
                    </div>
                    {employee.phone && (
                        <div className="flex items-center gap-2 text-text-muted">
                            <Phone size={16} className="text-primary/40" />
                            <span className="text-sm">{employee.phone}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-text-muted">
                        <Calendar size={16} className="text-primary/40" />
                        <span className="text-sm text-text-main font-bold">Joined {employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {(employee.skills || []).map((skill: string) => (
                        <span key={skill} className="px-3 py-1 rounded-lg bg-surface border border-border text-[10px] font-bold text-text-muted uppercase tracking-wider group-hover:border-primary/30 transition-colors">
                            {skill}
                        </span>
                    ))}
                </div>
            </div>

            <div className="flex flex-row lg:flex-col gap-3 ml-auto">
                {employee.githubUrl && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="rounded-xl border border-border bg-surface shadow-sm hover:shadow-md transition-all"
                        onClick={() => window.open(employee.githubUrl, '_blank')}
                    >
                        <Github size={18} />
                    </Button>
                )}
                {employee.twitterUrl && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="rounded-xl border border-border bg-surface shadow-sm hover:shadow-md transition-all"
                        onClick={() => window.open(employee.twitterUrl, '_blank')}
                    >
                        <Twitter size={18} />
                    </Button>
                )}
                {employee.linkedinUrl && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="rounded-xl border border-border bg-surface shadow-sm hover:shadow-md transition-all"
                        onClick={() => window.open(employee.linkedinUrl, '_blank')}
                    >
                        <Linkedin size={18} />
                    </Button>
                )}
                {employee.portfolioUrl && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="rounded-xl border border-border bg-surface shadow-sm hover:shadow-md transition-all"
                        onClick={() => window.open(employee.portfolioUrl, '_blank')}
                        title="Portfolio"
                    >
                        <ExternalLink size={18} />
                    </Button>
                )}
            </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 bg-surface p-1 rounded-2xl border border-border w-fit">
        {(['overview', 'work', 'performance', 'financials'] as Tab[]).map((tab) => {
            // Hide financials from managers if not their own profile
            if (tab === 'financials' && !isAdminOrManager(currentUser?.role) && !isHR(currentUser?.role) && !isOwnProfile) return null;
            if (tab === 'financials' && isManager(currentUser?.role) && !isAdmin(currentUser?.role) && !isHR(currentUser?.role) && !isOwnProfile) return null;

            return (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all uppercase tracking-widest ${
                        activeTab === tab 
                        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                        : 'text-text-muted hover:text-text-main hover:bg-surface-hover'
                    }`}
                >
                    {tab}
                </button>
            );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <Card className="border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Award size={20} className="text-primary" />
                            Professional Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-text-muted leading-relaxed">
                            {employee.bio || `A dedicated ${employee.designation || 'Staff Member'} at ${currentUser?.company?.name || 'this organization'}, working within the ${employee.department?.name || 'General'} department. ${employee.name} has been an integral part of the team since their arrival, contributing to various key initiatives and maintaining high standards of professional excellence.`}
                        </p>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-10">
                            <div>
                                <p className="text-lg font-bold text-text-main">{tasks.length}</p>
                                <p className="text-[10px] text-text-muted uppercase font-bold">Total Tasks</p>
                            </div>
                            <div>
                                <p className="text-lg font-bold text-text-main">{okrs.length}</p>
                                <p className="text-[10px] text-text-muted uppercase font-bold">OKRs</p>
                            </div>
                            <div>
                                <p className="text-lg font-bold text-text-main">92%</p>
                                <p className="text-[10px] text-text-muted uppercase font-bold">Efficiency</p>
                            </div>
                            <div>
                                <p className="text-lg font-bold text-text-main">24</p>
                                <p className="text-[10px] text-text-muted uppercase font-bold">Projects</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Sidebar info */}
            <div className="space-y-6">
                <Card className="border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base uppercase tracking-widest font-bold">Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                       <div className="flex items-start gap-4">
                            <div className="p-2 rounded-lg bg-surface border border-border text-text-muted">
                                <Briefcase size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-0.5">Title</p>
                                <p className="text-sm font-semibold text-text-main">{employee.designation || 'General Staff'}</p>
                            </div>
                       </div>
                       <div className="flex items-start gap-4">
                            <div className="p-2 rounded-lg bg-surface border border-border text-text-muted">
                                <Shield size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-0.5">Role Rank</p>
                                <p className="text-sm font-semibold text-text-main capitalize">{employee.role}</p>
                            </div>
                       </div>
                       <div className="flex items-start gap-4">
                            <div className="p-2 rounded-lg bg-surface border border-border text-text-muted">
                                <MapPin size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-0.5">Location</p>
                                <p className="text-sm font-semibold text-text-main">
                                    {employee.workLocation || 
                                     [currentUser?.company?.settings?.city, currentUser?.company?.settings?.country]
                                       .filter(Boolean)
                                       .join(', ') || 
                                     'Remote'}
                                </p>
                            </div>
                       </div>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base uppercase tracking-widest font-bold">Structure</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-center">
                        <div>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Reports To</p>
                            {employee.reportingManager ? (
                                <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => navigate(`/hr/employees/${employee.reportingManagerId}`)}>
                                    <Avatar name={employee.reportingManager.name} color={employee.reportingManager.avatarColor} size={64} className="ring-2 ring-primary/20 group-hover:ring-primary transition-all" />
                                    <div>
                                        <p className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">{employee.reportingManager.name}</p>
                                        <p className="text-[11px] text-text-muted">{employee.reportingManager.email}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-text-muted italic py-2">No reporting manager assigned</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
          </div>
        )}

        {activeTab === 'work' && (
            <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="bg-primary/5 border-primary/20 shadow-none">
                        <CardContent className="pt-6 pb-6 text-center">
                            <p className="text-4xl font-black text-primary">{tasks.length}</p>
                            <p className="text-xs font-bold text-primary/70 uppercase tracking-widest mt-1">Total Assigned Tasks</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-emerald-500/5 border-emerald-500/20 shadow-none">
                        <CardContent className="pt-6 pb-6 text-center">
                            <p className="text-4xl font-black text-emerald-500">{tasks.filter(t => t.status === 'completed').length}</p>
                            <p className="text-xs font-bold text-emerald-500/70 uppercase tracking-widest mt-1">Tasks Completed</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-amber-500/5 border-amber-500/20 shadow-none">
                        <CardContent className="pt-6 pb-6 text-center">
                            <p className="text-4xl font-black text-amber-500">{tasks.filter(t => t.status !== 'completed').length}</p>
                            <p className="text-xs font-bold text-amber-500/70 uppercase tracking-widest mt-1">Current Active Tasks</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-border shadow-sm overflow-hidden text-left">
                    <CardHeader>
                        <CardTitle className="text-xl">Work Pipeline</CardTitle>
                    </CardHeader>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Task Name</TableHead>
                                <TableHead>Project</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Deadline</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tasks.length > 0 ? tasks.map(task => (
                                <TableRow key={task.id} className="hover:bg-surface transition-colors cursor-pointer" onClick={() => navigate(`/pm/tasks`)}>
                                    <TableCell className="font-bold text-text-main">{task.title}</TableCell>
                                    <TableCell className="text-text-muted">{task.project?.name || 'General'}</TableCell>
                                    <TableCell>
                                        <Badge variant={task.priority === 'critical' ? 'red' : task.priority === 'high' ? 'amber' : 'gray'}>
                                            {task.priority}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={task.status === 'completed' ? 'green' : 'indigo'}>
                                            {task.status.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm font-medium text-text-muted">
                                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-text-muted font-medium">
                                        No tasks found in the pipeline.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        )}

        {activeTab === 'performance' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* OKRs Section */}
                    <Card className="border-border shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <TargetIcon size={20} className="text-primary" />
                                Growth Targets (OKRs)
                            </CardTitle>
                            <Button variant="ghost" size="sm" className="text-xs font-bold text-primary">View All</Button>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {okrs.length > 0 ? okrs.map(okr => (
                                <div key={okr.id} className="space-y-3 p-4 rounded-2xl bg-surface border border-border hover:border-primary/30 transition-all group">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h5 className="font-bold text-text-main group-hover:text-primary transition-colors">{okr.title}</h5>
                                            <p className="text-sm text-text-muted line-clamp-1">{okr.description || 'No description provided'}</p>
                                        </div>
                                        <Badge variant="gray" className="text-[10px] uppercase font-bold">{okr.quarter}</Badge>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-[11px] font-bold text-text-muted uppercase">
                                            <span>Progress</span>
                                            <span className="text-primary">{okr.progress}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-primary transition-all duration-1000 ease-out" 
                                                style={{ width: `${okr.progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-10 border-2 border-dashed border-border rounded-2xl">
                                    <p className="text-sm text-text-muted">No OKRs defined for this period.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Feedback Section */}
                    <Card className="border-border shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-xl">Recent Feedback</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {reviews.length > 0 ? reviews.map(review => (
                                <div key={review.id} className="p-5 rounded-2xl bg-surface/50 border border-border">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Avatar name={review.reviewer?.name} color={review.reviewer?.avatarColor} size={40} />
                                        <div>
                                            <p className="text-sm font-bold text-text-main">{review.reviewer?.name}</p>
                                            <p className="text-[11px] text-text-muted uppercase tracking-wider">{new Date(review.reviewDate).toLocaleDateString()}</p>
                                        </div>
                                        <div className="ml-auto">
                                            <div className="flex items-center gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <StarIcon key={i} size={14} className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-border'} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-text-muted leading-relaxed italic">"{review.feedback}"</p>
                                </div>
                            )) : (
                                <div className="text-center py-10">
                                    <p className="text-sm text-text-muted">No peer reviews or feedback found.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-primary text-white border-0 shadow-lg shadow-primary/20 relative overflow-hidden">
                        <CardContent className="pt-8 pb-8">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70 mb-2">Overall Rating</p>
                            <h3 className="text-5xl font-black mb-4">4.8<span className="text-xl opacity-50">/5.0</span></h3>
                            <div className="flex items-center gap-1 mb-6">
                                {[...Array(5)].map((_, i) => <StarIcon key={i} size={16} className="fill-current" />)}
                            </div>
                            <p className="text-sm leading-relaxed opacity-90">
                                This employee consistently exceeds expectations in technical implementation and leadership roles.
                            </p>
                        </CardContent>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                    </Card>

                    <Card className="border-border shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base uppercase tracking-widest font-bold">Skills Ranking</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { name: 'Technical Depth', val: 95, color: 'bg-primary' },
                                { name: 'Communication', val: 82, color: 'bg-emerald-500' },
                                { name: 'Leadership', val: 78, color: 'bg-violet-500' },
                                { name: 'Punctuality', val: 90, color: 'bg-amber-500' },
                            ].map(skill => (
                                <div key={skill.name} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-[11px] font-bold text-text-main">
                                        <span className="uppercase tracking-wider">{skill.name}</span>
                                        <span>{skill.val}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                                        <div className={`h-full ${skill.color}`} style={{ width: `${skill.val}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        )}

        {activeTab === 'financials' && (
            <div className="space-y-8">
                {/* Salary Info Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="border-border shadow-sm lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <DollarSign size={20} className="text-emerald-500" />
                                Salary Structure
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 border-t border-border">
                            <div className="divide-y divide-border">
                                <div className="p-4 flex items-center justify-between">
                                    <span className="text-sm text-text-muted">Basic Salary</span>
                                    <span className="font-bold">₹1,20,000 / mo</span>
                                </div>
                                <div className="p-4 flex items-center justify-between">
                                    <span className="text-sm text-text-muted">HRA</span>
                                    <span className="font-bold">₹40,000 / mo</span>
                                </div>
                                <div className="p-4 flex items-center justify-between">
                                    <span className="text-sm text-text-muted">Special Allowance</span>
                                    <span className="font-bold">₹25,000 / mo</span>
                                </div>
                                <div className="p-4 bg-emerald-500/5 flex items-center justify-between">
                                    <span className="text-sm font-bold text-emerald-600">Total Fixed Pay</span>
                                    <span className="font-black text-emerald-600">₹1,85,000 / mo</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-sm lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-xl">Annual Earnings Projection</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[250px] pt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={[
                                        { month: 'Apr', salary: 1.8 },
                                        { month: 'May', salary: 1.8 },
                                        { month: 'Jun', salary: 2.1 },
                                        { month: 'Jul', salary: 1.8 },
                                        { month: 'Aug', salary: 1.8 },
                                        { month: 'Sep', salary: 1.8 },
                                    ]}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ fill: '#f8fafc' }}
                                    />
                                    <Bar dataKey="salary" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Payslips Table */}
                <Card className="border-border shadow-sm overflow-hidden text-left">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-xl">Monthly Payslips</CardTitle>
                        <Button variant="ghost" size="sm" className="text-xs text-primary font-bold">Download All (ZIP)</Button>
                    </CardHeader>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Period</TableHead>
                                <TableHead>Gross Pay</TableHead>
                                <TableHead>Deductions</TableHead>
                                <TableHead>Net Salary</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payslips.length > 0 ? payslips.map(slip => (
                                <TableRow key={slip.id}>
                                    <TableCell className="font-bold text-text-main">{new Date(0, slip.month - 1).toLocaleString('default', { month: 'long' })} {slip.year}</TableCell>
                                    <TableCell className="text-text-muted">₹{slip.grossPay.toLocaleString()}</TableCell>
                                    <TableCell className="text-danger">₹{slip.totalDeductions.toLocaleString()}</TableCell>
                                    <TableCell className="font-bold text-emerald-500">₹{slip.netPay.toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={slip.status === 'paid' ? 'green' : 'amber'}>
                                            {slip.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                                            Download PDF
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-text-muted font-medium">
                                        No payslips found for the selected period.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Employee Profile"
        size="lg"
      >
        <div className="flex flex-col gap-6">
            {/* Modal Tabs */}
            <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-border w-full overflow-x-auto">
                <button
                    onClick={() => setEditModalTab('account')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider whitespace-nowrap ${
                        editModalTab === 'account' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-surface-hover'
                    }`}
                >
                    <UserIcon size={14} /> Account
                </button>
                <button
                    onClick={() => setEditModalTab('personal')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider whitespace-nowrap ${
                        editModalTab === 'personal' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-surface-hover'
                    }`}
                >
                    <Heart size={14} /> Personal
                </button>
                <button
                    onClick={() => setEditModalTab('employment')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider whitespace-nowrap ${
                        editModalTab === 'employment' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-surface-hover'
                    }`}
                >
                    <Briefcase size={14} /> Employment
                </button>
                {(isAdmin(currentUser?.role) || isHR(currentUser?.role) || isOwnProfile) && (
                    <button
                        onClick={() => setEditModalTab('financial')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider whitespace-nowrap ${
                            editModalTab === 'financial' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-surface-hover'
                        }`}
                    >
                        <Lock size={14} /> Financial
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-6">
                <div className="min-h-[400px]">
                    {editModalTab === 'account' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <Input
                                label="Full Name"
                                placeholder="Jane Doe"
                                {...register('name')}
                                error={errors.name?.message}
                            />
                            <Input
                                label="Email Address"
                                placeholder="jane@example.com"
                                type="email"
                                {...register('email')}
                                error={errors.email?.message}
                            />
                            <Input
                                label="Designation"
                                placeholder="Product Designer"
                                {...register('designation')}
                                error={errors.designation?.message}
                                disabled={!isAdmin(currentUser?.role) && !isHR(currentUser?.role)}
                            />
                            <Input
                                label="Skills (comma separated)"
                                placeholder="React, Figma, Node.js"
                                {...register('skillsString')}
                                error={errors.skillsString?.message}
                            />
                        </div>
                    )}

                    {editModalTab === 'personal' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-text-main mb-1.5">Professional Summary / Bio</label>
                                <textarea
                                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main placeholder:text-text-muted transition-all min-h-[120px] text-sm resize-none"
                                    placeholder="Brief professional background..."
                                    {...register('bio')}
                                />
                                {errors.bio && <p className="text-xs text-danger mt-1">{errors.bio.message}</p>}
                            </div>
                            <Input
                                label="Phone Number"
                                placeholder="+91 9876543210"
                                {...register('phoneNumber')}
                            />
                            <Input
                                label="Date of Birth"
                                type="date"
                                {...register('dateOfBirth')}
                            />
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-text-main">Gender</label>
                                <Controller
                                    name="gender"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomSelect
                                            options={[
                                                { value: 'Male', label: 'Male' },
                                                { value: 'Female', label: 'Female' },
                                                { value: 'Other', label: 'Other' },
                                                { value: 'Prefer not to say', label: 'Prefer not to say' }
                                            ]}
                                            value={field.value as string}
                                            onChange={field.onChange}
                                            placeholder="Select gender"
                                        />
                                    )}
                                />
                            </div>
                            <Input
                                label="Blood Group"
                                placeholder="O+ve"
                                {...register('bloodGroup')}
                            />
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-text-main mb-1.5">Current Address</label>
                                <textarea
                                    className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main placeholder:text-text-muted transition-all min-h-[80px] text-sm resize-none"
                                    placeholder="Full residential address..."
                                    {...register('address')}
                                />
                            </div>
                            <div className="md:col-span-2 mt-4 pt-4 border-t border-border">
                                <h4 className="text-sm font-bold text-text-main mb-4 flex items-center gap-2">
                                    <Link size={16} className="text-primary" /> Social & Public Profiles
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label="GitHub URL" placeholder="https://github.com/username" {...register('githubUrl')} error={errors.githubUrl?.message} />
                                    <Input label="LinkedIn URL" placeholder="https://linkedin.com/in/username" {...register('linkedinUrl')} error={errors.linkedinUrl?.message} />
                                    <Input label="Twitter URL" placeholder="https://twitter.com/username" {...register('twitterUrl')} error={errors.twitterUrl?.message} />
                                    <Input label="Portfolio URL" placeholder="https://portfolio.com" {...register('portfolioUrl')} error={errors.portfolioUrl?.message} />
                                </div>
                            </div>
                        </div>
                    )}

                    {editModalTab === 'employment' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <Input
                                label="Employee ID"
                                placeholder="EYE-001"
                                {...register('employeeId')}
                                disabled={!isAdmin(currentUser?.role) && !isHR(currentUser?.role)}
                            />
                            <Input
                                label="Joining Date"
                                type="date"
                                {...register('joiningDate')}
                                disabled={!isAdmin(currentUser?.role) && !isHR(currentUser?.role)}
                            />
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-text-main">Employment Type</label>
                                <Controller
                                    name="employmentType"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomSelect
                                            options={[
                                                { value: 'Full-time', label: 'Full-time' },
                                                { value: 'Part-time', label: 'Part-time' },
                                                { value: 'Contract', label: 'Contract' },
                                                { value: 'Intern', label: 'Intern' }
                                            ]}
                                            value={field.value as string}
                                            onChange={field.onChange}
                                            placeholder="Select type"
                                            disabled={!isAdmin(currentUser?.role) && !isHR(currentUser?.role)}
                                        />
                                    )}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-text-main">Work Location</label>
                                <Controller
                                    name="workLocation"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomSelect
                                            options={[
                                                { value: 'Office', label: 'Office' },
                                                { value: 'Remote', label: 'Remote' },
                                                { value: 'Hybrid', label: 'Hybrid' }
                                            ]}
                                            value={field.value as string}
                                            onChange={field.onChange}
                                            placeholder="Select location"
                                            disabled={!isAdmin(currentUser?.role) && !isHR(currentUser?.role)}
                                        />
                                    )}
                                />
                            </div>
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="block text-sm font-medium text-text-main">Reporting Manager</label>
                                <Controller
                                    name="reportingManagerId"
                                    control={control}
                                    render={({ field }) => (
                                        <CustomSelect
                                            options={allUsers
                                                .filter(u => u.id !== employee.id)
                                                .map(u => ({ value: u.id, label: `${u.name} (${u.role})` }))
                                            }
                                            value={field.value as string}
                                            onChange={field.onChange}
                                            placeholder="Select manager"
                                            disabled={!isAdmin(currentUser?.role) && !isHR(currentUser?.role)}
                                        />
                                    )}
                                />
                            </div>
                            <Input
                                label="Emergency Contact"
                                placeholder="Name - Phone"
                                {...register('emergencyContact')}
                            />
                        </div>
                    )}

                    {editModalTab === 'financial' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                             <div className="md:col-span-2 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex gap-3 items-start mb-2">
                                <Info size={20} className="text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-700 leading-relaxed font-medium">
                                    Sensitive financial data is only visible to HR and Administrators. Employees can only view their own records.
                                </p>
                            </div>
                            <Input
                                label="Bank Name"
                                placeholder="HDFC Bank"
                                {...register('bankName')}
                                disabled={!isAdmin(currentUser?.role) && !isHR(currentUser?.role)}
                            />
                            <Input
                                label="Account Number"
                                placeholder="50100..."
                                {...register('accountNumber')}
                                disabled={!isAdmin(currentUser?.role) && !isHR(currentUser?.role)}
                            />
                            <Input
                                label="IFSC Code"
                                placeholder="HDFC0001234"
                                {...register('ifscCode')}
                                disabled={!isAdmin(currentUser?.role) && !isHR(currentUser?.role)}
                            />
                            <Input
                                label="PAN / National ID"
                                placeholder="ABCDE1234F"
                                {...register('panNumber')}
                                disabled={!isAdmin(currentUser?.role) && !isHR(currentUser?.role)}
                            />
                        </div>
                    )}
                </div>

                <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-border">
                    <Button 
                        variant="secondary" 
                        type="button"
                        onClick={() => setIsEditModalOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button 
                        type="submit" 
                        isLoading={isSubmitting}
                        className="min-w-[120px]"
                    >
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
      </Modal>
    </div>
  );
};

export default EmployeeProfilePage;
