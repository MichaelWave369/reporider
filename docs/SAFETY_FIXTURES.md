# Safety Fixture Coverage

RepoRider includes a lightweight local safety fixture suite for the safety policy gate.

The suite exercises known-safe, warning, blocker, absolute-path, package-manifest, remediation, receipt policy-coupling, and receipt fingerprint examples without adding a heavyweight test framework.

## Current command

```bash
npm run test:safety
```

This command:

1. Compiles only the safety scanner, shared types, supporting local writer/receipt modules, and fixture files with `tsconfig.safety-tests.json`.
2. Runs the compiled fixture files with Node.
3. Deletes the temporary `.safety-test-build/` output directory.

## Current fixture buckets

The current fixture suite covers:

- **Known-safe package**
  - Private repo
  - Safe file path
  - Safe reviewed file content
  - Safe reviewed issue text
  - Safe `package.json` manifest with `private: true`, explicit license, and exact dependency pins
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

- **Absolute path blockers**
  - Unix root paths, Windows drive-letter paths, and Windows UNC paths
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

- **Empty / large reviewed file warnings**
  - Empty reviewed starter-file content
  - Unusually large reviewed starter-file content
  - Expected status: `needs-review`
  - Expected categories: `empty-content` and `large-content`

- **Reviewed file content risk**
  - Private-key-like block in reviewed starter-file content
  - Remote script piped into shell in reviewed starter-file content
  - Expected statuses: `blocked` or `needs-review`
  - Expected categories: `credential-material` and `remote-execution`

- **Package manifest pass**
  - Safe reviewed `package.json` with simple local scripts, `private: true`, explicit license, and pinned registry dependency
  - Expected status: `pass`
  - Expected named check: `package-manifest-policy` is `pass`

- **Package lifecycle hook warning**
  - `postinstall`, `install`, `preinstall`, `prepare`, or publish lifecycle scripts
  - Expected status: `needs-review`
  - Expected category: `package-lifecycle-hook`
  - Expected named check: `package-manifest-policy` is `warning`

- **Package script blocker**
  - Package script with remote shell pipe, destructive root command, or broad permissions
  - Expected status: `blocked`
  - Expected category: `package-script-risk`
  - Expected named check: `package-manifest-policy` is `blocker`

- **Package-manager command warning**
  - Package script using global installs, force installs/audit fix, or `npx` execution
  - Expected status: `needs-review`
  - Expected category: `package-manager-command-risk`

- **Package dependency name warning**
  - Dependency names with suspicious or credential-like wording
  - Expected status: `needs-review`
  - Expected category: `package-dependency-name-risk`

- **Package dependency source warning**
  - Dependency versions using `git+`, `github:`, `file:`, or URL sources
  - Expected status: `needs-review`
  - Expected category: `package-dependency-source-risk`

- **Package license warning**
  - Missing or blank `license` field
  - Expected status: `needs-review`
  - Expected category: `package-license-review`

- **Package private / visibility mismatch warning**
  - Private repo package not marked `private: true`
  - Public repo package marked `private: true`
  - Expected status: `needs-review`
  - Expected category: `package-private-visibility-risk`

- **Package dependency range warning**
  - Caret, tilde, wildcard, `latest`, `next`, canary, or inequality dependency ranges
  - Expected status: `needs-review`
  - Expected category: `package-dependency-range-risk`

- **Package manifest parse warning**
  - Invalid `package.json` content
  - Expected status: `needs-review`
  - Expected category: `package-manifest-parse`

- **Empty / large reviewed issue warnings**
  - Empty reviewed starter-issue body
  - Unusually large reviewed starter-issue text
  - More than 10 starter issues in the reviewed issue set
  - Expected status: `needs-review`
  - Expected categories: `empty-body`, `large-body`, and `large-issue-set`

- **Reviewed issue risk**
  - GitHub-token-like value inside reviewed issue text
  - OAuth and production-deployment language inside reviewed issue text
  - Expected statuses: `blocked` or `needs-review`
  - Expected categories: `credential-material`, `auth-flow-risk`, and `production-impact`

- **Receipt policy coupling**
  - Seed receipts carry the active safety policy version and safety status
  - Dry-run summaries carry the active safety policy version and safety status
  - Mock-create summaries carry safety status, warning count, and blocker count
  - Mock-create receipts carry receipt-level safety policy metadata
  - Markdown ride receipt export includes policy version, safety status, warnings, blockers, and receipt-level policy metadata

- **Receipt fingerprint coupling**
  - Seed receipts carry a seed artifact fingerprint
  - Dry-run summaries carry approved-file, approved-issue, receipt-preview, and ride artifact fingerprints
  - Mock-create summaries carry approved-file, approved-issue, ride artifact, and receipt-chain fingerprints
  - Mock-create receipts carry artifact fingerprints, previous receipt hashes, and receipt hashes
  - Markdown ride receipt export includes ride artifact, approved file, approved issue, receipt chain, and per-receipt hash metadata
  - Expected hash prefixes: `seed-`, `files-`, `issues-`, `ride-`, `receipt-preview-`, and `receipt-`

## Remediation coverage

The fixture suite asserts that every finding produced by the main safety fixture suite includes non-empty rider-facing remediation guidance.

The absolute-path suite additionally asserts that Unix, Windows drive-letter, and Windows UNC path blockers include explicit safe repo-relative path guidance.

The package-manifest suite asserts that package warnings and blockers include remediation and flow into the named `package-manifest-policy` check.

The receipt-policy suite asserts that safety policy version/status metadata flows through seed receipts, dry-run summaries, mock-create summaries, mock-create receipts, and Markdown exports.

The receipt fingerprint suite asserts that approved artifact fingerprints and receipt-chain hashes flow through dry-run summaries, mock-create summaries, mock-create receipts, and Markdown exports.

## CI relationship

The CI workflow runs:

```bash
npm run typecheck
npm run test:safety
```

This means the green check now verifies TypeScript validity, safety fixture behavior, package manifest fixture behavior, package license/source/range review behavior, remediation guidance coverage, receipt policy-coupling behavior, and receipt fingerprint/chain behavior.

## Boundary

Safety fixtures are local deterministic checks.

They do not:

- Request OAuth.
- Read, store, or validate real tokens.
- Install dependencies.
- Resolve dependency versions.
- Validate external license compatibility.
- Contact a package registry.
- Create repositories.
- Push files.
- Open issues.
- Auto-repair findings.
- Prove a future repository is safe to publish.
- Cryptographically sign receipts.
- Anchor receipt hashes to a remote ledger.
- Grant write authority.

A passing fixture suite only confirms that the current safety scanner still recognizes the covered known-safe, warning, blocker, package-manifest, remediation, receipt policy-coupling, and receipt fingerprint examples.

## Future fixture expansion

Future fixture waves should add coverage for:

- Credential-reference warning examples.
- Security disclosure warning examples.
- Privileged-operation warning examples.
- Local remediation preview helpers once remediation proposals exist.
- Optional signed receipt envelopes if live-write authority is ever introduced.
