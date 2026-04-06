import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks/useRedux';
import { fetchUsers } from '../../store/slices/userSlice';
import { fetchDepartments } from '../../store/slices/departmentSlice';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Users, Building, Palmtree, UserCheck, TrendingUp, UserPlus, Trophy, Star, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Avatar from '../../components/Avatar';
import api from '../../services/api/axios';
import { isAdminOrManager, isAdmin, isManager, isHR } from '../../constants/roles';
import { SkeletonDashboard } from '../../components/ui/Skeleton';
import Button from '../../components/ui/Button';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899', '#14b8a6'];

interface Performer {
  user: { id: string; name: string; avatarColor: string; designation?: string; department?: { name: string } };
  tasksCompleted: number;
  tasksCreated: number;
  hoursLogged: number;
}

const HRDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { users } = useAppSelector((state) => state.users);
  const { departments } = useAppSelector((state) => state.departments);
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const canViewStats = isAdminOrManager(currentUser?.role) || isHR(currentUser?.role);

  const [leaveStats, setLeaveStats] = useState<{ pending: number; approved: number; rejected: number }>({ pending: 0, approved: 0, rejected: 0 });
  const [topPerformers, setTopPerformers] = useState<Performer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          dispatch(fetchUsers()),
          dispatch(fetchDepartments()),
        ]);

        if (canViewStats) {
          const [leaveRes, perfRes] = await Promise.all([
            api.get('/leaves/all'),
            api.get('/analytics/team-comparison'),
          ]);
          
          const leaves = leaveRes.data.leaves || [];
          setLeaveStats({
            pending: leaves.filter((l: any) => l.status === 'PENDING').length,
            approved: leaves.filter((l: any) => l.status === 'APPROVED').length,
            rejected: leaves.filter((l: any) => l.status === 'REJECTED').length,
          });

          const performers = (perfRes.data.comparison || [])
            .filter((p: Performer) => p.tasksCompleted > 0)
            .slice(0, 10);
          setTopPerformers(performers);
        }
      } catch (err) {
        console.error('Failed to load HR data', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [dispatch, canViewStats]);

  const activeUsers = users.filter((u) => u.status === 'ACTIVE');
  const pendingUsers = users.filter((u) => u.status === 'PENDING');

  // Department user distribution
  const deptDistribution = departments.map((dept) => ({
    name: dept.name,
    employees: dept._count?.users || 0,
  })).filter((d) => d.employees > 0);

  // Role distribution
  const roleCount: Record<string, number> = {};
  activeUsers.forEach((u) => {
    const role = isAdmin(u.role) ? 'Admin' : isManager(u.role) ? 'Manager' : isHR(u.role) ? 'HR' : 'Employee';
    roleCount[role] = (roleCount[role] || 0) + 1;
  });
  const roleData = Object.entries(roleCount).map(([name, value]) => ({ name, value }));

  const medalColors = ['text-amber-400', 'text-gray-400', 'text-orange-500'];

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="space-y-6 text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
          <Users size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-text-main">HR Dashboard</h1>
          <p className="text-text-muted text-lg">Organization overview and employee management</p>
        </div>
      </div>

      {canViewStats && (
        <div className="flex justify-end gap-3 mb-2">
            <Button 
                onClick={() => navigate('/hr/employees')} 
                variant="secondary"
                leftIcon={<Users size={18} />}
            >
                Manage Employees
            </Button>
            <Button 
                onClick={() => navigate('/hr/leaves')} 
                variant="primary"
                leftIcon={<Palmtree size={18} />}
            >
                Pending Leaves
            </Button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-lift animate-fade-in-up">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <UserCheck size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-main">{activeUsers.length}</p>
              <p className="text-xs text-text-muted uppercase tracking-wider font-medium">Active Employees</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift animate-fade-in-up" style={{ animationDelay: '50ms' }}>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
              <UserPlus size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-main">{pendingUsers.length}</p>
              <p className="text-xs text-text-muted uppercase tracking-wider font-medium">Pending Approvals</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <Building size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-main">{departments.length}</p>
              <p className="text-xs text-text-muted uppercase tracking-wider font-medium">Departments</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <CardContent className="flex items-center gap-4 py-5">
            <div className="p-3 bg-violet-500/10 text-violet-500 rounded-xl">
              <Palmtree size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-main">{leaveStats.pending}</p>
              <p className="text-xs text-text-muted uppercase tracking-wider font-medium">Pending Leaves</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building size={18} className="text-primary" />
              Employees by Department
            </CardTitle>
            <CardDescription>Distribution of employees across departments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full min-h-[300px]">
              {deptDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptDistribution} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                    <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '12px', color: 'var(--color-text-main)' }}
                    />
                    <Bar dataKey="employees" name="Employees" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-text-muted font-medium">No department data</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              Role Distribution
            </CardTitle>
            <CardDescription>Users grouped by their role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full min-h-[300px]">
              {roleData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                    >
                      {roleData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '12px', color: 'var(--color-text-main)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-text-muted font-medium">No role data</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers Leaderboard */}
      {canViewStats && topPerformers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy size={18} className="text-amber-500" />
              Top Performers
            </CardTitle>
            <CardDescription>Employees ranked by tasks completed in the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.map((perf, index) => (
                <div
                  key={perf.user.id}
                  className={`flex items-center gap-4 p-3 rounded-xl border transition-all hover:shadow-sm ${
                    index === 0 ? 'bg-amber-500/5 border-amber-500/20' :
                    index === 1 ? 'bg-gray-500/5 border-gray-500/20' :
                    index === 2 ? 'bg-orange-500/5 border-orange-500/20' :
                    'bg-surface border-border'
                  }`}
                >
                  <div className="w-8 text-center flex-shrink-0">
                    {index < 3 ? (
                      <Star size={22} className={`${medalColors[index]} fill-current mx-auto`} />
                    ) : (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs ring-4 ring-primary/5 shrink-0">
                        {index + 1}
                      </div>
                    )}
                  </div>
                  <Link to={`/hr/employees/${perf.user.id}`} className="relative group/avatar cursor-pointer shrink-0">
                    <Avatar name={perf.user.name} color={perf.user.avatarColor} size={40} className="group-hover/avatar:ring-2 group-hover/avatar:ring-primary transition-all" />
                    {index === 0 && <Star size={14} className="absolute -top-1 -right-1 text-amber-500 fill-current" />}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/hr/employees/${perf.user.id}`} className="text-sm font-bold text-text-main hover:text-primary transition-colors truncate block">
                      {perf.user.name}
                    </Link>
                    <p className="text-xs text-text-muted truncate">
                      {perf.user.designation || 'Specialist'} • {perf.user.department?.name || 'Departmental Team'}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-center">
                      <p className="text-lg font-bold text-emerald-500">{perf.tasksCompleted}</p>
                      <p className="text-[10px] text-text-muted uppercase tracking-wider">Completed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-primary">{perf.tasksCreated}</p>
                      <p className="text-[10px] text-text-muted uppercase tracking-wider">Created</p>
                    </div>
                    <div className="text-center flex items-center gap-1">
                      <Clock size={14} className="text-text-muted" />
                      <div>
                        <p className="text-lg font-bold text-text-main">{perf.hoursLogged}h</p>
                        <p className="text-[10px] text-text-muted uppercase tracking-wider">Logged</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leave Overview */}
      {canViewStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palmtree size={18} className="text-emerald-500" />
              Leave Requests Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-amber-500/5 rounded-xl border border-amber-500/20">
                <p className="text-3xl font-bold text-amber-500">{leaveStats.pending}</p>
                <p className="text-xs text-text-muted uppercase tracking-wider font-medium mt-1">Pending</p>
              </div>
              <div className="text-center p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                <p className="text-3xl font-bold text-emerald-500">{leaveStats.approved}</p>
                <p className="text-xs text-text-muted uppercase tracking-wider font-medium mt-1">Approved</p>
              </div>
              <div className="text-center p-4 bg-red-500/5 rounded-xl border border-red-500/20">
                <p className="text-3xl font-bold text-red-500">{leaveStats.rejected}</p>
                <p className="text-xs text-text-muted uppercase tracking-wider font-medium mt-1">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HRDashboard;
