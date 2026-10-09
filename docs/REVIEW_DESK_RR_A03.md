# RR-A03: Human Review Desk

**Type:** static React review surface plus shared TypeScript validation library.

**Authority:** none. No queue, server, GitHub writer, OAuth, secure token storage, identity verification, authenticated approval, or remote notification.

RR-A03 builds on RR-A01 and RR-A02. Agents prepare proposals via **submit_for_review**; a human can inspect those proposals on the public RepoRider GitPage after deliberately pasting a JSON packet. Nothing is delivered to the human automatically.

## Open the review desk

https://michaelwave369.github.io/reporider/

Select **Agent Review Desk** in the sidebar. You can load the fully synthetic local sample or paste a complete RR-A01 review response, raw review request, or an MCP tool-call response with structuredContent.

The page replays the bounded agent request through RepoRider's **actual deterministic planner and safety scanner**, rejects blocked drafts, and compares the **whole imported response** to a new local response for changes. It renders file and issue contents as inert text, not executable HTML or code.

**A matching replay does not authenticate the author, prove provenance, or certify safety.** A malicious client can generate a self-consistent packet.

## CLI preparation on Windows PowerShell

From the RepoRider checkout:

    git pull origin main
    npm install
    npm run agent:build
    Get-Content .\examples\agent-review-request.json -Raw | node .\scripts\reporider-agent.cjs

Paste the complete single-line JSON result into the Review Desk.

The new RR-A01 review packet carries its original bounded **proposal_request** for fresh replay. Older packets missing that field are refused with REPLAY_REQUIRED; regenerate them or submit the original complete review request. No other live RR-A01 command acquires write authority.

## Review and export

After importing a consistent zero-blocker proposal, inspect every generated file and issue. Each has a checkbox confirming manual examination of that **exact draft**. The policy panel shows the actual native heuristic findings. Three informational outcomes are available:

- Recommend for separate authorization, only when every file and issue is checked.
- Request changes.
- Decline proposal.

You can copy or download the resulting JSON note. There is no localStorage or persistent queue. The note always includes source_identity_authenticated=false, reviewer_identity_authenticated=false, signature_verified=false, approval_granted=false, live_write_authorized=false, executed=false and delivered=false.

**The local note is not an approval token.** A future trusted executor requires explicit authenticated human approval of the exact artifacts and execution-time revalidation. RR-A03 does not provide that executor.

## Validate

    npm run agent:test
    cd site
    npm install
    npm run build

The RR-A03 fixture suite covers request and MCP result replay, tamper detection, missing inputs, unsafe/blocker imports, refusal of forged authority flags, checking every artifact before a positive recommendation, and permanent non-authority of exported notes.

Future rungs may add an opt-in local handoff bridge only behind independently reviewed transport, authentication, and security boundaries.
