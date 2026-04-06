import React, { useState, useEffect } from 'react';
// react-hook-form
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { login, clearError } from '../../store/slices/authSlice';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { fetchBranding, applyBranding } from '../../utils/tenantUtils';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [displayLogo, setDisplayLogo] = useState<string>('/eyelevel_logo.png');
  const [tenantName, setTenantName] = useState<string>('PM App');

  useEffect(() => {
    const handleBranding = async () => {
      const branding = await fetchBranding();
      if (branding) {
        if (branding.logoUrl) {
          setDisplayLogo(branding.logoUrl);
        }
        setTenantName(branding.name);
        applyBranding(branding);
      } else {
        const cachedLogo = localStorage.getItem('companyLogo');
        if (cachedLogo) {
          setDisplayLogo(cachedLogo);
        }
      }
    };

    handleBranding();
  }, []);

  const from = (location.state as any)?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    dispatch(clearError());
    const resultAction = await dispatch(login(data));
    if (login.fulfilled.match(resultAction)) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-background">
      {/* Left Side: Brand Hub (Visual Side - Compact) */}
      <div className="hidden lg:flex lg:w-5/12 relative mesh-gradient items-center justify-center p-8 overflow-hidden border-r border-border/10">
        <div className="absolute inset-0 bg-dot-pattern opacity-10" />
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-white/5 rounded-full blur-[100px] animate-float-orb" />
        
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
            Elevate with <br />
            <span className="text-white/80">{tenantName}</span>
          </h1>
          <p className="text-base text-white/70 font-medium leading-relaxed max-w-xs mx-auto">
            Experience premium team collaboration and management tools tailored for your success.
          </p>
        </div>
      </div>

      {/* Right Side: Authentication Area (Compact) */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-background relative overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-sm animate-fade-in-up py-4">
          {/* Header Area */}
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-text-main tracking-tight mb-2">
              Sign In
            </h2>
            <p className="text-sm text-text-muted font-medium">
              Continue to your workspace.
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

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <Input
                label="Corporate Email"
                type="email"
                placeholder="name@company.com"
                {...register('email')}
                error={errors.email?.message}
                className="rounded-xl border-border/60 focus:ring-primary/20 py-3 bg-surface text-sm"
              />

              <div className="space-y-1">
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  error={errors.password?.message}
                  className="rounded-xl border-border/60 focus:ring-primary/20 py-3 bg-surface text-sm"
                />
                <div className="flex justify-end pr-1">
                  <Link 
                    to="/auth/forgot-password" 
                    className="text-[10px] font-bold text-primary hover:text-primary-hover transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              size="md"
              className="w-full rounded-xl py-3.5 font-bold text-sm shadow-lg shadow-primary/5 hover-glow transition-all active:scale-[0.98] mt-2"
            >
              Sign In
            </Button>
          </form>

          {/* Footer Actions */}
          <div className="mt-8 pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <p className="text-xs text-text-muted font-medium">
              Need a workspace?
            </p>
            <Link 
              to="/auth/register" 
              className="px-5 py-2 border border-border/80 rounded-lg text-xs font-bold text-text-main hover:bg-surface transition-all hover-lift active:scale-[0.98]"
            >
              Register Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
