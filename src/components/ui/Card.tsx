import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils';

interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'outlined' | 'elevated' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const cardVariants = {
  default: 'bg-canvas-node-bg-light dark:bg-canvas-node-bg-dark border border-canvas-node-border-light dark:border-canvas-node-border-dark shadow-medium',
  outlined: 'bg-canvas-node-bg-light dark:bg-canvas-node-bg-dark border-2 border-primary-200 dark:border-primary-700 shadow-soft',
  elevated: 'bg-canvas-node-bg-light dark:bg-canvas-node-bg-dark border border-canvas-node-border-light dark:border-canvas-node-border-dark shadow-large hover:shadow-xl',
  glass: 'bg-white/80 dark:bg-secondary-900/80 backdrop-blur-sm border border-white/20 dark:border-secondary-700/50 shadow-medium',
};

const paddingVariants = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({
  variant = 'default',
  padding = 'md',
  children,
  className,
  ...props
}, ref) => {
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'rounded-xl transition-all duration-250 ease-smooth',
        cardVariants[variant],
        paddingVariants[padding],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
});

Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({
  className,
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 pb-4', className)}
    {...props}
  >
    {children}
  </div>
));

CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({
  className,
  children,
  ...props
}, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight text-secondary-900 dark:text-secondary-100', className)}
    {...props}
  >
    {children}
  </h3>
));

CardTitle.displayName = 'CardTitle';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({
  className,
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn('text-sm text-secondary-700 dark:text-secondary-300', className)}
    {...props}
  >
    {children}
  </div>
));

CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({
  className,
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-4', className)}
    {...props}
  >
    {children}
  </div>
));

CardFooter.displayName = 'CardFooter';
