import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { Card, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/Avatar';
import {
  Users,
  CheckCircle,
  AlertTriangle,
  Activity,
  Briefcase,
  Layers,
  ClipboardList,
  Clock,
  Calendar as CalendarIcon,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchAdminDashboard, fetchUserDashboard } from '../../store/slices/dashboardSlice';
import TodoList from '../../components/todo/TodoList';
import { SkeletonDashboard } from '../../components/ui/Skeleton';
import { 
  TASK_STATUS_CONFIG, 
  PROJECT_STATUS_CONFIG 
} from '../../constants/statusConstants';
import type { TaskStatusValue, ProjectStatusValue } from '../../constants/statusConstants';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = React.useState<'manager' | 'my-tasks'>('manager');
  const { adminData, userData, isLoading } = useAppSelector((state) => state.dashboard);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchAdminDashboard());
    dispatch(fetchUserDashboard());

  }, [dispatch]);

  if (isLoading && !adminData) {
    return <SkeletonDashboard />;
  }

  if (!adminData) return null;

  const { stats, taskStatusBreakdown, projectProgress, recentActivity, overdueTasks } = adminData;

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-text-main">
            {activeTab === 'manager' 
              ? (user?.role === 'admin' ? 'Admin Dashboard' : 'Manager Dashboard') 
              : 'My Personal Workspace'}
          </h1>
          <p className="text-text-muted text-lg">Welcome, <span className="font-bold text-text-main">{user?.name} </span></p>
        </div>
        
        <div className="flex glass p-1.5 rounded-2xl shadow-sm border border-border/50 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('manager')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'manager'
                ? 'bg-surface/80 text-primary shadow-sm ring-1 ring-border/50'
                : 'text-text-muted hover:text-text-main hover:bg-surface/40'
            }`}
          >
            <Layers size={18} />
            System Overview
          </button>
          <button
            onClick={() => setActiveTab('my-tasks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'my-tasks'
                ? 'bg-surface/80 text-primary shadow-sm ring-1 ring-border/50'
                : 'text-text-muted hover:text-text-main hover:bg-surface/40'
            }`}
          >
            <ClipboardList size={18} />
            My Personal Tasks
          </button>
        </div>
      </div>

      {activeTab === 'manager' ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Projects"
              value={stats.totalProjects}
              icon={<Briefcase className="text-info" size={24} />}
              bgColor="bg-info/10"
            />
            <Link to="/pm/live-monitoring">
              <StatCard
                title="Active Users"
                value={stats.activeUsers}
                icon={<Users className="text-primary" size={24} />}
                bgColor="bg-primary/10"
              />
            </Link>
            <StatCard
              title="Tasks Created (MTD)"
              value={stats.tasksThisMonth}
              icon={<Activity className="text-warning" size={24} />}
              bgColor="bg-warning/10"
            />
            <StatCard
              title="Completed Tasks"
              value={stats.completedTasks}
              icon={<CheckCircle className="text-success" size={24} />}
              bgColor="bg-success/10"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Project Progress */}
            <Card className="lg:col-span-2">
              <div className="p-4 border-b border-border flex justify-between items-center">
                <h3 className="font-semibold text-text-main">Project Overview</h3>
                <Link to="/pm/projects" className="text-xs font-semibold text-primary hover:text-primary-hover">View All</Link>
              </div>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-background border-b border-border uppercase text-[10px] font-bold text-text-muted tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Project Name</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Progress</th>
                        <th className="px-6 py-3 text-right">Tasks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {projectProgress.map((p: any) => (
                        <tr key={p.id} className="hover:bg-background transition-colors cursor-pointer" onClick={() => navigate(`/pm/projects/${p.id}`)}>
                          <td className="px-6 py-4 font-medium text-text-main">{p.name}</td>
                           <td className="px-6 py-4">
                            <Badge variant={PROJECT_STATUS_CONFIG[p.status as ProjectStatusValue]?.badgeVariant || 'gray'}>
                              {PROJECT_STATUS_CONFIG[p.status as ProjectStatusValue]?.label || p.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-24 bg-background rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${p.progress === 100 ? 'bg-success' : 'bg-primary'}`}
                                  style={{ width: `${p.progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-text-muted font-medium">{p.progress}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-text-muted">
                            {p.completedTasks}/{p.totalTasks}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {/* Task Status Breakdown */}
              <Card>
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold text-text-main">Global Task Breakdown</h3>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {Object.entries(taskStatusBreakdown).map(([status, count]: [string, any]) => (
                      <div key={status} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="capitalize text-text-muted">{status.replace('_', ' ')}</span>
                          <span className="text-text-main">{count}</span>
                        </div>
                        <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full`}
                            style={{ 
                              backgroundColor: TASK_STATUS_CONFIG[status as TaskStatusValue]?.color || '#94a3b8',
                              width: `${stats.totalProjects === 0 ? 0 : (count / (Object.values(taskStatusBreakdown).reduce((a: number, b: any) => a + (b as number), 0) || 1)) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>


            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-6">
            <Card>
              <div className="p-4 border-b border-border flex items-center gap-2">
                <AlertTriangle size={18} className="text-danger" />
                <h3 className="font-semibold text-text-main">Overdue Tasks (All)</h3>
              </div>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {overdueTasks.map((task: any) => (
                    <div key={task.id} className="p-4 flex justify-between items-center hover:bg-background transition-colors">
                      <div className="flex gap-3">
                        <div className="w-1 h-10 bg-danger rounded-full" />
                        <div>
                          <p className="text-sm font-semibold text-text-main">{task.title}</p>
                          <p className="text-xs text-text-muted font-medium">{task.project.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-danger mb-1">
                          DUE: {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                        {task.assignee ? (
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-[10px] text-text-muted">{task.assignee.name}</span>
                            <Avatar name={task.assignee.name} color={task.assignee.avatarColor} size={16} />
                          </div>
                        ) : (
                          <span className="text-[10px] text-text-muted italic">Unassigned</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {overdueTasks.length === 0 && (
                    <div className="p-10 text-center">
                      <div className="text-success mb-2 flex justify-center"><CheckCircle size={32} /></div>
                      <p className="text-sm text-text-muted">All tasks are on track!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-text-main">Recent Activity</h3>
              </div>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50 max-h-[350px] overflow-y-auto custom-scrollbar">
                  {recentActivity.map((log: any) => (
                    <div key={log.id} className="p-4 flex gap-3">
                      <Avatar name={log.user.name} color={log.user.avatarColor} size={32} />
                      <div className="flex-1">
                        <p className="text-sm text-text-main">
                          <span className="font-semibold text-text-main">{log.user.name}</span>
                          {' '}{log.description}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-background border-t border-border text-center">
                  <Link to="/activity" className="text-xs font-semibold text-primary hover:text-primary-hover">View Full Logs</Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {userData ? (
            <div className="space-y-6">
              {/* Personal Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatCard 
                  title="My Active Tasks" 
                  value={userData.stats.activeTasks} 
                  icon={<Clock className="text-primary" size={24} />} 
                  bgColor="bg-primary/10"
                />
                <StatCard 
                  title="Due This Week" 
                  value={userData.stats.dueThisWeek} 
                  icon={<CalendarIcon className="text-warning" size={24} />} 
                  bgColor="bg-warning/10"
                />
                <StatCard 
                  title="Completed by Me" 
                  value={userData.stats.completedTotal} 
                  icon={<CheckCircle className="text-success" size={24} />} 
                  bgColor="bg-success/10"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="space-y-6">
                  <Card>
                    <div className="p-4 border-b border-border flex justify-between items-center">
                      <h3 className="font-semibold text-text-main flex items-center gap-2">
                        <TrendingUp size={18} className="text-primary" />
                        Tasks Assigned to You
                      </h3>
                      <Link to="/tasks" className="text-xs font-semibold text-primary hover:text-primary-hover">View Full List</Link>
                    </div>
                    <CardContent className="p-0">
                      <div className="divide-y divide-border/20 max-h-[400px] overflow-y-auto">
                        {userData.myTasks.map((task: any) => (
                          <div key={task.id} className="p-4 flex justify-between items-center hover:bg-background transition-colors group cursor-pointer" onClick={() => navigate(`/pm/projects/${task.projectId}`)}>
                            <div className="flex-1 min-w-0">
                               <div className="flex items-center gap-2 mb-1">
                                  <Badge variant={TASK_STATUS_CONFIG[task.status as TaskStatusValue]?.badgeVariant || 'gray'}>
                                     {TASK_STATUS_CONFIG[task.status as TaskStatusValue]?.label || task.status}
                                  </Badge>
                                  <span className="text-[10px] text-text-muted font-medium truncate uppercase tracking-tighter">
                                     {task.project.name}
                                  </span>
                               </div>
                               <p className="text-sm font-semibold text-text-main truncate group-hover:text-primary transition-colors">
                                  {task.title}
                               </p>
                            </div>
                            <div className="text-right ml-4 shrink-0">
                               <p className={`text-xs font-medium ${task.dueDate && new Date(task.dueDate) < new Date() ? 'text-danger' : 'text-text-muted'}`}>
                                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                               </p>
                               <ArrowRight size={14} className="ml-auto mt-1 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        ))}
                        {userData.myTasks.length === 0 && (
                          <div className="p-10 text-center">
                            <p className="text-sm text-text-muted italic">No active tasks assigned to you.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  <TodoList />
                </div>

                <div className="space-y-6">
                  <Card className="bg-gradient-to-br from-primary to-indigo-600 border-none text-white overflow-hidden relative">
                    <div className="p-4 relative z-10">
                      <h3 className="font-semibold flex items-center gap-2">
                        <AlertTriangle size={18} className="text-amber-300" />
                        My Upcoming Deadlines
                      </h3>
                    </div>
                    <CardContent className="p-0 relative z-10">
                      <div className="divide-y divide-white/10">
                        {userData.upcomingDeadlines.map((task: any) => (
                          <div key={task.id} className="p-4 hover:bg-white/5 transition-colors">
                            <p className="text-sm font-medium">{task.title}</p>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-[10px] text-indigo-100 uppercase">{task.project.name}</span>
                              <span className="text-[10px] font-bold text-amber-300">
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                        {userData.upcomingDeadlines.length === 0 && (
                          <div className="p-10 text-center text-sm text-white/50 italic">
                            No upcoming deadlines!
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center p-20">
               <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon, bgColor }: any) => (
  <Card className="hover-lift animate-fade-in-up">
    <CardContent className="p-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-text-muted mb-1">{title}</p>
          <p className="text-3xl font-bold text-text-main">{value}</p>
        </div>
        <div className={`p-3 ${bgColor} rounded-xl`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default AdminDashboard;
