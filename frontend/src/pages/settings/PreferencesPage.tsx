import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import CustomSelect from '../../components/ui/CustomSelect';
import toast from 'react-hot-toast';
import api from '../../services/api/axios';
import { useTheme } from '../../store/ThemeContext';

const PreferencesPage: React.FC = () => {
  const [preferences, setPreferences] = useState({
    theme: 'system',
    language: 'en',
    defaultDashboardView: 'overview',
    itemsPerPage: 25
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { setTheme } = useTheme();

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const res = await api.get('/users/preferences');
      if (res.data) {
        const mergedPrefs = {
          theme: res.data.theme || 'system',
          language: res.data.language || 'en',
          defaultDashboardView: res.data.defaultDashboardView || 'overview',
          itemsPerPage: res.data.itemsPerPage || 25
        };
        setPreferences(mergedPrefs);
        applyTheme(mergedPrefs.theme);
      }
    } catch (error) {
      toast.error('Failed to load preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const applyTheme = (themeStr: string) => {
    setTheme(themeStr as any);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put('/users/preferences', preferences);
      applyTheme(preferences.theme);
      toast.success('Preferences saved successfully');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-text-main">System Preferences</h1>
        <p className="mt-1 text-sm text-text-muted">
          Manage your personal workspace settings, themes, and views.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance & Locale</CardTitle>
          <CardDescription>Customize how the platform looks for you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-main">Theme Interface</label>
              <CustomSelect
                options={[
                  { value: 'light', label: 'Light Mode' },
                  { value: 'dark', label: 'Dark Mode' },
                  { value: 'system', label: 'System Default' }
                ]}
                value={preferences.theme}
                onChange={(val) => {
                  setPreferences({ ...preferences, theme: val });
                  applyTheme(val);
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-main">Language</label>
              <div className="px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-text-main flex items-center gap-2">
                <span>🌐</span> English (US)
              </div>
              <p className="text-xs text-text-muted">Only English is currently supported.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workspace Defaults</CardTitle>
          <CardDescription>Your personal configurations across the board.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-main">Default Dashboard View</label>
              <CustomSelect
                options={[
                  { value: 'overview', label: 'Main Overview' },
                  { value: 'tasks', label: 'My Tasks List' },
                  { value: 'projects', label: 'Projects Timeline' }
                ]}
                value={preferences.defaultDashboardView}
                onChange={(val) => setPreferences({ ...preferences, defaultDashboardView: val })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-main">Items Per Page (Tables)</label>
              <CustomSelect
                options={[
                  { value: '10', label: '10 Items' },
                  { value: '25', label: '25 Items' },
                  { value: '50', label: '50 Items' },
                  { value: '100', label: '100 Items' }
                ]}
                value={String(preferences.itemsPerPage)}
                onChange={(val) => setPreferences({ ...preferences, itemsPerPage: Number(val) })}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end pt-6 border-t border-border mt-4">
          <Button onClick={handleSave} isLoading={isSaving}>Save Preferences</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PreferencesPage;
