/**
 * Payment Plans Client Component
 *
 * Interactive component for managing payment plans.
 */

'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  CheckCircle,
  Clock,
  WarningTriangle,
  Plus,
  Search,
  Filter,
  MoreVert,
  Euro,
  User,
  ArrowRight,
} from 'iconoir-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
} from '@paycore/ui/components';
import { cn } from '@paycore/ui/lib/utils';
import {
  FadeInUp,
  StaggerContainer,
  StaggerItem,
  AnimatedCard,
  PageTransition,
} from '@/components/ui/animated';
import type { PaymentPlanWithInstallments, Installment } from '@/actions/payment-plans';

interface PaymentPlansClientProps {
  plans: PaymentPlanWithInstallments[];
  overdueInstallments: Installment[];
  stats: {
    total: number;
    active: number;
    completed: number;
    defaulted: number;
    overdue: number;
    totalValue: number;
    collected: number;
  };
}

const statusColors: Record<string, string> = {
  proposed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  completed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  defaulted: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

function formatCurrency(amount: number | string, currency = 'EUR'): string {
  const num = typeof amount === 'string' ? Number.parseFloat(amount) : amount;
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
  }).format(num);
}

function formatDate(date: string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function PaymentPlansClient({
  plans,
  overdueInstallments,
  stats,
}: PaymentPlansClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlanWithInstallments | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filter plans
  const filteredPlans = plans.filter((plan) => {
    const matchesSearch = plan.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statsCards = [
    {
      title: 'Active Plans',
      value: stats.active,
      icon: Calendar,
      color: 'text-green-600',
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: CheckCircle,
      color: 'text-purple-600',
    },
    {
      title: 'Overdue Payments',
      value: stats.overdue,
      icon: WarningTriangle,
      color: 'text-red-600',
    },
    {
      title: 'Total Collected',
      value: formatCurrency(stats.collected),
      icon: Euro,
      color: 'text-primary',
      isFormatted: true,
    },
  ];

  return (
    <PageTransition>
      {/* Stats Grid */}
      <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => (
          <StaggerItem key={stat.title}>
            <AnimatedCard>
              <Card className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <div className={cn('h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center')}>
                      <stat.icon className={cn('h-5 w-5', stat.color)} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <motion.span
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                      className="text-3xl font-bold"
                    >
                      {stat.isFormatted ? stat.value : stat.value}
                    </motion.span>
                  </div>
                </CardContent>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
              </Card>
            </AnimatedCard>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Overdue Installments Alert */}
      {overdueInstallments.length > 0 && (
        <FadeInUp delay={0.1}>
          <Card className="mt-6 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <WarningTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800 dark:text-red-400">
                    {overdueInstallments.length} Overdue Installments
                  </h3>
                  <p className="text-sm text-red-600 dark:text-red-400/80">
                    Total:{' '}
                    {formatCurrency(
                      overdueInstallments.reduce(
                        (sum, i) => sum + Number(i.amount) - Number(i.paid_amount),
                        0
                      )
                    )}
                  </p>
                </div>
                <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                  View All
                </Button>
              </div>
            </CardContent>
          </Card>
        </FadeInUp>
      )}

      {/* Payment Plans Table */}
      <FadeInUp delay={0.2}>
        <Card className="mt-6">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-lg font-semibold">All Payment Plans</CardTitle>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search plans..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full md:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="proposed">Proposed</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="defaulted">Defaulted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredPlans.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No payment plans found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Next Payment</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {filteredPlans.map((plan, index) => {
                        const progress =
                          (Number(plan.paid_amount) / Number(plan.total_amount)) * 100;
                        const paidInstallments = plan.installments.filter(
                          (i) => i.status === 'paid'
                        ).length;
                        const nextInstallment = plan.installments.find(
                          (i) => i.status === 'pending' || i.status === 'overdue'
                        );

                        return (
                          <motion.tr
                            key={plan.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b cursor-pointer hover:bg-muted/50"
                            onClick={() => setSelectedPlan(plan)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <User className="h-4 w-4 text-primary" />
                                </div>
                                <span className="font-medium">
                                  Customer #{plan.customer_id.slice(0, 8)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={cn('capitalize', statusColors[plan.status])}
                              >
                                {plan.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(plan.total_amount, plan.currency)}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(plan.paid_amount, plan.currency)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 0.5, delay: index * 0.05 }}
                                    className={cn(
                                      'h-full rounded-full',
                                      progress >= 100
                                        ? 'bg-green-500'
                                        : progress > 50
                                          ? 'bg-primary'
                                          : 'bg-yellow-500'
                                    )}
                                  />
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {paidInstallments}/{plan.number_of_installments}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {nextInstallment ? (
                                <div
                                  className={cn(
                                    'text-sm',
                                    nextInstallment.status === 'overdue' && 'text-red-600 font-medium'
                                  )}
                                >
                                  {formatDate(nextInstallment.due_date)}
                                  {nextInstallment.status === 'overdue' && (
                                    <span className="ml-2 text-xs">(Overdue)</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreVert className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>View Details</DropdownMenuItem>
                                  <DropdownMenuItem>Record Payment</DropdownMenuItem>
                                  <DropdownMenuItem>Send Reminder</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeInUp>

      {/* Plan Details Dialog */}
      <Dialog open={!!selectedPlan} onOpenChange={() => setSelectedPlan(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Plan Details</DialogTitle>
          </DialogHeader>
          {selectedPlan && <PlanDetails plan={selectedPlan} />}
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}

// Plan Details Component
function PlanDetails({ plan }: { plan: PaymentPlanWithInstallments }) {
  return (
    <div className="space-y-6 mt-4">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-4 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">Total Amount</p>
          <p className="text-2xl font-bold">
            {formatCurrency(plan.total_amount, plan.currency)}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">Paid</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(plan.paid_amount, plan.currency)}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">Remaining</p>
          <p className="text-2xl font-bold text-orange-600">
            {formatCurrency(plan.remaining_amount, plan.currency)}
          </p>
        </div>
      </div>

      {/* Installments */}
      <div>
        <h4 className="font-semibold mb-3">Installments</h4>
        <div className="space-y-2">
          {plan.installments.map((installment, index) => (
            <motion.div
              key={installment.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'p-3 rounded-lg border flex items-center justify-between',
                installment.status === 'paid' && 'bg-green-50 dark:bg-green-900/10 border-green-200',
                installment.status === 'overdue' && 'bg-red-50 dark:bg-red-900/10 border-red-200',
                installment.status === 'pending' && 'bg-card'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium',
                    installment.status === 'paid' && 'bg-green-100 text-green-700',
                    installment.status === 'overdue' && 'bg-red-100 text-red-700',
                    installment.status === 'pending' && 'bg-muted text-muted-foreground'
                  )}
                >
                  {installment.installment_number}
                </div>
                <div>
                  <p className="font-medium">
                    {formatCurrency(installment.amount, plan.currency)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Due: {formatDate(installment.due_date)}
                  </p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className={cn(
                  'capitalize',
                  installment.status === 'paid' && 'bg-green-100 text-green-800',
                  installment.status === 'overdue' && 'bg-red-100 text-red-800',
                  installment.status === 'pending' && 'bg-gray-100 text-gray-800'
                )}
              >
                {installment.status}
              </Badge>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
