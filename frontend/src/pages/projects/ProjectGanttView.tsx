import React, { useMemo, useState } from 'react';
import { format, addDays, startOfDay, startOfToday } from 'date-fns';
import type { Task, Project } from '../../types';
import Avatar from '../../components/Avatar';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface ProjectGanttViewProps {
  tasks: Task[];
  project: Project;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500',
  ongoing: 'bg-primary',
  in_review: 'bg-violet-500',
  completed: 'bg-success',
};

export const ProjectGanttView: React.FC<ProjectGanttViewProps> = ({ tasks, project }) => {
  const [viewWindow, setViewWindow] = useState<{ start: Date; days: number }>({
    start: startOfToday(),
    days: 30, // Show 30 days initially
  });

  // 1. Calculate the overall date range from tasks and project
  const { minDate, maxDate } = useMemo(() => {
    const dates: Date[] = [];
    if (project.startDate) dates.push(new Date(project.startDate));
    if (project.deadline) dates.push(new Date(project.deadline));
    
    tasks.forEach(t => {
      if (t.dueDate) dates.push(new Date(t.dueDate));
      if (t.createdAt) dates.push(new Date(t.createdAt));
    });

    if (dates.length === 0) {
      const today = startOfToday();
      return { minDate: today, maxDate: addDays(today, 30) };
    }

    const min = new Date(Math.min(...dates.map(d => d.getTime())));
    const max = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Buffer
    return { 
      minDate: startOfDay(min), 
      maxDate: startOfDay(addDays(max, 7)) 
    };
  }, [tasks, project]);

  console.log('Gantt Range:', minDate, maxDate);

  // Adjust viewWindow if it's outside range or uninitialized
  useMemo(() => {
    // We keep viewWindow.start as is unless user navigates
    // But initially we might want to start from project start
    if (project.startDate && viewWindow.start.getTime() === startOfToday().getTime()) {
      setViewWindow(prev => ({ ...prev, start: startOfDay(new Date(project.startDate!)) }));
    }
  }, [project.startDate]);

  const daysToRender = useMemo(() => {
    return Array.from({ length: viewWindow.days }).map((_, i) => addDays(viewWindow.start, i));
  }, [viewWindow]);

  const navigate = (direction: 'prev' | 'next') => {
    setViewWindow(prev => ({
      ...prev,
      start: addDays(prev.start, direction === 'prev' ? -7 : 7)
    }));
  };

  const resetToToday = () => {
    setViewWindow(prev => ({ ...prev, start: startOfToday() }));
  };

  const getTaskPos = (task: Task) => {
    const start = task.createdAt ? startOfDay(new Date(task.createdAt)) : minDate;
    const end = task.dueDate ? startOfDay(new Date(task.dueDate)) : addDays(start, 1);
    
    // Relative to viewWindow.start
    const leftOffset = Math.max(0, (start.getTime() - viewWindow.start.getTime()) / (1000 * 60 * 60 * 24));
    let width = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1;
    
    if (leftOffset + width < 0 || leftOffset > viewWindow.days) return null;

    // Constrain within view
    const visibleLeft = Math.max(0, leftOffset);
    const visibleRight = Math.min(viewWindow.days, leftOffset + width);
    const visibleWidth = Math.max(0.5, visibleRight - visibleLeft);

    return {
      left: `${(visibleLeft / viewWindow.days) * 100}%`,
      width: `${(visibleWidth / viewWindow.days) * 100}%`,
      isStartOut: leftOffset < 0,
      isEndOut: leftOffset + width > viewWindow.days
    };
  };

  return (
    <div className="flex flex-col h-full bg-surface border border-border rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-500">
      {/* Header / Controls */}
      <div className="p-4 border-b border-border flex flex-col md:flex-row justify-between items-center gap-4 bg-background/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h3 className="font-bold text-text-main">Project Timeline</h3>
            <p className="text-xs text-text-muted">Visualizing {tasks.length} tasks across {viewWindow.days} days</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('prev')}
            className="p-2 hover:bg-background rounded-lg text-text-muted transition-colors border border-border"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={resetToToday}
            className="px-3 py-1.5 text-xs font-bold bg-background border border-border rounded-lg text-text-main hover:bg-surface transition-colors"
          >
            Today
          </button>
          <button 
            onClick={() => navigate('next')}
            className="p-2 hover:bg-background rounded-lg text-text-muted transition-colors border border-border"
          >
            <ChevronRight size={18} />
          </button>
          <div className="ml-2 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-lg text-xs font-bold text-primary">
            {format(viewWindow.start, 'MMM d')} - {format(daysToRender[daysToRender.length - 1], 'MMM d, yyyy')}
          </div>
        </div>
      </div>

      {/* Gantt Area */}
      <div className="flex-1 overflow-auto custom-scrollbar relative">
        <div className="min-w-[1000px]">
          {/* Timeline Header */}
          <div className="flex sticky top-0 z-20 bg-surface border-b border-border">
            <div className="w-[300px] shrink-0 p-3 border-r border-border font-bold text-xs text-text-muted uppercase tracking-wider bg-surface/80 backdrop-blur-sm">
              Task Name
            </div>
            <div className="flex-1 grid grid-cols-30">
              {daysToRender.map((day, i) => (
                <div 
                  key={i} 
                  className={`text-center py-2 border-r border-border/30 last:border-0 ${format(day, 'E') === 'Sat' || format(day, 'E') === 'Sun' ? 'bg-background/40' : ''}`}
                  style={{ width: `${100 / viewWindow.days}%` }}
                >
                  <p className="text-[10px] font-bold text-text-muted uppercase">{format(day, 'EEE')}</p>
                  <p className={`text-xs font-bold mt-0.5 ${format(day, 'yyyy-MM-dd') === format(startOfToday(), 'yyyy-MM-dd') ? 'text-primary' : 'text-text-main'}`}>
                    {format(day, 'd')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Task Rows */}
          <div className="divide-y divide-border/50">
            {tasks.map((task) => {
              const pos = getTaskPos(task);
              return (
                <div key={task.id} className="flex group hover:bg-primary/5 transition-colors">
                  <div className="w-[300px] shrink-0 p-3 border-r border-border flex items-center gap-3">
                    <div className={`w-1 h-8 rounded-full ${statusColors[task.status] || 'bg-gray-400'}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-main truncate" title={task.title}>{task.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-text-muted">
                        <span>{task.priority.toUpperCase()}</span>
                        {task.assignee && (
                          <>
                            <span className="opacity-30">•</span>
                            <div className="flex items-center gap-1">
                              <Avatar name={task.assignee.name} color={task.assignee.avatarColor} size={14} />
                              <span className="truncate">{task.assignee.name}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 relative h-14">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {daysToRender.map((_, i) => (
                        <div key={i} className="border-r border-border/10 last:border-0 h-full flex-1" />
                      ))}
                    </div>

                    {/* Task Bar */}
                    {pos && (
                      <div 
                        className={`absolute top-1/2 -translate-y-1/2 h-7 flex items-center justify-center rounded-lg shadow-sm border border-black/5 cursor-pointer group-hover:scale-[1.02] transition-transform ${statusColors[task.status] || 'bg-gray-400'}`}
                        style={{ 
                          left: pos.left, 
                          width: pos.width,
                          opacity: 0.85
                        }}
                      >
                         <span className="text-[10px] font-black text-white uppercase px-2 truncate">
                           {task.status.replace('_', ' ')}
                         </span>
                         
                         {/* Connection indicators if cut off */}
                         {pos.isStartOut && <div className="absolute -left-1 w-2 h-2 bg-inherit rotate-45" />}
                         {pos.isEndOut && <div className="absolute -right-1 w-2 h-2 bg-inherit rotate-45" />}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Footer / Legend */}
      <div className="p-3 bg-background/50 border-t border-border flex flex-wrap items-center justify-center gap-6">
        {Object.entries(statusColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${color}`} />
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{status.replace('_', ' ')}</span>
          </div>
        ))}
      </div>

      <style>{`
        .grid-cols-30 {
          display: flex;
          width: 100%;
        }
      `}</style>
    </div>
  );
};
