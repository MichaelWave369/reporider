# Issue #22: Repository Naming Policy (partial resolution)

RepoRider's current planner, Expo interface, static React GitPage, mock writer and agent planner now share a deterministic naming policy. The issue remains **open** until live-owner availability checks are implemented within the authenticated GitHub write flow.

## Implemented in this PR

**Generated names**
- Lowercase ASCII `a-z`, digits `0-9`, and single hyphens only.
- Start and end with an alphanumeric character, maximum **96** characters.
- Unicode accents in the slug utility are decomposed where possible; punctuation becomes separators.
- Leading/trailing hyphens and overlong tails are trimmed.
- Reserved/confusing identifiers such as `git`, `github`, `null`, `undefined`, `con`, `prn`, `aux`, `nul`, and Windows COM/LPT device names are denied.
- Suggestions that would use a reserved name gain `-starter` where possible; otherwise a safe fallback is used.

**Manual edits**
- The rider can edit the proposed name in Expo and the React GitPage.
- Unlike earlier builds, manual input is **not silently normalized**: `My_Project` remains `My_Project` in the field, displays a clear validation error, and causes a safety blocker. This helps prevent surprising repository names and silent renames.
- The same validation runs in `scanRepoPlan`, the mock writer (so bypassing the UI cannot bypass validation), and the RR-A01 agent-input gate.
- The UI displays the max length, accepted format, and explicit **UNVERIFIED** collision status; text and accessibility semantics do not rely on color alone.

**Collision groundwork**
- A pure offline `inspectKnownRepositoryNames` detects case-insensitive matches **only within a caller-supplied list**. It reports `POTENTIAL_CONFLICT`, `NOT_IN_SUPPLIED_LIST`, `INVALID_NAME`, or `UNKNOWN`, and never conflates a list miss with GitHub-wide availability.
- `getRepositoryNamePrewriteGate` **always returns** `name_collision_unverified: true` and `may_create_repository: false`. This is a fail-closed contract, not authorization.
- No authenticated GitHub account inventory, OAuth token, live REST existence check, or GitHub writer is added by this PR.

## Outstanding acceptance criterion

GitHub owner/repo collisions **cannot be reliably checked from a public, offline browser-only plan**. Hidden/private repos are not visible through unauthenticated requests, even when a public 404 appears to suggest a name is available. Repository names may also race between check and creation.

Issue #22's last acceptance criterion remains open. It requires a future owner-authenticated write adapter to:
1. Verify the current GitHub principal and the exact owner/org identity with least-privilege credentials.
2. Perform an owner-scoped existence check **immediately before creation**, returning `conflict`, `available`, or `unverified` with a bounded validity window and clear evidence.
3. **Fail closed** on timeouts, API errors, insufficient privileges, missing owner or stale plans; block mutation if an existing repo is found.
4. Bind the name, owner, visibility and reviewed artifact fingerprint to the operator's explicit authorization.
5. Treat GitHub creation conflict errors (e.g. concurrent creators) as authoritative final denials even after a prior available check.

A local name validation or an imported repo list alone is not this safety gate.

## Tests

```sh
npm run typecheck
npm run test:safety
cd site
npm test
npm run build
```

Fixtures test Unicode slugging, reserved names, 96-character bounds, traversal/mixed-case/underscore rejection, manual input preservation, repeated hyphens, known-list collision flags, no-inventory UNKNOWN, direct mock-writer bypass rejection, RR-A01 override refusal and unchanged private mock boundaries.

**Issue status:** keep #22 OPEN until the authenticated collision criterion can be verified end-to-end. This PR partially addresses #22 and should **not** use `Closes #22`.
