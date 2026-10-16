# Jev and custom iPhone rules

Write the conditions under which you want a post hidden, in your own words. The iPhone rules sheet provides **Write a rule**, **Paste several rules**, and an optional, editable **AI feed starter rules** list. Existing Bouncer phrases remain enabled without migration.

Each rule has editable text, an enabled switch, and a Jev match threshold. All enabled rules are independent: one match is enough to hide a post. Put exceptions in the rule that needs them; a separate “keep” rule does not override another rule. For example:

```text
Hide AI breakthrough claims without concrete evidence. Keep research with sources and reproducible results, even when the author is enthusiastic.
Hide posts asking me to comment a keyword or repost before they will share the useful information.
Hide generic tool lists with no original evaluation or implementation details.
Hide promotions promising easy money from AI without explaining the work and limitations.
```

Bulk entry uses one rule per line and skips blank lines and exact duplicates. Use the individual editor for a rule containing multiple paragraphs. The starter list is never enabled automatically. Rules belong to the selected platform. Open a rule to pause it, adjust its threshold, or rewrite it; swipe to delete. **View filtered** shows the matching rules and their scores, with the existing controls to restore a post or exclude an account.

## Set up the iPhone app

This is source code for a development build, not an App Store release or a signed IPA.

1. On a Mac, use Xcode 26.2 or newer (the upstream project was last updated with 26.2), Node.js, and npm. The iPhone deployment target is iOS 18.
2. From the checkout, run `cd Bouncer && npm ci && npm run build:no-ad`.
3. Open `Bouncer_xcode/Bouncer.xcodeproj`. Allow Swift Package Manager to resolve the upstream dependencies.
4. Select **Bouncer (iOS)**. In Signing & Capabilities, choose your Apple development team and unique bundle identifiers for the app and its notification service. Upstream signing settings belong to Imbue and must be changed for your device build.
5. Build and run on an iPhone. The Xcode JavaScript build phase now permits missing `.env.dev`/`.env.prod` files for builds using your own API keys. Imbue backend credentials and Firebase configuration are not required for Jev.
6. Open X in the app and sign in through the embedded website. Open Settings → Advanced Settings → AI providers. Under **TypeSafe / Jev**, save your TypeSafe key, then select **Jev · text rules**.
7. Open **Your rules**, paste your rules, and save. Start with the default 85% threshold, inspect filtered posts, and adjust rules or thresholds based on your feed.

Get a key from [TypeSafe](https://console.typesafe.ai). Enter it in the app, not in source code or a committed environment file. The native app uses Bouncer's existing app-local settings store for provider keys. Selecting Jev sends the extracted post text and enabled rules to TypeSafe. The bridge is only exposed to the app's isolated content world, uses a fixed HTTPS endpoint, excludes social-site cookies, and refuses HTTP redirects.

## Decisions, limits, and cost

Jev is called through [System One](https://docs.typesafe.ai/introduction/quickstart), with one independent [Noul question](https://docs.typesafe.ai/primitives/noul) per enabled rule. Each Noul is the model's estimated probability that the post satisfies that rule. The app compares that score with the saved threshold; the explanation names each matching rule and its score. Scores are model estimates, not verified facts or proof that a claim is false.

- This integration evaluates **text only**. Images, video, and linked pages are not fetched or judged by Jev. Image-only posts remain visible unless an existing structural filter applies.
- Jev thresholds range from 50% to 100%, defaulting to 85%. Higher thresholds hide fewer uncertain matches. Other model providers honor enabled switches but use their own classification decisions rather than Jev thresholds.
- Invalid, missing, or timed-out API results do not become hide decisions. Previously hidden posts are refreshed after rule edits; stale in-flight results are discarded.
- Up to 32 rules are scored per request. Larger rule lists use additional requests, and at most four feed evaluations run concurrently. More rules and longer posts consume more inference tokens. Requests time out after 30 seconds per batch.
- Bouncer's iPhone app displays the signed-in X website in a WebView, so this path does not purchase feed reads through the X developer API. TypeSafe usage is billed to your key. Check your TypeSafe account for current prices and spending controls; this branch does not enforce a monetary budget.
- The optional “suggest filters” action can score the four starter rules when Jev is selected. Jev does not generate arbitrary new prose; the rule editor remains the way to write anything you want.

The desktop extension also exposes Jev as a provider. Its existing phrase editor remains available; the richer rule editor and bulk entry in this branch are native iPhone UI. Android's native UI and transport have not been updated.

## Verification

Run from `Bouncer/`:

```bash
npm run lint
npm test
npm run build:no-ad
```

Tests cover independent rule scores, thresholds, paused rules, malformed/partial answers, HTTP errors, timeouts, long rule lists, native transport selection, persistence, duplicate handling, concurrent edits, and decisions that finish after a rule changes. Provider tests mock the API and do not spend credits.

The implementation environment has no Xcode or iOS simulator, so native compilation and end-to-end testing are still required on a Mac/device. No live authenticated TypeSafe call has been made. On-device acceptance checks: paste rules and reopen the app; edit and pause a rule while a feed request is pending; inspect matching-rule explanations; raise a threshold; delete the last matching rule; and confirm an invalid key or offline connection leaves new posts visible.
