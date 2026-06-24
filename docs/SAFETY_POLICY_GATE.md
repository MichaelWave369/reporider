# Safety Policy Gate

RepoRider now has a strengthened local safety policy gate for generated repository plans, reviewed starter-file draft contents, and reviewed starter-issue draft bodies.

This is still a **planning and review gate**, not proof that a repository is safe and not permission to write to GitHub.

## Current mode

The current implementation runs locally in mock mode. It reviews the generated `RepoPlan`, the current reviewed starter-file drafts, the current reviewed starter-issue drafts, and returns a policy-versioned `SafetyReport`.

The scanner does not request OAuth, read credentials, create repositories, push files, open issues, or contact GitHub.

## Policy version

Current version:

```text
safety-policy-gate-v0.4
```

The version is included in the safety report so future live-mode work can tell which policy produced a decision.

## Reviewed scope

Each report records the generated plan and reviewed content scope:

- Repository visibility
- Starter stack
- Starter file count
- Starter issue count
- Reviewed starter-file content count
- Reviewed starter-file content character count
- Reviewed starter-issue body count
- Reviewed starter-issue text character count

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

5. **Reviewed file content policy**
   - Blocks private-key-like blocks.
   - Blocks GitHub token-like values.
   - Blocks fine-grained GitHub token-like values.
   - Blocks AWS access key-like values.
   - Blocks Slack token-like values.
   - Blocks npm token-like values.
   - Blocks inline credential-like assignments.
   - Blocks destructive root filesystem commands.
   - Warns on empty reviewed file content.
   - Warns on unusually large starter file drafts.
   - Warns on remote-script-to-shell patterns.
   - Warns on broad permission commands.
   - Warns on credential-like environment variable references.
   - Warns on bearer authorization header examples.

6. **Starter issue count policy**
   - Warns on large generated issue sets.

7. **Reviewed issue body risk policy**
   - Blocks private-key-like blocks inside issue text.
   - Blocks live-token-like values inside issue text.
   - Blocks inline credential-like assignments inside issue text.
   - Blocks destructive root filesystem commands inside issue text.
   - Warns on credential-reference language.
   - Warns on vulnerability, exploit, CVE, zero-day, or disclosure language.
   - Warns on privileged or destructive ops instructions.
   - Warns on remote-script-to-shell instructions.
   - Warns on production/deployment/migration/incident language.
   - Warns on OAuth, token, scope, login, or authorization-code flow language.
   - Warns on empty or unusually large starter issue bodies.

## Risk categories

Findings may include a category to make review easier. Current categories include:

- `credential-material`
- `credential-reference`
- `destructive-command`
- `remote-execution`
- `permission-risk`
- `security-disclosure`
- `privileged-operation`
- `production-impact`
- `auth-flow-risk`
- `empty-body`
- `large-body`
- `large-issue-set`

Categories are review labels only. They are not proof of danger and they do not grant write authority.

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
- The reviewed starter-file contents must pass local credential/destructive-command checks.
- The reviewed starter-issue bodies must pass local credential/destructive/security/ops risk classification.
- The dry-run writer must summarize the exact reviewed package before live mode can be considered.
- Any blocker finding must be resolved before mock create or future live writes proceed.
- Future live writes still require OAuth, secure token storage, and an armed live-mode state.

## Boundary notes

The safety policy gate does not grant write authority.

A passing report does not mean live writes can happen. It only means the current local policy did not find warnings or blockers in the generated plan, reviewed starter-file contents, or reviewed starter-issue bodies.

Reviewed file and issue content is scanned locally from the current app state. This gate does not send reviewed content to GitHub.

Saved drafts, imported Markdown, restored rides, and exported receipts do not carry safety approval forward. Review state is reset when planning inputs are restored.

## Relationship to dry-run writer

The dry-run writer consumes the strengthened safety report.

If the safety report is not `pass`, the dry-run writer remains blocked.

If blockers exist, the dry-run writer includes the blocker count in its blocking reasons.

## Future work

Before real live writes exist, the safety policy should be expanded again to include:

- Protected file path allow/deny lists.
- Large write-set review gates.
- Explicit user confirmation for public repos.
- Receipt hashes tied to the exact policy version and reviewed content package.
- Test fixtures for known-safe and known-blocked reviewed file and issue contents.
