import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { updateProfile } from '../store/slices/authSlice';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Avatar from '../components/Avatar';
import { User, Mail, Shield, CheckCircle } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

type ProfileForm = z.infer<typeof profileSchema>;

const ProfilePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    if (user) {
      const action = await dispatch(updateProfile({ id: user.id, data }));
      if (updateProfile.fulfilled.match(action)) {
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 3000);
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Full Name"
                placeholder="Name"
                {...register('name')}
                error={errors.name?.message}
                leftIcon={<User size={18} />}
              />
              <Input
                label="Email Address"
                placeholder="email@example.com"
                {...register('email')}
                error={errors.email?.message}
                leftIcon={<Mail size={18} />}
              />

              <div className="pt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isSuccess && (
                     <div className="flex items-center gap-1.5 text-green-600 text-sm font-bold animate-in fade-in slide-in-from-left-2">
                        <CheckCircle size={16} />
                        Profile Updated Successfully
                     </div>
                  )}
                </div>
                <Button type="submit" isLoading={isSubmitting}>
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-red-100 bg-red-50/30">
          <CardHeader>
            <CardTitle className="text-red-900">Privacy & Security</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700 mb-4">
              Looking to change your password or delete your account? 
              Please contact your system administrator for security assistance.
            </p>
            <Button variant="secondary" className="border-red-200 text-red-700 hover:bg-red-50" disabled>
              Change Password
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
