import React, { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchMyTasks } from '../../store/slices/taskSlice';
import { ChevronLeft, ChevronRight, CalendarDays, LayoutGrid, Rows3, AlertCircle } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import type { Task } from '../../types';

type ViewMode = 'month' | 'week';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const statusColors: Record<string, string> = {
  pending: '#f59e0b',
  ongoing: '#3b82f6',
  in_review: '#8b5cf6',
  completed: '#10b981',
};

const CalendarPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tasks: myTasks } = useAppSelector((state) => state.tasks);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    dispatch(fetchMyTasks());
  }, [dispatch]);

  // Get start of current month
  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Current month
    for (let i = 1; i <= totalDays; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Next month padding to fill 6 rows
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  };

  const getWeekDays = (date: Date) => {
    const dayOfWeek = date.getDay();
    const start = new Date(date);
    start.setDate(date.getDate() - dayOfWeek);

    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push({ date: d, isCurrentMonth: d.getMonth() === date.getMonth() });
    }
    return days;
  };

  const days = viewMode === 'month' ? getMonthDays(currentDate) : getWeekDays(currentDate);

  // Tasks mapped by date string
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    myTasks.forEach((task) => {
      if (task.dueDate) {
        const dateKey = new Date(task.dueDate).toDateString();
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(task);
      }
    });
    return map;
  }, [myTasks]);

  // Deadline reminders (tasks due within 3 days)
  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    return myTasks
      .filter(t => t.dueDate && t.status !== 'completed' && new Date(t.dueDate) >= now && new Date(t.dueDate) <= threeDaysFromNow)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  }, [myTasks]);

  // Overdue tasks
  const overdueTasks = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return myTasks
      .filter(t => t.dueDate && t.status !== 'completed' && new Date(t.dueDate) < now)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  }, [myTasks]);

  const navigate = (direction: 'prev' | 'next') => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() + (direction === 'next' ? 1 : -1));
    } else {
      d.setDate(d.getDate() + (direction === 'next' ? 7 : -7));
    }
    setCurrentDate(d);
  };

  const goToToday = () => setCurrentDate(new Date());

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isOverdue = (dueDate: string) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return new Date(dueDate) < now;
  };

  const getDaysUntil = (dueDate: string) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
            <CalendarDays size={28} className="text-primary" />
            Calendar
          </h1>
          <p className="text-sm text-text-muted mt-1">
            View your tasks by deadline
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-surface border border-border rounded-xl p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'month' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-main'
              }`}
            >
              <LayoutGrid size={14} /> Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'week' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-main'
              }`}
            >
              <Rows3 size={14} /> Week
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar Grid */}
        <div className="flex-1">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-4 bg-surface border border-border rounded-xl px-4 py-3">
            <button
              onClick={() => navigate('prev')}
              className="p-1.5 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-text-main">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={goToToday}
                className="px-3 py-1 text-xs font-semibold text-primary bg-primary/10 rounded-full hover:bg-primary/20 transition-colors"
              >
                Today
              </button>
            </div>
            <button
              onClick={() => navigate('next')}
              className="p-1.5 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((day) => (
              <div key={day} className="text-center py-2 text-xs font-bold text-text-muted uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Cells */}
          <div className={`grid grid-cols-7 gap-px bg-border/30 rounded-xl overflow-hidden border border-border ${viewMode === 'week' ? '' : ''}`}>
            {days.map((dayObj, idx) => {
              const dateKey = dayObj.date.toDateString();
              const dayTasks = tasksByDate[dateKey] || [];
              const today = isToday(dayObj.date);

              return (
                <div
                  key={idx}
                  className={`bg-surface p-1.5 transition-colors group ${
                    viewMode === 'week' ? 'min-h-[180px]' : 'min-h-[90px] sm:min-h-[110px]'
                  } ${!dayObj.isCurrentMonth ? 'opacity-40' : ''} ${today ? 'ring-2 ring-primary/30 ring-inset' : ''} hover:bg-primary/5`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        today ? 'bg-primary text-white' : 'text-text-muted'
                      }`}
                    >
                      {dayObj.date.getDate()}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5 overflow-hidden">
                    {dayTasks.slice(0, viewMode === 'week' ? 5 : 2).map((task) => (
                      <button
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className="w-full text-left px-1.5 py-0.5 rounded text-[11px] font-medium truncate transition-all hover:scale-[1.02] cursor-pointer"
                        style={{
                          backgroundColor: `${statusColors[task.status]}15`,
                          borderLeft: `2px solid ${statusColors[task.status]}`,
                          color: statusColors[task.status],
                        }}
                        title={task.title}
                      >
                        {task.title}
                      </button>
                    ))}
                    {dayTasks.length > (viewMode === 'week' ? 5 : 2) && (
                      <span className="text-[10px] text-text-muted pl-1">+{dayTasks.length - (viewMode === 'week' ? 5 : 2)} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side Panel — Reminders */}
        <div className="w-full lg:w-72 shrink-0 space-y-4">
          {/* Overdue Tasks */}
          {overdueTasks.length > 0 && (
            <div className="bg-danger/5 border border-danger/20 rounded-xl p-4">
              <h3 className="text-sm font-bold text-danger flex items-center gap-1.5 mb-3">
                <AlertCircle size={16} /> Overdue ({overdueTasks.length})
              </h3>
              <div className="space-y-2">
                {overdueTasks.slice(0, 5).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="w-full text-left p-2.5 bg-surface hover:bg-danger/5 border border-border rounded-lg transition-colors group"
                  >
                    <p className="text-sm font-medium text-text-main truncate group-hover:text-danger">{task.title}</p>
                    <p className="text-[11px] text-danger font-semibold mt-0.5">
                      {Math.abs(getDaysUntil(task.dueDate!))} days overdue
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Deadlines */}
          <div className="bg-surface border border-border rounded-xl p-4">
            <h3 className="text-sm font-bold text-text-main flex items-center gap-1.5 mb-3">
              <CalendarDays size={16} className="text-warning" /> Upcoming Deadlines
            </h3>
            {upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-text-muted italic py-2">No upcoming deadlines</p>
            ) : (
              <div className="space-y-2">
                {upcomingDeadlines.map((task) => {
                  const daysLeft = getDaysUntil(task.dueDate!);
                  return (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="w-full text-left p-2.5 hover:bg-primary/5 border border-border rounded-lg transition-colors group"
                    >
                      <p className="text-sm font-medium text-text-main truncate group-hover:text-primary">{task.title}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[11px] text-text-muted">
                          {new Date(task.dueDate!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        <Badge variant={daysLeft === 0 ? 'red' : daysLeft === 1 ? 'amber' : 'blue'}>
                          {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days`}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Task Detail */}
          {selectedTask && (
            <div className="bg-surface border border-border rounded-xl p-4 animate-in fade-in slide-in-from-right-2 duration-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-text-main">Task Detail</h3>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-text-muted hover:text-text-main transition-colors text-xs"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2.5">
                <p className="text-sm font-semibold text-text-main">{selectedTask.title}</p>
                {selectedTask.description && (
                  <p className="text-xs text-text-muted line-clamp-3">{selectedTask.description}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Badge variant={selectedTask.status === 'completed' ? 'green' : selectedTask.status === 'ongoing' ? 'blue' : 'gray'}>
                    {selectedTask.status.replace('_', ' ')}
                  </Badge>
                  <Badge variant={selectedTask.priority === 'critical' ? 'red' : selectedTask.priority === 'high' ? 'amber' : 'gray'}>
                    {selectedTask.priority}
                  </Badge>
                </div>
                {selectedTask.dueDate && (
                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <CalendarDays size={12} />
                    <span>Due: {new Date(selectedTask.dueDate).toLocaleDateString()}</span>
                    {isOverdue(selectedTask.dueDate) && selectedTask.status !== 'completed' && (
                      <span className="text-danger font-semibold ml-1">Overdue!</span>
                    )}
                  </div>
                )}
                {selectedTask.assignee && (
                  <div className="text-xs text-text-muted">
                    Assigned to: <span className="font-medium text-text-main">{selectedTask.assignee.name}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
