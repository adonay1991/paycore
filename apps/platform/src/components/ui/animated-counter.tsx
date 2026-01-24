'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  formatFn?: (value: number) => string;
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 1.5,
  formatFn = (v) => Math.round(v).toLocaleString(),
  className,
}: AnimatedCounterProps) {
  const spring = useSpring(0, {
    stiffness: 75,
    damping: 30,
    duration: duration * 1000,
  });

  const display = useTransform(spring, (current) => formatFn(current));
  const [displayValue, setDisplayValue] = useState(formatFn(0));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => setDisplayValue(v));
    return unsubscribe;
  }, [display]);

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {displayValue}
    </motion.span>
  );
}

interface AnimatedCurrencyProps {
  value: number;
  currency?: string;
  locale?: string;
  duration?: number;
  className?: string;
}

export function AnimatedCurrency({
  value,
  currency = 'EUR',
  locale = 'es-ES',
  duration = 1.5,
  className,
}: AnimatedCurrencyProps) {
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(v);

  return (
    <AnimatedCounter
      value={value}
      duration={duration}
      formatFn={formatCurrency}
      className={className}
    />
  );
}
