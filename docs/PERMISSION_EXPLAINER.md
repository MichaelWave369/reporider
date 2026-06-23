# Permission Explainer

RepoRider's permission explainer is the first UI step on the path toward live GitHub write mode.

It is intentionally informational. It does not request OAuth, store tokens, create repositories, commit files, or open issues.

## Purpose

The permission explainer gives the rider a plain-language preview of what RepoRider may need later, before any live authorization surface exists.

It answers four questions:

1. What mode is active right now?
2. What future GitHub permission categories may be needed?
3. What gates must pass before live writes unlock?
4. What actions are explicitly not happening yet?

## Current state

The explainer currently states that:

- mock write mode remains active,
- no GitHub token is requested,
- no token is stored on device,
- no real repository, file, or issue write can run from the explainer.

## Future permission categories

The first live-mode path may eventually need permission to:

- confirm the GitHub account that authorized RepoRider,
- create a new repository after final rider approval,
- write only freshly approved starter files,
- open only freshly approved starter issues.

Exact OAuth scopes and provider details should be chosen only after the live-mode implementation plan is reviewed.

## Gates before live writes

Live writes stay blocked until these gates exist:

1. permission explainer reviewed by the rider,
2. OAuth capability model implemented,
3. secure token storage adapter reviewed,
4. safety scan upgraded for live writes,
5. all current files and issues freshly approved,
6. dry-run writer verified before real writer is enabled.

## Boundary

Explaining permissions is not consent to write.

A future login button, OAuth redirect, token storage adapter, repository writer, file writer, issue writer, and receipt expansion must each be implemented behind separate gates.

Saved drafts, imports, restored rides, archived slots, pinned slots, labels, and receipts must never become write authority by themselves.

## Related docs

- `docs/OAUTH_WRITE_MODE_ARCHITECTURE.md`
- `docs/GITHUB_WRITE_BOUNDARY.md`
- `docs/APPROVAL_RECEIPT_PREVIEW.md`
- `docs/MARKDOWN_RIDE_RECEIPT.md`
