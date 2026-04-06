import React, { useState, useEffect } from 'react';
import { Square } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchRunningTimer, stopTimer } from '../store/slices/timeSlice';

const TimeTracker: React.FC = () => {
  const dispatch = useAppDispatch();
  const { runningTimer } = useAppSelector((state: any) => state.time);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    dispatch(fetchRunningTimer());
  }, [dispatch]);

  useEffect(() => {
    let interval: any;
    if (runningTimer) {
      const start = new Date(runningTimer.startTime).getTime();
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [runningTimer]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStop = () => {
    dispatch(stopTimer());
  };

  if (!runningTimer) return null;

  return (
    <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full animate-in fade-in slide-in-from-right-4">
      <div className="flex flex-col">
        <span className="text-[10px] uppercase font-bold text-primary tracking-wider leading-none">Working on</span>
        <span className="text-xs font-semibold text-text-main truncate max-w-[120px]">{runningTimer.task?.title}</span>
      </div>
      
      <div className="h-8 w-px bg-primary/20 mx-1" />
      
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 min-w-[60px] justify-center">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-mono font-bold text-primary">{formatTime(elapsed)}</span>
        </div>
        
        <button 
          onClick={handleStop}
          className="p-1.5 rounded-full bg-danger text-white hover:bg-danger-hover transition-colors shadow-sm"
          title="Stop Timer"
        >
          <Square size={14} fill="currentColor" />
        </button>
      </div>
    </div>
  );
};

export default TimeTracker;
