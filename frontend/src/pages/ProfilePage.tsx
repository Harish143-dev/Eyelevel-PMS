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
import { User, Mail, Shield, CheckCircle, Briefcase, Lock } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  designation: z.string().max(100, 'Designation must be less than 100 characters').optional().nullable(),
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
    formState: { errors: profileErrors, isSubmitting: isSubmittingProfile },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      designation: user?.designation || '',
    },
  });

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
      const action = await dispatch(updateProfile({ id: user.id, data }));
      if (updateProfile.fulfilled.match(action)) {
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
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
    <div className="max-w-2xl mx-auto space-y-6 text-left">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-1 text-gray-600">
          Manage your account information and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 w-full" />
          <div className="px-6 -mt-12 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="flex flex-col items-center sm:items-start">
                <div className="p-1 bg-white rounded-full">
                  <Avatar name={user.name} color={user.avatarColor} size={96} />
                </div>
                <div className="mt-4 text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                  <div className="flex items-center gap-1.5 text-gray-500 mt-1">
                    <Shield size={14} className="text-indigo-500" />
                    <span className="text-sm font-medium capitalize">{user.role} Account</span>
                    {user.designation && (
                      <>
                        <span className="mx-1">•</span>
                        <span className="text-sm font-medium">{user.designation}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-4">
              <Input
                label="Full Name"
                placeholder="Name"
                {...registerProfile('name')}
                error={profileErrors.name?.message}
                leftIcon={<User size={18} />}
              />
              <Input
                label="Email Address"
                placeholder="email@example.com"
                {...registerProfile('email')}
                error={profileErrors.email?.message}
                leftIcon={<Mail size={18} />}
              />
              <Input
                label="Designation"
                placeholder="e.g. Project Manager, Lead Developer"
                {...registerProfile('designation')}
                error={profileErrors.designation?.message}
                leftIcon={<Briefcase size={18} />}
              />

              <div className="pt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {profileSuccess && (
                     <div className="flex items-center gap-1.5 text-green-600 text-sm font-bold animate-in fade-in slide-in-from-left-2">
                        <CheckCircle size={16} />
                        Profile Updated Successfully
                     </div>
                  )}
                </div>
                <Button type="submit" isLoading={isSubmittingProfile}>
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security & Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4">
              <Input
                type="password"
                label="Current Password"
                placeholder="••••••••"
                {...registerPassword('currentPassword')}
                error={passwordErrors.currentPassword?.message}
                leftIcon={<Lock size={18} />}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  type="password"
                  label="New Password"
                  placeholder="••••••••"
                  {...registerPassword('newPassword')}
                  error={passwordErrors.newPassword?.message}
                  leftIcon={<Lock size={18} />}
                />
                <Input
                  type="password"
                  label="Confirm New Password"
                  placeholder="••••••••"
                  {...registerPassword('confirmPassword')}
                  error={passwordErrors.confirmPassword?.message}
                  leftIcon={<Lock size={18} />}
                />
              </div>

              {passwordError && (
                <p className="text-sm text-red-600 font-medium">{passwordError}</p>
              )}

              <div className="pt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {passwordSuccess && (
                     <div className="flex items-center gap-1.5 text-green-600 text-sm font-bold animate-in fade-in slide-in-from-left-2">
                        <CheckCircle size={16} />
                        Password Changed Successfully
                     </div>
                  )}
                </div>
                <Button type="submit" variant="secondary" isLoading={isSubmittingPassword}>
                  Update Password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
