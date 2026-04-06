import React, { useState, useEffect } from 'react';
import api from '../../services/api/axios';
import { useAppDispatch } from '../../hooks/useRedux';
import { getMe } from '../../store/slices/authSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { Palmtree, Plus, Trash2, Clock } from 'lucide-react';

const inputClass = "w-full text-sm px-3 py-2 bg-surface border border-border rounded-lg text-text-main focus:outline-none focus:ring-1 focus:ring-primary";

const WorkspaceLeave: React.FC = () => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState({
    halfDayThreshold: 4,
    overtimeLimit: 2,
    leaveCategories: [] as Array<{ name: string; isCarryForward: boolean; maxDays: number }>,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings/company');
      setSettings({
        halfDayThreshold: res.data?.settings?.halfDayThreshold || 4,
        overtimeLimit: res.data?.settings?.overtimeLimit || 2,
        leaveCategories: res.data?.settings?.leaveCategories || [],
      });
    } catch (error) {
      toast.error('Failed to load leave settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put('/settings/company', settings);
      toast.success('Leave policies updated');
      dispatch(getMe());
    } catch (error) {
      toast.error('Failed to update leave policies');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddLeaveType = () => {
    setSettings(prev => ({
      ...prev,
      leaveCategories: [
        ...prev.leaveCategories,
        { name: '', isCarryForward: false, maxDays: 0 }
      ]
    }));
  };

  const handleLeaveTypeChange = (index: number, field: string, value: any) => {
    const updated = [...settings.leaveCategories];
    updated[index] = { ...updated[index], [field]: value };
    setSettings(prev => ({ ...prev, leaveCategories: updated }));
  };

  const handleRemoveLeaveType = (index: number) => {
    const updated = settings.leaveCategories.filter((_, idx) => idx !== index);
    setSettings(prev => ({ ...prev, leaveCategories: updated }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center flex-col items-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-text-muted">Loading policies...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-main">HR & Leave Policies</h1>
        <p className="mt-1 text-sm text-text-muted">
          Configure attendance rules, overtime limits, and paid time off quotas.
        </p>
      </div>

      <Card>
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            Attendance Thresholds
          </CardTitle>
          <CardDescription className="mt-1">
            Rules for automatic time logging classifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-5">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-main mb-1.5">Half-Day Threshold (Hours)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={settings.halfDayThreshold}
                onChange={(e) => setSettings({ ...settings, halfDayThreshold: Number(e.target.value) })}
                className={inputClass}
              />
              <p className="text-xs text-text-muted mt-1.5">
                Minimum daily hours required to count as 0.5 working days. Default is 4.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-main mb-1.5">Auto-Overtime Limit (Hours)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={settings.overtimeLimit}
                onChange={(e) => setSettings({ ...settings, overtimeLimit: Number(e.target.value) })}
                className={inputClass}
              />
              <p className="text-xs text-text-muted mt-1.5">
                Maximum daily overtime verified automatically without manual manager approval.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Palmtree size={20} className="text-primary" />
                Leave Categories
              </CardTitle>
              <CardDescription className="mt-1">
                Define standard PTO types available to your team.
              </CardDescription>
            </div>
            <Button size="sm" onClick={handleAddLeaveType} leftIcon={<Plus size={14} />}>
              Add Category
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          {(settings.leaveCategories.length > 0) ? (
            <div className="space-y-3">
              {settings.leaveCategories.map((cat, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row gap-4 items-end sm:items-center p-4 border border-border bg-background rounded-xl hover:border-primary/30 transition-colors">
                  <div className="flex-1 w-full">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5">Category Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Sick Leave, Annual Leave" 
                      value={cat.name} 
                      onChange={(e) => handleLeaveTypeChange(idx, 'name', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="w-full sm:w-32">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5">Max Days/Yr</label>
                    <input 
                      type="number" 
                      min="0"
                      value={cat.maxDays} 
                      onChange={(e) => handleLeaveTypeChange(idx, 'maxDays', Number(e.target.value))}
                      className={inputClass}
                    />
                  </div>
                  <div className="w-full sm:w-auto pt-2 sm:pt-0 sm:pb-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer px-2 py-1 text-text-main mx-1">
                      <input 
                        type="checkbox" 
                        checked={cat.isCarryForward} 
                        onChange={(e) => handleLeaveTypeChange(idx, 'isCarryForward', e.target.checked)}
                        className="w-4 h-4 rounded text-primary focus:ring-primary border-border bg-background cursor-pointer"
                      />
                      <span>Carry Fw.</span>
                    </label>
                  </div>
                  <button 
                    onClick={() => handleRemoveLeaveType(idx)}
                    className="p-2 sm:mb-1 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors border border-transparent self-end sm:self-auto"
                    title="Delete Category"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-border rounded-xl bg-surface/30">
              <Palmtree size={32} className="mx-auto text-text-muted/30 mb-3" />
              <p className="text-sm text-text-muted">No leave categories defined.</p>
              <p className="text-xs text-text-muted mt-1">Employees will not be able to request time off.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t border-border mt-4 justify-end">
          <Button onClick={handleSave} isLoading={isSaving} disabled={settings.leaveCategories.some(c => !c.name.trim())}>
            Save Leave Policies
          </Button>
        </CardFooter>
      </Card>
      
    </div>
  );
};

export default WorkspaceLeave;
