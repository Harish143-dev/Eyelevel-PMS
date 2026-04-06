import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { register as registerUser, clearError } from '../../store/slices/authSlice';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { fetchBranding, applyBranding } from '../../utils/tenantUtils';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  companyName: z.string().min(2, 'Workspace name must be at least 2 characters'),
});

type RegisterForm = z.infer<typeof registerSchema>;

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const [successMessage, setSuccessMessage] = useState('');
  const [displayLogo, setDisplayLogo] = useState<string>('/eyelevel_logo.png');

  useEffect(() => {
    const handleBranding = async () => {
      const branding = await fetchBranding();
      if (branding) {
        if (branding.logoUrl) {
          setDisplayLogo(branding.logoUrl);
        }
        applyBranding(branding);
      }
    };

    handleBranding();
  }, []);

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    dispatch(clearError());
    setSuccessMessage('');
    const resultAction = await dispatch(registerUser(data));
    if (registerUser.fulfilled.match(resultAction)) {
      if (resultAction.payload?.pending) {
        setSuccessMessage(resultAction.payload.message || 'Registration pending approval.');
      } else {
        navigate('/');
      }
    }
  };

  return (
    <div className="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-background">
      {/* Left Side: Brand Hub (Visual Side - Compact) */}
      <div className="hidden lg:flex lg:w-5/12 relative mesh-gradient items-center justify-center p-8 overflow-hidden border-r border-border/10">
        <div className="absolute inset-0 bg-dot-pattern opacity-10" />
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-white/5 rounded-full blur-[100px] animate-float-orb" />
        
        <div className="relative z-10 w-full max-w-md animate-fade-in-up text-center">
          <div className="inline-block p-4 rounded-2xl bg-white/5 border border-white/10 shadow-xl backdrop-blur-xl mb-6 hover-lift">
            <img 
              src={displayLogo} 
              alt="Logo" 
              className="h-14 w-auto object-contain filter drop-shadow-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/eyelevel_logo.png';
              }}
            />
          </div>
          <h1 className="text-4xl font-black text-white leading-tight mb-4 tracking-tight">
            Build your vision <br />
            <span className="text-white/80">starting now.</span>
          </h1>
          <p className="text-base text-white/70 font-medium leading-relaxed max-w-xs mx-auto">
            Join thousands of teams relying on our platform to structure their success.
          </p>
        </div>
      </div>

      {/* Right Side: Registration Area (Compact) */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-background relative overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-sm animate-fade-in-up py-4">
          {/* Header Area */}
          <div className="mb-6 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">
              Create Workspace
            </h2>
            <p className="text-sm text-text-muted font-medium">
              Start your free trial today.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-xl text-xs font-bold border border-red-100 flex items-center mb-6 animate-in fade-in duration-300">
              <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 text-green-600 p-3 rounded-xl text-[11px] font-bold border border-green-100 flex items-start mb-6 animate-in fade-in duration-300">
              <div className="bg-green-100 p-1 rounded-full mr-2.5 mt-0.5 flex-shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="pt-0.5">{successMessage}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Full Name"
                type="text"
                placeholder="Name"
                {...formRegister('name')}
                error={errors.name?.message}
                className="rounded-xl border-border/60 focus:ring-primary/20 py-2.5 bg-surface text-sm"
              />

              <Input
                label="Work Email"
                type="email"
                placeholder="name@company.com"
                {...formRegister('email')}
                error={errors.email?.message}
                className="rounded-xl border-border/60 focus:ring-primary/20 py-2.5 bg-surface text-sm"
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                {...formRegister('password')}
                error={errors.password?.message}
                className="rounded-xl border-border/60 focus:ring-primary/20 py-2.5 bg-surface text-sm"
              />

              <Input
                label="Workspace"
                type="text"
                placeholder="Company Name"
                {...formRegister('companyName')}
                error={errors.companyName?.message}
                className="rounded-xl border-border/60 focus:ring-primary/20 py-2.5 bg-surface text-sm"
              />
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              size="md"
              className="w-full rounded-xl py-3.5 font-bold text-sm shadow-lg shadow-primary/5 hover-glow transition-all active:scale-[0.98] mt-2"
            >
              Initialize Workspace
            </Button>
          </form>

          {/* Footer Actions */}
          <div className="mt-8 pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <p className="text-xs text-text-muted font-medium">
              Already have an account?
            </p>
            <Link 
              to="/auth/login" 
              className="px-5 py-2 border border-border/80 rounded-lg text-xs font-bold text-text-main hover:bg-surface transition-all hover-lift active:scale-[0.98]"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
