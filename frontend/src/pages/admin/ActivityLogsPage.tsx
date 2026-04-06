import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchActivities } from '../../store/slices/dashboardSlice';
import { Card, CardContent } from '../../components/ui/Card';
import Avatar from '../../components/Avatar';
import Button from '../../components/ui/Button';
import { History, ChevronLeft, ChevronRight } from 'lucide-react';

const ActivityLogsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { activitiesData, isLoading } = useAppSelector((state) => state.dashboard);
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    dispatch(fetchActivities({ page, limit }));
  }, [dispatch, page]);

  if (isLoading && !activitiesData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const activities = activitiesData?.activities || [];
  const pagination = activitiesData?.pagination || { total: 0, pages: 1 };

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between mb-6">
        <div>
           <h1 className="text-3xl font-bold text-text-main flex items-center gap-2">
              <History size={32} className="text-primary" />
              System Activity Logs
           </h1>
           <p className="text-text-muted mt-1">Audit trail of all actions across the platform.</p>
        </div>
      </div>

      <Card>
         <CardContent className="p-0">
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                  <thead className="bg-background/50 border-b border-border uppercase text-[10px] font-bold text-text-muted tracking-wider">
                     <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">IP Address</th>
                        <th className="px-6 py-4">Action</th>
                        <th className="px-6 py-4">Entity</th>
                        <th className="px-6 py-4">Description</th>
                        <th className="px-6 py-4 text-right">Date & Time</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                     {activities.map((log: any) => (
                        <tr key={log.id} className="hover:bg-background/50 transition-colors">
                           <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                 <Avatar name={log.user.name} color={log.user.avatarColor} size={24} />
                                 <span className="font-medium text-text-main">{log.user.name}</span>
                              </div>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-text-muted font-mono text-xs">{log.ipAddress || 'Internal'}</span>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                 log.action.includes('CREATE') ? 'bg-success/15 text-success' :
                                 log.action.includes('DELETE') ? 'bg-danger/15 text-danger' :
                                 log.action.includes('UPDATE') ? 'bg-info/15 text-info' :
                                 'bg-background text-text-muted border border-border/50'
                              }`}>
                                 {log.action}
                              </span>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-text-muted font-semibold text-xs tracking-tight">{log.entityType}</span>
                           </td>
                           <td className="px-6 py-4">
                              <p className="text-text-main font-medium max-w-md truncate" title={log.description}>
                                 {log.description}
                              </p>
                           </td>
                           <td className="px-6 py-4 text-right whitespace-nowrap text-text-muted tabular-nums font-medium">
                              {new Date(log.createdAt).toLocaleString()}
                           </td>
                        </tr>
                     ))}
                     {activities.length === 0 && (
                        <tr>
                           <td colSpan={5} className="px-6 py-20 text-center text-text-muted italic bg-background/20 font-medium">No logs found.</td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
               <div className="p-4 border-t border-border flex items-center justify-between bg-background/50">
                  <p className="text-xs text-text-muted">
                     Showing page <span className="font-bold text-text-main">{page}</span> of <span className="font-bold text-text-main">{pagination.pages}</span>
                  </p>
                  <div className="flex gap-2">
                     <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                     >
                        <ChevronLeft size={16} /> Previous
                     </Button>
                     <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                        disabled={page === pagination.pages}
                     >
                        Next <ChevronRight size={16} />
                     </Button>
                  </div>
               </div>
            )}
         </CardContent>
      </Card>
    </div>
  );
};

export default ActivityLogsPage;
