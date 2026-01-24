'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown } from 'iconoir-react';
import { Card, CardHeader, CardTitle, CardContent, Skeleton } from '@paycore/ui/components';
import { cn } from '@paycore/ui/lib/utils';
import { AnimatedCounter, AnimatedCurrency } from './animated-counter';

interface StatCardProps {
  title: string;
  value: number;
  previousValue?: number;
  subValue?: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  isCurrency?: boolean;
  loading?: boolean;
  delay?: number;
}

const variantStyles = {
  default: {
    icon: 'bg-primary/10 text-primary',
    trend: { up: 'text-green-600', down: 'text-red-600' },
  },
  success: {
    icon: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    trend: { up: 'text-green-600', down: 'text-red-600' },
  },
  warning: {
    icon: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    trend: { up: 'text-yellow-600', down: 'text-green-600' },
  },
  danger: {
    icon: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    trend: { up: 'text-red-600', down: 'text-green-600' },
  },
  info: {
    icon: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    trend: { up: 'text-blue-600', down: 'text-blue-400' },
  },
};

export function StatCard({
  title,
  value,
  previousValue,
  subValue,
  icon: Icon,
  variant = 'default',
  isCurrency = false,
  loading = false,
  delay = 0,
}: StatCardProps) {
  const styles = variantStyles[variant];

  // Calculate trend
  const trend =
    previousValue !== undefined
      ? ((value - previousValue) / (previousValue || 1)) * 100
      : undefined;
  const trendUp = trend !== undefined ? trend >= 0 : undefined;

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow duration-300">
        {/* Subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <CardHeader className="pb-2 relative">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
            <motion.div
              className={cn('p-2.5 rounded-xl', styles.icon)}
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <Icon className="h-5 w-5" />
            </motion.div>
          </div>
        </CardHeader>

        <CardContent className="relative">
          <div className="text-2xl font-bold tracking-tight">
            {isCurrency ? (
              <AnimatedCurrency value={value} />
            ) : (
              <AnimatedCounter value={value} />
            )}
          </div>

          <div className="flex items-center gap-2 mt-2">
            {trend !== undefined && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.3 }}
                className={cn(
                  'flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full',
                  trendUp ? styles.trend.up : styles.trend.down,
                  trendUp ? 'bg-green-100/50 dark:bg-green-900/20' : 'bg-red-100/50 dark:bg-red-900/20'
                )}
              >
                {trendUp ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )}
                {Math.abs(trend).toFixed(1)}%
              </motion.span>
            )}
            {subValue && (
              <span className="text-xs text-muted-foreground">{subValue}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface MiniStatProps {
  label: string;
  value: number | string;
  color?: 'default' | 'success' | 'warning' | 'danger';
}

const colorClasses = {
  default: 'text-foreground',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  danger: 'text-red-600 dark:text-red-400',
};

export function MiniStat({ label, value, color = 'default' }: MiniStatProps) {
  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn('font-medium tabular-nums', colorClasses[color])}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
    </div>
  );
}
