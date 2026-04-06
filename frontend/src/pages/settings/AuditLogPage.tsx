import React, { useState, useEffect } from 'react';
import api from '../../services/api/axios';
import { RefreshCcw, Search, Filter } from 'lucide-react';

interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  ipAddress: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarColor: string;
  };
}

const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/activity?page=${page}&limit=50`);
      setLogs(res.data.activities);
      setTotalPages(res.data.pagination.pages);
    } catch (error) {
      console.error('Failed to fetch audit logs', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (page === 1) fetchLogs();
    else setPage(1);
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.description && log.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Security Audit Log</h1>
          <p className="text-gray-500 text-sm mt-1">Comprehensive tracking of all read/write actions across the workspace.</p>
        </div>
        <button 
          onClick={handleRefresh}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700 transition"
        >
          <RefreshCcw className={isLoading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search events, users, or targets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>
          <button className="flex items-center space-x-2 text-gray-600 hover:text-primary">
            <Filter />
            <span>Advanced Filters</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
              <tr>
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">Actor</th>
                <th className="px-6 py-3">IP Address</th>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">Entity Type</th>
                <th className="px-6 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Loading audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No activity logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 whitespace-nowrap text-xs">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: log.user.avatarColor || '#6366f1' }}
                        >
                          {log.user.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-800">{log.user.name}</span>
                          <span className="text-[10px] text-gray-500">{log.user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-gray-500">
                      {log.ipAddress || 'Internal Web'}
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex bg-gray-100 text-gray-700 font-mono text-xs px-2 py-1 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      {log.entityType}
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs truncate max-w-xs" title={log.description || ''}>
                      {log.description || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 flex justify-between items-center border-t border-gray-200 bg-gray-50">
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <div className="space-x-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button 
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogPage;
