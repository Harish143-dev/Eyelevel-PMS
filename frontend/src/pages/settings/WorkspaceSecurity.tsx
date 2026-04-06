import React, { useState, useEffect } from 'react';
import api from '../../services/api/axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import CustomSelect from '../../components/ui/CustomSelect';
import toast from 'react-hot-toast';
import { ShieldCheck, Key, Clock, Smartphone } from 'lucide-react';

const inputClass = "w-full text-sm px-3 py-2 bg-surface border border-border rounded-lg text-text-main focus:outline-none focus:ring-1 focus:ring-primary";

const WorkspaceSecurity: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState({
    passwordPolicy: {
      requireUppercase: true,
      requireNumber: true,
      requireSpecialChar: true,
      minLength: 8
    },
    sessionTimeout: 120,
    require2fa: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings/company');
      if (res.data?.settings) {
        setSettings(prev => ({
          ...prev,
          passwordPolicy: res.data.settings.passwordPolicy || prev.passwordPolicy,
          sessionTimeout: res.data.settings.sessionTimeout || 120,
          require2fa: res.data.settings.require2fa || false,
        }));
      }
    } catch (error) {
      toast.error('Failed to load security settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put('/settings/company', {
        passwordPolicy: settings.passwordPolicy,
        sessionTimeout: settings.sessionTimeout,
        require2fa: settings.require2fa
      });
      toast.success('Security settings updated');
    } catch (error) {
      toast.error('Failed to update security settings');
    } finally {
      setIsSaving(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-text-main">Security & Authentication</h1>
        <p className="mt-1 text-sm text-text-muted">
          Manage how users authenticate and access your workspace.
        </p>
      </div>

      <Card>
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Key size={20} className="text-primary" />
            Password Policy
          </CardTitle>
          <CardDescription className="mt-1">
            Enforce strong passwords for all user accounts in your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-5">
          <div>
            <label className="block text-sm font-medium text-text-main mb-1.5">Minimum Password Length</label>
            <CustomSelect
              options={[
                { value: '8', label: '8 characters (Standard)' },
                { value: '10', label: '10 characters' },
                { value: '12', label: '12 characters (Strong)' },
                { value: '16', label: '16 characters (Maximum Security)' },
              ]}
              value={String(settings.passwordPolicy.minLength)}
              onChange={(val) => setSettings({ 
                ...settings, 
                passwordPolicy: { ...settings.passwordPolicy, minLength: Number(val) } 
              })}
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 bg-surface border border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
              <input
                type="checkbox"
                checked={settings.passwordPolicy.requireUppercase}
                onChange={(e) => setSettings({
                  ...settings,
                  passwordPolicy: { ...settings.passwordPolicy, requireUppercase: e.target.checked }
                })}
                className="w-4 h-4 text-primary rounded border-border bg-background focus:ring-primary focus:ring-offset-background"
              />
              <span className="text-sm font-medium text-text-main">Require at least one uppercase letter</span>
            </label>
            
            <label className="flex items-center gap-3 p-3 bg-surface border border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
              <input
                type="checkbox"
                checked={settings.passwordPolicy.requireNumber}
                onChange={(e) => setSettings({
                  ...settings,
                  passwordPolicy: { ...settings.passwordPolicy, requireNumber: e.target.checked }
                })}
                className="w-4 h-4 text-primary rounded border-border bg-background focus:ring-primary focus:ring-offset-background"
              />
              <span className="text-sm font-medium text-text-main">Require at least one number</span>
            </label>
            
            <label className="flex items-center gap-3 p-3 bg-surface border border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
              <input
                type="checkbox"
                checked={settings.passwordPolicy.requireSpecialChar}
                onChange={(e) => setSettings({
                  ...settings,
                  passwordPolicy: { ...settings.passwordPolicy, requireSpecialChar: e.target.checked }
                })}
                className="w-4 h-4 text-primary rounded border-border bg-background focus:ring-primary focus:ring-offset-background"
              />
              <span className="text-sm font-medium text-text-main">Require at least one special character (!@#$%^&*)</span>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Smartphone size={20} className="text-primary" />
            Two-Factor Authentication (2FA)
          </CardTitle>
          <CardDescription className="mt-1">
            Additional security layers during login.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-5">
          <label className="flex items-start gap-3 p-4 bg-surface border border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
            <div className="pt-0.5">
              <input
                type="checkbox"
                checked={settings.require2fa}
                onChange={(e) => setSettings({ ...settings, require2fa: e.target.checked })}
                className="w-4 h-4 text-primary rounded border-border bg-background focus:ring-primary focus:ring-offset-background"
              />
            </div>
            <div>
              <span className="text-sm font-bold text-text-main block">Enforce 2FA for all users</span>
              <span className="text-xs text-text-muted mt-1 block">
                If enabled, all users will be required to set up an Authenticator app (like Google Authenticator) upon their next login.
              </span>
            </div>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            Session Management
          </CardTitle>
          <CardDescription className="mt-1">
            Control how long users can remain logged in while inactive.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-5">
           <div>
            <label className="block text-sm font-medium text-text-main mb-1.5">Idle Session Timeout (Minutes)</label>
            <input
              type="number"
              min="15"
              max="1440"
              value={settings.sessionTimeout}
              onChange={(e) => setSettings({ ...settings, sessionTimeout: Number(e.target.value) })}
              className={inputClass}
            />
            <p className="text-xs text-text-muted mt-2">
              Users will be automatically logged out after this many minutes of inactivity. Default is 120 minutes (2 hours). Max is 1440 (24 hours).
            </p>
          </div>
        </CardContent>
        <CardFooter className="border-t border-border mt-4 justify-end">
          <Button onClick={handleSave} isLoading={isSaving}>
            Save Security Settings
          </Button>
        </CardFooter>
      </Card>
      
    </div>
  );
};

export default WorkspaceSecurity;
