'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  EmptyPage,
  User,
  DollarCircle,
  Folder,
  Phone,
  Megaphone,
  Calendar,
  ViewGrid,
  Clock,
} from 'iconoir-react';
import { Card, CardHeader, CardTitle, CardContent, Skeleton } from '@paycore/ui/components';
import { cn } from '@paycore/ui/lib/utils';
import { useAuth } from '@/lib/auth/context';
import { getDashboardStats } from '@/lib/api/client';
import {
  StatCard,
  MiniStat,
  ProgressRing,
  ProgressBar,
  PageHeader,
  PageContainer,
  Section,
} from '@/components/ui';

type DashboardStats = {
  invoices: {
    total: number;
    draft: number;
    sent: number;
    paid: number;
    overdue: number;
    totalAmount: number;
    paidAmount: number;
  };
  customers: {
    total: number;
    active: number;
  };
  payments: {
    total: number;
    pending: number;
    completed: number;
    totalAmount: number;
  };
  debtCases: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    totalDebt: number;
  };
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Animated card wrapper for staggered animations
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: 'easeOut' as const,
    },
  }),
};

function RecentActivityItem({
  type,
  title,
  description,
  time,
  status,
}: {
  type: 'call' | 'payment' | 'campaign';
  title: string;
  description: string;
  time: string;
  status?: 'success' | 'pending' | 'failed';
}) {
  const icons = {
    call: Phone,
    payment: DollarCircle,
    campaign: Megaphone,
  };
  const Icon = icons[type];

  const statusColors = {
    success: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    pending: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    failed: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className={cn('p-2 rounded-lg', statusColors[status ?? 'pending'])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">{time}</span>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { session, user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!session?.access_token) return;

      const result = await getDashboardStats(session.access_token);
      if (result.success && result.data) {
        setStats(result.data);
      }
      setLoading(false);
    }

    fetchStats();
  }, [session?.access_token]);

  // Calculate collection rate
  const collectionRate = stats
    ? Math.round((stats.invoices.paidAmount / (stats.invoices.totalAmount || 1)) * 100)
    : 0;

  const resolutionRate = stats
    ? Math.round((stats.debtCases.resolved / (stats.debtCases.total || 1)) * 100)
    : 0;

  return (
    <PageContainer>
      <PageHeader
        title={`Welcome back${user?.email ? `, ${user.email.split('@')[0]}` : ''}`}
        description="Here's an overview of your debt recovery operations"
        icon={ViewGrid}
      />

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Invoices"
          value={stats?.invoices.total ?? 0}
          subValue={`${stats?.invoices.overdue ?? 0} overdue`}
          icon={EmptyPage}
          loading={loading}
          delay={0}
        />
        <StatCard
          title="Total Revenue"
          value={stats?.invoices.totalAmount ?? 0}
          subValue={`${formatCurrency(stats?.invoices.paidAmount ?? 0)} collected`}
          icon={DollarCircle}
          isCurrency
          loading={loading}
          delay={0.1}
        />
        <StatCard
          title="Customers"
          value={stats?.customers.total ?? 0}
          subValue={`${stats?.customers.active ?? 0} active`}
          icon={User}
          loading={loading}
          delay={0.2}
        />
        <StatCard
          title="Debt Cases"
          value={stats?.debtCases.total ?? 0}
          subValue={formatCurrency(stats?.debtCases.totalDebt ?? 0)}
          icon={Folder}
          variant="warning"
          loading={loading}
          delay={0.3}
        />
      </div>

      {/* Charts and Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collection Performance */}
        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Collection Performance</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-4">
              {loading ? (
                <Skeleton className="h-32 w-32 rounded-full" />
              ) : (
                <>
                  <ProgressRing
                    value={collectionRate}
                    size={140}
                    strokeWidth={12}
                    color="success"
                    label="Collection Rate"
                  />
                  <div className="grid grid-cols-2 gap-4 w-full mt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(stats?.invoices.paidAmount ?? 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Collected</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-muted-foreground">
                        {formatCurrency(
                          (stats?.invoices.totalAmount ?? 0) -
                            (stats?.invoices.paidAmount ?? 0)
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">Outstanding</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Invoice Status Breakdown */}
        <motion.div
          custom={5}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Invoice Status</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <ProgressBar
                    value={stats?.invoices.paid ?? 0}
                    max={stats?.invoices.total ?? 1}
                    label="Paid"
                    showValue
                    color="success"
                  />
                  <ProgressBar
                    value={stats?.invoices.sent ?? 0}
                    max={stats?.invoices.total ?? 1}
                    label="Sent"
                    showValue
                    color="primary"
                  />
                  <ProgressBar
                    value={stats?.invoices.draft ?? 0}
                    max={stats?.invoices.total ?? 1}
                    label="Draft"
                    showValue
                    color="warning"
                  />
                  <ProgressBar
                    value={stats?.invoices.overdue ?? 0}
                    max={stats?.invoices.total ?? 1}
                    label="Overdue"
                    showValue
                    color="danger"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Debt Cases Status */}
        <motion.div
          custom={6}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base">Debt Recovery</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-4">
              {loading ? (
                <Skeleton className="h-32 w-32 rounded-full" />
              ) : (
                <>
                  <ProgressRing
                    value={resolutionRate}
                    size={140}
                    strokeWidth={12}
                    color={resolutionRate > 50 ? 'success' : 'warning'}
                    label="Resolution Rate"
                  />
                  <div className="w-full mt-6 space-y-2">
                    <MiniStat
                      label="Open Cases"
                      value={stats?.debtCases.open ?? 0}
                    />
                    <MiniStat
                      label="In Progress"
                      value={stats?.debtCases.inProgress ?? 0}
                      color="warning"
                    />
                    <MiniStat
                      label="Resolved"
                      value={stats?.debtCases.resolved ?? 0}
                      color="success"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div
          custom={7}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-1">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <RecentActivityItem
                    type="call"
                    title="Call completed"
                    description="Customer agreed to payment plan"
                    time="2 min ago"
                    status="success"
                  />
                  <RecentActivityItem
                    type="payment"
                    title="Payment received"
                    description="Invoice #1234 - 250.00"
                    time="15 min ago"
                    status="success"
                  />
                  <RecentActivityItem
                    type="campaign"
                    title="Campaign started"
                    description="Q1 Collection Drive"
                    time="1 hour ago"
                    status="pending"
                  />
                  <RecentActivityItem
                    type="call"
                    title="Call failed"
                    description="No answer - scheduled retry"
                    time="2 hours ago"
                    status="failed"
                  />
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          custom={8}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Phone, label: 'Start Call', href: '/voice-calls', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
                  { icon: Megaphone, label: 'New Campaign', href: '/campaigns', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
                  { icon: Calendar, label: 'Payment Plan', href: '/payment-plans', color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
                  { icon: EmptyPage, label: 'New Invoice', href: '/invoices', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
                ].map((action) => (
                  <motion.a
                    key={action.label}
                    href={action.href}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/50 hover:shadow-md transition-all duration-200"
                  >
                    <div className={cn('p-3 rounded-xl', action.color)}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium">{action.label}</span>
                  </motion.a>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageContainer>
  );
}
