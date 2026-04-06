import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api/axios';
import { ShieldCheck, ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface Company {
  id: string;
  name: string;
  features: Record<string, boolean>;
}

const DEFAULT_FEATURES = [
  { key: 'projectManagement', label: 'Project Management', module: 'PM' },
  { key: 'taskManagement', label: 'Task Management', module: 'PM' },
  { key: 'hrManagement', label: 'HR Management', module: 'HR' },
  { key: 'attendanceTracking', label: 'Attendance Tracking', module: 'HR' },
  { key: 'payroll', label: 'Payroll & Compliance', module: 'HR' },
  { key: 'leaveManagement', label: 'Leave Management', module: 'HR' },
  { key: 'employeeMonitoring', label: 'Employee Monitoring', module: 'Security' },
  { key: 'customFields', label: 'Custom Fields', module: 'Settings' },
  { key: 'dataExport', label: 'Data Export/Backup', module: 'Settings' },
  { key: 'teamChat', label: 'Team Chat', module: 'PM' },
  { key: 'calendar', label: 'Calendar', module: 'PM' },
  { key: 'performance', label: 'Performance Reviews', module: 'HR' },
  { key: 'clientManagement', label: 'Client Management', module: 'PM' },
  { key: 'templates', label: 'Templates', module: 'PM' },
  { key: 'analytics', label: 'Analytics', module: 'Reports' },
  { key: 'documents', label: 'Documents', module: 'PM' },
];

const CompanyFeatures: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const response = await api.get(`/api/companies/${id}`);
        setCompany(response.data.company);
        setFeatures(response.data.company.features || {});
      } catch (error) {
        console.error('Error fetching company features', error);
        toast.error('Failed to load company features');
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, [id]);

  const toggleFeature = (key: string) => {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const saveFeatures = async () => {
    setSaving(true);
    try {
      await api.patch(`/api/companies/${id}/features`, { features });
      toast.success('Features updated successfully');
      navigate('/pm/settings/super-admin');
    } catch (error) {
      console.error('Error saving features', error);
      toast.error('Failed to save features');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !company) {
    return <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div></div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 bg-surface hover:bg-background border border-border rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="text-primary" />
            Feature Manager
          </h1>
          <p className="text-text-muted mt-1">Managing access for <span className="font-bold text-text-main">{company.name}</span></p>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 mb-6">
        <div className="space-y-6">
          {['PM', 'HR', 'Reports', 'Settings', 'Security'].map(moduleName => (
            <div key={moduleName}>
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3 pb-2 border-b border-border/50">
                {moduleName} Module
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DEFAULT_FEATURES.filter(f => f.module === moduleName).map(feature => (
                  <label key={feature.key} className="flex items-center justify-between p-4 bg-background border border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    <div>
                      <div className="font-semibold text-text-main">{feature.label}</div>
                      <div className="text-xs text-text-muted mt-0.5">Key: `{feature.key}`</div>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={features[feature.key] !== false} 
                        onChange={() => toggleFeature(feature.key)} 
                      />
                      <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button 
          onClick={() => navigate(-1)} 
          className="px-4 py-2 border border-border rounded-lg hover:bg-surface font-medium transition-colors"
        >
          Cancel
        </button>
        <button 
          onClick={saveFeatures} 
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium transition-colors disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default CompanyFeatures;
