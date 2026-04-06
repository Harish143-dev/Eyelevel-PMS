import React, { useState, useEffect } from 'react';
import api from '../../services/api/axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import Avatar from '../../components/Avatar';

const WorkloadPage: React.FC = () => {
  const [workload, setWorkload] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchGlobalWorkload();
  }, []);

  const fetchGlobalWorkload = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/analytics/workload');
      setWorkload(res.data.workload);
    } catch (err) {
      console.error('Failed to load global workload', err);
      toast.error('Failed to load workload data');
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = workload.map((w: any) => ({
    name: w.user.name,
    activeTasks: w.activeTasks,
  }));

  return (
    <div className="space-y-6 text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl border border-indigo-500/20">
          <Activity size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-text-main">Global Workload Dashboard</h1>
          <p className="text-text-muted text-lg">See how busy your team members are across all projects.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center flex-col items-center h-64 gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-text-muted font-medium animate-pulse">Analyzing workload...</p>
        </div>
      ) : workload.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center text-text-muted">
          No active tasks assigned to anyone.
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b-0">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Users size={20} className="text-indigo-500" /> Active Tasks by Employee
                </CardTitle>
                <CardDescription>Number of ongoing/pending tasks across all projects</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--color-border)" opacity={0.5} />
                    <XAxis type="number" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '12px', color: 'var(--color-text-main)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                      itemStyle={{ color: 'var(--color-text-main)', fontWeight: 500 }}
                      cursor={{ fill: 'var(--color-primary)', opacity: 0.05 }}
                    />
                    <Bar dataKey="activeTasks" name="Active Tasks" fill="var(--color-indigo-500, #6366f1)" radius={[0, 4, 4, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workload Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workload.map((w, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-background hover:border-indigo-500/50 transition-colors shadow-sm">
                    <Avatar name={w.user.name} color={w.user.avatarColor} size={48} />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-text-main truncate text-lg">{w.user.name}</p>
                      <p className="text-xs text-text-muted truncate mt-0.5">
                        {w.user.department?.name ? w.user.department.name : w.user.designation || 'Team Member'}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="bg-indigo-500/10 text-indigo-500 text-xs font-bold px-2 py-1 rounded-full border border-indigo-500/20">
                          {w.activeTasks} Tasks
                        </span>
                        <span className="text-xs text-text-muted truncate">in {w.projects.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
};

export default WorkloadPage;
