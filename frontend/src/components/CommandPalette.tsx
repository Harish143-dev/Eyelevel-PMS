import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/useRedux';
import { Search, LayoutDashboard, Users, FolderKanban, Briefcase, FileText, CheckSquare, Settings, Command } from 'lucide-react';
import { isAdminOrManager, isStaff, isAdmin } from '../constants/roles';

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const allCommands = [
    { id: 'dashboard', title: 'Go to Home / Module Selector', icon: LayoutDashboard, path: '/' },
    { id: 'pm-dashboard', title: 'Project Management Dashboard', icon: LayoutDashboard, path: '/pm' },
    { id: 'pm-projects', title: 'Projects', icon: FolderKanban, path: '/pm/projects' },
    { id: 'pm-calendar', title: 'Calendar', icon: FileText, path: '/pm/calendar' },
    { id: 'pm-todo', title: 'Personal To-Do', icon: CheckSquare, path: '/pm/todo' },
    { id: 'pm-time', title: 'Time Reports', icon: Settings, path: '/pm/time-reports' },
    { id: 'templates', title: 'Project Templates', icon: FileText, path: '/pm/templates', requireAdminOrManager: true },
    
    // HR
    { id: 'hr-dashboard', title: 'HR Dashboard', icon: Briefcase, path: '/hr', requireHR: true },
    { id: 'hr-leaves', title: 'Leave Management', icon: FileText, path: '/hr/leaves' }, // usually for everyone to apply leaves
    { id: 'hr-payroll', title: 'Payroll', icon: Briefcase, path: '/hr/payroll', requireHR: true },
    { id: 'hr-performance', title: 'Performance', icon: Briefcase, path: '/hr/performance', requireHR: true },
    
    // Admin
    { id: 'admin-users', title: 'User Management', icon: Users, path: '/admin/users', requireAdmin: true },
    { id: 'admin-clients', title: 'Clients', icon: Users, path: '/admin/clients', requireAdmin: true },
    { id: 'admin-workload', title: 'Team Workload', icon: Users, path: '/admin/workload', requireAdmin: true },
    { id: 'admin-activity', title: 'Activity Logs', icon: FileText, path: '/admin/activity-logs', requireAdmin: true },
    { id: 'admin-monitor', title: 'Activity Monitor', icon: Settings, path: '/admin/activity-monitor', requireAdmin: true },
  ];

  const filteredCommands = allCommands.filter((cmd) => {
    if (cmd.requireAdmin && !isAdmin(user?.role)) return false;
    if (cmd.requireAdminOrManager && !isAdminOrManager(user?.role)) return false;
    if (cmd.requireHR && !isStaff(user?.role)) return false;
    
    if (!query) return true;
    return cmd.title.toLowerCase().includes(query.toLowerCase());
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        handleSelect(filteredCommands[selectedIndex].path);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-start pt-[15vh] px-4 backdrop-blur-sm bg-background/50 animate-in fade-in duration-200" onClick={() => setIsOpen(false)}>
      <div 
        className="w-full max-w-xl bg-surface border border-border shadow-2xl rounded-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-border gap-3">
          <Search className="text-text-muted" size={20} />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent border-none outline-none text-text-main placeholder:text-text-muted/50 text-base"
            placeholder="Search for pages or commands..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex items-center gap-1 text-xs text-text-muted font-medium bg-background px-2 py-1 rounded">
            <Command size={12} /> K
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-2 py-2">
          {filteredCommands.length === 0 ? (
            <div className="text-center py-8 text-text-muted text-sm">
              No results found for "{query}"
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-3 py-1 text-xs font-semibold text-text-muted/70 uppercase tracking-widest">
                Navigation
              </div>
              {filteredCommands.map((cmd, index) => {
                const Icon = cmd.icon;
                const active = index === selectedIndex;
                return (
                  <button
                    key={cmd.id}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
                      active ? 'bg-primary/10 text-primary' : 'hover:bg-background text-text-main'
                    }`}
                    onClick={() => handleSelect(cmd.path)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <Icon size={18} className={active ? 'text-primary' : 'text-text-muted'} />
                    <span className="font-semibold text-sm">{cmd.title}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
