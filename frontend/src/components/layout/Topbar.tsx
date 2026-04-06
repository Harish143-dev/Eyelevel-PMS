import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Check, X, Menu, Settings } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/useRedux';
import Avatar from '../Avatar';
import { fetchNotifications, markAsRead, markAllAsRead, deleteNotification } from '../../store/slices/notificationSlice';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api/axios';
import { ThemeToggle } from '../ui/ThemeToggle';

interface TopbarProps {
  collapsed: boolean;
  onMenuToggle?: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ collapsed, onMenuToggle }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { notifications, unreadCount } = useAppSelector((state) => state.notifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ projects: any[], tasks: any[] }>({ projects: [], tasks: [] });
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    dispatch(fetchNotifications({ page: 1, limit: 10 }));
  }, [dispatch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        try {
          const { data } = await api.get(`/search?q=${searchQuery}`);
          setSearchResults(data);
          setShowSearchResults(true);
        } catch (error) {
          console.error('Search failed:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults({ projects: [], tasks: [] });
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleMarkAllRead = () => {
    dispatch(markAllAsRead());
  };

  const handleNotificationClick = (id: string, isRead: boolean) => {
    if (!isRead) {
      dispatch(markAsRead(id));
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(deleteNotification(id));
  };

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-surface/95 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-4 md:px-6 z-30 transition-all duration-300 w-full md:w-auto ${collapsed ? 'md:left-[68px]' : 'md:left-[240px]'
        }`}
    >
      {/* Mobile Menu Button */}
      <button
        onClick={onMenuToggle}
        className="p-2 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition-colors md:hidden mr-2"
      >
        <Menu size={22} />
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-md hidden md:block" ref={searchRef}>
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search projects, tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
          className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-full text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-text-muted hover:bg-background"
        />

        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {showSearchResults && (searchQuery.length >= 2) && (
          <div className="absolute left-0 top-full mt-3 w-full bg-surface border border-border rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300 text-left">
            <div className="max-h-[70vh] overflow-y-auto custom-scrollbar p-3">

              {/* Projects */}
              {searchResults.projects.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-3 mb-1">Projects</h4>
                  {searchResults.projects.map(project => (
                    <button
                      key={project.id}
                      onClick={() => {
                        navigate(`/pm/projects/${project.id}`);
                        setShowSearchResults(false);
                        setSearchQuery('');
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-primary/10 rounded-lg transition-colors group"
                    >
                      <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                        {project.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-main group-hover:text-primary">{project.name}</p>
                        <p className="text-[10px] text-text-muted capitalize">{project.category || 'No category'} • {project.status.replace('_', ' ')}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Tasks */}
              {searchResults.tasks.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-3 mb-1">Tasks</h4>
                  {searchResults.tasks.map(task => (
                    <button
                      key={task.id}
                      onClick={() => {
                        navigate(`/pm/projects/${task.projectId}`);
                        setShowSearchResults(false);
                        setSearchQuery('');
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-primary/10 rounded-lg transition-colors group"
                    >
                      <div className={`w-2 h-2 rounded-full ${task.status === 'completed' ? 'bg-success' : 'bg-warning'}`} />
                      <div>
                        <p className="text-sm font-semibold text-text-main group-hover:text-primary">{task.title}</p>
                        <p className="text-[10px] text-text-muted">In {task.project.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchResults.projects.length === 0 && searchResults.tasks.length === 0 && !isSearching && (
                <div className="p-8 text-center">
                  <p className="text-sm text-text-muted italic">No results found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 md:gap-4 ml-auto">
        <ThemeToggle />

        {!location.pathname.startsWith('/settings') && (
          <button
            onClick={() => navigate('/settings/preferences')}
            className="p-2 rounded-full hover:bg-primary/10 text-text-muted hover:text-primary transition-colors"
            title="System Settings"
          >
            <Settings size={20} />
          </button>
        )}

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-full hover:bg-primary/10 text-text-muted hover:text-primary transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 max-w-[calc(100vw-2rem)] bg-surface border border-border rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="p-4 border-b border-border/50 flex justify-between items-center bg-background/30 rounded-t-2xl">
                <h3 className="text-sm font-semibold text-text-main">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-primary hover:text-primary-hover font-medium flex items-center gap-1"
                  >
                    <Check size={14} /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-text-muted">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif.id, notif.isRead)}
                      className={`p-3 border-b border-border/50 hover:bg-background cursor-pointer relative group ${!notif.isRead ? 'bg-primary/5' : ''}`}
                    >
                      <div className="flex justify-between items-start pr-6">
                        {notif.link ? (
                          <Link to={notif.link} className="block w-full">
                            <p className={`text-sm ${!notif.isRead ? 'text-text-main font-medium' : 'text-text-muted'}`}>
                              {notif.message}
                            </p>
                          </Link>
                        ) : (
                          <p className={`text-sm ${!notif.isRead ? 'text-text-main font-medium' : 'text-text-muted'}`}>
                            {notif.message}
                          </p>
                        )}
                        <button
                          onClick={(e) => handleDelete(e, notif.id)}
                          className="absolute right-2 top-3 text-text-muted opacity-0 group-hover:opacity-100 hover:text-danger transition-opacity"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <span className="text-xs text-text-muted mt-1 block">
                        {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2 border-t border-border bg-background text-center">
                <Link
                  to="/pm/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-bold text-primary hover:text-primary-hover transition-colors"
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-2">
            <Avatar name={user.name} color={user.avatarColor} size={32} />
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-text-main">{user.name}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
