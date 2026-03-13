import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchAdminDashboard } from '../../store/slices/dashboardSlice';
import { Card, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/Avatar';
import {
  Users,
  CheckCircle,
  AlertTriangle,
  Activity,
  Briefcase
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { adminData, isLoading } = useAppSelector((state) => state.dashboard);
  const { user } = useAppSelector((state) => state.auth);
  console.log(adminData);
  useEffect(() => {
    dispatch(fetchAdminDashboard());
  }, [dispatch]);

  if (isLoading && !adminData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!adminData) return null;

  const { stats, taskStatusBreakdown, projectProgress, recentActivity, overdueTasks } = adminData;

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 text-lg">Welcome, <span className="font-bold text-xl">{user?.name} </span></p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Projects"
          value={stats.totalProjects}
          icon={<Briefcase className="text-blue-600" size={24} />}
          bgColor="bg-blue-50"
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          icon={<Users className="text-indigo-600" size={24} />}
          bgColor="bg-indigo-50"
        />
        <StatCard
          title="Tasks Created (MTD)"
          value={stats.tasksThisMonth}
          icon={<Activity className="text-amber-600" size={24} />}
          bgColor="bg-amber-50"
        />
        <StatCard
          title="Completed Tasks"
          value={stats.completedTasks}
          icon={<CheckCircle className="text-green-600" size={24} />}
          bgColor="bg-green-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Project Progress */}
        <Card className="lg:col-span-2">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Project Overview</h3>
            <Link to="/projects" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">View All</Link>
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100 uppercase text-[10px] font-bold text-gray-500 tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Project Name</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Progress</th>
                    <th className="px-6 py-3 text-right">Tasks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {projectProgress.map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/projects/${p.id}`)}>
                      <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                      <td className="px-6 py-4">
                        <Badge variant={p.status === 'completed' ? 'green' : p.status === 'on_hold' ? 'amber' : 'blue'}>
                          {p.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${p.progress === 100 ? 'bg-green-500' : 'bg-indigo-600'}`}
                              style={{ width: `${p.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 font-medium">{p.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-500">
                        {p.completedTasks}/{p.totalTasks}
                      </td>
                    </tr>
                  ))}
                  {projectProgress.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-400 italic">No projects found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Task Status Breakdown */}
        <Card>
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Task Breakdown</h3>
          </div>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Object.entries(taskStatusBreakdown).map(([status, count]: [string, any]) => (
                <div key={status} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="capitalize text-gray-600">{status.replace('_', ' ')}</span>
                    <span className="text-gray-900">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${status === 'completed' ? 'bg-green-500' :
                        status === 'in_review' ? 'bg-amber-400' :
                          status === 'ongoing' ? 'bg-blue-500' :
                            status === 'cancelled' ? 'bg-gray-400' : 'bg-indigo-400'
                        }`}
                      style={{ width: `${stats.totalProjects === 0 ? 0 : (count / (Object.values(taskStatusBreakdown).reduce((a: number, b: any) => a + (b as number), 0) || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-6">

        {/* Overdue Tasks */}
        <Card>
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" />
            <h3 className="font-semibold text-gray-900">Overdue Tasks</h3>
          </div>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {overdueTasks.map((task: any) => (
                <div key={task.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                  <div className="flex gap-3">
                    <div className="w-1 h-10 bg-red-500 rounded-full" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{task.title}</p>
                      <p className="text-xs text-gray-500 font-medium">{task.project.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-red-500 mb-1">
                      DUE: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                    {task.assignee ? (
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-[10px] text-gray-500">{task.assignee.name}</span>
                        <Avatar name={task.assignee.name} color={task.assignee.avatarColor} size={16} />
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-400 italic">Unassigned</span>
                    )}
                  </div>
                </div>
              ))}
              {overdueTasks.length === 0 && (
                <div className="p-10 text-center">
                  <div className="text-green-500 mb-2 flex justify-center"><CheckCircle size={32} /></div>
                  <p className="text-sm text-gray-500">All tasks are on track!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {recentActivity.map((log: any) => (
                <div key={log.id} className="p-4 flex gap-3">
                  <Avatar name={log.user.name} color={log.user.avatarColor} size={32} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold text-gray-900">{log.user.name}</span>
                      {' '}{log.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <p className="p-8 text-center text-sm text-gray-400 italic">No activity yet.</p>
              )}
            </div>
            <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
              <Link to="/activity" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">View Full Logs</Link>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, bgColor }: any) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 ${bgColor} rounded-xl`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default AdminDashboard;
