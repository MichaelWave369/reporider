# RepoRider

**Catch the idea. Forge the repo. Ride the build.**

RepoRider is a mobile-first, voice-friendly GitHub creation assistant for builders who get ideas while they are away from the desk.

The goal is simple:

> Speak an idea on your phone, review the repo plan, approve the files, and publish a safe starter repository with receipts.

## What this skeleton includes

- Expo + React Native + TypeScript starter app
- Phone-first project capture flow
- Repo plan preview model
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
3. **Plan** — user reviews repo name, visibility, stack, files, and next issues.
4. **Guard** — safety checks catch secrets, dangerous file names, and risky defaults.
5. **Approve** — human approval unlocks the ride.
6. **Create** — approved starter files are pushed to GitHub once live mode exists.
7. **Receipt** — every action gets a human-readable audit trail.

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

## Product principle

RepoRider should feel like a friendly pocket forge, not a complicated developer console.

No idea left uncommitted.

## License

MIT © 2026 Michael Hughes
