# RepoRider static React showcase

The public site in this directory is a **mobile-friendly browser frontend** using RepoRider's **existing** planning, file generation, issue generation, safety scanner, content-sensitive approval fingerprints, mock writer, and receipt JSON modules. The source mobile application in the repository root is **Expo / React Native**, not replaced by this site.

## Public GitHub Pages address

https://michaelwave369.github.io/reporider/

GitHub Pages project paths are case-sensitive; the actual repository name is **reporider** (lowercase), even though the product is branded RepoRider.

## Develop locally

From this repo:

```sh
cd site
npm install
npm test
npm run dev
```

Build with `npm run build`. The Vite base is `/reporider/`, including the favicon, so paths work on GitHub project Pages. Vite compiles shared TypeScript from the parent project's `src/lib` without changing the mobile application.

## Publishing

1. Merge the pull request that adds `site/` and `.github/workflows/pages.yml`.
2. In **Settings → Pages → Build and deployment**, select **GitHub Actions**.
3. If a merge did not trigger the workflow, go to **Actions → RepoRider React GitHub Pages → Run workflow**.
4. Once the build and deploy jobs are green, open https://michaelwave369.github.io/reporider/.

Pull requests run the website's smoke tests and build, without deploying. The existing CI for the Expo app continues separately.

## What the public UI does

- Capture and steer a repo idea, selecting name, visibility, stack and issue count.
- Generate actual RepoRider file and issue previews, edit them, and approve their **current content-bound fingerprints** one by one.
- Run the existing deterministic safety scan, see warnings/blockers and their remediations.
- Inspect the original receipt preview and dry-run writer result.
- After reviewing every artifact and resolving all **blockers**, simulate a mock ride using the existing mock writer. Export the demonstration JSON receipt.

### Hard boundaries

- **No GitHub repo is created, no file pushed, no issue opened.** A result URL under `github.com/reporider-demo/` is a *fictional example*, not proof of creation or a link to a real repository.
- **No GitHub API, OAuth, token storage or external connector.** The site does not need or request credentials.
- **No private data persistence**. Inputs are in React state and disappear when the browser reloads or closes. The only intentional file output is a user-clicked local JSON download. The native app remains mock-only.
- The safety scan is heuristic, not an audit or proof of safety. Receipt fingerprints are local checks, not cryptographic signatures.
- Changing plan scope or editing an artifact resets or invalidates its approval. Completing a mock ride never grants permission for a future live write.
- No private or sensitive information should be entered in a public demo, even though this static UI never intentionally transmits form content.

This app does not install, compile or run generated starter files. Root `README.md` and the project's `docs/GITHUB_WRITE_BOUNDARY.md` govern later design for real GitHub writes.


## Agent Review Desk (RR-A03)

The Pages site includes an **Agent Review Desk**. Visitors can load a local synthetic sample or paste a RR-A01 review request/result or RR-A02 MCP response. The browser replays the original request through the native TypeScript planner/policy, rejects tampering and blocker findings, and shows file/issue drafts as untrusted inert text.

Reviewers may check individual artifacts and export a **non-authoritative, unsigned informational review note**. Nothing is uploaded or dispatched. A recommendation is not execution approval. See [RR-A03 docs](../docs/REVIEW_DESK_RR_A03.md).


## RR-A04 courier handoff

The **Agent Review Desk** now supports **Open local .json packet**, an explicit browser file picker. A human can select a JSON file from their privately configured local courier inbox and review it in the browser tab without uploading it.

The public Pages app cannot run the local MCP server, access the filesystem directly or silently receive agent submissions. See [RR-A04 local courier manual](../docs/LOCAL_PROPOSAL_COURIER_RR_A04.md) for optional user-controlled MCP configuration and safety limits.

## RR-A09 Audit Observatory

The GitPage sidebar includes **Audit Observatory**. It accepts a user-selected local JSON export from the RR-A08 operator audit CLI, visualizes the imported ledger/notes/inbox metadata and reported checkpoint status, and supports filters plus a synthetic demo.

The client validates structure and internal counts only. It **does not** recompute SHA-256 source hashes, independently inspect your offline ledger, verify checkpoint custody, authenticate humans/agents or grant any GitHub execution authority. All input stays in the tab, no uploads or persistent browser storage. See [RR-A09 documentation](../docs/AUDIT_OBSERVATORY_RR_A09.md).

## Issue #23: visibility education

The Idea Garage shows public/private access consequences. Public mock rides require a separate explicit checkbox in the Ride Console and the shared mock writer refuses unconfirmed public plans. Idea/plan changes reset the checkbox. No OAuth, tokens or GitHub writes are enabled.

## Accessibility baseline (issue #18)

The public site supports a skip-to-main keyboard shortcut, visible focus on controls, reduced motion, accessible explorer state, and mobile-sized targets on primary controls. The Expo UI now labels its primary editors and selection controls. Automated contrast/semantics checks are in `site/tests/accessibility.test.mjs`; manual assistive-tech, screen-reader and zoom testing remains required. [Full QA checklist](../docs/ACCESSIBILITY_BASELINE_ISSUE_18.md).
