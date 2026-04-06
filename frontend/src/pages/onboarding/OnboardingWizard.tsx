import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Building2,
  Globe,
  Clock,
  LayoutGrid,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Briefcase,
  ChevronRight,
  Zap,
  FolderKanban,
  ListTodo,
  MessagesSquare,
  Palmtree,
  BarChart3,
  Calendar,
  Users
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { getMe } from '../../store/slices/authSlice';
import { fetchOnboardingStatus, submitStep1, submitStep2, submitStep3, submitStep4, completeOnboarding } from '../../store/slices/onboardingSlice';

const STEPS = [
  { number: 1, title: 'Identity & Style', desc: 'Branding & Vision', icon: <Building2 className="w-5 h-5" /> },
  { number: 2, title: 'Localization', desc: 'Regional Settings', icon: <Globe className="w-5 h-5" /> },
  { number: 3, title: 'Schedule', desc: 'Work Hours', icon: <Clock className="w-5 h-5" /> },
  { number: 4, title: 'Modules', desc: 'Feature Selection', icon: <LayoutGrid className="w-5 h-5" /> },
];

const TIMEZONES = [
  'Asia/Kolkata', 'America/New_York', 'America/Chicago', 'America/Los_Angeles',
  'Europe/London', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Singapore',
  'Australia/Sydney', 'America/Toronto', 'UTC',
];

const CURRENCIES = ['INR', 'USD', 'GBP', 'EUR', 'CAD', 'AUD', 'JPY', 'SGD'];
const DATE_FORMATS = ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY', 'DD-MM-YYYY'];
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const DEFAULT_FEATURES = [
  { key: 'projectManagement', label: 'Project Mgmt', icon: FolderKanban, desc: 'Kanban & Gantt' },
  { key: 'taskManagement', label: 'Tasks', icon: ListTodo, desc: 'Daily tracking' },
  { key: 'timeTracking', label: 'Time Tracking', icon: Clock, desc: 'Productivity' },
  { key: 'teamChat', label: 'Team Chat', icon: MessagesSquare, desc: 'Direct & Group' },
  { key: 'calendar', label: 'Calendar', icon: Calendar, desc: 'Deadlines' },
  { key: 'hrManagement', label: 'HR Admin', icon: Users, desc: 'Employee data' },
  { key: 'leaveManagement', label: 'Leaves', icon: Palmtree, desc: 'Holiday policy' },
  { key: 'performance', label: 'Reviews', icon: BarChart3, desc: 'KPI & Growth' },
];

const OnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { setupStep, setupCompleted, isLoading, isInitialized } = useAppSelector((state) => state.onboarding);
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 fields
  const [businessType, setBusinessType] = useState('');
  const [address, setAddress] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [logoUrl, setLogoUrl] = useState('');

  // Step 2 fields
  const [country, setCountry] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [currency, setCurrency] = useState('INR');
  const [dateFormat, setDateFormat] = useState('YYYY-MM-DD');

  // Step 3 fields
  const [workDays, setWorkDays] = useState([1, 2, 3, 4, 5]);
  const [workStart, setWorkStart] = useState('09:00');
  const [workEnd, setWorkEnd] = useState('18:00');

  // Step 4 fields
  const [selectedFeatures, setSelectedFeatures] = useState<Record<string, boolean>>(
    Object.fromEntries(DEFAULT_FEATURES.map((f) => [f.key, true]))
  );

  useEffect(() => {
    if (!isInitialized && !isLoading) {
      dispatch(fetchOnboardingStatus());
    }
  }, [dispatch, isInitialized, isLoading]);

  useEffect(() => {
    if (setupCompleted) {
      navigate('/', { replace: true });
    } else if (setupStep > 0 && setupStep <= 4) {
      setCurrentStep(setupStep);
    }
  }, [setupCompleted, setupStep, navigate]);

  const handleStep1 = async () => {
    const result = await dispatch(submitStep1({ businessType, address, primaryColor, logoUrl }));
    if (submitStep1.fulfilled.match(result)) {
      setCurrentStep(2);
    } else {
      toast.error('Failed to save branding settings');
    }
  };

  const handleStep2 = async () => {
    const result = await dispatch(submitStep2({ country, timezone, currency, dateFormat }));
    if (submitStep2.fulfilled.match(result)) {
      setCurrentStep(3);
    } else {
      toast.error('Failed to save localization settings');
    }
  };

  const handleStep3 = async () => {
    const result = await dispatch(submitStep3({ workDays, workHoursStart: workStart, workHoursEnd: workEnd }));
    if (submitStep3.fulfilled.match(result)) {
      setCurrentStep(4);
    } else {
      toast.error('Failed to save work schedule');
    }
  };

  const handleStep4 = async () => {
    const s4 = await dispatch(submitStep4({ emails: [], features: selectedFeatures }));
    if (submitStep4.fulfilled.match(s4)) {
      const comp = await dispatch(completeOnboarding());
      if (completeOnboarding.fulfilled.match(comp)) {
        await dispatch(fetchOnboardingStatus());
        await dispatch(getMe());
        navigate('/', { replace: true });
      } else {
        toast.error('Failed to complete onboarding');
      }
    } else {
      toast.error('Failed to launch workspace');
    }
  };

  const toggleDay = (idx: number) => {
    setWorkDays((prev) => prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx].sort());
  };

  const toggleFeature = (key: string) => {
    setSelectedFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Tailwind Reusable Classes
  const inputClass = "w-full pl-[44px] pr-4 py-3.5 bg-slate-50 border-[1.5px] border-slate-200 rounded-xl text-slate-900 text-[15px] focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400";
  const iconClass = "absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-[18px] h-[18px]";
  const labelClass = "block text-sm font-semibold text-slate-600 mb-2.5";

  return (
    <div className="fixed inset-0 flex bg-slate-50 overflow-hidden z-[9999] font-sans">

      {/* Left Column: Immersive Visuals */}
      <div className="hidden lg:flex flex-[1.1] relative overflow-hidden flex-col justify-between p-16 text-white bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900">

        {/* Animated Glow Orbs */}
        <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full blur-[100px] z-0 animate-pulse bg-indigo-500/25 pointer-events-none" />
        <div className="absolute bottom-[-50px] right-[-50px] w-[400px] h-[400px] rounded-full blur-[100px] z-0 animate-pulse bg-violet-500/20 pointer-events-none" style={{ animationDirection: 'reverse', animationDuration: '8s' }} />

        <div className="relative z-10 max-w-[440px]">
          <div className="flex items-center mb-20">
            <img
              src="/eyelevel_logo.png"
              alt="EyeLevel"
              className="h-16 w-auto object-contain brightness-0 invert"
            />
          </div>

          <div>
            <h1 className="text-[42px] font-extrabold leading-[1.1] mb-6 text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 tracking-tight">
              Build your <br /> workspace in <br /> seconds.
            </h1>
            <p className="text-lg leading-relaxed text-slate-400 m-0">
              Empower your team with a modern platform built for performance, transparency, and growth.
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 text-sm text-slate-400 italic opacity-80">
            <Zap className="w-5 h-5 text-indigo-400" />
            <span>Trusted by 500+ modern organizations worldwide.</span>
          </div>
        </div>
      </div>

      {/* Right Column: Form Wizard */}
      <div className="flex-[0.9] bg-white flex flex-col p-8 sm:p-16 overflow-y-auto relative w-full lg:w-auto custom-scrollbar">

        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.03),transparent_25%)] pointer-events-none" />

        <div className="hidden lg:flex flex-col absolute left-8 top-1/2 -translate-y-1/2 gap-8 z-10">
          {STEPS.map((s) => (
            <div
              key={s.number}
              className={`w-1 h-12 rounded-sm transition-all duration-500 ${currentStep === s.number ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]' : currentStep > s.number ? 'bg-emerald-500' : 'bg-slate-100'}`}
            />
          ))}
        </div>

        <div className="w-full max-w-[500px] mx-auto relative z-10 my-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Step 1 */}
          {currentStep === 1 && (
            <div>
              <div className="mb-10">
                <span className="block text-xs font-extrabold text-indigo-500 uppercase tracking-widest mb-2">Step 01 / 04</span>
                <h2 className="text-[32px] font-extrabold text-slate-900 tracking-tight m-0">Identity & Style</h2>
                <p className="text-slate-500 text-base mt-2">Personalize your workspace to match your brand.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className={labelClass}>Brand Primary Color</label>
                  <div className="flex items-center gap-4 p-3 bg-slate-50 border-[1.5px] border-slate-200 rounded-xl">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none p-0"
                    />
                    <span className="text-sm font-mono text-slate-600 uppercase font-bold">{primaryColor}</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="business-type" className={labelClass}>Industry / Type</label>
                  <div className="relative flex items-center">
                    <Briefcase className={iconClass} />
                    <input
                      id="business-type"
                      type="text"
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      placeholder="e.g. Creative Agency"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="logo-url" className={labelClass}>Brand Logo URL (Optional)</label>
                <div className="relative flex items-center">
                  <Globe className={iconClass} />
                  <input
                    id="logo-url"
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="company-address" className={labelClass}>Office Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-4 text-slate-400 w-[18px] h-[18px]" />
                  <textarea
                    id="company-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter city or full physical address"
                    rows={3}
                    className="w-full pl-[44px] pr-4 py-3.5 bg-slate-50 border-[1.5px] border-slate-200 rounded-xl text-slate-900 text-[15px] focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400 resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end mt-8">
                <button
                  className="px-8 py-3.5 rounded-2xl text-[15px] font-bold bg-slate-900 text-white hover:bg-slate-800 hover:scale-[1.02] flex items-center justify-center gap-2 transition-all disabled:opacity-50 w-full sm:w-auto"
                  onClick={handleStep1}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Next Step'} <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {currentStep === 2 && (
            <div>
              <div className="mb-10">
                <span className="block text-xs font-extrabold text-indigo-500 uppercase tracking-widest mb-2">Step 02 / 04</span>
                <h2 className="text-[32px] font-extrabold text-slate-900 tracking-tight m-0">Localization</h2>
                <p className="text-slate-500 text-base mt-2">Customize regional settings for your workspace.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                <div>
                  <label htmlFor="country" className={labelClass}>Country</label>
                  <input id="country" type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. India" className="w-full px-4 py-3.5 bg-slate-50 border-[1.5px] border-slate-200 rounded-xl text-slate-900 text-[15px] focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                </div>
                <div>
                  <label htmlFor="timezone" className={labelClass}>Timezone</label>
                  <select id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border-[1.5px] border-slate-200 rounded-xl text-slate-900 text-[15px] focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none cursor-pointer">
                    {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                <div>
                  <label htmlFor="currency" className={labelClass}>Currency</label>
                  <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border-[1.5px] border-slate-200 rounded-xl text-slate-900 text-[15px] focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none cursor-pointer">
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="date-format" className={labelClass}>Date Format</label>
                  <select id="date-format" value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border-[1.5px] border-slate-200 rounded-xl text-slate-900 text-[15px] focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none cursor-pointer">
                    {DATE_FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between mt-8 gap-4">
                <button className="px-6 sm:px-8 py-3.5 rounded-2xl text-[15px] font-bold border-[1.5px] border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button className="flex-1 px-8 py-3.5 rounded-2xl text-[15px] font-bold bg-slate-900 text-white hover:bg-slate-800 hover:scale-[1.02] flex items-center justify-center gap-2 transition-all disabled:opacity-50" onClick={handleStep2} disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Next Step'} <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {currentStep === 3 && (
            <div>
              <div className="mb-10">
                <span className="block text-xs font-extrabold text-indigo-500 uppercase tracking-widest mb-2">Step 03 / 04</span>
                <h2 className="text-[32px] font-extrabold text-slate-900 tracking-tight m-0">Work Schedule</h2>
                <p className="text-slate-500 text-base mt-2">Define standard working hours for the team.</p>
              </div>

              <div className="mb-6">
                <label className={labelClass}>Working Days</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day, i) => {
                    const isSelected = workDays.includes(i);
                    return (
                      <button
                        key={`${day}-${i}`}
                        type="button"
                        onClick={() => toggleDay(i)}
                        className={`w-11 h-11 rounded-xl flex justify-center items-center text-sm font-bold transition-all duration-200 ${isSelected ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 -translate-y-0.5' : 'bg-slate-50 border-[1.5px] border-slate-200 text-slate-600 hover:border-indigo-400 hover:bg-white'}`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                <div>
                  <label htmlFor="work-start" className={labelClass}>Shift Starts</label>
                  <input id="work-start" type="time" value={workStart} onChange={(e) => setWorkStart(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border-[1.5px] border-slate-200 rounded-xl text-slate-900 text-[15px] focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer" />
                </div>
                <div>
                  <label htmlFor="work-end" className={labelClass}>Shift Ends</label>
                  <input id="work-end" type="time" value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} className="w-full px-4 py-3.5 bg-slate-50 border-[1.5px] border-slate-200 rounded-xl text-slate-900 text-[15px] focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer" />
                </div>
              </div>

              <div className="flex items-center justify-between mt-8 gap-4">
                <button className="px-6 sm:px-8 py-3.5 rounded-2xl text-[15px] font-bold border-[1.5px] border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2" onClick={() => setCurrentStep(2)}>
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button className="flex-1 px-8 py-3.5 rounded-2xl text-[15px] font-bold bg-slate-900 text-white hover:bg-slate-800 hover:scale-[1.02] flex items-center justify-center gap-2 transition-all disabled:opacity-50" onClick={handleStep3} disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Next Step'} <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4 */}
          {currentStep === 4 && (
            <div>
              <div className="mb-10">
                <span className="block text-xs font-extrabold text-indigo-500 uppercase tracking-widest mb-2">Step 04 / 04</span>
                <h2 className="text-[32px] font-extrabold text-slate-900 tracking-tight m-0">Feature Toggle</h2>
                <p className="text-slate-500 text-base mt-2">Select the modules you want to activate.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {DEFAULT_FEATURES.map((feat) => {
                  const isActive = selectedFeatures[feat.key];
                  return (
                    <button
                      key={feat.key}
                      type="button"
                      onClick={() => toggleFeature(feat.key)}
                      className={`flex items-center gap-4 p-4 rounded-[18px] border-[1.5px] transition-all duration-300 text-left hover:-translate-y-1 ${isActive ? 'bg-indigo-50/50 border-indigo-500 shadow-[0_10px_20px_-10px_rgba(99,102,241,0.2)]' : 'bg-white border-slate-100 hover:border-indigo-300 hover:shadow-xl'}`}
                    >
                      <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center transition-colors ${isActive ? 'bg-indigo-500 text-white' : 'bg-slate-50 text-slate-500'}`}>
                        <feat.icon className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[14px] font-bold text-slate-900 truncate">{feat.label}</span>
                        <span className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider">{isActive ? 'Enabled' : 'Disabled'}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between mt-8 gap-4">
                <button className="px-6 sm:px-8 py-3.5 rounded-2xl text-[15px] font-bold border-[1.5px] border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2" onClick={() => setCurrentStep(3)}>
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button className="flex-1 px-8 py-3.5 rounded-2xl text-[15px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.02] flex items-center justify-center gap-2 transition-all disabled:opacity-50" onClick={handleStep4} disabled={isLoading}>
                  {isLoading ? 'Finalizing...' : 'Launch Workspace'} <CheckCircle2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
