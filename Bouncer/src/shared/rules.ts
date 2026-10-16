/** Rules remain plain-language phrases; options are additive, so existing
 * installs and the desktop phrase editor keep working without migration. */
export interface RuleOptions {
  enabled: boolean;
  threshold: number;
}

export type RuleOptionsMap = Record<string, RuleOptions>;
export const DEFAULT_RULE_THRESHOLD = 0.85;

export function ruleOptionsFor(text: string, options: unknown): RuleOptions {
  const stored = options && typeof options === 'object' && Object.prototype.hasOwnProperty.call(options, text)
    ? (options as Record<string, unknown>)[text]
    : undefined;
  const value = stored && typeof stored === 'object' ? stored as Partial<RuleOptions> : {};
  return {
    enabled: value.enabled !== false,
    threshold: typeof value.threshold === 'number' && Number.isFinite(value.threshold)
      ? Math.max(0.5, Math.min(1, value.threshold))
      : DEFAULT_RULE_THRESHOLD,
  };
}

export function activeRuleDescriptions(descriptions: string[], options: unknown): string[] {
  return descriptions.filter(text => ruleOptionsFor(text, options).enabled);
}

/** One rule per line. Preserve wording, punctuation and order; ignore blanks
 * and exact duplicates. A paragraph on one line stays a single rule. */
export function parseRuleLines(text: string): string[] {
  return [...new Set(text.split(/\r?\n/).map(line => line.trim()).filter(Boolean))];
}

export const AI_FEED_STARTER_RULES = [
  'Hide exaggerated AI breakthrough claims that offer no concrete evidence, source, or reproducible example. Keep substantive research and engineering updates, even when enthusiastic.',
  'Hide engagement bait that asks me to comment a keyword, like, or repost to receive the useful information.',
  'Hide promotions promising easy money or guaranteed business success from AI with no meaningful explanation of the work or limitations.',
  'Hide generic AI tool roundups that provide no original evaluation, implementation detail, or useful comparison.',
];
