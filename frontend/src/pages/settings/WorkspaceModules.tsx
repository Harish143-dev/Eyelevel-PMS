import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { useAppDispatch } from '../../hooks/useRedux';
import { getMe } from '../../store/slices/authSlice';
import { 
  FolderKanban, ListTodo, Clock, MessagesSquare, Calendar, Users, Palmtree, 
  BarChart3, Handshake, Sliders, Receipt, History, Activity, LayoutGrid, Zap, Save, AlertTriangle
} from 'lucide-react';

interface SubFeature {
  key: string;
  label: string;
  description: string;
}

interface ModuleEntry {
  id: string;
  icon: any;
  label: string;
  description: string;
  color: string;
  subFeatures?: SubFeature[];
}

const CORE_MODULES: ModuleEntry[] = [
  {
    id: 'projectManagement',
    icon: FolderKanban,
    label: 'Project Management',
    description: 'Manage projects with Kanban boards, milestones, and team collaboration.',
    color: '#6366f1',
    subFeatures: [
      { key: 'kanban', label: 'Kanban Boards', description: 'Visual drag-and-drop task boards per project.' },
      { key: 'gantt', label: 'Gantt / Timeline', description: 'Timeline view for project planning.' },
      { key: 'milestones', label: 'Milestones', description: 'Track major project checkpoints.' },
      { key: 'templates', label: 'Project Templates', description: 'Reusable project structure templates.' },
      { key: 'analytics', label: 'Project Analytics', description: 'Visual charts and data reports on project health.' },
    ],
  },
  {
    id: 'taskManagement',
    icon: ListTodo,
    label: 'Task Management',
    description: 'Assign, track and prioritize work items across the organization.',
    color: '#10b981',
    subFeatures: [
      { key: 'myTasks', label: 'My Tasks View', description: 'Personal task list for each employee.' },
      { key: 'customWorkflows', label: 'Custom Workflows', description: 'Define custom status columns per project.' },
      { key: 'taskDependencies', label: 'Task Dependencies', description: 'Link tasks with blocking relationships.' },
    ],
  },
  {
    id: 'timeTracking',
    icon: Clock,
    label: 'Time Tracking',
    description: 'Log work hours, generate time reports, and track productivity.',
    color: '#f59e0b',
    subFeatures: [
      { key: 'timeLogs', label: 'Manual Time Logs', description: 'Let employees manually log time spent per task.' },
      { key: 'timeReports', label: 'Time Reports', description: 'Generate time utilization reports by user or project.' },
    ],
  },
  {
    id: 'teamChat',
    icon: MessagesSquare,
    label: 'Team Chat',
    description: 'Built-in messaging for direct and group communications.',
    color: '#3b82f6',
    subFeatures: [
      { key: 'directMessages', label: 'Direct Messages', description: 'Private 1-on-1 conversations between team members.' },
      { key: 'groupChannels', label: 'Group Channels', description: 'Project-level or department-wide channels.' },
    ],
  },
  {
    id: 'calendar',
    icon: Calendar,
    label: 'Calendar',
    description: 'Visualize deadlines, events, and team schedules in one place.',
    color: '#ec4899',
    subFeatures: [
      { key: 'deadlineView', label: 'Deadline View', description: 'Show upcoming task and project due dates.' },
      { key: 'eventScheduling', label: 'Event Scheduling', description: 'Create and share custom team events.' },
    ],
  },
  {
    id: 'hrManagement',
    icon: Users,
    label: 'HR Management',
    description: 'Manage the employee directory, departments, and onboarding.',
    color: '#14b8a6',
    subFeatures: [
      { key: 'employeeDirectory', label: 'Employee Directory', description: 'Searchable directory of all staff with profiles.' },
      { key: 'departments', label: 'Departments', description: 'Organize employees into functional departments.' },
      { key: 'payroll', label: 'Payroll Module', description: 'Basic payroll tracking and salary records.' },
    ],
  },
  {
    id: 'leaveManagement',
    icon: Palmtree,
    label: 'Leave Management',
    description: 'Handle leave requests, approvals, and holiday policies.',
    color: '#8b5cf6',
    subFeatures: [
      { key: 'leaveRequests', label: 'Leave Requests', description: 'Employees can submit and track leave applications.' },
      { key: 'leaveApprovals', label: 'Manager Approvals', description: 'Managers can approve or reject leave requests.' },
    ],
  },
  {
    id: 'performance',
    icon: BarChart3,
    label: 'Performance Reviews',
    description: 'Run KPI reviews, self-assessments, and employee growth tracking.',
    color: '#f97316',
    subFeatures: [
      { key: 'kpiReviews', label: 'KPI Reviews', description: 'Structured review cycles with scoring.' },
      { key: 'selfAssessments', label: 'Self-Assessments', description: 'Allow employees to evaluate their own performance.' },
    ],
  },
];

