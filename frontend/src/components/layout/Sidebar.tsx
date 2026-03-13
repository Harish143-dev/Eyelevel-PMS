import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks/useRedux';
import { logout } from '../../store/slices/authSlice';
import Avatar from '../Avatar';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  ClipboardList,
  Activity,
  LogOut,
  ChevronLeft,
  Menu,
  UserCircle,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/auth/login');
  };

  const adminLinks = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/projects', icon: FolderKanban, label: 'Projects' },
    { to: '/users', icon: Users, label: 'Users' },
    { to: '/activity', icon: Activity, label: 'Activity Logs' },
    { to: '/profile', icon: UserCircle, label: 'Profile' },
  ];

  const userLinks = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/projects', icon: FolderKanban, label: 'My Projects' },
    { to: '/tasks', icon: ClipboardList, label: 'My Tasks' },
    { to: '/profile', icon: UserCircle, label: 'Profile' },
  ];

  const links = user?.role === 'admin' ? adminLinks : userLinks;

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-40 ${collapsed ? 'w-[68px]' : 'w-[240px]'
        }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200">
        {!collapsed && (
          <span className="text-lg font-bold text-indigo-600 tracking-tight">Eyelevel PM</span>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            <link.icon size={20} className="flex-shrink-0" />
            {!collapsed && <span>{link.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-200 p-3 bg-gray-50/50">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <Link to="/profile" className="flex items-center gap-3 flex-1 min-w-0 group">
            {user && <Avatar name={user.name} color={user.avatarColor} size={32} />}
            {!collapsed && user && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                  {user.name}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 truncate">
                  {user.role}
                </p>
              </div>
            )}
          </Link>
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
