# Safety Fixture Coverage

RepoRider includes a lightweight local safety fixture suite for the safety policy gate.

The suite exercises known-safe, warning, blocker, absolute-path, package-manifest, and remediation examples without adding a heavyweight test framework.

## Current command

```bash
npm run test:safety
```

This command:

1. Compiles only the safety scanner, shared types, and fixture files with `tsconfig.safety-tests.json`.
2. Runs the compiled fixture files with Node.
3. Deletes the temporary `.safety-test-build/` output directory.

## Current fixture buckets

The current fixture suite covers:

- **Known-safe package**
  - Private repo
  - Safe file path
  - Safe reviewed file content
  - Safe reviewed issue text
  - Expected status: `pass`
  - Expected finding remediation: present

- **Unsafe repo name blocker**
  - Repo name containing traversal-like text
  - Expected status: `blocked`
  - Expected finding: `unsafe-repo-name`
  - Expected remediation: rename to a simple path-safe slug

- **Public visibility warning**
  - Public repo visibility selected
  - Expected status: `needs-review`
  - Expected category: `visibility-review`
  - Expected remediation: keep private unless public release is intentional

- **Secret-like path blocker**
  - Secret-like generated path such as `.env`
  - Expected status: `blocked`
  - Expected category: `secret-like-path`
  - Expected remediation: rename/remove secret-like file and use samples/placeholders

- **Traversal path blocker**
  - Generated path that escapes the repo root, such as `../outside.md`
  - Expected status: `blocked`
  - Expected category: `unsafe-path`
  - Expected remediation: move to a safe repo-relative path

- **Unix absolute path blocker**
  - Generated path that starts from the filesystem root, such as `/tmp/reporider/README.md`
  - Expected status: `blocked`
  - Expected category: `unsafe-path`
  - Expected named check: `file-path-policy` is `blocker`
  - Expected remediation: safe repo-relative path guidance

- **Windows drive-letter absolute path blocker**
  - Generated paths such as `C:\Users\rider\RepoRider\README.md` and `C:/Users/rider/RepoRider/README.md`
  - Expected status: `blocked`
  - Expected category: `unsafe-path`
  - Expected named check: `file-path-policy` is `blocker`
  - Expected remediation: safe repo-relative path guidance

- **Windows UNC absolute path blocker**
  - Generated network paths such as `\\server\share\RepoRider\README.md`
  - Expected status: `blocked`
  - Expected category: `unsafe-path`
  - Expected named check: `file-path-policy` is `blocker`
  - Expected remediation: safe repo-relative path guidance

- **Key-file path blocker**
  - Generated path with private-key-like filename, such as `deploy/id_rsa`
  - Expected status: `blocked`
  - Expected category: `unsafe-path`

- **High-risk file warning**
  - Generated high-risk starter file, such as a deployment script
  - Expected status: `needs-review`
  - Expected category: `high-risk-file`

- **Empty reviewed file warning**
  - Empty reviewed starter-file content
  - Expected status: `needs-review`
  - Expected category: `empty-content`

- **Large reviewed file warning**
  - Unusually large reviewed starter-file content
  - Expected status: `needs-review`
  - Expected category: `large-content`

- **Reviewed file blocker**
  - Private-key-like block in reviewed starter-file content
  - Expected status: `blocked`
  - Expected category: `credential-material`
  - Expected remediation: remove credential-like material and use placeholders

- **Reviewed file warning**
  - Remote script piped into shell in reviewed starter-file content
  - Expected status: `needs-review`
  - Expected category: `remote-execution`
  - Expected remediation: avoid pipe-to-shell instructions

- **Package manifest pass**
  - Safe reviewed `package.json` with simple local scripts and pinned registry dependency
  - Expected status: `pass`
  - Expected named check: `package-manifest-policy` is `pass`

- **Package lifecycle hook warning**
  - `postinstall`, `install`, `preinstall`, `prepare`, or publish lifecycle scripts
  - Expected status: `needs-review`
  - Expected category: `package-lifecycle-hook`
  - Expected named check: `package-manifest-policy` is `warning`

- **Package script blocker**
  - package script with remote shell pipe, destructive root command, or broad permissions
  - Expected status: `blocked`
  - Expected category: `package-script-risk`
  - Expected named check: `package-manifest-policy` is `blocker`

- **Package-manager command warning**
  - package script using global installs, force installs/audit fix, or `npx` execution
  - Expected status: `needs-review`
  - Expected category: `package-manager-command-risk`

- **Package dependency name warning**
  - dependency names with suspicious or credential-like wording
  - Expected status: `needs-review`
  - Expected category: `package-dependency-name-risk`

- **Package dependency source warning**
  - dependency versions using `git+`, `file:`, or URL sources
  - Expected status: `needs-review`
  - Expected category: `package-dependency-source-risk`

- **Package manifest parse warning**
  - invalid `package.json` content
  - Expected status: `needs-review`
  - Expected category: `package-manifest-parse`

- **Empty reviewed issue body warning**
  - Empty reviewed starter-issue body
  - Expected status: `needs-review`
  - Expected category: `empty-body`

- **Large reviewed issue body warning**
  - Unusually large reviewed starter-issue text
  - Expected status: `needs-review`
  - Expected category: `large-body`

- **Large generated issue set warning**
  - More than 10 starter issues in the reviewed issue set
  - Expected status: `needs-review`
  - Expected category: `large-issue-set`

- **Reviewed issue blocker**
  - GitHub-token-like value inside reviewed issue text
  - Expected status: `blocked`
  - Expected category: `credential-material`
  - Expected remediation: remove token-like material and use placeholders

- **Reviewed issue warning**
  - OAuth and production-deployment language inside reviewed issue text
  - Expected status: `needs-review`
  - Expected categories: `auth-flow-risk` and `production-impact`

## Remediation coverage

The fixture suite asserts that every finding produced by the main safety fixture suite includes non-empty rider-facing remediation guidance.

The absolute-path suite additionally asserts that Unix, Windows drive-letter, and Windows UNC path blockers include explicit safe repo-relative path guidance.

The package-manifest suite asserts that package warnings and blockers include remediation and flow into the named `package-manifest-policy` check.

## CI relationship

The CI workflow runs:

```bash
npm run typecheck
npm run test:safety
```

This means the green check now verifies TypeScript validity, safety fixture behavior, package manifest fixture behavior, and remediation guidance coverage.

## Boundary

Safety fixtures are local deterministic checks.

They do not:

- Request OAuth.
- Read, store, or validate real tokens.
- Install dependencies.
- Contact a package registry.
- Create repositories.
- Push files.
- Open issues.
- Auto-repair findings.
- Prove a future repository is safe to publish.
- Grant write authority.

A passing fixture suite only confirms that the current safety scanner still recognizes the covered known-safe, warning, blocker, package-manifest, and remediation examples.

## Future fixture expansion

Future fixture waves should add coverage for:

- Credential-reference warning examples.
- Security disclosure warning examples.
- Privileged-operation warning examples.
- Receipt/policy-version coupling once receipt hashes exist.
- Local remediation preview helpers once remediation proposals exist.
