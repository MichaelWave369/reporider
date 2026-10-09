# RR-A04: Local Proposal Courier

**Status:** optional local-only MCP file-inbox bridge. Default MCP behavior remains **read-only and mock-only**.

RR-A04 connects the agent planner with the human Review Desk, **without** pretending the public GitPage has direct authority over your PC. The agent may save a bounded, locally replayable review packet in a directory you explicitly prepare. A human must open that file using the new **Open local .json packet** control inside the Agent Review Desk. There is no browser-to-localhost socket, remote relay, polling, upload, persistent browser database, OAuth, code execution, GitHub write, or human-approval shortcut.

## 1. Opt-in on your local machine

The courier is **OFF** unless both of these environment variables are set for the local RepoRider MCP server process:

- `REPORIDER_COURIER_ENABLED=1`
- `REPORIDER_COURIER_INBOX=<absolute existing private directory>`

Example in Windows PowerShell, inside your RepoRider clone:

```powershell
npm install
npm run agent:build

$inbox = Join-Path $HOME 'RepoRiderInbox'
New-Item -ItemType Directory -Path $inbox -Force | Out-Null

$env:REPORIDER_COURIER_ENABLED = '1'
$env:REPORIDER_COURIER_INBOX = $inbox
npm run mcp:test
npm run mcp:serve
```

These are **session-scoped** environment variables in that PowerShell window. For an MCP app that launches RepoRider itself, configure the same settings in that *app's local MCP server environment configuration*. The terminal command is a standalone stdio server and is not an interactive CLI. Do not put it on the public internet.

**Windows folder ACLs:** Creating a directory under your home folder normally inherits its existing Windows permissions; confirm the folder is private if other local accounts share your machine. The package requests owner-only new-file permissions where the platform supports it, but **does not configure or verify Windows ACLs**.

Example Linux/macOS:

```sh
mkdir -p "$HOME/RepoRiderInbox"
chmod 700 "$HOME/RepoRiderInbox"
export REPORIDER_COURIER_ENABLED=1
export REPORIDER_COURIER_INBOX="$HOME/RepoRiderInbox"
npm run agent:build
npm run mcp:serve
```

The directory must exist before server startup, must be an actual directory (not a symlink), and must have no group/other write permission on Unix. Paths containing symlinked parents are refused. **The server will not create the directory for the agent.**

## 2. Agent tool discovery

When disabled, the MCP server exposes its original **five** RR-A02 tools and performs **no inbox writes**. When explicitly enabled, a sixth tool is discovered:

`reporider_enqueue_review`

The tool accepts the same bounded `idea`, `overrides`, and `edits` arguments as the planner. It does not accept output paths, filenames, arbitrary files, secrets, GitHub tokens, approval objects, or an existing review result. Internally it calls RR-A01 **submit_for_review** using the original planner and safety scanner. A blocked draft cannot enter the queue.

The MCP tool is correctly marked as **not read-only**. This is the only side effect: a local JSON file with a random system-generated name is stored in the owner-selected directory. The receipt includes the basename and proposal consistency fingerprint. The reply explicitly states no person was notified, no agent identity was authenticated, and no GitHub write was authorized.

Security controls:
- Random UUID filename, exclusive file creation and no agent-defined path
- Bounded JSON packet at most **250000 bytes**
- Maximum **24** matching courier packets in the inbox (not an unlimited storage queue)
- Default local user-only file creation mode on Unix, and existing-ACL behavior on Windows
- Revalidate directory type and canonical path before each write
- No hidden retries, no deletion, no automatic cleanup, no socket or network access
- No approved status and no execution authority, ever

The inbox is not a trusted agent authentication system. A local account permitted to launch the MCP server may submit proposals. The operator still decides what to inspect.

## 3. Human handoff

Visit [RepoRider Pages](https://michaelwave369.github.io/reporider/) and open **Agent Review Desk**.

1. Select **Open local .json packet**.
2. Choose a file named `reporider-review-<uuid>.json` from your local inbox.
3. The browser reads the JSON as local text and replays it through the same planner and safety policy. It rejects blocked, tampered, or non-replayable packets. A matching replay verifies internal consistency, not source identity.
4. Inspect each file and issue and record an **informational** recommendation, request changes, or decline.
5. Export the review note if useful. It remains `approval_granted=false`, `live_write_authorized=false`, and `executed=false`.

Packets are **not** automatically removed from your inbox. You control retention and manually delete reviewed packets. Avoid submitting private files, tokens, or sensitive personal information: the static browser app doesn't upload them, but the model or MCP client used to create them may have its own logging/storage rules.

## 4. Verify

```sh
npm run agent:test
npm run mcp:test
cd site
npm install
npm run build
```

The RR-A04 smoke suite launches the actual MCP server twice, with and without explicit opt-in, and checks discovery, actual local file creation, packet integrity, blocked-draft refusal, unplanned path refusal, capacity limits, and missing/insecure path controls. The original RR-A01, RR-A02 and RR-A03 tests still run in CI.

## Explicit non-goals

- No local web service, CORS bridge, localhost port, browser polling, browser data persistence or automatic GitPage handoff.
- No authenticated queue or provenance guarantee.
- No GitHub repository creation, token handling, model execution, notification of the human, or agent-approved execution.
- No background agent task scheduling or automatic review promotion.

An optional future rung can add a trusted local review application with real authentication, durable receipts, explicit retention policy, and independent human sign-off. RR-A04 stays a **small, inspectable local side-effect boundary**.
