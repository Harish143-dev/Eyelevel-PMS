import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchUserDashboard } from '../../store/slices/dashboardSlice';
import { Card, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/Avatar';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  ArrowRight,
  Briefcase
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import TodoList from '../../components/todo/TodoList';
import { SkeletonDashboard } from '../../components/ui/Skeleton';
import { TASK_STATUS_CONFIG } from '../../constants/statusConstants';
import type { TaskStatusValue } from '../../constants/statusConstants';
const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { userData, isLoading } = useAppSelector((state) => state.dashboard);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchUserDashboard());
  }, [dispatch]);

  if (isLoading && !userData) {
    return <SkeletonDashboard />;
  }

  if (!userData) return null;

  const { stats, myTasks, upcomingDeadlines, myProjects } = userData;

  return (
    <div className="space-y-6 text-left">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-text-main">Welcome back, {user?.name}!</h1>
        <p className="text-text-muted">Here's what's on your plate for today.</p>
      </div>


      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Active Tasks" 
          value={stats.activeTasks} 
          icon={<Clock className="text-primary" size={24} />} 
          bgColor="bg-primary/10"
          desc="Assigned to you"
        />
        <StatCard 
          title="Due This Week" 
          value={stats.dueThisWeek} 
          icon={<Calendar className="text-warning" size={24} />} 
          bgColor="bg-warning/10"
          desc="Deadlines approaching"
        />
        <StatCard 
          title="Tasks Completed" 
          value={stats.completedTotal} 
          icon={<CheckCircle className="text-success" size={24} />} 
          bgColor="bg-success/10"
          desc="In total"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Left Column */}
        <div className="space-y-6 h-full flex flex-col">
          {/* My Tasks List */}
          <Card className="flex-none">
            <div className="p-4 border-b border-border flex justify-between items-center">
               <h3 className="font-semibold text-text-main flex items-center gap-2">
                  <TrendingUp size={18} className="text-primary" />
                  Your Current Tasks
               </h3>
               <Link to="/tasks" className="text-xs font-semibold text-primary hover:text-primary-hover">View All</Link>
            </div>
            <CardContent className="p-0">
                <div className="divide-y divide-border/20 max-h-[350px] overflow-y-auto custom-scrollbar">
                  {myTasks.map((task: any) => (
                     <div key={task.id} className="p-4 flex justify-between items-center hover:bg-background transition-colors group cursor-pointer" onClick={() => navigate(`/pm/projects/${task.projectId}`)}>
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2 mb-1">
                              <Badge variant={TASK_STATUS_CONFIG[task.status as TaskStatusValue]?.badgeVariant || 'gray'}>
                                 {TASK_STATUS_CONFIG[task.status as TaskStatusValue]?.label || task.status}
                              </Badge>
                              <span className="text-[10px] text-text-muted font-medium truncate uppercase tracking-tighter">
                                 {task.project.name}
                              </span>
                           </div>
                           <p className="text-sm font-semibold text-text-main truncate group-hover:text-primary transition-colors">
                              {task.title}
                           </p>
                        </div>
                        <div className="text-right ml-4 shrink-0">
                           {task.dueDate ? (
                              <p className={`text-xs font-medium ${new Date(task.dueDate) < new Date() ? 'text-danger' : 'text-text-muted'}`}>
                                 {new Date(task.dueDate).toLocaleDateString()}
                              </p>
                           ) : (
                              <span className="text-xs text-text-muted/30">No date</span>
                           )}
                           <ArrowRight size={14} className="ml-auto mt-1 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                     </div>
                  ))}
                  {myTasks.length === 0 && (
                     <div className="p-10 text-center">
                        <CheckCircle size={40} className="mx-auto text-success mb-3 opacity-20" />
                        <p className="text-sm text-text-muted italic font-medium">No active tasks assigned to you.</p>
                     </div>
                  )}
               </div>
            </CardContent>
          </Card>

          {/* Personal To-Do */}
          <div className="flex-1 min-h-[350px]">
            <TodoList />
          </div>
        </div>

        {/* My Projects */}
        <div className="space-y-6">
           <Card>
              <div className="p-4 border-b border-border flex justify-between items-center">
                 <h3 className="font-semibold text-text-main flex items-center gap-2">
                    <Briefcase size={18} className="text-info" />
                    Projects Active In
                 </h3>
                 <Link to="/pm/projects" className="text-xs font-semibold text-primary hover:text-primary-hover">Explore</Link>
              </div>
               <CardContent className="p-0">
                 <div className="divide-y divide-border/20">
                    {myProjects.slice(0, 4).map((p: any) => (
                       <div key={p.id} className="p-4 hover:bg-background transition-colors cursor-pointer" onClick={() => navigate(`/pm/projects/${p.id}`)}>
                          <div className="flex justify-between items-start mb-2">
                             <div>
                                <p className="text-sm font-semibold text-text-main">{p.name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                   <span className="text-[10px] text-text-muted">Manager:</span>
                                   <Avatar name={p.owner.name} color={p.owner.avatarColor} size={14} />
                                   <span className="text-[10px] text-text-main font-medium">{p.owner.name}</span>
                                </div>
                             </div>
                             <span className="text-xs font-bold text-text-main">{p.progress}%</span>
                          </div>
                          <div className="w-full bg-background rounded-full h-1.5 overflow-hidden">
                             <div 
                                className={`h-full rounded-full ${p.progress === 100 ? 'bg-success' : 'bg-primary'}`}
                                style={{ width: `${p.progress}%` }}
                             />
                          </div>
                       </div>
                    ))}
                    {myProjects.length === 0 && (
                       <p className="p-8 text-center text-sm text-text-muted italic font-medium">No assigned projects yet.</p>
                    )}
                 </div>
              </CardContent>
           </Card>

           {/* Upcoming Deadlines */}
           <Card className="bg-gradient-to-br from-indigo-600 to-violet-700 border-none text-white overflow-hidden relative">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-indigo-400/10 rounded-full blur-3xl" />
              
              <div className="p-4 relative z-10">
                 <h3 className="font-semibold flex items-center gap-2">
                    <AlertTriangle size={18} className="text-amber-300" />
                    Upcoming Deadlines
                 </h3>
              </div>
              <CardContent className="p-0 relative z-10">
                 <div className="divide-y divide-white/10">
                    {upcomingDeadlines.map((task: any) => (
                       <div key={task.id} className="p-4 hover:bg-white/5 transition-colors">
                          <p className="text-sm font-medium">{task.title}</p>
                          <div className="flex justify-between items-center mt-1">
                             <span className="text-[10px] text-indigo-100 uppercase">{task.project.name}</span>
                             <span className="text-[10px] font-bold text-amber-300">
                                {new Date(task.dueDate).toLocaleDateString()}
                             </span>
                          </div>
                       </div>
                    ))}
                    {upcomingDeadlines.length === 0 && (
                       <p className="p-8 text-center text-sm text-indigo-100/50 italic">No tight deadlines!</p>
                    )}
                 </div>
              </CardContent>
           </Card>
        </div>

      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, bgColor, desc }: any) => (
  <Card className="hover-lift animate-fade-in-up">
    <CardContent className="p-6">
      <div className="flex justify-between items-center mb-1">
        <p className="text-sm font-medium text-text-muted">{title}</p>
        <div className={`p-2 ${bgColor} rounded-lg`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-text-main">{value}</p>
        <p className="text-[10px] text-text-muted mt-1 uppercase tracking-wider">{desc}</p>
      </div>
    </CardContent>
  </Card>
);

const AlertTriangle = ({ size, className }: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

export default UserDashboard;
