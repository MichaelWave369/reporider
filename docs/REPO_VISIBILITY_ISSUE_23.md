# GitHub Issue #23: Repo Visibility Education and Public Confirmation

**Resolution:** user-visible education and explicit public confirmation for the Expo native and React GitPage **mock** creator, backed by a central mock-writer guard.

## What happens

- **Private (recommended):** Starter plans default to private unless the idea or operator settings select public. The interface explains that only granted users typically see private repositories, subject to organization/platform access policies.
- **Public:** The interface explains that anyone can browse, clone, copy and redistribute the code and history. Never include tokens, secrets, personal information or unpublished work.
- **Separate confirmation:** Public plans require a distinct checkbox in the final mock-ride panel. This is NOT the same as approving generated files/issues or acknowledging mock mode.
- **Freshness:** In React GitPage, changing the idea, repo name, visibility, stack or issue count resets the public confirmation along with existing artifact approvals. In Expo, changes to the plan or reviewed artifact set reset confirmation.
- **Enforcement:** Both UIs disable their mock-create action until public confirmation is present. The shared `createMockGitHubRepository` function also refuses public plans without `publicVisibilityConfirmed: true`, including direct caller bypass.
- **Mock only:** This is a rehearsal for the future real writer. There is still no OAuth flow, token custody or actual GitHub repository creation. The separate authenticated live write gate remains a distinct future issue and must enforce its own permission and confirmation checks.

## Acceptance mapping

- Explain public means anyone can view it: **implemented** in both app surfaces.
- Explain private access: **implemented** with relevant organizational caveats.
- Recommend private: **already present and clarified**.
- Require extra confirmation for public generated repos: **implemented for mock-only flows**, enforced in shared writer. Actual live creates cannot happen in this build.

## Tests

Run `npm run test:safety` to validate private/public confirmation controls, nonboolean/truthy bypass attempts, refusal of a public mock creation without separate explicit consent, retained artifact approval gate, and successful private/public mock demo with correct permissions. Existing Expo TypeScript, full agent/MCP CI, and React Pages build remain required. No public GitHub write authority is introduced.

**PR references issue #23 and closes it on merge** for the currently supported product (mock-only). When live GitHub mode eventually exists, its separate authorization requirements must be implemented and independently tested.
