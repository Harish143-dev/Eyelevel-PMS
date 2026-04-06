import React from 'react';

type BadgeVariant = 'gray' | 'blue' | 'amber' | 'green' | 'red' | 'indigo' | 'pink';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  gray: 'bg-background text-text-muted border border-border',
  blue: 'bg-info/10 text-info border border-info/20',
  amber: 'bg-warning/10 text-warning border border-warning/20',
  green: 'bg-success/10 text-success border border-success/20',
  red: 'bg-danger/10 text-danger border border-danger/20',
  indigo: 'bg-primary/10 text-primary border border-primary/20',
  pink: 'bg-pink-500/10 text-pink-500 border border-pink-500/20',
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
