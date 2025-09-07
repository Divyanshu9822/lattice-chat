import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  children: React.ReactNode;
}

const buttonVariants = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-medium hover:shadow-large focus:ring-primary-500 border-transparent dark:bg-primary-500 dark:hover:bg-primary-600',
  secondary: 'bg-secondary-100 hover:bg-secondary-200 text-secondary-900 shadow-soft hover:shadow-medium focus:ring-secondary-500 border-secondary-200 dark:bg-secondary-800 dark:hover:bg-secondary-700 dark:text-secondary-100 dark:border-secondary-700',
  ghost: 'hover:bg-secondary-100 text-secondary-700 hover:text-secondary-900 focus:ring-secondary-500 border-transparent dark:hover:bg-secondary-800 dark:text-secondary-300 dark:hover:text-secondary-100',
  outline: 'border-secondary-300 bg-transparent hover:bg-secondary-50 text-secondary-700 hover:text-secondary-900 shadow-soft hover:shadow-medium focus:ring-primary-500 dark:border-secondary-600 dark:hover:bg-secondary-800 dark:text-secondary-300 dark:hover:text-secondary-100',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-medium hover:shadow-large focus:ring-red-500 border-transparent dark:bg-red-500 dark:hover:bg-red-600',
};

const sizeVariants = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  icon: 'p-2',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className,
  ...props
}, ref) => {
  return (
    <motion.button
      ref={ref}
      whileHover={!disabled && !isLoading ? { scale: 1.02 } : undefined}
      whileTap={!disabled && !isLoading ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      disabled={disabled || isLoading}
      className={cn(
        // Base styles
        'inline-flex items-center justify-center gap-2 rounded-xl border font-medium',
        'transition-all duration-200 ease-smooth',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-secondary-900',
        'disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none',
        // Variant styles
        buttonVariants[variant],
        // Size styles
        sizeVariants[size],
        className
      )}
      {...props}
    >
      {isLoading && (
        <Loader2 className="w-4 h-4 animate-spin" />
      )}
      {children}
    </motion.button>
  );
});

Button.displayName = 'Button';
