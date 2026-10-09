# RR-A01: Agent-Native Headless Planner

**Status: local, bounded, no-authority adapter.** This is a programmatic interface to RepoRider's original TypeScript planner, file/issue generator, policy scanner and content fingerprint helpers. It is **not** a remote service, an MCP server, a GitHub app, a credential broker, a queue, or a live repository writer.

## Build and run

From the root checkout, with Node.js 18+ and npm dependencies installed:

```sh
npm install
npm run agent:test
npm run agent:build
node scripts/reporider-agent.cjs < examples/agent-request.json
```

For Windows PowerShell:

```powershell
Get-Content .\examples\agent-request.json -Raw | node .\scripts\reporider-agent.cjs
```

The command reads **one UTF-8 JSON object** from stdin (65,536-byte maximum), emits exactly **one machine-readable JSON object** to stdout, and exits. It does not read the filesystem for requests, send network calls, persist state, launch background work or accept GitHub tokens. The build step writes compiled **local** JavaScript under ignored `.agent-build/`, separate from the protocol's external-effects boundary.

Use `npm run agent:test` to compile and run isolated agent rail fixtures, including malformed, duplicate-key, token-marker, unknown-path, stale-approval, out-of-scope and unsafe-content failures. Existing mobile CI safety tests remain intact and run alongside RR-A01.

## Request protocol

Use [request.schema.json](../contracts/agent/v0.1/request.schema.json) and [response.schema.json](../contracts/agent/v0.1/response.schema.json) for the versioned wire shape.

```json
{
  "schema": "reporider.agent.request.v0.1",
  "action": "preview",
  "idea": "Create a private React Vite checklist app",
  "overrides": {"visibility":"private","stack":"react-vite","issueCount":3}
}
```

The `action` selector supports:

| Action | Meaning | Side effects |
| --- | --- | --- |
| `plan` | Existing repo name/stack/visibility/file/issue plan and summary | None |
| `preview` | Generated file and issue contents, with non-authenticating fingerprints | None |
| `scan` | Existing safety policy checks, findings and required gates | None |
| `dry_run` | Report missing human approval/live-write gates; **never** a real write | None |
| `submit_for_review` | Emit a candidate in-band `review_packet` for separate human presentation | **Not dispatched** |

`edits.files[]` may change only the **existing planned paths**, and `edits.issues[]` only an existing zero-based issue index. No extra files or issues are introduced by RR-A01. Each supplied edit is validated, bounded, scanned and reflected in a changed package fingerprint.

**Visibility is always private by default in agent mode**, regardless of words like "public" in the prompt. Public is only an explicitly requested *draft plan*, not permission to publish.

## Non-authority contract

Every result includes:

```json
{
  "mode":"mock_only",
  "authority_granted":false,
  "action_executed":false,
  "repository_created":false,
  "notification_sent":false,
  "memory_admitted":false,
  "review_dispatched":false,
  "source_identity_verified":false
}
```

Responses are `REVIEW_REQUIRED` or `BLOCKED`, never approved/executed. Unknown schema, action, key, file path, issue index, malformed JSON, duplicate JSON object keys, possible credential literals, excessive input, duplicate edits or unsafe content fail closed. The reply never echoes raw invalid input.

`submit_for_review` has an intentionally restrained name: it only **prepares** an in-band packet (`delivery=CALLER_HANDOFF_REQUIRED`). It does not contact a user, dispatch a workflow, open an issue, store review records or authenticate any recipient. The caller must use a separately reviewed UI/handoff process. Fingerprints from the existing helper are **short non-cryptographic consistency checks**, not signatures, proof of origin or human approval.

These results do not carry OAuth, tokens, permission grants, leases, execution instructions, or authorization for a later request. Future live GitHub writes must be independently gated using the architecture in [OAUTH_WRITE_MODE_ARCHITECTURE.md](OAUTH_WRITE_MODE_ARCHITECTURE.md).

## Integration concept

A model or agent may invoke the one-shot CLI from an explicitly user-approved local application, parse the strict JSON response, and present the proposal for a person to review. **Do not expose this process to untrusted remote agents without separate sandboxing and a trusted identity/permission boundary.** Any MCP wrapper comes later (RR-A02) and should merely expose the already reviewed, no-authority functions. It must not add GitHub tokens, workspace writes or pretend that a model proposal can authenticate a human.

## Deliberate limitations

- Current generation is the original local deterministic starter-template system, not autonomous multi-file AI coding.
- Safety policy checks are heuristic and cannot certify that generated code is safe.
- The protocol cannot transfer current approvals between agents or prove a particular human approved a result.
- The CLI has no state continuity or durable request history; every call re-evaluates the current request.
- `dry_run` only describes a **hypothetical** write package. It does not invoke the Expo mock writer and does not assert that live authorization is available.
- Full code-execution sandboxing, real human queue integration and live OAuth write mode are future, separate rungs.
