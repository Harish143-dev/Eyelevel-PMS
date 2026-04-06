import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, leftIcon, id, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || React.useId();
    const isPassword = type === 'password';

    const togglePassword = () => setShowPassword(!showPassword);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-text-main mb-1 text-left">
            {label}
          </label>
        )}
        <div className="relative group">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            type={isPassword ? (showPassword ? 'text' : 'password') : type}
            className={`
              appearance-none block w-full border rounded-lg text-sm transition-all
              focus:outline-none focus:ring-2 focus:border-transparent
              ${leftIcon ? 'pl-10 mr-0' : 'px-3'} ${isPassword ? 'pr-10' : 'pr-3'} py-2
              ${
                error
                  ? 'border-danger/50 text-danger placeholder-danger/50 focus:ring-danger bg-danger/5'
                  : 'border-border text-text-main placeholder-text-muted/50 focus:ring-primary hover:border-border-hover bg-background'
              }
              ${props.disabled ? 'bg-background/50 text-text-muted cursor-not-allowed border-border hover:border-border' : ''}
              ${className}
            `}
            {...props}
          />
          {isPassword && !props.disabled && (
            <button
              type="button"
              onClick={togglePassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors focus:outline-none p-1 rounded-md"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {error && <p className="mt-1.5 text-sm text-danger font-medium text-left">{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-sm text-text-muted text-left">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
