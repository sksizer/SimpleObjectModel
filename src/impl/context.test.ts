import { describe, expect, test } from 'vitest';
import { ContextImpl } from './contextImpl';

test('instantiates', () => {
  expect(() => {
    new ContextImpl();
  }).not.toThrowError();
});
