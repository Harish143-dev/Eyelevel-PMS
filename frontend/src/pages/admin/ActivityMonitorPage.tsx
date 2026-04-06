import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import Avatar from '../../components/Avatar';
import Button from '../../components/ui/Button';
import { ShieldAlert, Activity, LogOut, Clock, Smartphone, Globe, Download, AlertTriangle } from 'lucide-react';
import activityService from '../../services/activityService';
import api from '../../services/api/axios';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

interface LiveStatus {
  sessionId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarColor: string;
    designation: string;
  };
  deviceInfo: any;
  ipAddress: string;
  loginTime: string;
  lastActiveAt: string;
  currentStatus: 'active' | 'idle' | 'break' | 'offline';
}

const ActivityMonitorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'live' | 'anomalies'>('live');
  const [statuses, setStatuses] = useState<LiveStatus[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ sessionId: string; userName: string } | null>(null);

  const fetchLiveStatus = async () => {
    try {
      const data = await activityService.getAdminLiveStatus();
      setStatuses(data.liveStatuses);
    } catch (error) {
      console.error('Failed to fetch live stats', error);
      toast.error('Failed to load active sessions');
    }
  };

  const fetchAnomalies = async () => {
    try {
      const data = await activityService.getAnomalies();
      setAnomalies(data);
    } catch (error) {
      console.error('Failed to fetch anomalies', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchLiveStatus(), fetchAnomalies()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(() => {
      fetchLiveStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleExportCSV = async () => {
    try {
      setExportLoading(true);
      const response = await api.get('/activity-tracking/admin/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `work-summary-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report exported successfully.');
    } catch (error) {
      toast.error('Failed to export CSV report');
    } finally {
      setExportLoading(false);
    }
  };

  const handleForceLogout = (sessionId: string, userName: string) => {
    setDeleteConfirm({ sessionId, userName });
  };

  const executeForceLogout = async () => {
    if (!deleteConfirm) return;
    
    setActionLoadingId(deleteConfirm.sessionId);
    try {
      await activityService.forceLogout(deleteConfirm.sessionId);
      toast.success(`${deleteConfirm.userName} has been logged out.`);
      setStatuses(prev => prev.filter(s => s.sessionId !== deleteConfirm.sessionId));
    } catch (error) {
      toast.error('Failed to force logout');
    } finally {
      setActionLoadingId(null);
      setDeleteConfirm(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success';
      case 'idle': return 'bg-warning';
      case 'break': return 'bg-orange-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-main flex items-center gap-2">
            <Activity className="text-primary" size={32} />
            Live Activity Monitor
          </h1>
          <p className="text-text-muted mt-1 text-lg">Real-time overview of active user sessions</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="secondary" 
            onClick={fetchData} 
            disabled={loading}
          >
            Refresh Now
          </Button>
          <Button 
            leftIcon={<Download size={18} />} 
            onClick={handleExportCSV} 
            disabled={exportLoading}
          >
            Export Today's CSV
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('live')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'live' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-text-muted hover:text-text-main hover:border-border'
          }`}
        >
          Live Sessions
        </button>
        <button
          onClick={() => setActiveTab('anomalies')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'anomalies' 
              ? 'border-warning text-warning' 
              : 'border-transparent text-text-muted hover:text-text-main hover:border-border'
          }`}
        >
          Anomalies Detected
          {anomalies.length > 0 && (
            <span className="bg-warning text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {anomalies.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'live' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-4 h-4 rounded-full bg-success animate-pulse" />
            <div>
              <p className="text-2xl font-bold">{statuses.filter(s => s.currentStatus === 'active').length}</p>
              <p className="text-xs text-text-muted uppercase tracking-wider">Active Now</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-4 h-4 rounded-full bg-warning" />
            <div>
              <p className="text-2xl font-bold">{statuses.filter(s => s.currentStatus === 'idle').length}</p>
              <p className="text-xs text-text-muted uppercase tracking-wider">Idle {'>'} 5m</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-4 h-4 rounded-full bg-orange-500" />
            <div>
              <p className="text-2xl font-bold">{statuses.filter(s => s.currentStatus === 'break').length}</p>
              <p className="text-xs text-text-muted uppercase tracking-wider">On Break</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-primary">{statuses.length}</p>
              <p className="text-xs text-primary/70 uppercase tracking-wider">Total Sessions</p>
            </div>
            <ShieldAlert className="text-primary" size={24} />
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-surface/50 border-b border-border">
              <tr>
                <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider">User</th>
                <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Live Status</th>
                <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Login Time</th>
                <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Device / IP</th>
                <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && statuses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text-muted">Loading live sessions...</td>
                </tr>
              ) : statuses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text-muted">No active sessions found.</td>
                </tr>
              ) : (
                statuses.map((session) => (
                  <tr key={session.sessionId} className="hover:bg-surface/50 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <Avatar name={session.user.name} color={session.user.avatarColor} size={36} />
                      <div>
                        <p className="font-semibold text-text-main text-sm">{session.user.name}</p>
                        <p className="text-xs text-text-muted">{session.user.designation || 'Member'}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(session.currentStatus)} ${session.currentStatus === 'active' ? 'animate-pulse' : ''}`} />
                        <span className="text-sm font-medium capitalize text-text-main">{session.currentStatus}</span>
                      </div>
                      <p className="text-[10px] text-text-muted mt-1">
                        Last ping: {formatDistanceToNow(new Date(session.lastActiveAt), { addSuffix: true })}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-text-muted">
                        <Clock size={14} />
                        <span className="text-sm">{new Date(session.loginTime).toLocaleTimeString()}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-xs text-text-muted truncate max-w-[200px]" title={JSON.stringify(session.deviceInfo)}>
                          <Smartphone size={12} /> Browser Tab
                        </div>
                        {session.ipAddress && (
                          <div className="flex items-center gap-1 text-xs text-text-muted">
                            <Globe size={12} /> {session.ipAddress}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="danger"
                        size="sm"
                        isLoading={actionLoadingId === session.sessionId}
                        onClick={() => handleForceLogout(session.sessionId, session.user.name)}
                        className="py-1 px-3 text-xs h-8"
                        leftIcon={<LogOut size={14} />}
                      >
                        Force Logout
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
        </>
      ) : (
        <Card className="shadow-lg border-border border-l-4 border-l-warning">
          <div className="p-4 border-b border-border bg-warning/5">
            <h3 className="font-bold flex items-center gap-2 text-warning">
              <AlertTriangle size={20} />
              Suspicious Activity Flags (Last 7 Days)
            </h3>
            <p className="text-sm text-text-muted mt-1">Review sessions flagged automatically by the behavior analysis daemon.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-surface/50 border-b border-border">
                <tr>
                  <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider">User</th>
                  <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Date</th>
                  <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Total Time</th>
                  <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Idle Time</th>
                  <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Flag Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-text-muted">Loading anomalies...</td></tr>
                ) : anomalies.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-success italic">No anomalies detected! System looks clean.</td></tr>
                ) : (
                  anomalies.map((anomaly) => (
                    <tr key={anomaly.id} className="hover:bg-warning/5 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <Avatar name={anomaly.user.name} color={anomaly.user.avatarColor} size={36} />
                        <div>
                          <p className="font-semibold text-text-main text-sm">{anomaly.user.name}</p>
                          <p className="text-xs text-text-muted">{anomaly.user.designation || 'Member'}</p>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-medium">{new Date(anomaly.date).toLocaleDateString()}</td>
                      <td className="p-4 text-sm font-bold">{(anomaly.totalSessionTime / 3600).toFixed(1)}h</td>
                      <td className="p-4 text-sm font-bold text-danger">{(anomaly.totalIdleTime / 3600).toFixed(1)}h</td>
                      <td className="p-4 text-sm text-warning font-medium">{anomaly.anomalyReason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={executeForceLogout}
        title="Force Logout"
        message={`Are you sure you want to force logout ${deleteConfirm?.userName}?`}
        confirmText="Logout"
        variant="danger"
      />
    </div>
  );
};

export default ActivityMonitorPage;
