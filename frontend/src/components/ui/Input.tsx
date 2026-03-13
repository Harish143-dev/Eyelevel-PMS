import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, leftIcon, id, ...props }, ref) => {
    const inputId = id || React.useId();

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative group">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`
              appearance-none block w-full border rounded-lg text-sm transition-all
              focus:outline-none focus:ring-2 focus:border-transparent
              ${leftIcon ? 'pl-10 pr-3' : 'px-3'} py-2
              ${
                error
                  ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500'
                  : 'border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-indigo-500 hover:border-gray-400'
              }
              ${props.disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200 hover:border-gray-200' : 'bg-white'}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-sm text-red-600 font-medium">{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
