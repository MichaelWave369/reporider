# Starter Issue Approval Gate

RepoRider treats starter GitHub issues as reviewed artifacts, not invisible side effects.

Before a create action can run, the rider can inspect, edit, and approve each planned starter issue.

## What can be edited

Each starter issue draft includes:

- Title
- Body
- Labels

The generated issue plan remains the baseline. Rider edits are stored as a reviewed draft overlay.

## Approval model

Issue approvals are content-sensitive.

An approval is tied to the current issue draft fingerprint:

- Issue slot
- Title length and content
- Body length and content
- Normalized label list

If the rider edits the title, body, or labels after approval, the approval becomes stale and the issue must be approved again.

## Mock mode behavior

In mock mode, RepoRider does not open real GitHub issues.

The mock writer receives the reviewed issue drafts and reports which issue titles would be queued after repository creation.

## Live mode contract

When live GitHub writes exist, RepoRider must use the reviewed issue drafts exactly.

The live writer must not regenerate issue titles, bodies, or labels behind the rider's back.

Core rule:

> What the rider approved is what RepoRider opens.

## Why this matters

Starter issues can shape project direction just as much as starter files.

RepoRider should not silently create public roadmap claims, sensitive task names, or misleading labels without human review.
