import React, { useState, useEffect, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks/useRedux';
import { fetchProjects, fetchProjectById } from '../../store/slices/projectSlice';
import CustomSelect from '../../components/ui/CustomSelect';
import api from '../../services/api/axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { BarChart3, TrendingDown, Users, Download, TrendingUp, FileText, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { SkeletonDashboard } from '../../components/ui/Skeleton';

const ReportsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentProject, projects } = useAppSelector((state) => state.projects);
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const isStaff = ['manager', 'admin', 'hr'].includes(currentUser?.role || '');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [workload, setWorkload] = useState<any[]>([]);
  const [burndown, setBurndown] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Advanced reporting state
  const [activeTab, setActiveTab] = useState<'overview' | 'team'>('overview');
  const [teamComparison, setTeamComparison] = useState<any[]>([]);
  const [isTeamLoading, setIsTeamLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Date range filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const fetchAnalytics = useCallback(async (projectId: string) => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const [workloadRes, burndownRes] = await Promise.all([
        api.get(`/analytics/projects/${projectId}/workload`),
        api.get(`/analytics/projects/${projectId}/burndown`)
      ]);
      
      const formattedWorkload = workloadRes.data.workload.map((w: any) => ({
        name: w.user.name,
        completed: w.completed,
        pending: w.pending,
        total: w.total,
      }));
      
      setWorkload(formattedWorkload);
      setBurndown(burndownRes.data.burndown);
    } catch (err) {
      console.error('Failed to load analytics', err);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTeamComparison = useCallback(async () => {
    setIsTeamLoading(true);
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.get('/analytics/team-comparison', { params });
      setTeamComparison(res.data.comparison || []);
    } catch (err) {
      console.error('Failed to load team comparison', err);
      toast.error('Failed to load team comparison');
    } finally {
      setIsTeamLoading(false);
    }
  }, [startDate, endDate]);

  const handleProjectChange = (projectId: string) => {
    if (projectId) {
      setSelectedProjectId(projectId);
      dispatch(fetchProjectById(projectId));
    }
  };

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  useEffect(() => {
    if (currentProject && !selectedProjectId) {
      setSelectedProjectId(currentProject.id);
    }
  }, [currentProject, selectedProjectId]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchAnalytics(selectedProjectId);
    }
  }, [selectedProjectId, fetchAnalytics]);

  useEffect(() => {
    if (activeTab === 'team' && isStaff) fetchTeamComparison();
  }, [activeTab, fetchTeamComparison, isStaff]);

  // PDF Export using browser print
  const handleExportPDF = async () => {
    if (!selectedProjectId) {
      toast.error('Please select a project first');
      return;
    }

    setIsExporting(true);
    try {
      const params: any = { projectId: selectedProjectId };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/analytics/report-export', { params });
      const report = res.data.report;

      // Generate HTML report and open in new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Please allow popups to export PDF');
        return;
      }

      const statusLabels: Record<string, string> = {
        pending: 'Pending',
        ongoing: 'In Progress',
        in_review: 'In Review',
        completed: 'Completed',
        cancelled: 'Cancelled'
      };

      const priorityLabels: Record<string, string> = {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        critical: 'Critical'
      };

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${report.project.name} - Project Report</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e; padding: 40px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #6366f1; }
            .header h1 { font-size: 28px; color: #6366f1; margin-bottom: 4px; }
            .header p { color: #64748b; font-size: 14px; }
            .section { margin-bottom: 32px; }
            .section h2 { font-size: 20px; color: #1e293b; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
            .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center; }
            .stat-card .value { font-size: 28px; font-weight: 700; color: #6366f1; }
            .stat-card .label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
            th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            th { background: #f1f5f9; font-weight: 600; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
            tr:nth-child(even) { background: #fafbfc; }
            .badge { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 600; }
            .badge-pending { background: #fef3c7; color: #92400e; }
            .badge-ongoing { background: #dbeafe; color: #1e40af; }
            .badge-in_review { background: #ede9fe; color: #5b21b6; }
            .badge-completed { background: #d1fae5; color: #065f46; }
            .badge-cancelled { background: #fee2e2; color: #991b1b; }
            .badge-low { background: #e0f2fe; color: #0369a1; }
            .badge-medium { background: #fef3c7; color: #92400e; }
            .badge-high { background: #fed7aa; color: #c2410c; }
            .badge-critical { background: #fee2e2; color: #991b1b; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px; }
            .members-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
            .member-chip { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 12px; font-size: 13px; }
            .breakdown-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
            .breakdown-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
            @media print { body { padding: 20px; } .stats-grid { grid-template-columns: repeat(4, 1fr); } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${report.project.name}</h1>
            <p>Project Report | Generated on ${new Date(report.generatedAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
          </div>

          <div class="section">
            <h2>📋 Project Overview</h2>
            <table>
              <tr><td><strong>Owner</strong></td><td>${report.project.owner}</td></tr>
              <tr><td><strong>Status</strong></td><td><span class="badge badge-${report.project.status}">${report.project.status.replace('_', ' ')}</span></td></tr>
              <tr><td><strong>Start Date</strong></td><td>${report.project.startDate ? new Date(report.project.startDate).toLocaleDateString() : 'Not set'}</td></tr>
              <tr><td><strong>Deadline</strong></td><td>${report.project.deadline ? new Date(report.project.deadline).toLocaleDateString() : 'Not set'}</td></tr>
              <tr><td><strong>Description</strong></td><td>${report.project.description || 'No description'}</td></tr>
            </table>
          </div>

          <div class="section">
            <h2>📊 Summary</h2>
            <div class="stats-grid">
              <div class="stat-card"><div class="value">${report.summary.totalTasks}</div><div class="label">Total Tasks</div></div>
              <div class="stat-card"><div class="value">${report.summary.completedTasks}</div><div class="label">Completed</div></div>
              <div class="stat-card"><div class="value">${report.summary.completionRate}%</div><div class="label">Completion Rate</div></div>
              <div class="stat-card"><div class="value">${report.summary.overdueTasks}</div><div class="label">Overdue</div></div>
            </div>
            <div class="stats-grid">
              <div class="stat-card"><div class="value">${report.summary.totalHoursLogged}h</div><div class="label">Hours Logged</div></div>
              <div class="stat-card"><div class="value">${report.summary.milestonesCompleted}/${report.summary.milestonesTotal}</div><div class="label">Milestones</div></div>
            </div>
          </div>

          <div class="section">
            <h2>📈 Status Breakdown</h2>
            <div class="breakdown-grid">
              <div>
                ${Object.entries(report.statusBreakdown).map(([key, val]) => `
                  <div class="breakdown-item">
                    <span><span class="badge badge-${key}">${statusLabels[key] || key}</span></span>
                    <strong>${val}</strong>
                  </div>
                `).join('')}
              </div>
              <div>
                <h3 style="margin-bottom: 8px; font-size: 14px; color: #475569;">Priority Distribution</h3>
                ${Object.entries(report.priorityBreakdown).map(([key, val]) => `
                  <div class="breakdown-item">
                    <span><span class="badge badge-${key}">${priorityLabels[key] || key}</span></span>
                    <strong>${val}</strong>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="section">
            <h2>👥 Team Members</h2>
            <div class="members-list">
              ${report.project.members.map((m: any) => `
                <div class="member-chip">
                  <strong>${m.name}</strong>${m.designation ? ` &middot; ${m.designation}` : ''}${m.isProjectManager ? ' ⭐ PM' : ''}
                </div>
              `).join('')}
            </div>
          </div>

          ${report.milestones.length > 0 ? `
          <div class="section">
            <h2>🏁 Milestones</h2>
            <table>
              <thead><tr><th>Milestone</th><th>Status</th><th>Due Date</th></tr></thead>
              <tbody>
                ${report.milestones.map((m: any) => `
                  <tr>
                    <td>${m.title}</td>
                    <td><span class="badge badge-${m.status}">${m.status.replace('_', ' ')}</span></td>
                    <td>${m.dueDate ? new Date(m.dueDate).toLocaleDateString() : '—'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>` : ''}

          <div class="section">
            <h2>📝 Task List</h2>
            <table>
              <thead><tr><th>Task</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Due Date</th></tr></thead>
              <tbody>
                ${report.tasks.map((t: any) => `
                  <tr>
                    <td>${t.title}</td>
                    <td><span class="badge badge-${t.status}">${statusLabels[t.status] || t.status}</span></td>
                    <td><span class="badge badge-${t.priority}">${priorityLabels[t.priority] || t.priority}</span></td>
                    <td>${t.assignee}</td>
                    <td>${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>EyeLevel Project Management System &middot; Report generated automatically</p>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();

      // Wait for content to load then trigger print
      setTimeout(() => {
        printWindow.print();
      }, 500);

      toast.success('Report ready! Use Ctrl+P or the print dialog to save as PDF.');
    } catch (err) {
      console.error('Export failed', err);
      toast.error('Failed to generate report');
    } finally {
      setIsExporting(false);
    }
  };

  const tabs = [
    { key: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { key: 'team' as const, label: 'Team Comparison', icon: Users, show: isStaff },
  ].filter(t => t.show !== false);

  return (
    <div className="space-y-6 text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-xl border border-primary/20">
            <BarChart3 size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-main">Advanced Reports</h1>
            <p className="text-text-muted text-lg">
              Comprehensive insights{currentProject ? <> for <span className="font-semibold text-text-main">{currentProject.name}</span></> : ' across your projects'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-full md:w-56">
            <CustomSelect
              value={selectedProjectId}
              onChange={handleProjectChange}
              options={[
                { value: '', label: 'Select Project...' },
                ...projects
                  .filter(p => p.isMember || p.ownerId === currentUser?.id || isStaff)
                  .map(p => ({ value: p.id, label: p.name }))
              ]}
            />
          </div>
          {selectedProjectId && (
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              {isExporting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download size={16} />
              )}
              Export PDF
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-surface/50 rounded-xl border border-border/50 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-text-muted hover:text-text-main hover:bg-surface'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Date Range Filter (for team comparison) */}
      {activeTab === 'team' && (
        <Card>
          <CardContent className="flex items-center gap-4 py-3">
            <Filter size={16} className="text-text-muted" />
            <span className="text-sm font-medium text-text-muted">Date Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-background border border-border text-text-main text-sm"
            />
            <span className="text-text-muted">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-background border border-border text-text-main text-sm"
            />
            <button
              onClick={fetchTeamComparison}
              className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              Apply
            </button>
          </CardContent>
        </Card>
      )}

      {/* ===== OVERVIEW TAB ===== */}
      {activeTab === 'overview' && (
        <>
          {!selectedProjectId ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <FileText size={48} className="text-text-muted/30 mb-4" />
                <h3 className="text-lg font-medium text-text-main">Select a Project</h3>
                <p className="text-text-muted mt-1">Choose a project above to view detailed analytics and charts.</p>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <SkeletonDashboard />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Workload Chart */}
              <Card className="col-span-1 lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between pb-2 border-b-0">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl"><Users size={20} className="text-primary" /> Team Workload Distribution</CardTitle>
                    <CardDescription>Number of assigned tasks per team member</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px] w-full mt-2">
                    {workload.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={workload} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                          <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '12px', color: 'var(--color-text-main)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                            cursor={{ fill: 'var(--color-primary)', opacity: 0.05 }}
                          />
                          <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                          <Bar dataKey="completed" name="Completed" stackId="a" fill="var(--color-success)" radius={[0, 0, 4, 4]} />
                          <Bar dataKey="pending" name="Pending" stackId="a" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-text-muted font-medium bg-background/50 rounded-xl border border-dashed border-border/70">No task data available</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Burndown Chart */}
              <Card className="col-span-1 lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between pb-2 border-b-0">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl"><TrendingDown size={20} className="text-primary" /> Task Burndown (Cumulative)</CardTitle>
                    <CardDescription>Tracking total tasks created vs completed over time</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px] w-full mt-2">
                    {burndown.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={burndown} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                          <defs>
                            <linearGradient id="colorRemaining" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--color-warning)" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="var(--color-warning)" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} 
                            axisLine={false} 
                            tickLine={false}
                            tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            dy={10}
                          />
                          <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} dx={-10} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '12px', color: 'var(--color-text-main)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                            labelFormatter={(val) => new Date(val).toLocaleDateString()}
                          />
                          <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                          <Area type="monotone" dataKey="total" name="Total Tasks" stroke="var(--color-text-muted)" fillOpacity={0} strokeDasharray="5 5" strokeWidth={2} />
                          <Area type="monotone" dataKey="completed" name="Completed" stroke="var(--color-success)" fill="url(#colorCompleted)" strokeWidth={2} />
                          <Area type="monotone" dataKey="remaining" name="Remaining Tasks" stroke="var(--color-warning)" fill="url(#colorRemaining)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-text-muted font-medium bg-background/50 rounded-xl border border-dashed border-border/70">No task data available</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {/* ===== TEAM COMPARISON TAB ===== */}
      {activeTab === 'team' && (
        <>
          {isTeamLoading ? (
            <div className="flex justify-center flex-col items-center h-64 gap-3">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-text-muted font-medium animate-pulse">Loading team data...</p>
            </div>
          ) : (
            <>
              {/* Team Comparison Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <TrendingUp size={20} className="text-primary" /> Team Performance
                  </CardTitle>
                  <CardDescription>Tasks completed, created, and hours logged per team member</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] w-full">
                    {teamComparison.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={teamComparison.slice(0, 15)} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                          <XAxis dataKey="user.name" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} angle={-15} textAnchor="end" height={60} />
                          <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '12px', color: 'var(--color-text-main)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                          />
                          <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                          <Bar dataKey="tasksCompleted" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="tasksCreated" name="Created" fill="#6366f1" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="hoursLogged" name="Hours Logged" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-text-muted font-medium">No team data available</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Team Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Team Leaderboard</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">#</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Member</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Department</th>
                          <th className="text-right px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Completed</th>
                          <th className="text-right px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Created</th>
                          <th className="text-right px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamComparison.map((item, idx) => (
                          <tr key={item.user.id} className="border-b border-border/30 hover:bg-surface/50 transition-colors">
                            <td className="px-5 py-3 font-bold text-text-muted">{idx + 1}</td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                  style={{ backgroundColor: item.user.avatarColor || '#6366f1' }}
                                >
                                  {item.user.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium text-text-main">{item.user.name}</div>
                                  <div className="text-xs text-text-muted">{item.user.designation || '—'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-text-muted">{item.user.department?.name || '—'}</td>
                            <td className="px-5 py-3 text-right font-semibold text-success">{item.tasksCompleted}</td>
                            <td className="px-5 py-3 text-right font-semibold text-primary">{item.tasksCreated}</td>
                            <td className="px-5 py-3 text-right font-semibold text-warning">{item.hoursLogged}h</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {teamComparison.length === 0 && (
                      <div className="flex h-32 items-center justify-center text-text-muted">No team data available</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ReportsPage;
