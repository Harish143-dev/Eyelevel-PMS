import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { updateProfile, updatePassword } from '../store/slices/authSlice';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Avatar from '../components/Avatar';
import { 
  User, Mail, Shield, CheckCircle, Briefcase, Lock, 
  Calendar, Clock, Award
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  designation: z.string().max(100, 'Designation must be less than 100 characters').optional().nullable(),
  currentPassword: z.string().optional().or(z.literal('')),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    watch: watchProfile,
    setError: setProfileError,
    setValue: setProfileValue,
    formState: { errors: profileErrors, isSubmitting: isSubmittingProfile },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      designation: user?.designation || '',
      currentPassword: '',
    },
  });

  const profileEmail = watchProfile('email');
  const isEmailChanged = profileEmail !== user?.email;

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: isSubmittingPassword },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (data: ProfileForm) => {
    if (user) {
      // Security Check: If email is changed, currentPassword must be provided
      if (data.email !== user.email && !data.currentPassword) {
        setProfileError('currentPassword', { 
          type: 'manual', 
          message: 'Current password is required to change email' 
        });
        return;
      }

      const action = await dispatch(updateProfile({ id: user.id, data }));
      if (updateProfile.fulfilled.match(action)) {
        setProfileSuccess(true);
        setProfileValue('currentPassword', ''); // Clear password field
        toast.success('Profile updated successfully');
        setTimeout(() => setProfileSuccess(false), 3000);
      } else if (updateProfile.rejected.match(action)) {
        const errorMsg = action.payload as string || 'Failed to update profile';
        // Handle backend password mismatch or other errors
        if (errorMsg.toLowerCase().includes('password')) {
          setProfileError('currentPassword', { type: 'manual', message: errorMsg });
          toast.error(errorMsg);
        } else {
          toast.error(errorMsg);
        }
      }
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    if (user) {
      setPasswordError(null);
      const action = await dispatch(updatePassword({
        id: user.id,
        data: {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        }
      }));
      if (updatePassword.fulfilled.match(action)) {
        setPasswordSuccess(true);
        resetPassword();
        setTimeout(() => setPasswordSuccess(false), 3000);
      } else if (updatePassword.rejected.match(action)) {
        setPasswordError(action.payload as string);
      }
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section with Canvas Banner (Static) */}
      <div className="relative">
        <div className="h-48 sm:h-64 rounded-3xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-hover to-accent opacity-90" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
        </div>

        {/* Profile Identity Card (Floating Overlap) */}
        <div className="px-6 -mt-20">
          <div className="bg-surface/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/10 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
              <div className="p-1.5 bg-surface rounded-full shadow-2xl ring-4 ring-primary/20 relative">
                <Avatar name={user.name} color={user.avatarColor} size={140} />
              </div>
              
              <div className="text-center sm:text-left mb-2">
                <div className="flex items-center justify-center sm:justify-start gap-3">
                  <h2 className="text-3xl font-extrabold text-text-main tracking-tight leading-none">
                    {user.name}
                  </h2>
                  <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Shield size={12} />
                    {user.role}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-y-2 gap-x-4 text-text-muted mt-3">
                  <div className="flex items-center gap-1.5">
                    <Mail size={16} className="text-primary/60" />
                    <span className="text-sm font-medium">{user.email}</span>
                  </div>
                  {user.designation && (
                    <div className="flex items-center gap-1.5 border-l border-border pl-4">
                      <Briefcase size={16} className="text-primary/60" />
                      <span className="text-sm font-medium">{user.designation}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mb-2 px-2">
              <div className="p-3 bg-primary/5 border border-primary/10 rounded-2xl">
                 <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-0.5">Account Status</p>
                 <div className="flex items-center gap-1.5 text-success font-extrabold text-sm">
                   <CheckCircle size={14} />
                   Verified Member
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Split Layout Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-2">
        
        {/* Left Column: Account Meta & Stats */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none bg-surface/50 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-text-muted flex items-center gap-2">
                <Award size={16} className="text-primary" />
                Member Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-surface/80 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-success/10 text-success rounded-xl">
                      <CheckCircle size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-text-muted font-bold uppercase tracking-tight">Account Status</p>
                      <p className="text-sm font-extrabold text-text-main">Verified</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-surface/80 border border-border">
                    <Calendar size={18} className="text-primary mb-2" />
                    <p className="text-[10px] text-text-muted font-bold uppercase">Joined</p>
                    <p className="text-sm font-bold text-text-main">{format(new Date(user.createdAt || Date.now()), 'MMM yyyy')}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-surface/80 border border-border">
                    <Clock size={18} className="text-primary mb-2" />
                    <p className="text-[10px] text-text-muted font-bold uppercase">Last Active</p>
                    <p className="text-sm font-bold text-text-main truncate">Now</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 relative overflow-hidden group">
            <div className="absolute -right-8 -bottom-8 text-primary/5 group-hover:text-primary/10 transition-all duration-700">
               <Shield size={120} />
            </div>
            <h4 className="text-sm font-bold text-primary mb-1">Security Recommendation</h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Enable two-factor authentication to better protect your workspace account from unauthorized access.
            </p>
            <button className="mt-4 text-xs font-bold text-primary hover:underline flex items-center gap-1">
              Configure 2FA
            </button>
          </div>
        </div>

        {/* Right Column: Settings Forms */}
        <div className="lg:col-span-8 space-y-6">
          {/* Account Information Card */}
          <Card className="shadow-xl">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-xl">Account Information</CardTitle>
              <p className="text-sm text-text-muted mt-1 font-normal">Update your personal details and how you're identified across the platform.</p>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-text-main ml-1">Full Name</label>
                    <Input
                      placeholder="e.g. John Doe"
                      {...registerProfile('name')}
                      error={profileErrors.name?.message}
                      leftIcon={<User size={18} className="text-primary/50" />}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-text-main ml-1">Job Title / Designation</label>
                    <Input
                      placeholder="e.g. Project Lead, HR Manager"
                      {...registerProfile('designation')}
                      error={profileErrors.designation?.message}
                      leftIcon={<Briefcase size={18} className="text-primary/50" />}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-text-main ml-1">Email Address</label>
                    <Input
                      placeholder="email@company.com"
                      {...registerProfile('email')}
                      error={profileErrors.email?.message}
                      leftIcon={<Mail size={18} className="text-primary/50" />}
                    />
                  </div>

                  {isEmailChanged && (
                    <div className="space-y-2 p-4 bg-primary/5 border border-primary/10 rounded-2xl animate-in fade-in slide-in-from-top-2">
                       <div className="flex items-center gap-2 mb-2">
                        <Lock size={14} className="text-primary" />
                        <label className="text-sm font-bold text-text-main">Verify Password to Continue</label>
                       </div>
                       <p className="text-xs text-text-muted mb-3 leading-relaxed">
                        For your security, you must provide your current password to change your workspace email address.
                       </p>
                       <Input
                        type="password"
                        placeholder="Confirm your current password"
                        {...registerProfile('currentPassword')}
                        error={profileErrors.currentPassword?.message}
                        leftIcon={<Shield size={18} className="text-primary/40" />}
                        className="bg-surface"
                      />
                    </div>
                  )}

                  <p className="text-[10px] text-text-muted ml-1 flex items-center gap-1.5">
                    <Clock size={12} />
                    {isEmailChanged 
                      ? "Your new email will take effect immediately after verification." 
                      : "Regular updates to your profile are logged for security."}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-border pt-6">
                  <div className="flex items-center gap-2">
                    {profileSuccess && (
                      <div className="flex items-center gap-1.5 text-success text-sm font-bold animate-in fade-in slide-in-from-left-2">
                        <CheckCircle size={18} />
                        Profile settings saved!
                      </div>
                    )}
                  </div>
                  <Button type="submit" isLoading={isSubmittingProfile} className="h-11 px-8 rounded-xl shadow-lg shadow-primary/20">
                    Update Profile
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Security & Password Card */}
          <Card className="shadow-xl">
            <CardHeader className="border-b border-border">
               <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Security & Password</CardTitle>
                  <p className="text-sm text-text-muted mt-1 font-normal">Manage your password and account security protocols.</p>
                </div>
                <div className="p-2 bg-warning/10 text-warning rounded-xl">
                  <Shield size={20} />
                </div>
               </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-text-main ml-1">Current Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...registerPassword('currentPassword')}
                    error={passwordErrors.currentPassword?.message}
                    leftIcon={<Lock size={18} className="text-primary/50" />}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-text-main ml-1">New Password</label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...registerPassword('newPassword')}
                      error={passwordErrors.newPassword?.message}
                      leftIcon={<Lock size={18} className="text-primary/50" />}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-text-main ml-1">Confirm New Password</label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...registerPassword('confirmPassword')}
                      error={passwordErrors.confirmPassword?.message}
                      leftIcon={<Lock size={18} className="text-primary/50" />}
                    />
                  </div>
                </div>

                {passwordError && (
                  <div className="p-3 bg-danger/5 border border-danger/10 rounded-xl">
                    <p className="text-xs text-danger font-bold uppercase tracking-wide mb-1">Error</p>
                    <p className="text-sm text-danger font-medium">{passwordError}</p>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between border-t border-border pt-6">
                  <div className="flex items-center gap-2">
                    {passwordSuccess && (
                      <div className="flex items-center gap-1.5 text-success text-sm font-bold animate-in fade-in slide-in-from-left-2">
                        <CheckCircle size={18} />
                        Password updated successfully!
                      </div>
                    )}
                  </div>
                  <Button type="submit" variant="secondary" isLoading={isSubmittingPassword} className="h-11 px-8 rounded-xl border-dashed">
                    Change Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
