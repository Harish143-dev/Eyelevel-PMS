import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { logout } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import { LogOut, Clock } from 'lucide-react';
import Button from '../ui/Button';

const IdleTimer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  
  // Timeout in minutes from company settings, default to 1440 (24h) if not set
  const timeoutMins = user?.company?.settings?.sessionTimeout || 1440;
  const timeoutMs = timeoutMins * 60 * 1000;
  const warningMs = 60 * 1000; // Show warning 60s before logout
  
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  
  const timerRef = useRef<any>(null);
  const warningTimerRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);

  const handleLogout = useCallback(() => {
    dispatch(logout());
    toast.error('Session expired due to inactivity');
    setShowWarning(false);
  }, [dispatch]);

  const resetTimer = useCallback(() => {
    if (showWarning) return; // Don't reset if we're showing the warning
    
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    
    if (isAuthenticated) {
      // Set the main logout timer
      timerRef.current = setTimeout(handleLogout, timeoutMs);
      
      // Set the warning timer (total timeout - 60s)
      const delayBeforeWarning = Math.max(0, timeoutMs - warningMs);
      warningTimerRef.current = setTimeout(() => {
        setShowWarning(true);
        setTimeLeft(60);
      }, delayBeforeWarning);
    }
  }, [isAuthenticated, handleLogout, timeoutMs, warningMs, showWarning]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => resetTimer();
    
    events.forEach(event => window.addEventListener(event, handleActivity));
    resetTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [isAuthenticated, resetTimer]);

  useEffect(() => {
    if (showWarning && timeLeft > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleLogout();
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [showWarning, timeLeft, handleLogout]);

  const stayLoggedIn = () => {
    setShowWarning(false);
    resetTimer();
  };

  return (
    <>
      {children}
      
      {showWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-surface border border-border shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <Clock size={24} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-main">Session Expiring</h3>
                  <p className="text-sm text-text-muted">You've been inactive for a while.</p>
                </div>
              </div>
              
              <div className="bg-surface-alt p-4 rounded-xl border border-border mb-6">
                <p className="text-center text-sm font-medium">
                  Your session will end in <span className="text-primary font-bold text-lg tabular-nums">{timeLeft}</span> seconds.
                </p>
                <div className="w-full bg-border h-1.5 rounded-full mt-3 overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-1000 ease-linear"
                    style={{ width: `${(timeLeft / 60) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button 
                  onClick={stayLoggedIn}
                  variant="primary" 
                  className="w-full"
                >
                  Stay Logged In
                </Button>
                <Button 
                  onClick={handleLogout}
                  variant="secondary" 
                  className="w-full text-text-muted"
                >
                  <LogOut size={16} /> Logout Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default IdleTimer;
