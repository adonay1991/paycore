/**
 * Utils Package Unit Tests
 */

import { describe, expect, test, beforeEach, mock } from 'bun:test';
import {
  formatDate,
  formatCurrency,
  sleep,
  safeJsonParse,
  generateId,
  debounce,
  isServer,
  isClient,
} from '../index';

describe('Utils Package', () => {
  describe('formatDate', () => {
    test('formats Date object', () => {
      const date = new Date('2024-06-15');
      const result = formatDate(date, 'en-US');
      expect(result).toContain('2024');
      expect(result).toContain('June');
      expect(result).toContain('15');
    });

    test('formats date string', () => {
      const result = formatDate('2024-12-25', 'en-US');
      expect(result).toContain('2024');
      expect(result).toContain('December');
      expect(result).toContain('25');
    });

    test('uses default locale', () => {
      const result = formatDate(new Date('2024-01-01'));
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('respects locale parameter', () => {
      const date = new Date('2024-03-10');
      const enResult = formatDate(date, 'en-US');
      const deResult = formatDate(date, 'de-DE');

      // Both should contain year and day
      expect(enResult).toContain('2024');
      expect(deResult).toContain('2024');

      // Different month formatting
      expect(enResult).toContain('March');
      expect(deResult).toContain('März');
    });
  });

  describe('formatCurrency', () => {
    test('formats USD by default', () => {
      const result = formatCurrency(1234.56);
      expect(result).toBe('$1,234.56');
    });

    test('formats EUR', () => {
      const result = formatCurrency(1234.56, 'EUR', 'de-DE');
      expect(result).toContain('1.234,56');
      expect(result).toContain('€');
    });

    test('formats GBP', () => {
      const result = formatCurrency(1234.56, 'GBP', 'en-GB');
      expect(result).toContain('£');
      expect(result).toContain('1,234.56');
    });

    test('handles zero', () => {
      const result = formatCurrency(0);
      expect(result).toBe('$0.00');
    });

    test('handles negative amounts', () => {
      const result = formatCurrency(-100.50);
      expect(result).toContain('-');
      expect(result).toContain('100.50');
    });

    test('handles large numbers', () => {
      const result = formatCurrency(1000000);
      expect(result).toBe('$1,000,000.00');
    });

    test('rounds to two decimal places', () => {
      const result = formatCurrency(99.999);
      expect(result).toBe('$100.00');
    });
  });

  describe('sleep', () => {
    test('waits for specified duration', async () => {
      const start = Date.now();
      await sleep(50);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(45);
      expect(elapsed).toBeLessThan(100);
    });

    test('returns a promise', () => {
      const result = sleep(1);
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('safeJsonParse', () => {
    test('parses valid JSON', () => {
      const result = safeJsonParse('{"name":"test","value":42}', {});
      expect(result).toEqual({ name: 'test', value: 42 });
    });

    test('returns fallback for invalid JSON', () => {
      const fallback = { default: true };
      const result = safeJsonParse('not valid json', fallback);
      expect(result).toBe(fallback);
    });

    test('returns fallback for empty string', () => {
      const result = safeJsonParse('', 'fallback');
      expect(result).toBe('fallback');
    });

    test('parses arrays', () => {
      const result = safeJsonParse<number[]>('[1,2,3]', []);
      expect(result).toEqual([1, 2, 3]);
    });

    test('parses primitive values', () => {
      expect(safeJsonParse<string>('"hello"', '')).toBe('hello');
      expect(safeJsonParse<number>('123', 0)).toBe(123);
      expect(safeJsonParse<boolean>('true', false)).toBe(true);
      expect(safeJsonParse<string | null>('null', 'default')).toBe(null);
    });

    test('uses generic type correctly', () => {
      interface User {
        id: number;
        name: string;
      }

      const result = safeJsonParse<User>('{"id":1,"name":"John"}', { id: 0, name: '' });
      expect(result.id).toBe(1);
      expect(result.name).toBe('John');
    });
  });

  describe('generateId', () => {
    test('generates ID of default length', () => {
      const id = generateId();
      expect(id).toHaveLength(12);
    });

    test('generates ID of custom length', () => {
      expect(generateId(8)).toHaveLength(8);
      expect(generateId(20)).toHaveLength(20);
      expect(generateId(1)).toHaveLength(1);
    });

    test('generates unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      // All 100 IDs should be unique
      expect(ids.size).toBe(100);
    });

    test('contains only alphanumeric characters', () => {
      const id = generateId(100);
      expect(id).toMatch(/^[A-Za-z0-9]+$/);
    });

    test('handles zero length', () => {
      const id = generateId(0);
      expect(id).toBe('');
    });
  });

  describe('debounce', () => {
    test('delays function execution', async () => {
      let callCount = 0;
      const fn = () => {
        callCount++;
      };

      const debounced = debounce(fn, 50);

      debounced();
      debounced();
      debounced();

      expect(callCount).toBe(0);

      await sleep(100);

      expect(callCount).toBe(1);
    });

    test('resets timer on subsequent calls', async () => {
      let callCount = 0;
      const debounced = debounce(() => callCount++, 50);

      debounced();
      await sleep(30);
      debounced();
      await sleep(30);
      debounced();
      await sleep(30);

      // Still not called because timer keeps resetting
      expect(callCount).toBe(0);

      await sleep(60);
      expect(callCount).toBe(1);
    });

    test('passes arguments to debounced function', async () => {
      let receivedArgs: unknown[] = [];
      const fn = (...args: unknown[]) => {
        receivedArgs = args;
      };

      const debounced = debounce(fn, 20);
      debounced('a', 'b', 123);

      await sleep(50);

      expect(receivedArgs).toEqual(['a', 'b', 123]);
    });

    test('uses last call arguments', async () => {
      let result = '';
      const debounced = debounce((val: unknown) => {
        result = val as string;
      }, 20);

      debounced('first');
      debounced('second');
      debounced('third');

      await sleep(50);

      expect(result).toBe('third');
    });
  });

  describe('isServer / isClient', () => {
    test('isServer returns boolean', () => {
      expect(typeof isServer()).toBe('boolean');
    });

    test('isClient returns boolean', () => {
      expect(typeof isClient()).toBe('boolean');
    });

    test('isServer and isClient are opposites', () => {
      expect(isServer()).toBe(!isClient());
    });

    // In Bun test environment, we're on server
    test('detects server environment in Bun', () => {
      expect(isServer()).toBe(true);
      expect(isClient()).toBe(false);
    });
  });
});
