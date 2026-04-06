import React, { useState, useEffect } from 'react';
import api from '../../services/api/axios';
import { Card, CardContent } from '../../components/ui/Card';
import Avatar from '../../components/Avatar';
import { Activity, Clock, ShieldAlert, MonitorPlay, Search } from 'lucide-react';
import { format, differenceInMinutes, parseISO } from 'date-fns';

interface MonitoringRecord {
  id: string;
  userId: string;
  firstLoginAt: string | null;
  lastLogoutAt: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  user: {
    name: string;
    email: string;
    avatarColor: string;
    designation: string | null;
  };
}

const MonitoringDashboard: React.FC = () => {
  const [records, setRecords] = useState<MonitoringRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [targetDate, setTargetDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [targetDate]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/monitoring/daily?date=${targetDate}`);
      setRecords(res.data);
    } catch (error) {
      console.error('Failed to fetch monitoring data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDuration = (first: string | null, last: string | null) => {
    if (!first) return 'No Login';
    const end = last ? parseISO(last) : new Date();
    const diffMins = differenceInMinutes(end, parseISO(first));
    
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const filteredRecords = records.filter(r => 
    r.user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 fade-in text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <MonitorPlay size={32} className="text-indigo-600" />
            Live Session Monitoring
          </h1>
          <p className="text-gray-500 mt-1">Audit active sessions, total duration, and login geographical origin.</p>
        </div>
        
        <div className="flex gap-4 items-center w-full md:w-auto">
          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-md focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
            />
          </div>
          <input 
            type="date" 
            value={targetDate} 
            onChange={(e) => setTargetDate(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-md">
        <div className="flex items-start">
          <ShieldAlert className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-bold text-yellow-800">Privacy Notice Enforced</h3>
            <p className="text-sm text-yellow-700 mt-1">
              "Employee Monitoring" restricts tracking exclusively to passive system check-ins via Auth gateways. 
              Each user undergoes forced consent checks transparently disclosing access logs.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b font-medium text-gray-700">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">First Login</th>
                  <th className="px-6 py-4">Last Logout/Ping</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Security Fingerprint (IP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 flex flex-col items-center">
                       <Activity className="animate-pulse w-8 h-8 text-indigo-200 mb-2" />
                       Scanning session logs...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500 italic">
                      No matching records for {targetDate}.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center space-x-3">
                          <Avatar name={rec.user.name} color={rec.user.avatarColor} size={32} />
                          <div>
                            <p className="font-semibold text-gray-800">{rec.user.name}</p>
                            <p className="text-xs text-gray-500">{rec.user.designation || 'Employee'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-gray-700 font-medium">
                        {rec.firstLoginAt ? format(parseISO(rec.firstLoginAt), 'hh:mm a') : '—'}
                      </td>
                      <td className="px-6 py-3 text-gray-500">
                        {rec.lastLogoutAt ? format(parseISO(rec.lastLogoutAt), 'hh:mm a') : (
                          <span className="inline-flex items-center text-green-600 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-gray-700 font-semibold tabular-nums">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" /> 
                          {calculateDuration(rec.firstLoginAt, rec.lastLogoutAt)}
                        </div>
                      </td>
                      <td className="px-6 py-3 font-mono text-xs text-gray-500 truncate max-w-[200px]" title={rec.userAgent || ''}>
                        <div className="font-medium text-gray-700">{rec.ipAddress || 'Internal Network'}</div>
                        <div className="text-[10px] text-gray-400 italic">User-Agent Logged</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonitoringDashboard;
