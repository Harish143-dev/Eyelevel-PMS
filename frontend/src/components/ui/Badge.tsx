import React from 'react';

type BadgeVariant = 'gray' | 'blue' | 'amber' | 'green' | 'red' | 'indigo';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  gray: 'bg-gray-100 text-gray-600 border border-gray-200',
  blue: 'bg-blue-100 text-blue-700 border border-blue-200',
  amber: 'bg-amber-100 text-amber-700 border border-amber-200',
  green: 'bg-green-100 text-green-700 border border-green-200',
  red: 'bg-red-100 text-red-600 border border-red-200',
  indigo: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
};

export const Badge: React.FC<BadgeProps> = ({ variant = 'gray', className = '', children, ...props }) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
