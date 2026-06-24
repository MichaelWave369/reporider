# Safety Fixture Coverage

RepoRider includes a lightweight local safety fixture suite for the safety policy gate.

The suite exercises known-safe, warning, and blocker examples without adding a heavyweight test framework.

## Current command

```bash
npm run test:safety
```

This command:

1. Compiles only the safety scanner, shared types, and fixture file with `tsconfig.safety-tests.json`.
2. Runs the compiled fixture file with Node.
3. Deletes the temporary `.safety-test-build/` output directory.

## Current fixture buckets

The current fixture suite covers:

- **Known-safe package**
  - Private repo
  - Safe file path
  - Safe reviewed file content
  - Safe reviewed issue text
  - Expected status: `pass`

- **Reviewed file blocker**
  - Private-key-like block in reviewed starter-file content
  - Expected status: `blocked`
  - Expected category: `credential-material`

- **Reviewed file warning**
  - Remote script piped into shell in reviewed starter-file content
  - Expected status: `needs-review`
  - Expected category: `remote-execution`

- **Reviewed issue blocker**
  - GitHub-token-like value inside reviewed issue text
  - Expected status: `blocked`
  - Expected category: `credential-material`

- **Reviewed issue warning**
  - OAuth and production-deployment language inside reviewed issue text
  - Expected status: `needs-review`
  - Expected categories: `auth-flow-risk` and `production-impact`

## CI relationship

The CI workflow runs:

```bash
npm run typecheck
npm run test:safety
```

This means the green check now verifies both TypeScript validity and safety fixture behavior.

## Tracker status

The #31 milestone should record this as the safety fixture coverage wave once the issue-comment connector accepts a new comment.

## Boundary

Safety fixtures are local deterministic checks.

They do not:

- Request OAuth.
- Read, store, or validate real tokens.
- Create repositories.
- Push files.
- Open issues.
- Prove a future repository is safe to publish.
- Grant write authority.

A passing fixture suite only confirms that the current safety scanner still recognizes the covered known-safe, warning, and blocker examples.

## Future fixture expansion

Future fixture waves should add coverage for:

- Unsafe repo names.
- Public visibility warning behavior.
- Secret-like paths.
- Unsafe traversal paths.
- High-risk files.
- Large issue sets.
- Empty reviewed files and issue bodies.
- Credential-reference warning examples.
- Security disclosure warning examples.
- Privileged-operation warning examples.
- Receipt/policy-version coupling once receipt hashes exist.
