import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchTimeLogs, deleteTimeLog } from '../store/slices/timeSlice';
import { fetchProjects } from '../store/slices/projectSlice';
import { Clock, Filter, Trash2, Briefcase } from 'lucide-react';
import Button from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Avatar from '../components/Avatar';
import Badge from '../components/ui/Badge';
import toast from 'react-hot-toast';
import CustomSelect from '../components/ui/CustomSelect';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { isAdminOrManager } from '../constants/roles';

const TimeReportsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { logs, isLoading } = useAppSelector((state: any) => state.time);
  const { projects } = useAppSelector((state: any) => state.projects);
  const { user: currentUser } = useAppSelector((state: any) => state.auth);
  const { users } = useAppSelector((state: any) => state.users);

  const [filters, setFilters] = useState({
    projectId: '',
    userId: '',
    startDate: '',
    endDate: '',
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchTimeLogs());
  }, [dispatch]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterValueChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    dispatch(fetchTimeLogs(filters));
  };

  const resetFilters = () => {
    const defaultFilters = { projectId: '', userId: '', startDate: '', endDate: '' };
    setFilters(defaultFilters);
    dispatch(fetchTimeLogs(defaultFilters));
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm(id);
  };

  const executeDelete = () => {
    if (deleteConfirm) {
      dispatch(deleteTimeLog(deleteConfirm));
      toast.success('Time log deleted');
      setDeleteConfirm(null);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    let res = '';
    if (h > 0) res += `${h}h `;
    if (m > 0 || h > 0) res += `${m}m `;
    if (!h) res += `${s}s`;
    return res.trim();
  };

  const getTotalTime = () => {
    const totalSeconds = logs.reduce((acc: number, log: any) => acc + (log.duration || 0), 0);
    return formatDuration(totalSeconds);
  };

  const isAdmin = isAdminOrManager(currentUser?.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-main">Time Reports</h1>
          <p className="text-text-muted mt-1">Track and analyze working hours across tasks and projects.</p>
        </div>
        <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl flex items-center gap-3">
          <Clock className="text-primary" size={20} />
          <div>
            <p className="text-[10px] uppercase font-bold text-primary tracking-wider leading-none">Total Time Engaged</p>
            <p className="text-xl font-mono font-bold text-text-main">{getTotalTime()}</p>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-text-muted mb-1 block">Project</label>
              <CustomSelect
                value={filters.projectId}
                onChange={(val) => handleFilterValueChange('projectId', val)}
                options={[
                  { value: '', label: 'All Projects' },
                  ...(projects?.map((p: any) => ({ value: p.id, label: p.name })) || [])
                ]}

              />
            </div>

            {isAdmin && (
              <div>
                <label className="text-xs font-semibold text-text-muted mb-1 block">Team Member</label>
                <CustomSelect
                  value={filters.userId}
                  onChange={(val) => handleFilterValueChange('userId', val)}
                  options={[
                    { value: '', label: 'All Members' },
                    ...(users?.map((u: any) => ({ value: u.id, label: u.name })) || [])
                  ]}
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-text-muted mb-1 block">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full text-sm border-border rounded-lg bg-background text-text-main py-2 px-3"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-text-muted mb-1 block">End Date</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full text-sm border-border rounded-lg bg-background text-text-main py-2 px-3"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={resetFilters}>Reset</Button>
            <Button variant="primary" size="sm" onClick={applyFilters} className="gap-2">
              <Filter size={14} /> Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Detailed Logs</CardTitle>
            {isLoading && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-background text-[10px] uppercase font-bold text-text-muted tracking-wider border-b border-border">
                  <th className="px-6 py-4">Task / Project</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-text-muted italic">
                      No time logs found for the selected criteria.
                    </td>
                  </tr>
                ) : (
                  logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-background/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-text-main">{log.task?.title || 'Unknown Task'}</p>
                        <p className="text-[10px] text-text-muted flex items-center gap-1">
                          <Briefcase size={10} /> {log.task?.project?.name || 'No Project'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {log.user ? (
                          <div className="flex items-center gap-2">
                            <Avatar name={log.user.name} color={log.user.avatarColor} size={24} />
                            <span className="text-xs font-medium text-text-main">{log.user.name}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Avatar name="?" color="#94a3b8" size={24} />
                            <span className="text-xs font-medium text-text-muted italic">Unknown User</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs text-text-main font-medium">{new Date(log.startTime).toLocaleDateString()}</span>
                          <span className="text-[10px] text-text-muted">
                            {new Date(log.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {log.endTime && ` - ${new Date(log.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="blue" className="font-mono">
                          {formatDuration(log.duration)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-text-muted italic max-w-xs truncate" title={log.description}>
                          {log.description || 'No description'}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(isAdmin || log.userId === currentUser?.id) && (
                          <button
                            onClick={() => handleDelete(log.id)}
                            className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={executeDelete}
        title="Delete Time Log"
        message="Are you sure you want to delete this time log?"
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default TimeReportsPage;
