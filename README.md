# RepoRider

**Catch the idea. Forge the repo. Ride the build.**

RepoRider is a mobile-first, voice-friendly GitHub creation assistant for builders who get ideas while they are away from the desk.

The goal is simple:

> Speak an idea on your phone, review the repo plan, steer the final settings, approve the files, and publish a safe starter repository with receipts.

## What this skeleton includes

- Expo + React Native + TypeScript starter app
- Phone-first project capture flow
- Live idea-to-repo planner
- Editable repo name, visibility, stack, and starter issue controls
- Dynamic repo name, visibility, stack, file, and issue planning
- Safety scan placeholder for generated files
- Mock create-repo ride flow
- GitHub write boundary model
- Receipt ledger model for every meaningful action
- Product spec and architecture docs
- GitHub issue/PR templates
- Basic CI typecheck workflow
- MIT license

## Current mode

RepoRider currently runs in **mock write mode**.

That means the app can simulate the full ride from approval to repo creation without requesting a GitHub token, creating a real repository, pushing files, or opening issues. This lets us safely build the UX before live OAuth and GitHub writes exist.

## Core flow

1. **Capture** — user speaks or types a rough idea.
2. **Shape** — RepoRider turns it into a structured project brief.
3. **Steer** — user edits repo name, visibility, starter stack, and issue count.
4. **Plan** — user reviews repo files, starter issues, and safety status.
5. **Guard** — safety checks catch secrets, dangerous file names, and risky defaults.
6. **Approve** — human approval unlocks the ride.
7. **Create** — approved starter files are pushed to GitHub once live mode exists.
8. **Receipt** — every action gets a human-readable audit trail.

## Planner behavior

The current planner is local and deterministic. As the idea text changes, RepoRider regenerates the suggested repo plan, safety report, approval state, and receipt preview.

The rider can override the generated repo name, choose public or private visibility, switch starter stacks, and cap starter issue generation before approval. Editing the idea resets plan overrides so the suggestion and safety scan stay aligned.

It keeps repositories private by default, infers likely starter stacks from idea text, chooses starter files from the selected stack, and creates a small first issue set. It does not write to GitHub by itself.

## MVP scope

The first version is intentionally small:

- No full IDE.
- No blind commits.
- Private-first repo creation recommendation.
- Human approval before GitHub writes.
- Voice capture can begin as device dictation or typed notes.

## Development

```bash
npm install
npm run start
```

For TypeScript checks:

```bash
npm run typecheck
```

## Docs

- [Product Spec](docs/PRODUCT_SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [GitHub Write Boundary](docs/GITHUB_WRITE_BOUNDARY.md)
- [Planner](docs/PLANNER.md)

## Product principle

RepoRider should feel like a friendly pocket forge, not a complicated developer console.

No idea left uncommitted.

## License

MIT © 2026 Michael Hughes