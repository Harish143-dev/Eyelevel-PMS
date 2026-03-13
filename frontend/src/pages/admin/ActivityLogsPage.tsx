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
           <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <History size={32} className="text-indigo-600" />
              System Activity Logs
           </h1>
           <p className="text-gray-600 mt-1">Audit trail of all actions across the platform.</p>
        </div>
      </div>

      <Card>
         <CardContent className="p-0">
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100 uppercase text-[10px] font-bold text-gray-500 tracking-wider">
                     <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Action</th>
                        <th className="px-6 py-4">Entity</th>
                        <th className="px-6 py-4">Description</th>
                        <th className="px-6 py-4 text-right">Date & Time</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {activities.map((log: any) => (
                        <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                           <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                 <Avatar name={log.user.name} color={log.user.avatarColor} size={24} />
                                 <span className="font-medium text-gray-900">{log.user.name}</span>
                              </div>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                 log.action.includes('CREATE') ? 'bg-green-100 text-green-700' :
                                 log.action.includes('DELETE') ? 'bg-red-100 text-red-700' :
                                 log.action.includes('UPDATE') ? 'bg-blue-100 text-blue-700' :
                                 'bg-gray-100 text-gray-700'
                              }`}>
                                 {log.action}
                              </span>
                           </td>
                           <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-gray-500 font-medium">{log.entityType}</span>
                           </td>
                           <td className="px-6 py-4">
                              <p className="text-gray-700 max-w-md truncate" title={log.description}>
                                 {log.description}
                              </p>
                           </td>
                           <td className="px-6 py-4 text-right whitespace-nowrap text-gray-500 tabular-nums">
                              {new Date(log.createdAt).toLocaleString()}
                           </td>
                        </tr>
                     ))}
                     {activities.length === 0 && (
                        <tr>
                           <td colSpan={5} className="px-6 py-20 text-center text-gray-400 italic">No logs found.</td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
               <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                  <p className="text-xs text-gray-500">
                     Showing page <span className="font-bold text-gray-900">{page}</span> of <span className="font-bold text-gray-900">{pagination.pages}</span>
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
