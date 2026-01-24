/**
 * Button Component Unit Tests
 *
 * Tests for the Button UI component.
 */

import { describe, expect, test } from 'bun:test';
import { buttonVariants } from '../ui/button';

describe('Button Component', () => {
  describe('buttonVariants', () => {
    test('returns default variant classes', () => {
      const classes = buttonVariants();
      expect(classes).toContain('bg-primary');
      expect(classes).toContain('text-primary-foreground');
    });

    test('returns outline variant classes', () => {
      const classes = buttonVariants({ variant: 'outline' });
      expect(classes).toContain('border-border');
      expect(classes).toContain('bg-input/30');
    });

    test('returns secondary variant classes', () => {
      const classes = buttonVariants({ variant: 'secondary' });
      expect(classes).toContain('bg-secondary');
      expect(classes).toContain('text-secondary-foreground');
    });

    test('returns ghost variant classes', () => {
      const classes = buttonVariants({ variant: 'ghost' });
      expect(classes).toContain('hover:bg-muted');
    });

    test('returns destructive variant classes', () => {
      const classes = buttonVariants({ variant: 'destructive' });
      expect(classes).toContain('text-destructive');
      expect(classes).toContain('bg-destructive/10');
    });

    test('returns link variant classes', () => {
      const classes = buttonVariants({ variant: 'link' });
      expect(classes).toContain('text-primary');
      expect(classes).toContain('underline-offset-4');
    });

    test('returns default size classes', () => {
      const classes = buttonVariants();
      expect(classes).toContain('h-9');
    });

    test('returns xs size classes', () => {
      const classes = buttonVariants({ size: 'xs' });
      expect(classes).toContain('h-6');
      expect(classes).toContain('text-xs');
    });

    test('returns sm size classes', () => {
      const classes = buttonVariants({ size: 'sm' });
      expect(classes).toContain('h-8');
    });

    test('returns lg size classes', () => {
      const classes = buttonVariants({ size: 'lg' });
      expect(classes).toContain('h-10');
    });

    test('returns icon size classes', () => {
      const classes = buttonVariants({ size: 'icon' });
      expect(classes).toContain('size-9');
    });

    test('returns icon-sm size classes', () => {
      const classes = buttonVariants({ size: 'icon-sm' });
      expect(classes).toContain('size-8');
    });

    test('returns icon-lg size classes', () => {
      const classes = buttonVariants({ size: 'icon-lg' });
      expect(classes).toContain('size-10');
    });

    test('combines variant and size', () => {
      const classes = buttonVariants({ variant: 'secondary', size: 'lg' });
      expect(classes).toContain('bg-secondary');
      expect(classes).toContain('h-10');
    });

    test('appends custom className', () => {
      const classes = buttonVariants({ className: 'custom-class' });
      expect(classes).toContain('custom-class');
    });

    test('includes common base classes', () => {
      const classes = buttonVariants();
      expect(classes).toContain('inline-flex');
      expect(classes).toContain('items-center');
      expect(classes).toContain('justify-center');
      expect(classes).toContain('font-medium');
      expect(classes).toContain('transition-all');
      expect(classes).toContain('disabled:pointer-events-none');
      expect(classes).toContain('disabled:opacity-50');
    });

    test('includes focus styles', () => {
      const classes = buttonVariants();
      expect(classes).toContain('focus-visible:ring');
    });

    test('includes aria-invalid styles', () => {
      const classes = buttonVariants();
      expect(classes).toContain('aria-invalid:border-destructive');
    });
  });

  describe('variant and size combinations', () => {
    const variants = ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'] as const;
    const sizes = ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'] as const;

    test('all variant/size combinations produce valid class strings', () => {
      for (const variant of variants) {
        for (const size of sizes) {
          const classes = buttonVariants({ variant, size });
          expect(typeof classes).toBe('string');
          expect(classes.length).toBeGreaterThan(0);
        }
      }
    });
  });
});
