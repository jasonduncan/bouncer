import type { SiteId } from '../types';
import { getDescriptions, getRuleOptions } from './storage';
import { parseRuleLines, ruleOptionsFor, type RuleOptions } from './rules';

export interface EditableRule extends RuleOptions { text: string }

export async function loadRules(site: SiteId): Promise<EditableRule[]> {
  const [phrases, options] = await Promise.all([getDescriptions(`descriptions_${site}`), getRuleOptions(site)]);
  return phrases.map(text => ({ text, ...ruleOptionsFor(text, options) }));
}

// Serialize native edits so quick switch taps cannot overwrite one another.
const writes = new Map<SiteId, Promise<unknown>>();
function updateRules<T>(site: SiteId, update: (rules: EditableRule[]) => T): Promise<T> {
  const task = (writes.get(site) ?? Promise.resolve()).catch(() => {}).then(async () => {
    const rules = await loadRules(site);
    const result = update(rules);
    await chrome.storage.local.set({
      [`descriptions_${site}`]: rules.map(r => r.text),
      [`ruleOptions_${site}`]: Object.fromEntries(rules.map(({ text, ...options }) => [text, options])),
    });
    return result;
  });
  writes.set(site, task);
  void task.finally(() => { if (writes.get(site) === task) writes.delete(site); }).catch(() => {});
  return task;
}

export function saveRule(site: SiteId, original: string | null, updated: EditableRule): Promise<void> {
  return updateRules(site, rules => {
    const text = updated.text.trim();
    if (!text) throw new Error('Write a rule before saving.');
    if (rules.some(r => r.text === text && r.text !== original)) throw new Error('That rule already exists.');
    const rule = { text, ...ruleOptionsFor(text, { [text]: updated }) };
    if (original === null) rules.push(rule);
    else {
      const index = rules.findIndex(r => r.text === original);
      if (index < 0) throw new Error('This rule was removed. Reopen the rules list.');
      rules[index] = rule;
    }
  });
}

export function addRuleLines(site: SiteId, text: string): Promise<number> {
  return updateRules(site, rules => {
    const existing = new Set(rules.map(r => r.text));
    const added = parseRuleLines(text).filter(line => !existing.has(line));
    rules.push(...added.map(text => ({ text, ...ruleOptionsFor(text, {}) })));
    return added.length;
  });
}

export function removeRule(site: SiteId, text: string): Promise<void> {
  return updateRules(site, rules => {
    const index = rules.findIndex(rule => rule.text === text);
    if (index >= 0) rules.splice(index, 1);
  });
}