const FEATURE_FLAGS: ModuleEntry[] = [
  {
    id: 'clientPortal',
    icon: Handshake,
    label: 'Client Portal',
    description: 'Give external clients read-only access to their project status.',
    color: '#06b6d4',
  },
  {
    id: 'customFields',
    icon: Sliders,
    label: 'Custom Fields',
    description: 'Add custom metadata fields to tasks, projects, and employees.',
    color: '#6366f1',
  },
  {
    id: 'financials',
    icon: Receipt,
    label: 'Invoices & Billing',
    description: 'Track client invoices, payment status, and subscriptions.',
    color: '#22c55e',
  },
  {
    id: 'auditLogs',
    icon: History,
    label: 'Audit Logs',
    description: 'Keep a comprehensive history of major changes and deletions.',
    color: '#64748b',
  },
  {
    id: 'activityMonitoring',
    icon: Activity,
    label: 'Activity Monitoring',
    description: 'Real-time tracking of employee sessions, active/idle status, and automated productivity summaries.',
    color: '#f43f5e',
  },
];

const WorkspaceModules: React.FC = () => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [savedFeatures, setSavedFeatures] = useState<Record<string, boolean>>({});
  const [isDirty, setIsDirty] = useState(false);

  // BUG-006: Block browser tab close / hard refresh when unsaved
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      // BUG-002: Fetch directly from the settings API — do NOT rely on redux auth state
      // which may have stale data or not yet reflect the just-saved features.
      const res = await api.get('/settings/company');
      const loaded = res.data.company?.features || {};
      setFeatures(loaded);
      setSavedFeatures(loaded);
      setIsDirty(false);
    } catch (error) {
      toast.error('Failed to load module settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const isFeatureEnabled = (key: string): boolean => {
    if (features[key] === false) return false;
    return true; // Default true if not explicitly set to false
  };

  const handleToggleModule = (moduleId: string) => {
    setFeatures(prev => {
      const next = { ...prev, [moduleId]: !isFeatureEnabled(moduleId) };
      setIsDirty(JSON.stringify(next) !== JSON.stringify(savedFeatures));
      return next;
    });
  };

  const handleToggleSubFeature = (subKey: string) => {
    setFeatures(prev => {
      const next = { ...prev, [subKey]: !isFeatureEnabled(subKey) };
      setIsDirty(JSON.stringify(next) !== JSON.stringify(savedFeatures));
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.patch('/settings/company/features', { features });
      toast.success('Module settings updated');
      // BUG-002 Fix: Re-fetch from DB to confirm actual persisted state.
      // Using fetchSettings() guarantees the UI reflects what's truly in the DB.
      await fetchSettings();
      // Also refresh auth/navbar so sidebar links update immediately
      dispatch(getMe());
    } catch (error) {
      toast.error('Failed to update module settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setFeatures(savedFeatures);
    setIsDirty(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center flex-col items-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-text-muted">Loading modules...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left max-w-5xl mx-auto">
      {/* BUG-005 Fix: Sticky unsaved-changes bar always visible while editing */}
      {isDirty && (
        <div className="sticky top-0 z-30 flex items-center justify-between gap-4 px-5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-sm shadow-md animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertTriangle size={16} />
            <span className="text-sm font-semibold">You have unsaved changes</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDiscard}
              className="text-xs font-semibold text-text-muted hover:text-text-main px-3 py-1.5 rounded-lg transition-colors"
            >
              Discard
            </button>
            <Button onClick={handleSave} isLoading={isSaving} size="sm" leftIcon={<Save size={14} />}>
              Save Changes
            </Button>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-text-main">Modules & Features</h1>
        <p className="mt-1 text-sm text-text-muted">
          Enable or disable core modules or specific features to tailor the workspace to your needs. Disabling a module hides it from the UI but does not delete its data.
        </p>
      </div>

      <Card>
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid size={20} className="text-primary" />
            Core Platform Modules
          </CardTitle>
          <CardDescription className="mt-1">
            Major sections of the application block.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5 p-0 sm:p-5">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CORE_MODULES.map(module => (
              <div 
                key={module.id}
                className={`border rounded-xl transition-all overflow-hidden ${
                  isFeatureEnabled(module.id) 
                    ? 'border-primary/30 bg-primary/5 shadow-sm shadow-primary/5' 
                    : 'border-border bg-background'
                }`}
              >
                {/* Module Header Toggle */}
                <div 
                  className="p-4 flex items-start gap-4 cursor-pointer hover:bg-surface transition-colors"
                  onClick={() => handleToggleModule(module.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <module.icon size={18} style={{ color: isFeatureEnabled(module.id) ? module.color : '#94a3b8' }} />
                      <h3 className={`font-bold text-sm ${isFeatureEnabled(module.id) ? 'text-text-main' : 'text-text-muted'}`}>
                        {module.label}
                      </h3>
                    </div>
                    <p className={`text-xs ${isFeatureEnabled(module.id) ? 'text-text-muted' : 'text-text-muted/60'}`}>
                      {module.description}
                    </p>
                  </div>
                  <div className="pt-1">
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${isFeatureEnabled(module.id) ? 'bg-primary' : 'bg-surface border border-border'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${isFeatureEnabled(module.id) ? 'left-[22px]' : 'left-0.5 bg-text-muted/50'}`} />
                    </div>
                  </div>
                </div>

                {/* Sub Features (Collapsible) */}
                {isFeatureEnabled(module.id) && module.subFeatures && (
                  <div className="px-4 pb-4 pt-2 border-t border-border/50 bg-background/50">
                    <h4 className="text-[10px] uppercase font-bold text-text-muted tracking-wider mb-3 pl-7">Detailed Features</h4>
                    <div className="space-y-3 pl-7">
                      {module.subFeatures.map(sub => (
                        <label key={sub.key} className="flex items-start gap-2 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={isFeatureEnabled(sub.key)}
                            onChange={() => handleToggleSubFeature(sub.key)}
                            className="mt-0.5 w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary bg-background"
                          />
                          <div>
                            <p className="text-sm font-medium text-text-main group-hover:text-primary transition-colors">{sub.label}</p>
                            <p className="text-xs text-text-muted leading-tight">{sub.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="flex items-center gap-2">
             <Zap size={20} className="text-warning" />
             Premium Extras & Flags
          </CardTitle>
          <CardDescription className="mt-1">
            Additional cross-cutting capabilities.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {FEATURE_FLAGS.map(flag => (
                <div 
                  key={flag.id}
                  className={`border rounded-xl transition-all p-4 flex items-start gap-3 cursor-pointer hover:bg-surface ${
                    isFeatureEnabled(flag.id) ? 'border-primary/30 bg-primary/5' : 'border-border bg-background'
                  }`}
                  onClick={() => handleToggleModule(flag.id)}
                >
                  <flag.icon size={20} style={{ color: isFeatureEnabled(flag.id) ? flag.color : '#94a3b8' }} className="shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-sm ${isFeatureEnabled(flag.id) ? 'text-text-main' : 'text-text-muted'}`}>
                      {flag.label}
                    </h3>
                    <p className={`text-xs mt-0.5 ${isFeatureEnabled(flag.id) ? 'text-text-muted' : 'text-text-muted/60'}`}>
                      {flag.description}
                    </p>
                  </div>
                  <div className="pt-1">
                    <input 
                      type="checkbox" 
                      checked={isFeatureEnabled(flag.id)}
                      readOnly
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-background cursor-pointer pointer-events-none"
                    />
                  </div>
                </div>
             ))}
           </div>
        </CardContent>
        <CardFooter className="border-t border-border mt-4 justify-end gap-3">
           {isDirty && (
             <button
               onClick={handleDiscard}
               className="text-sm font-semibold text-text-muted hover:text-text-main px-4 py-2 rounded-lg border border-border transition-colors"
             >
               Discard
             </button>
           )}
           <Button onClick={handleSave} isLoading={isSaving} leftIcon={<Save size={15} />}>
            Save Module Selections
          </Button>
        </CardFooter>
      </Card>
      
    </div>
  );
};

export default WorkspaceModules;
