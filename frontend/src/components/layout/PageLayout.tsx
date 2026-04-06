import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { socketService } from '../../services/socket/socketService';
import { useFeature } from '../../context/FeatureContext';
import { setUser } from '../../store/slices/authSlice';
import { useDispatch } from 'react-redux';
import api from '../../services/api/axios';
import IdleTimer from './IdleTimer';

const ConsentBanner = ({ onAccept }: { onAccept: () => void }) => {
  const [loading, setLoading] = useState(false);
  const handleAccept = async () => {
    try {
      setLoading(true);
      await api.post('/monitoring/consent');
      onAccept();
    } catch(err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="bg-yellow-100 text-yellow-900 px-6 py-4 fixed top-16 left-0 right-0 z-40 flex flex-col md:flex-row shadow-md items-center justify-between border-b border-yellow-200">
      <div className="flex-1 mb-3 md:mb-0">
        <h3 className="font-bold text-lg text-yellow-800">Privacy Notice: Session Monitoring Enabled</h3>
        <p className="text-sm mt-1 text-yellow-700">Your employer has enabled active login sequence tracking. As per company policy, basic diagnostics such as your device footprint, geographic login point (IP Address) and core active hours are captured transparently on check-in and checkout to support data security auditing workflows.</p>
      </div>
      <button 
        onClick={handleAccept}
        disabled={loading}
        className="ml-0 md:ml-6 whitespace-nowrap bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-6 rounded transition shadow-sm"
      >
        I Understand
      </button>
    </div>
  );
};

const PageLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true); // Start collapsed on mobile
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const employeeMonitoringEnabled = useFeature('employeeMonitoring');

  // Auto-expand sidebar on desktop, collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setCollapsed(false);
      } else {
        setCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (user?.id) {
      socketService.connect(user.id);
    }
    return () => {};
  }, [user]);

  return (
    <IdleTimer>
      <div className="min-h-screen bg-background flex flex-col md:flex-row">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <Topbar collapsed={collapsed} onMenuToggle={() => setCollapsed(!collapsed)} />
        <main
          className={`pt-16 min-h-screen transition-all duration-300 flex-1 min-w-0 ${
            collapsed ? 'md:ml-[68px]' : 'md:ml-[240px]'
          }`}
        >
          {employeeMonitoringEnabled && user && user.monitoringConsentShown === false && (
            <ConsentBanner onAccept={() => {
              dispatch(setUser({ ...user, monitoringConsentShown: true }));
            }} />
          )}
          
          <div className="p-4 md:p-6 w-full max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </IdleTimer>
  );
};

export default PageLayout;
