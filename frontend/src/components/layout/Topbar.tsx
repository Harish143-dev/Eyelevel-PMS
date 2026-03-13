import React from 'react';
import { Search, Bell } from 'lucide-react';
import { useAppSelector } from '../../hooks/useRedux';
import Avatar from '../Avatar';

interface TopbarProps {
  collapsed: boolean;
}

const Topbar: React.FC<TopbarProps> = ({ collapsed }) => {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-30 transition-all duration-300 ${
        collapsed ? 'left-[68px]' : 'left-[240px]'
      }`}
    >
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search projects, tasks..."
          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4 ml-4">
        <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {user && (
          <div className="flex items-center gap-2">
            <Avatar name={user.name} color={user.avatarColor} size={32} />
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
