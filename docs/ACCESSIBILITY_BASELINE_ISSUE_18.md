# Issue #18: Accessibility Baseline

This change improves RepoRider's existing **Expo React Native** app and **React GitPage** without adding any network services, OAuth tokens, or GitHub write authority.

## What changed

**Native mobile app**
- Named repository-name, starter issue title/body/label, draft import/rename/export, and idea-input fields for screen readers.
- Gave repo visibility, starter stack, and issue-count selectors explicit `radio` roles and `selected` accessibility state.
- Annotated file-selection and issue-selection buttons with current review/edited status instead of relying on color or checkmarks.
- Exposed selected edit/diff tab state and labeled public visibility consent and blocked mock-create button.
- Preserved the existing **editable text idea input** as a device-dictation fallback. No mandatory microphone access or third-party transcription.
- Lightened key native input placeholder text (#94a3b8 on #0f172a) for clearer legibility.

**React GitPage**
- Added a keyboard-visible **Skip to main content** link and a targetable main landmark.
- Described primary navigation, kept `aria-current=page`, and announced status notices through `aria-live=polite`.
- Marked Audit Observatory explorer views and selected rows with explicit pressed state.
- Strengthened visible keyboard focus styles and mobile (max-width 700px) minimum target heights on key navigation/explorer controls.
- Disabled transitions/animations when the browser requests reduced motion.

## Contrast and limits

`site/tests/accessibility.test.mjs` computes **WCAG AA text-contrast ratios (at least 4.5:1)** for selected verified foreground/background pairs, including native body text and input/placeholder text, site body text, and the keyboard skip link. It also checks that key semantic affordances are present in the source.

This is **an automated baseline, not a comprehensive accessibility certification**. Dynamic screen-reader navigation, all custom colors, responsive zoom, OS-level font scaling, every screen and device, and real assistive technology still need manual human testing. CSS heuristics and source checks alone cannot prove full WCAG compliance.

### Manual QA checklist before release

1. **Keyboard:** From the public GitPage, Tab reaches the skip link first; Enter jumps over the sidebar to the main content. All visible controls remain reachable; focus is visible and does not vanish into the sidebar.
2. **Mobile screen reader:** On Android TalkBack or iOS VoiceOver, the repo name, visibility, stack and issue count are announced with meaningful names and selected states. Starter issue fields and edited/approved statuses can be distinguished.
3. **Typed fallback:** Enter a complete repository idea using the keyboard alone, with microphone permissions denied.
4. **Error feedback:** Force an invalid draft/import, a blocked safety gate, and missing public confirmation. Each error must be understandable **in text**, not only by red/green or a status icon.
5. **Display settings:** Test larger accessibility text, 200% browser zoom, landscape and 320px phone layouts for wrapping, scrolling, touch target overlap and clipping.
6. **Motion:** Turn on reduced-motion preferences and verify the GitPage stays usable without animation.
7. **Contrast:** Audit remaining small badges, informational metadata, disabled labels, and third-party color surfaces across real device screenshots.

## Checks

```sh
npm run typecheck
npm run test:safety
cd site
npm test
npm run build
```

The PR references `Closes #18` for the requested **baseline acceptance criteria**, while tracking the above manual verification separately during pre-release qualification.

**Boundary:** This feature provides more accessible, usable review interfaces. It does not authenticate users or promote model proposals to GitHub writes.
