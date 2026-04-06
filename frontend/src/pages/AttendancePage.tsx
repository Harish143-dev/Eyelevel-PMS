import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import {
  LogIn,
  LogOut,
  Clock,
  Calendar,
  AlertCircle
} from 'lucide-react';
import activityService, { type ActivityStatusResponse } from '../services/activityService';
import attendanceService, { type AttendanceRecord } from '../services/attendanceService';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const AttendancePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [activityStatus, setActivityStatus] = useState<ActivityStatusResponse | null>(null);
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);

  const formatSeconds = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [status, attendanceLogs, myActivityStatus] = await Promise.all([
        attendanceService.getTodayStatus(),
        attendanceService.getLogs(),
        activityService.getMyStatus().catch(() => null)
      ]);
      setTodayRecord(status);
      setLogs(attendanceLogs);
      if (myActivityStatus) setActivityStatus(myActivityStatus);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      await attendanceService.checkIn();
      toast.success('Checked in successfully!');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      await attendanceService.checkOut();
      toast.success('Checked out successfully!');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-main flex items-center gap-2">
            <Calendar className="text-primary" size={32} />
            Attendance Management
          </h1>
          <p className="text-text-muted mt-1 text-lg">Track your daily presence and working hours</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-primary/20 shadow-lg shadow-primary/5">
          <CardHeader>
            <CardTitle>Today's Status</CardTitle>
            <CardDescription>Register your entry or exit for today</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            {!todayRecord ? (
              <div className="text-center">
                <div className="bg-background p-4 rounded-full mb-4 inline-block">
                  <AlertCircle size={48} className="text-text-muted opacity-50" />
                </div>
                <p className="text-text-muted mb-6">You haven't checked in yet today.</p>
                <Button
                  onClick={handleCheckIn}
                  disabled={actionLoading}
                  size="lg"
                  className="px-8 py-6 text-lg h-auto rounded-xl gap-2 shadow-lg shadow-primary/20"
                >
                  <LogIn size={20} />
                  Check In Now
                </Button>
              </div>
            ) : (
              <div className="w-full space-y-6 text-center">
                <div className="flex justify-center">
                  <Badge
                    variant={todayRecord.status === 'present' ? 'green' : 'amber'}
                    className="text-sm px-4 py-1 uppercase tracking-wider font-bold"
                  >
                    {todayRecord.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background p-4 rounded-xl border border-border">
                    <p className="text-xs text-text-muted uppercase font-bold mb-1">Check In</p>
                    <p className="text-xl font-bold text-text-main">
                      {format(new Date(todayRecord.checkIn), 'hh:mm a')}
                    </p>
                  </div>
                  <div className="bg-background p-4 rounded-xl border border-border">
                    <p className="text-xs text-text-muted uppercase font-bold mb-1">Check Out</p>
                    <p className="text-xl font-bold text-text-main">
                      {todayRecord.checkOut ? format(new Date(todayRecord.checkOut), 'hh:mm a') : '--:--'}
                    </p>
                  </div>
                </div>

                {!todayRecord.checkOut ? (
                  <div className="pt-4">
                    <Button
                      onClick={handleCheckOut}
                      variant="secondary"
                      disabled={actionLoading}
                      size="lg"
                      className="w-full py-6 text-lg h-auto rounded-xl gap-2 border-primary/30 text-primary hover:bg-primary/5"
                    >
                      <LogOut size={20} />
                      Finish Workday
                    </Button>
                  </div>
                ) : (
                  <div className="pt-4 p-4 bg-success/5 border border-success/20 rounded-xl">
                    <p className="text-success font-medium flex items-center justify-center gap-2">
                      <Clock size={18} />
                      Workday completed: <span className="text-xl font-bold">{todayRecord.totalHours} hrs</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/20 shadow-lg shadow-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock size={20} className="text-primary"/>
              Live Activity Tracker
            </CardTitle>
            <CardDescription>Your real-time activity and time breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {activityStatus ? (
              <>
                <div className="flex justify-between items-center p-4 bg-background border border-border rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${
                      activityStatus.currentStatus === 'active' ? 'bg-success animate-pulse' :
                      activityStatus.currentStatus === 'idle' ? 'bg-warning' :
                      activityStatus.currentStatus === 'break' ? 'bg-orange-500' : 'bg-gray-400'
                    }`} />
                    <span className="font-bold uppercase tracking-wider text-sm">
                      {activityStatus.currentStatus}
                    </span>
                  </div>
                  <div>
                    <Badge variant="green" className="opacity-80">
                      Productive: {formatSeconds(activityStatus.todaySummary.productiveTime)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3 bg-success/5 border border-success/20 rounded-lg text-center">
                    <p className="text-xs text-text-muted font-semibold mb-1">Session</p>
                    <p className="font-bold text-success">
                      {formatSeconds(activityStatus.todaySummary.totalSessionTime)}
                    </p>
                  </div>
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-center">
                    <p className="text-xs text-text-muted font-semibold mb-1">Active</p>
                    <p className="font-bold text-primary">
                      {formatSeconds(activityStatus.todaySummary.totalActiveTime)}
                    </p>
                  </div>
                  <div className="p-3 bg-warning/5 border border-warning/20 rounded-lg text-center">
                    <p className="text-xs text-text-muted font-semibold mb-1">Idle</p>
                    <p className="font-bold text-warning">
                      {formatSeconds(activityStatus.todaySummary.totalIdleTime)}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg text-center">
                    <p className="text-xs text-text-muted font-semibold mb-1">Break</p>
                    <p className="font-bold text-orange-500">
                      {formatSeconds(activityStatus.todaySummary.totalBreakTime)}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center p-6 bg-background rounded-xl border border-dashed border-border text-text-muted">
                Activity data unavailable. Try reloading or working on tasks.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/10 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <Clock size={20} />
              Policy Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-success/20 text-success flex items-center justify-center text-xs font-bold mt-1">1</div>
              <p className="text-text-main text-sm">Check in before <span className="font-bold">10:00 AM</span> to avoid being marked late.</p>
            </div>
            <div className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold mt-1">2</div>
              <p className="text-text-main text-sm">Remember to check out before leaving to accurately record your total hours.</p>
            </div>
            <div className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-warning/20 text-warning flex items-center justify-center text-xs font-bold mt-1">3</div>
              <p className="text-text-main text-sm">Total hours are calculated automatically based on your check-in and check-out timestamps.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-text-main">Recent Activity Logs</h2>
        <Table className="border border-border rounded-xl overflow-hidden">
          <TableHeader>
            <TableRow className="bg-background/50">
              <TableHead>Date</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total Hours</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-text-muted">
                  No attendance records found yet.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="hover:bg-primary/5 transition-colors">
                  <TableCell className="font-medium text-text-main">
                    {format(new Date(log.date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>{format(new Date(log.checkIn), 'hh:mm a')}</TableCell>
                  <TableCell>{log.checkOut ? format(new Date(log.checkOut), 'hh:mm a') : '-'}</TableCell>
                  <TableCell>
                    <Badge variant={log.status === 'present' ? 'green' : log.status === 'late' ? 'amber' : 'gray'}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold text-text-main">
                    {log.totalHours ? `${log.totalHours} hrs` : '--'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AttendancePage;
