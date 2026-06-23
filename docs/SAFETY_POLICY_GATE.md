# Safety Policy Gate

RepoRider now has a strengthened local safety policy gate for generated repository plans.

This is still a **planning and review gate**, not proof that a repository is safe and not permission to write to GitHub.

## Current mode

The current implementation runs locally in mock mode. It reviews the generated `RepoPlan` and returns a policy-versioned `SafetyReport`.

The scanner does not request OAuth, read credentials, create repositories, push files, open issues, or contact GitHub.

## Policy version

Current version:

```text
safety-policy-gate-v0.2
```

The version is included in the safety report so future live-mode work can tell which policy produced a decision.

## Reviewed scope

Each report records the generated plan scope:

- Repository visibility
- Starter stack
- Starter file count
- Starter issue count

This keeps safety receipts tied to the package that was actually reviewed.

## Checks

The scanner currently emits named checks for:

1. **Repository name hygiene**
   - Blocks empty names.
   - Blocks slash characters.
   - Blocks path traversal-like names.

2. **Visibility review**
   - Warns when public visibility is selected.
   - Private-first remains the preferred default.

3. **File path policy**
   - Blocks secret-like file paths.
   - Blocks absolute paths.
   - Blocks traversal paths.
   - Blocks private key style paths.

4. **File risk policy**
   - Warns on high-risk generated files.

5. **Starter issue policy**
   - Warns on large generated issue sets.
   - Warns when issue text appears to mention credentials, tokens, API keys, or secrets.

## Report status

The report status is derived from findings:

- `pass` — no warnings or blockers.
- `needs-review` — at least one warning and no blockers.
- `blocked` — at least one blocker.

Warnings require explicit human review before future live writes can be considered.

Blockers are hard stops.

## Required gates

The report includes required gates that future live-mode work must respect:

- Every generated starter file must have a fresh content-bound approval.
- Every generated starter issue must have a fresh content-bound approval.
- The dry-run writer must summarize the exact reviewed package before live mode can be considered.
- Any blocker finding must be resolved before mock create or future live writes proceed.
- Future live writes still require OAuth, secure token storage, and an armed live-mode state.

## Boundary notes

The safety policy gate does not grant write authority.

A passing report does not mean live writes can happen. It only means the current local policy did not find warnings or blockers in the generated plan.

Saved drafts, imported Markdown, restored rides, and exported receipts do not carry safety approval forward. Review state is reset when planning inputs are restored.

## Relationship to dry-run writer

The dry-run writer consumes the strengthened safety report.

If the safety report is not `pass`, the dry-run writer remains blocked.

If blockers exist, the dry-run writer includes the blocker count in its blocking reasons.

## Future work

Before real live writes exist, the safety policy should be expanded again to include:

- Full content scanning of reviewed file drafts.
- Generated issue body risk classification.
- Protected file path allow/deny lists.
- Large write-set review gates.
- Explicit user confirmation for public repos.
- Receipt hashes tied to the exact policy version.
