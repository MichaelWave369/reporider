# RR-A02: RepoRider MCP Agent Bridge

**Status:** local MCP stdio server, no authority or external effects. This is a compatibility adapter exposing the five already-reviewed RR-A01 agent rail operations to user-enabled MCP clients.

The bridge does **not** change the Expo app or the public GitHub Pages site, and neither automatically launches it.

## Requirements and startup

- Local checkout of RepoRider on a computer with Node.js 18+ and npm
- The host user explicitly configures a trusted MCP client to launch RepoRider
- No GitHub token, OAuth app, API key, cloud account, listening port, or external server

From the repository root:

\`\`\`sh
npm install
npm run agent:build
npm run mcp:test
npm run mcp:serve
\`\`\`

The last command starts an MCP stdio process. It is **not** an interactive shell: its stdin and stdout are newline-delimited JSON-RPC messages owned by your MCP client. It runs only while that local client keeps the subprocess open. A standalone terminal normally appears idle with no normal text output. To exit, close its stdin or stop the process.

## Example MCP client configuration

The exact configuration format depends on your MCP-enabled application. The following illustrates the common local subprocess shape. Replace the path with your actual cloned repository path, **not** a URL:

\`\`\`json
{
  "mcpServers": {
    "reporider": {
      "command": "node",
      "args": ["C:/path/to/reporider/scripts/reporider-mcp.cjs"]
    }
  }
}
\`\`\`

**Required first-time step:** run \`npm run agent:build\` from the cloned repository before enabling the client. The server reads the generated local CommonJS output under the ignored \`.agent-build/\` directory. No new runtime dependency is needed beyond the existing RepoRider installation.

### Discoverable tool names

| MCP tool | RR-A01 action | Real effects |
| --- | --- | --- |
| \`reporider_plan\` | \`plan\` | None |
| \`reporider_preview\` | \`preview\` | None |
| \`reporider_scan\` | \`scan\` | None |
| \`reporider_dry_run\` | \`dry_run\` | None |
| \`reporider_submit_for_review\` | \`submit_for_review\` | None; packet returned in the reply, **not** delivered |

Each takes an \`idea\` string plus optional \`overrides\` and \`edits\` under the RR-A01 contract. The input JSON Schema is derived directly from \`contracts/agent/v0.1/request.schema.json\` with \`schema\` and \`action\` supplied by the server. Unknown fields and any attempt to add live execution fields fail closed.

Responses carry the existing RR-A01 \`mock_only\` flags: \`authority_granted=false\`, \`action_executed=false\`, \`repository_created=false\`, \`review_dispatched=false\` and \`source_identity_verified=false\`. The MCP bridge exposes structured content **and** a text JSON representation for older clients. Safety-blocked requests return an MCP tool error result without exposing unsafe draft contents.

### Protocol compatibility

This minimal, auditable stdio transport implements:
- **Modern MCP \`2026-07-28\`**: \`server/discover\`, stateless per-request metadata, \`tools/list\`, \`tools/call\`, and \`ping\` responses. Modern tool responses use \`resultType=complete\`.
- **Legacy MCP \`2025-11-25\`**: \`initialize\` handshake, \`notifications/initialized\`, \`tools/list\`, \`tools/call\`, and \`ping\`.
- One valid JSON-RPC message per newline on stdin and stdout; a maximum inbound line length, bounded request complexity, duplicate-key rejection, and never any non-MCP messages on stdout.
- No prompts, resources, subscription streams, sampling, elicitation, progress messages, tasks or server-to-client requests.

This implementation is deliberately small and is **not** a full substitute for the official MCP SDK. Client implementations vary; test your chosen client before relying on it. No MCP integration is considered deployed until tested through a user-authorized local client.

## Authority and privacy boundary

**MCP discovery is not permission to write to GitHub.** The client controls if and when a model may invoke these tools. RepoRider's rail performs its own schema validation, private-by-default planning, bounded artifact edits, risk checks, and no-authority response generation.

- No filesystem access from tool inputs: no path read, repo creation, git commands or file writes.
- No network access (not even GitHub metadata lookup).
- No token storage or credentials. Do not paste API keys, passwords, keys or private work documents into a model's tool prompt. Local MCP clients may log tool inputs or results according to *their* separate policies.
- No automatic human notification, queue insertion, FieldDeck dispatch or promotion to a trusted executable. \`submit_for_review\` returns the packet to the caller.
- Mock safety scanners are heuristics. The returned fingerprints are **not cryptographic signatures or human consent**.
- Any future authenticated GitHub writer must live behind a separate reviewed service and require fresh per-artifact human approval and execution-time verification.

## Verification

\`\`\`sh
npm run mcp:test
\`\`\`

The subprocess smoke suite checks modern discovery, legacy handshake, the fixed five-tool catalog, actual native rail calls, content blocking, unknown-tool rejection, unknown-field rejection, malformed and duplicate-key JSON rejection, oversized framing rejection, and a strict stdout boundary.

Follow-up **RR-A03** could add a host-owned human review queue via a separate, explicitly approved adapter. This PR does not create one.
