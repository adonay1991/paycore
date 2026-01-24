/**
 * Badge Component Unit Tests
 *
 * Tests for the Badge UI component.
 */

import { describe, expect, test } from 'bun:test';
import { badgeVariants } from '../ui/badge';

describe('Badge Component', () => {
  describe('badgeVariants', () => {
    test('returns default variant classes', () => {
      const classes = badgeVariants();
      expect(classes).toContain('bg-primary');
      expect(classes).toContain('text-primary-foreground');
    });

    test('returns secondary variant classes', () => {
      const classes = badgeVariants({ variant: 'secondary' });
      expect(classes).toContain('bg-secondary');
      expect(classes).toContain('text-secondary-foreground');
    });

    test('returns destructive variant classes', () => {
      const classes = badgeVariants({ variant: 'destructive' });
      expect(classes).toContain('bg-destructive');
      expect(classes).toContain('text-destructive-foreground');
    });

    test('returns outline variant classes', () => {
      const classes = badgeVariants({ variant: 'outline' });
      expect(classes).toContain('text-foreground');
    });

    test('returns success variant classes', () => {
      const classes = badgeVariants({ variant: 'success' });
      expect(classes).toContain('bg-green-100');
      expect(classes).toContain('text-green-800');
    });

    test('returns warning variant classes', () => {
      const classes = badgeVariants({ variant: 'warning' });
      expect(classes).toContain('bg-yellow-100');
      expect(classes).toContain('text-yellow-800');
    });

    test('returns info variant classes', () => {
      const classes = badgeVariants({ variant: 'info' });
      expect(classes).toContain('bg-blue-100');
      expect(classes).toContain('text-blue-800');
    });

    test('includes common base classes', () => {
      const classes = badgeVariants();
      expect(classes).toContain('inline-flex');
      expect(classes).toContain('items-center');
      expect(classes).toContain('rounded-full');
      expect(classes).toContain('border');
      expect(classes).toContain('px-2.5');
      expect(classes).toContain('py-0.5');
      expect(classes).toContain('text-xs');
      expect(classes).toContain('font-semibold');
      expect(classes).toContain('transition-colors');
    });

    test('includes focus styles', () => {
      const classes = badgeVariants();
      expect(classes).toContain('focus:outline-none');
      expect(classes).toContain('focus:ring-2');
    });
  });

  describe('all variants produce valid classes', () => {
    const variants = [
      'default',
      'secondary',
      'destructive',
      'outline',
      'success',
      'warning',
      'info',
    ] as const;

    test('each variant produces a valid class string', () => {
      for (const variant of variants) {
        const classes = badgeVariants({ variant });
        expect(typeof classes).toBe('string');
        expect(classes.length).toBeGreaterThan(0);
      }
    });
  });

  describe('dark mode support', () => {
    test('success variant has dark mode classes', () => {
      const classes = badgeVariants({ variant: 'success' });
      expect(classes).toContain('dark:bg-green-900');
      expect(classes).toContain('dark:text-green-100');
    });

    test('warning variant has dark mode classes', () => {
      const classes = badgeVariants({ variant: 'warning' });
      expect(classes).toContain('dark:bg-yellow-900');
      expect(classes).toContain('dark:text-yellow-100');
    });

    test('info variant has dark mode classes', () => {
      const classes = badgeVariants({ variant: 'info' });
      expect(classes).toContain('dark:bg-blue-900');
      expect(classes).toContain('dark:text-blue-100');
    });
  });
});
