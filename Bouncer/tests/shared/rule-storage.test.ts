import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addRuleLines, loadRules, removeRule, saveRule } from '../../src/shared/rule-storage';

let store: Record<string, unknown>;
beforeEach(() => {
  store = {};
  vi.mocked(chrome.storage.local.get).mockImplementation(async (keys) =>
    Object.fromEntries((keys as string[]).filter(k => k in store).map(k => [k, store[k]])));
  vi.mocked(chrome.storage.local.set).mockImplementation(async items => { Object.assign(store, items); });
});

describe('rule persistence', () => {
  it('edits a legacy rule and stores text and settings together', async () => {
    store.descriptions_twitter = ['old rule'];
    await saveRule('twitter', 'old rule', { text: '  new rule  ', enabled: false, threshold: 0.9 });
    expect(await loadRules('twitter')).toEqual([{ text: 'new rule', enabled: false, threshold: 0.9 }]);
    expect(store.ruleOptions_twitter).toEqual({ 'new rule': { enabled: false, threshold: 0.9 } });
  });

  it('appends pasted rules, preserves existing options and keeps platforms separate', async () => {
    await saveRule('twitter', null, { text: 'hype', enabled: false, threshold: 0.95 });
    expect(await addRuleLines('twitter', 'hype\nbait\nbait\n')).toBe(1);
    expect(await loadRules('twitter')).toEqual([
      { text: 'hype', enabled: false, threshold: 0.95 },
      { text: 'bait', enabled: true, threshold: 0.85 },
    ]);
    expect(await loadRules('youtube')).toEqual([]);
  });

  it('serializes simultaneous edits without losing a rule', async () => {
    await Promise.all([addRuleLines('twitter', 'first'), addRuleLines('twitter', 'second')]);
    expect((await loadRules('twitter')).map(r => r.text)).toEqual(['first', 'second']);
  });

  it('rejects blank rules, duplicate edits and editing a removed rule without breaking later saves', async () => {
    await addRuleLines('twitter', 'a\nb');
    await expect(saveRule('twitter', 'a', { text: ' ', enabled: true, threshold: 0.9 })).rejects.toThrow('Write a rule');
    await expect(saveRule('twitter', 'a', { text: 'b', enabled: true, threshold: 0.9 })).rejects.toThrow('already exists');
    await expect(saveRule('twitter', 'gone', { text: 'c', enabled: true, threshold: 0.9 })).rejects.toThrow('removed');
    await addRuleLines('twitter', 'c');
    expect((await loadRules('twitter')).map(r => r.text)).toEqual(['a', 'b', 'c']);
  });

  it('removes metadata so a newly added rule starts enabled', async () => {
    await saveRule('twitter', null, { text: '__proto__', enabled: false, threshold: 1 });
    await removeRule('twitter', '__proto__');
    expect(store.ruleOptions_twitter).toEqual({});
    await addRuleLines('twitter', '__proto__');
    expect(await loadRules('twitter')).toEqual([{ text: '__proto__', enabled: true, threshold: 0.85 }]);
  });
});
