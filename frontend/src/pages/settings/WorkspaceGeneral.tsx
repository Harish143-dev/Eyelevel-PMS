import React, { useState, useEffect } from 'react';
import api from '../../services/api/axios';
import { useAppDispatch } from '../../hooks/useRedux';
import { getMe } from '../../store/slices/authSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import CustomSelect from '../../components/ui/CustomSelect';
import toast from 'react-hot-toast';
import { Building2, Globe, CalendarRange, UploadCloud, Link as LinkIcon } from 'lucide-react';

const inputClass = "w-full text-sm px-3 py-2 bg-surface border border-border rounded-lg text-text-main focus:outline-none focus:ring-1 focus:ring-primary";
const labelClass = "block text-sm font-medium text-text-main mb-1.5";

const WorkspaceGeneral: React.FC = () => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [logoInputType, setLogoInputType] = useState<'file' | 'url'>('file');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState({
    companyName: '',
    businessType: '',
    address: '',
    city: '',
    state: '',
    country: '',
    website: '',
    logoUrl: '',
    timezone: 'UTC',
    currency: 'USD',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    workHoursStart: '09:00',
    workHoursEnd: '17:00',
    lateGraceMinutes: 15,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings/company');
      const data = res.data.settings || {};
      const company = res.data.company || {};
      
      setSettings(prev => ({
        ...prev,
        ...data,
        companyName: company.name || data.companyName || '',
      }));
    } catch (error) {
      toast.error('Failed to load general settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put('/settings/company', settings);
      toast.success('Workspace settings updated');
      dispatch(getMe()); // refresh user state for UI changes
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleWorkDay = (day: string) => {
    const isSelected = settings.workDays.includes(day);
    if (isSelected) {
      setSettings({ ...settings, workDays: settings.workDays.filter(d => d !== day) });
    } else {
      setSettings({ ...settings, workDays: [...settings.workDays, day] });
    }
  };

  const processLogoFile = (file: File) => {
    const validTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Only SVG, PNG, JPG, and WEBP are allowed.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      toast.error('Logo file size must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      handleChange('logoUrl', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processLogoFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processLogoFile(file);
  };

  const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (isLoading) {
    return (
      <div className="flex justify-center flex-col items-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-text-muted">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Workspace General</h1>
        <p className="mt-1 text-sm text-text-muted">
          Manage your organization's profile, localization, and working hours.
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Building2 size={20} className="text-primary" />
            Company Profile
          </CardTitle>
          <CardDescription className="mt-1">
            Basic information about your organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-5">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="shrink-0">
              <label className={labelClass}>Company Logo</label>
              <div className="w-24 h-24 bg-surface border border-border border-dashed rounded-xl flex items-center justify-center overflow-hidden relative group">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Building2 size={32} className="text-text-muted/30" />
                )}
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Organization Name</label>
                  <input
                    type="text"
                    value={settings.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Website</label>
                  <input
                    type="url"
                    value={settings.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    className={inputClass}
                    placeholder="https://"
                  />
                </div>
              </div>
              
              <div className="pt-2">
                <div className="flex items-center gap-4 mb-3 border-b border-border/50 pb-2">
                  <button
                    className={`text-sm font-medium pb-2 border-b-2 transition-colors ${logoInputType === 'file' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-main'}`}
                    onClick={() => { setLogoInputType('file'); handleChange('logoUrl', ''); }}
                  >
                    <div className="flex items-center gap-1.5"><UploadCloud size={16}/> Upload Logo</div>
                  </button>
                  <button
                    className={`text-sm font-medium pb-2 border-b-2 transition-colors ${logoInputType === 'url' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-main'}`}
                    onClick={() => { setLogoInputType('url'); handleChange('logoUrl', ''); }}
                  >
                    <div className="flex items-center gap-1.5"><LinkIcon size={16}/> Image URL</div>
                  </button>
                </div>
                
                {logoInputType === 'file' ? (
                  <div 
                    className={`p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center gap-2 transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-border bg-surface/50'}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.webp,.svg"
                      onChange={handleFileUpload}
                      key={settings.logoUrl} // Reset input if logoUrl changes
                    />
                    <UploadCloud size={24} className="text-text-muted" />
                    <div className="text-sm">
                      <span className="text-primary font-medium hover:underline cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        Click to upload
                      </span>
                      <span className="text-text-muted"> or drag and drop</span>
                    </div>
                    <p className="text-xs text-text-muted">SVG, PNG, JPG or WEBP (max. 2MB)</p>
                  </div>
                ) : (
                  <div>
                    <label className={labelClass}>Paste Logo URL</label>
                    <input
                      type="text"
                      value={settings.logoUrl}
                      onChange={(e) => handleChange('logoUrl', e.target.value)}
                      className={inputClass}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="md:col-span-3">
                  <label className={labelClass}>HQ Address</label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>City</label>
                  <input
                    type="text"
                    value={settings.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>State/Province</label>
                  <input
                    type="text"
                    value={settings.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Country</label>
                  <input
                    type="text"
                    value={settings.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Localization Section */}
      <Card>
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Globe size={20} className="text-primary" />
            Localization
          </CardTitle>
          <CardDescription className="mt-1">
            Regional settings affecting dates, times, and currency displays.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-5">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Timezone</label>
                <CustomSelect
                  options={[
                    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
                    { value: 'America/New_York', label: 'EST (New York)' },
                    { value: 'Europe/London', label: 'GMT (London)' },
                    { value: 'Asia/Dubai', label: 'GST (Dubai)' },
                    { value: 'Asia/Kolkata', label: 'IST (India)' },
                    { value: 'Asia/Singapore', label: 'SGT (Singapore)' },
                  ]}
                  value={settings.timezone}
                  onChange={(val) => handleChange('timezone', val)}
                />
              </div>
              <div>
                <label className={labelClass}>Currency</label>
                <CustomSelect
                  options={[
                    { value: 'USD', label: 'USD ($) - US Dollar' },
                    { value: 'EUR', label: 'EUR (€) - Euro' },
                    { value: 'GBP', label: 'GBP (£) - British Pound' },
                    { value: 'INR', label: 'INR (₹) - Indian Rupee' },
                    { value: 'AED', label: 'AED (د.إ) - UAE Dirham' },
                  ]}
                  value={settings.currency}
                  onChange={(val) => handleChange('currency', val)}
                />
              </div>
              <div>
                <label className={labelClass}>Date Format</label>
                <CustomSelect
                  options={[
                    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-03-15)' },
                    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (15/03/2024)' },
                    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (03/15/2024)' },
                  ]}
                  value={settings.dateFormat}
                  onChange={(val) => handleChange('dateFormat', val)}
                />
              </div>
              <div>
                <label className={labelClass}>Time Format</label>
                <CustomSelect
                  options={[
                    { value: '12h', label: '12-Hour (02:30 PM)' },
                    { value: '24h', label: '24-Hour (14:30)' },
                  ]}
                  value={settings.timeFormat}
                  onChange={(val) => handleChange('timeFormat', val)}
                />
              </div>
            </div>
        </CardContent>
      </Card>

      {/* Work Schedule */}
      <Card>
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="flex items-center gap-2">
            <CalendarRange size={20} className="text-primary" />
            Default Work Schedule
          </CardTitle>
          <CardDescription className="mt-1">
            Global business hours used for time tracking and SLA calculations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-5">
           <div>
              <label className={labelClass}>Working Days</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {WEEKDAYS.map(day => (
                  <button
                    key={day}
                    onClick={() => toggleWorkDay(day)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      settings.workDays.includes(day)
                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                        : 'bg-surface border border-border text-text-muted hover:bg-background'
                    }`}
                  >
                    {day.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
              <div>
                <label className={labelClass}>Work Start Time</label>
                <input
                  type="time"
                  value={settings.workHoursStart}
                  onChange={(e) => handleChange('workHoursStart', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Work End Time</label>
                <input
                  type="time"
                  value={settings.workHoursEnd}
                  onChange={(e) => handleChange('workHoursEnd', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Late Grace Period (Mins)</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={settings.lateGraceMinutes}
                  onChange={(e) => handleChange('lateGraceMinutes', Number(e.target.value))}
                  className={inputClass}
                />
              </div>
            </div>
        </CardContent>
        <CardFooter className="border-t border-border mt-4 justify-end">
          <Button onClick={handleSave} isLoading={isSaving}>
            Save General Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default WorkspaceGeneral;
