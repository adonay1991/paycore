'use client';

import { motion } from 'framer-motion';
import { cn } from '@paycore/ui/lib/utils';

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  showPercentage?: boolean;
  className?: string;
}

const colorStyles = {
  primary: 'stroke-primary',
  success: 'stroke-green-500',
  warning: 'stroke-yellow-500',
  danger: 'stroke-red-500',
};

const bgColorStyles = {
  primary: 'stroke-primary/20',
  success: 'stroke-green-500/20',
  warning: 'stroke-yellow-500/20',
  danger: 'stroke-red-500/20',
};

export function ProgressRing({
  value,
  max = 100,
  size = 120,
  strokeWidth = 10,
  label,
  sublabel,
  color = 'primary',
  showPercentage = true,
  className,
}: ProgressRingProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={bgColorStyles[color]}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={colorStyles[color]}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage && (
          <motion.span
            className="text-2xl font-bold"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            {Math.round(percentage)}%
          </motion.span>
        )}
        {label && (
          <span className="text-xs text-muted-foreground mt-0.5">{label}</span>
        )}
        {sublabel && (
          <span className="text-[10px] text-muted-foreground/70">{sublabel}</span>
        )}
      </div>
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const barColorStyles = {
  primary: 'bg-primary',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
};

const barBgColorStyles = {
  primary: 'bg-primary/20',
  success: 'bg-green-500/20',
  warning: 'bg-yellow-500/20',
  danger: 'bg-red-500/20',
};

const sizeStyles = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false,
  color = 'primary',
  size = 'md',
  className,
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && (
            <span className="text-sm text-muted-foreground">{label}</span>
          )}
          {showValue && (
            <span className="text-sm font-medium tabular-nums">
              {value.toLocaleString()} / {max.toLocaleString()}
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full overflow-hidden',
          barBgColorStyles[color],
          sizeStyles[size]
        )}
      >
        <motion.div
          className={cn('h-full rounded-full', barColorStyles[color])}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
