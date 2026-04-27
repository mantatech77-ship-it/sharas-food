import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-sharas-primary text-white font-bold hover:bg-sharas-accent hover:scale-[1.02] active:scale-95',
      secondary: 'bg-stone-800 text-white hover:bg-stone-900',
      outline: 'border-2 border-sharas-secondary bg-transparent hover:bg-sharas-light text-sharas-primary',
      ghost: 'bg-transparent hover:bg-stone-100 text-stone-700 font-bold',
      danger: 'bg-red-500 text-white hover:bg-red-600',
    };
    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-5 py-3 text-sm',
      lg: 'px-6 py-5 text-base sm:text-lg',
      icon: 'p-2',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-[24px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sharas-primary disabled:pointer-events-none disabled:opacity-50 cursor-pointer uppercase tracking-tight',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-12 w-full rounded-2xl border-none bg-gray-100 px-4 py-3 text-gray-800 placeholder-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sharas-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

export const Card = ({ className, children, ...props }: { className?: string; children: React.ReactNode; [key: string]: any }) => (
  <div 
    className={cn('bg-white rounded-3xl p-4 shadow-xl border-4 border-white transition-all', className)}
    {...props}
  >
    {children}
  </div>
);
