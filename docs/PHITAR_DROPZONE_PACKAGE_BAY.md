# RR × PhiTar × Drop Zone: Local Package Bay (v0.1)

RepoRider's GitHub Pages frontend has a **Package Bay** navigation item. After a rider completes the **current** review, starter-file and starter-issue approvals, safety gate and **mock** ride, the rider may explicitly download a **local starter ZIP** to open using PhiTar or the Drop Zone builder.

## Why this boundary matters

RepoRider remains **mock-only**, including the Expo application and the public GitHub Pages frontend. There is no GitHub OAuth, no GitHub repository creation, no file pushes, no issue creation, no remote uploads, no Netlify/Parallax integration and no background transfer. The browser creates the ZIP from reviewed text drafts only, on a user button press. The workflow is not an execution or publishing approval.

## Rider instructions

1. In RepoRider's **Idea Garage**, select a project name, stack and planned repository visibility.
2. Go through the **Review Pit** and explicitly approve each currently generated/edited file and issue. Resolve safety blockers.
3. Complete the **mock** Ride Console. The mock result's example GitHub URL remains fictional.
4. Enter **Package Bay**, review its local-only boundary, then click **Export Approved Starter ZIP**.
5. RepoRider downloads `<repo-name>-reporider-starter.zip` and displays the SHA-256 digest of the exact ZIP bytes for optional manual copying.
6. Open `https://michaelwave369.github.io/DropZone/phitar.html` and **choose the downloaded ZIP yourself**. PhiTar can inspect it and, where supported, extract it locally.
7. Alternatively open `https://michaelwave369.github.io/DropZone/` and select that ZIP as source to inspect and prepare a platform build kit. A build kit is not a compiled installer. The project stack must be compatible with Drop Zone's recognized source formats and may need manual development.

No file, file path, token, hash, or metadata is passed in the links. The user explicitly chooses which downloaded file to open. Avoid putting secrets in a public Pages workflow.

## Archive contract

`reporider.phitar-handoff.v1` uses JSZip with standard DEFLATE ZIP; reviewed starter files stay at **ZIP root** so normal importers can recognize `package.json`, `README.md`, source folders etc. Extra context is under a reserved `__reporider_handoff__/` directory:

- `manifest.json`: actual filenames, byte sizes, per-file SHA-256 checksums, planned visibility and stack, safety status/policy version, local approval fingerprints, and trust warnings.
- `issue-drafts.json`: issue titles, bodies and labels recorded as **drafts**, not GitHub issues.
- `mock-ride-receipt.json`: non-authoritative mock receipt chain reference and fictional example GitHub URL, not real creation proof.

Standalone archive SHA-256 is computed after ZIP generation and shown in RepoRider, but **not embedded inside its own ZIP** (which would create a circular checksum dependency). Copy it from the page if you want an out-of-band comparison. The included per-file checksums verify bytes, not safety or provenance.

## Approval safety rules

- The Export button remains disabled unless *all current* starter files and issues have been approved, no safety blockers remain, and a mock result for the **same** files, issues, plan and safety policy matches RepoRider's recalculated artifact fingerprints.
- Editing any current starter file or issue invalidates the completed mock result and thus the export gate.
- All source paths are revalidated; traversal, absolute/drive paths, reserved device names, alternate-data-stream syntax, duplicate paths, source file/directory collisions and collisions with `__reporider_handoff__/` are rejected.
- At most **100 source files** and **8 MiB** total ZIP bytes; starter bytes/metadata are capped before building. No file is executed or fetched.
- The SHA-256 digest checks byte identity. It cannot prove the origin of the archive or the safety of its scripts.

## Tested, not claimed

Automated tests check mock-only gating, approvals becoming stale, blocked safety, malformed paths, duplicate and file/directory collisions, ZIP structure and checksum behavior. The Pages CI runs them as part of `site/npm test`.

**Not included:** direct browser-to-browser transfer, live GitHub publishing, generation of compiled applications, automated PhiTar opening, or any changes to RepoRider's local MCP/agent or native Expo permission policies.