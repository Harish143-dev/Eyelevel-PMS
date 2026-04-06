import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchDeletedProjects, fetchDeletedTasks, restoreProject, restoreTask } from '../../store/slices/adminSlice';
import { Trash2, RotateCcw, Folder, CheckSquare, Calendar, User as UserIcon, AlertCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/Avatar';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const TrashPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { deletedProjects, deletedTasks, isLoading } = useAppSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchDeletedProjects());
    dispatch(fetchDeletedTasks());
  }, [dispatch]);

  const handleRestoreProject = async (id: string) => {
    try {
      await dispatch(restoreProject(id)).unwrap();
      toast.success('Project restored successfully');
    } catch (err: any) {
      toast.error(err || 'Failed to restore project');
    }
  };

  const handleRestoreTask = async (id: string) => {
    try {
      await dispatch(restoreTask(id)).unwrap();
      toast.success('Task restored successfully');
    } catch (err: any) {
      toast.error(err || 'Failed to restore task');
    }
  };

  if (isLoading && deletedProjects.length === 0 && deletedTasks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-main flex items-center gap-3">
            <Trash2 className="text-danger" size={32} /> Trash Management
          </h1>
          <p className="text-text-muted mt-1 text-sm">Review and restore soft-deleted projects and tasks.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Deleted Projects */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Folder size={20} className="text-primary" />
            <h2 className="text-xl font-bold text-text-main">Deleted Projects</h2>
            <Badge variant="gray" className="ml-2">{deletedProjects.length}</Badge>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {deletedProjects.length === 0 ? (
              <EmptyTrash icon={<Folder size={48} />} title="No Deleted Projects" />
            ) : (
              deletedProjects.map((project) => (
                <Card key={project.id} className="border-danger/10 hover:border-danger/30 transition-all group">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-text-main truncate text-lg">{project.name}</h3>
                          <Badge variant="red">DELETED</Badge>
                        </div>
                        <p className="text-sm text-text-muted line-clamp-2 mb-3">{project.description || 'No description provided.'}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
                          <div className="flex items-center gap-1.5">
                            <UserIcon size={14} />
                            <span>Owner: {project.owner?.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            <span>Deleted: {project.deletedAt ? format(new Date(project.deletedAt), 'MMM d, yyyy') : 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => handleRestoreProject(project.id)}
                        className="shrink-0 hover:bg-success/10 hover:text-success hover:border-success/20 transition-colors"
                        leftIcon={<RotateCcw size={16} />}
                      >
                        Restore
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Deleted Tasks */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <CheckSquare size={20} className="text-primary" />
            <h2 className="text-xl font-bold text-text-main">Deleted Tasks</h2>
            <Badge variant="gray" className="ml-2">{deletedTasks.length}</Badge>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {deletedTasks.length === 0 ? (
              <EmptyTrash icon={<CheckSquare size={48} />} title="No Deleted Tasks" />
            ) : (
              deletedTasks.map((task) => (
                <Card key={task.id} className="border-danger/10 hover:border-danger/30 transition-all group">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-text-main truncate text-lg">{task.title}</h3>
                          <Badge variant="red">DELETED</Badge>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                           <Badge variant="gray" className="bg-primary/5 text-primary text-[10px] px-1.5 py-0">Proj: {task.project?.name || 'Unknown'}</Badge>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
                          <div className="flex items-center gap-1.5">
                            <Avatar name={task.assignee?.name || 'Unassigned'} color={task.assignee?.avatarColor || '#ccc'} size={14} />
                            <span>{task.assignee?.name || 'Unassigned'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            <span>Deleted: {task.deletedAt ? format(new Date(task.deletedAt), 'MMM d, yyyy') : 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => handleRestoreTask(task.id)}
                        className="shrink-0 hover:bg-success/10 hover:text-success hover:border-success/20 transition-colors"
                        leftIcon={<RotateCcw size={16} />}
                      >
                        Restore
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 mt-12 overflow-hidden relative">
         <div className="absolute top-0 right-0 p-8 text-primary/10 -mr-4 -mt-4 rotate-12">
           <Trash2 size={120} />
         </div>
         <div className="p-3 bg-primary/10 rounded-full text-primary shrink-0 relative z-10">
           <AlertCircle size={32} />
         </div>
         <div className="relative z-10">
           <h3 className="text-xl font-bold text-text-main">Data Protection Policy</h3>
           <p className="text-sm text-text-muted mt-2 max-w-2xl">
             Deleted items are kept in the trash indefinitely to prevent accidental data loss. 
             Only authorized administrators can restore these items to their original locations. 
             Status, assignments, and historical activity logs are preserved during the restoration process.
           </p>
         </div>
      </div>
    </div>
  );
};

const EmptyTrash: React.FC<{ icon: React.ReactNode, title: string }> = ({ icon, title }) => (
  <div className="h-48 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-text-muted bg-surface/30">
    <div className="mb-3 opacity-20">{icon}</div>
    <p className="font-medium">{title}</p>
    <p className="text-xs">Your data is safe.</p>
  </div>
);

export default TrashPage;
