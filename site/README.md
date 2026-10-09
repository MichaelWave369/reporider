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
