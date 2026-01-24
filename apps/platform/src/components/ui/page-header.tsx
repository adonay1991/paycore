'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@paycore/ui/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('mb-6', className)}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-3">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground">
            {breadcrumbs.map((item, index) => (
              <li key={item.label} className="flex items-center gap-2">
                {index > 0 && <span>/</span>}
                {item.href ? (
                  <a
                    href={item.href}
                    className="hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </a>
                ) : (
                  <span className="text-foreground">{item.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {Icon && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="p-3 bg-primary/10 rounded-xl"
            >
              <Icon className="h-6 w-6 text-primary" />
            </motion.div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>

        {actions && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2"
          >
            {actions}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('space-y-6', className)}
    >
      {children}
    </motion.div>
  );
}

interface SectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function Section({
  title,
  description,
  children,
  actions,
  className,
}: SectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </motion.section>
  );
}
