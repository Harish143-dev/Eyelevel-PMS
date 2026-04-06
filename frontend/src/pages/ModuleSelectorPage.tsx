import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { setActiveModule } from '../store/slices/moduleSlice';
import { FolderKanban, Users, Rocket, Sparkles, ArrowRight, LogOut, Settings } from 'lucide-react';
import { logout } from '../store/slices/authSlice';
import Avatar from '../components/Avatar';
import { ThemeToggle } from '../components/ui/ThemeToggle';

const modules = [
  {
    key: 'pm' as const,
    title: 'Project Management',
    description: 'Manage projects, tasks, milestones, team collaboration, time tracking, and analytics.',
    icon: FolderKanban,
    color: '#6366f1',
    gradient: 'from-indigo-500 to-violet-600',
    features: ['Kanban Boards', 'Task Tracking', 'Team Chat', 'Time Reports', 'Analytics'],
    available: true,
  },
  {
    key: 'hr' as const,
    title: 'HR Management',
    description: 'Manage employees, departments, leave requests, and organizational structure.',
    icon: Users,
    color: '#10b981',
    gradient: 'from-emerald-500 to-teal-600',
    features: ['Employee Directory', 'Departments', 'Leave Management', 'HR Dashboard'],
    available: true,
  },
  {
    key: null,
    title: 'More Coming Soon',
    description: 'Finance, Inventory, CRM, and more modules are on the way.',
    icon: Rocket,
    color: '#94a3b8',
    gradient: 'from-slate-400 to-slate-500',
    features: ['Finance', 'Inventory', 'CRM', 'Custom Modules'],
    available: false,
  },
];

const ModuleSelectorPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  // Read company feature flags
  const companyFeatures = (user as any)?.company?.features as Record<string, boolean> | undefined;
  const isFeatureEnabled = (key: string): boolean => {
    if (companyFeatures && companyFeatures[key] === false) return false;
    return true;
  };

  // Dynamically set module availability based on feature flags
  const dynamicModules = modules.map((mod) => {
    if (mod.key === 'pm') {
      return { ...mod, available: isFeatureEnabled('projectManagement') };
    }
    if (mod.key === 'hr') {
      return { ...mod, available: isFeatureEnabled('hrManagement') };
    }
    return mod;
  });

  const handleSelectModule = (moduleKey: 'pm' | 'hr') => {
    // BUG-003 Fix: Check if the module is actually enabled before navigating.
    // The card click handler already checks `mod.available` but this provides a safety net.
    const moduleFeatureKey = moduleKey === 'pm' ? 'projectManagement' : 'hrManagement';
    if (!isFeatureEnabled(moduleFeatureKey)) {
      import('react-hot-toast').then(({ default: toast }) =>
        toast.error('This module has been disabled by your administrator.')
      );
      return;
    }
    dispatch(setActiveModule(moduleKey));
    if (moduleKey === 'pm') {
      navigate('/pm');
    } else {
      navigate('/hr');
    }
  };

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-surface/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <img
            src={user?.company?.settings?.logoUrl || "/eyelevel_logo.png"}
            alt="Workspace Logo"
            className="max-h-10 w-auto object-contain brightness-100 dark:brightness-110"
            onError={(e) => {
              e.currentTarget.src = "/eyelevel_logo.png";
              e.currentTarget.onerror = null;
            }}
          />
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button
            onClick={() => navigate('/settings/preferences')}
            className="p-2 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition-colors"
            title="System Settings"
          >
            <Settings size={20} />
          </button>
          {user && (
            <div className="flex items-center gap-3">
              <Avatar name={user.name} color={user.avatarColor} size={32} />
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-text-main">{user.name}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{user.role.replace('_', ' ')}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Welcome */}
        <div className="text-center mb-12 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
            <Sparkles size={14} />
            Welcome back, {user?.name?.split(' ')[0] || 'User'}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-text-main mb-4 tracking-tight">
            Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-500">Workspace</span>
          </h1>
          <p className="text-lg text-text-muted max-w-lg mx-auto">
            Select a module to get started. Each workspace has its own dashboard, tools, and features.
          </p>
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
          {dynamicModules.map((mod, idx) => (
            <div
              key={idx}
              onClick={() => mod.available && mod.key && handleSelectModule(mod.key)}
              className={`group relative overflow-hidden rounded-2xl border transition-all duration-500 ${
                mod.available
                  ? 'border-border/50 hover:border-transparent hover:shadow-2xl hover:shadow-primary/10 cursor-pointer hover:-translate-y-2'
                  : 'border-border/30 opacity-60 cursor-not-allowed'
              }`}
            >
              {/* Gradient Header */}
              <div className={`h-36 bg-gradient-to-br ${mod.gradient} relative overflow-hidden flex items-center justify-center`}>
                <div className="absolute inset-0 bg-black/10" />
                <mod.icon size={56} className="text-white/90 relative z-10 group-hover:scale-110 transition-transform duration-500" />
                
                {/* Decorative circles */}
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />

                {!mod.available && mod.key === null && (
                  <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/30 backdrop-blur-sm rounded-full text-white text-[10px] font-bold uppercase tracking-wider">
                    Coming Soon
                  </div>
                )}
                {!mod.available && mod.key !== null && (
                  <div className="absolute top-3 right-3 px-2.5 py-1 bg-red-500/70 backdrop-blur-sm rounded-full text-white text-[10px] font-bold uppercase tracking-wider">
                    Disabled by Admin
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-6 bg-surface">
                <h3 className="text-xl font-bold text-text-main mb-2 flex items-center justify-between">
                  {mod.title}
                  {mod.available && (
                    <ArrowRight size={18} className="text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                  )}
                </h3>
                <p className="text-sm text-text-muted mb-4 leading-relaxed">
                  {mod.description}
                </p>

                {/* Feature Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {mod.features.map((feat) => (
                    <span
                      key={feat}
                      className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-background border border-border/50 text-text-muted"
                    >
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-text-muted border-t border-border/30">
        EyeLevel Management Platform &middot; v2.0
      </footer>
    </div>
  );
};

export default ModuleSelectorPage;
