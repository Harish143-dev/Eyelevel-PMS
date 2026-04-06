import { NavLink, useNavigate, Link, useLocation } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../../hooks/useRedux";
import { logout } from "../../store/slices/authSlice";
import { setActiveModule } from "../../store/slices/moduleSlice";
import Avatar from "../Avatar";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  ClipboardList,
  Activity,
  LogOut,
  ChevronLeft,
  Menu,
  Clock,
  CalendarDays,
  Building,
  BarChart3,
  X,
  ClipboardCheck,
  MessageSquare,
  Palmtree,
  FileStack,
  ArrowLeftRight,
  IndianRupee,
  Trophy,
  Briefcase,
  Trash2,
  Shield,
  Database,
  Settings2,
  Building2,
  ShieldCheck,
  Blocks,
  GitBranch,
  User
} from "lucide-react";
import { isAdmin, isAdminOrManager, isStaff } from "../../constants/roles";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user } = useAppSelector((state) => state.auth);
  const { activeModule } = useAppSelector((state) => state.module);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/auth/login");
  };

  const isSettings = location.pathname.startsWith('/settings');

  const handleSwitchModule = () => {
    if (isSettings) {
      if (activeModule === 'hr') navigate('/hr');
      else if (activeModule === 'pm') navigate('/pm');
      else navigate('/');
      return;
    }
    dispatch(setActiveModule(null));
    navigate("/");
  };

  const isManagerOrAdmin = isAdminOrManager(user?.role);
  const isHROrAdmin = isStaff(user?.role);

  // Read company features from Redux auth state
  const companyFeatures = (user as any)?.company?.features as Record<string, boolean> | undefined;
  const isFeatureEnabled = (key: string): boolean => {
    // If the feature is explicitly set to false, return false. Otherwise default to true.
    if (companyFeatures && companyFeatures[key] === false) return false;
    return true;
  };

  // Project Management links — feature-gated
  const isPMEnabled = isFeatureEnabled('projectManagement');
  const pmLinks = isPMEnabled ? [
    { to: "/pm", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/pm/projects", icon: FolderKanban, label: "Projects" },
    ...(isFeatureEnabled('calendar')
      ? [{ to: "/pm/calendar", icon: CalendarDays, label: "Calendar" }]
      : []),
    { to: "/pm/todo", icon: ClipboardList, label: "Personal To-Do" },
    ...(isFeatureEnabled('taskManagement')
      ? [{ to: "/pm/tasks", icon: ClipboardCheck, label: "My Tasks" }]
      : []),
    ...(isFeatureEnabled('teamChat')
      ? [{ to: "/pm/chat", icon: MessageSquare, label: "Team Chat" }]
      : []),
    ...(isAdmin(user?.role)
      ? [
          ...(isFeatureEnabled('auditLogs') ? [{ to: "/pm/activity", icon: Activity, label: "Activity Logs" }] : []),
          ...(isFeatureEnabled('activityMonitoring') ? [{ to: "/pm/live-monitoring", icon: ShieldCheck, label: "Live Monitoring" }] : [])
        ]
      : []),
    ...(isManagerOrAdmin && isFeatureEnabled('clientPortal')
      ? [{ to: "/pm/clients", icon: Briefcase, label: "Clients" }]
      : []),
    ...(isManagerOrAdmin && isFeatureEnabled('templates')
      ? [{ to: "/pm/templates", icon: FileStack, label: "Templates" }]
      : []),
    ...(isManagerOrAdmin
      ? [{ to: "/pm/trash", icon: Trash2, label: "Trash / Soft-Delete" }]
      : []),
    ...(isFeatureEnabled('timeTracking')
      ? [{ to: "/pm/time-reports", icon: Clock, label: "Time Reports" }]
      : []),
    ...(isFeatureEnabled('analytics')
      ? [{ to: "/pm/reports", icon: BarChart3, label: "Analytics" }]
      : []),
  ] : [];

  // HR Management links — feature-gated
  const isHREnabled = isFeatureEnabled('hrManagement');
  const hrLinks = isHREnabled ? [
    { to: "/hr", icon: LayoutDashboard, label: "Dashboard" },
    ...(isHROrAdmin
      ? [{ to: "/hr/employees", icon: Users, label: "Employees" }]
      : []),
    ...(isHROrAdmin
      ? [{ to: "/hr/departments", icon: Building, label: "Departments" }]
      : []),
    ...(isHROrAdmin && isFeatureEnabled('payroll')
      ? [{ to: "/hr/payroll", icon: IndianRupee, label: "Payroll" }]
      : []),
    ...(isFeatureEnabled('performance')
      ? [{ to: "/hr/performance", icon: Trophy, label: "Performance" }]
      : []),
    ...(isFeatureEnabled('leaveManagement')
      ? [{ to: "/hr/leaves", icon: Palmtree, label: "Leaves" }]
      : []),
  ] : [];

  // Settings Links (Rendered when isSettings is true)
  const isCompanyAdmin = isAdmin(user?.role);
  const navGroups = [
    {
      title: 'Personal',
      items: [
        { to: '/settings/profile', label: 'My Profile', icon: User, exact: true },
        { to: '/settings/preferences', label: 'System Preferences', icon: Settings2 },
      ]
    },
    ...(isCompanyAdmin ? [{
      title: 'Workspace',
      items: [
        { to: '/settings/workspace/general', label: 'General', icon: Building2 },
        { to: '/settings/workspace/security', label: 'Security & Auth', icon: ShieldCheck },
        { to: '/settings/workspace/modules', label: 'Modules & Features', icon: Blocks },
        { to: '/settings/workspace/workflows', label: 'Workflows', icon: GitBranch },
        { to: '/settings/workspace/leave', label: 'Leave Categories', icon: Palmtree },
      ]
    }] : []),
    ...(isCompanyAdmin ? [{
      title: 'User Management',
      items: [
        { to: '/settings/roles', label: 'Roles & Permissions', icon: Shield },
      ]
    }] : []),
    ...(isCompanyAdmin ? [{
      title: 'Advanced Data',
      items: [
        ...(isFeatureEnabled('customFields') ? [{ to: '/settings/custom-fields', label: 'Custom Fields', icon: FileStack }] : []),
        { to: '/settings/data', label: 'Data & Exports', icon: Database },
      ]
    }] : []),
  ];

  const mainLinks = isSettings ? [] : (activeModule === "hr" ? hrLinks : pmLinks);

  return (
    <>
      {/* Mobile Overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen bg-surface border-r border-border flex flex-col transition-all duration-300 z-40 ${collapsed
          ? "w-[68px] -translate-x-full md:translate-x-0"
          : "w-[240px] translate-x-0"
          }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-border">
          {!collapsed && (
            <img
              src={user?.company?.settings?.logoUrl || "/eyelevel_logo.png"}
              alt="Workspace Logo"
              className="max-h-10 w-auto object-contain brightness-100 dark:brightness-110"
              loading="lazy"
              onError={(e) => {
                // Fallback to default if custom URL breaks
                e.currentTarget.src = "/eyelevel_logo.png";
                e.currentTarget.onerror = null; // Prevent infinite loop if default also fails somehow
              }}
            />
          )}
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-background text-text-muted transition-colors"
          >
            {collapsed ? <Menu size={20} /> : (
              <>
                <ChevronLeft size={20} className="hidden md:block" />
                <X size={20} className="md:hidden" />
              </>
            )}
          </button>
        </div>

        {/* Module Indicator + Switch Button */}
        <div className="px-2 py-2">
          <button
            onClick={handleSwitchModule}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              collapsed ? "justify-center" : ""
            } ${
              isSettings 
                ? "text-slate-500 bg-slate-500/10 hover:bg-slate-500/20 border border-slate-500/30"
                : activeModule === "pm"
                ? "text-indigo-500 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/20"
                : "text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20"
            }`}
            title={isSettings ? "Back to App" : "Switch Module"}
          >
            {isSettings ? <ChevronLeft size={16} className="flex-shrink-0" /> : <ArrowLeftRight size={16} className="flex-shrink-0" />}
            {!collapsed && (
              <span>
                {isSettings ? "Back to App" : activeModule === "pm" ? "Project Mgmt" : "HR Mgmt"}
              </span>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-4 overflow-y-auto custom-scrollbar flex flex-col justify-start">
          {isSettings ? (
            <div className="space-y-6">
              {navGroups.map((group, idx) => (
                <div key={idx} className={collapsed ? "hidden" : "block"}>
                  <h3 className="px-3 mb-2 text-[11px] font-extrabold uppercase tracking-widest text-text-muted">
                    {group.title}
                  </h3>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = location.pathname.startsWith(item.to) || (item.exact && location.pathname === item.to);
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={() => {
                            if (window.innerWidth < 768) onToggle();
                          }}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            isActive
                              ? "bg-primary/10 text-primary shadow-sm shadow-primary/5"
                              : "text-text-muted hover:bg-background hover:text-text-main"
                          } ${collapsed ? "justify-center" : ""}`}
                        >
                          <item.icon size={18} className="flex-shrink-0" />
                          {!collapsed && <span>{item.label}</span>}
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              ))}
              {/* Show icons only when collapsed */}
              {collapsed && navGroups.map((group) => group.items.map((item) => {
                const isActive = location.pathname.startsWith(item.to) || (item.exact && location.pathname === item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => {
                      if (window.innerWidth < 768) onToggle();
                    }}
                    title={item.label}
                    className={`flex items-center justify-center gap-3 w-10 h-10 mb-2 mx-auto rounded-lg transition-all ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-text-muted hover:bg-background hover:text-text-main"
                    }`}
                  >
                    <item.icon size={18} />
                  </NavLink>
                );
              }))}
            </div>
          ) : (
            <div className="space-y-1">
              {mainLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/pm" || link.to === "/hr"}
                  onClick={() => {
                    if (window.innerWidth < 768) onToggle();
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                      ? "bg-primary/10 text-primary"
                      : "text-text-muted hover:bg-background hover:text-text-main"
                    } ${collapsed ? "justify-center" : ""}`
                  }
                >
                  <link.icon size={20} className="flex-shrink-0" />
                  {!collapsed && <span>{link.label}</span>}
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        {/* User Section */}
        <div className="border-t border-border p-3 bg-background/50">
          <div
            className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}
          >
            <Link
              to={activeModule === "pm" ? "/pm/profile" : "/hr/profile"}
              className={`flex items-center ${collapsed ? "" : "gap-3 flex-1"}  min-w-0 group`}
            >
              {user && (
                <Avatar name={user.name} color={user.avatarColor} size={32} />
              )}
              {!collapsed && user && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-main truncate group-hover:text-primary transition-colors">
                    {user.name}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted truncate">
                    {user.role.replace('_', ' ')}
                  </p>
                </div>
              )}
            </Link>
            {!collapsed && (
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
