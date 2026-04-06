import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchNotifications, markAsRead, markAllAsRead, deleteNotification } from '../store/slices/notificationSlice';
import { Bell, Check, Trash2, Calendar, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

const NotificationsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { notifications, unreadCount, isLoading } = useAppSelector((state: any) => state.notifications);

  useEffect(() => {
    dispatch(fetchNotifications({ page: 1, limit: 50 }));
  }, [dispatch]);

  const handleMarkRead = (id: string) => {
    dispatch(markAsRead(id));
  };

  const handleMarkAllRead = () => {
    dispatch(markAllAsRead());
  };

  const handleDelete = (id: string) => {
    dispatch(deleteNotification(id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED': return <Badge variant="blue"><LinkIcon size={12} className="mr-1"/> Task</Badge>;
      case 'COMMENT_ADDED': return <Badge variant="amber"><Bell size={12} className="mr-1"/> Comment</Badge>;
      case 'PROJECT_ADDED': return <Badge variant="indigo"><ExternalLink size={12} className="mr-1"/> Project</Badge>;
      case 'DEADLINE_REMINDER': return <Badge variant="red"><Calendar size={12} className="mr-1"/> Deadline</Badge>;
      default: return <Badge variant="gray">Update</Badge>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-main">Notifications</h1>
          <p className="text-text-muted mt-1">
            You have {unreadCount} unread messages.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={handleMarkAllRead} className="gap-2">
            <Check size={16} /> Mark all as read
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="divide-y divide-border/50 p-0">
          {notifications.length === 0 ? (
            <div className="py-20 text-center">
              <div className="bg-background w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                <Bell size={32} className="text-text-muted" />
              </div>
              <h3 className="text-lg font-semibold text-text-main">No notifications yet</h3>
              <p className="text-text-muted">When you get updates, they'll show up here.</p>
            </div>
          ) : (
            notifications.map((notif: any) => (
              <div 
                key={notif.id}
                className={`p-6 flex gap-4 transition-colors hover:bg-background/50 relative group ${!notif.isRead ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    {getIcon(notif.type)}
                    <span className="text-xs text-text-muted">
                      {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <p className={`text-base ${!notif.isRead ? 'text-text-main font-semibold' : 'text-text-muted'}`}>
                      {notif.message}
                    </p>
                    {notif.link && (
                      <Link 
                        to={notif.link} 
                        onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                        className="text-sm text-primary hover:underline font-medium inline-flex items-center gap-1 mt-1"
                      >
                        View details <ExternalLink size={14} />
                      </Link>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                   {!notif.isRead && (
                     <button 
                       onClick={() => handleMarkRead(notif.id)}
                       className="p-2 text-text-muted hover:text-primary hover:bg-white rounded-lg transition-all"
                       title="Mark as read"
                     >
                       <Check size={18} />
                     </button>
                   )}
                   <button 
                     onClick={() => handleDelete(notif.id)}
                     className="p-2 text-text-muted hover:text-danger hover:bg-white rounded-lg transition-all"
                     title="Delete"
                   >
                     <Trash2 size={18} />
                   </button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      
      {isLoading && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
