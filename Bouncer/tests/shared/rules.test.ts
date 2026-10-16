import { describe, expect, it } from 'vitest';
import { activeRuleDescriptions, parseRuleLines, ruleOptionsFor } from '../../src/shared/rules';

describe('plain-language rules', () => {
  it('preserves wording, punctuation and order while removing blank lines and exact duplicates', () => {
    expect(parseRuleLines('  Keep sources; hide hype.\r\n\nKeep sources; hide hype.\nNo “comment AI” bait\n')).toEqual([
      'Keep sources; hide hype.', 'No “comment AI” bait',
    ]);
  });

  it('treats legacy phrases as enabled without a migration', () => {
    expect(ruleOptionsFor('anything', undefined)).toEqual({ enabled: true, threshold: 0.85 });
    expect(activeRuleDescriptions(['legacy', 'paused'], { paused: { enabled: false } })).toEqual(['legacy']);
  });

  it.each([NaN, Infinity, '0.9', null])('defaults malformed threshold %s', threshold => {
    expect(ruleOptionsFor('rule', { rule: { threshold } }).threshold).toBe(0.85);
  });

  it('clamps out-of-range thresholds', () => {
    expect(ruleOptionsFor('r', { r: { threshold: -1 } }).threshold).toBe(0.5);
    expect(ruleOptionsFor('r', { r: { threshold: 2 } }).threshold).toBe(1);
  });

  it('treats property names as ordinary rule text', () => {
    const options = Object.fromEntries([['__proto__', { enabled: false, threshold: 0.9 }]]);
    expect(ruleOptionsFor('__proto__', options).enabled).toBe(false);
    expect(ruleOptionsFor('constructor', options)).toEqual({ enabled: true, threshold: 0.85 });
  });
});
