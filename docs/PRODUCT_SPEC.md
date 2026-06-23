# RepoRider Product Spec

## One-line promise

RepoRider turns a rough mobile idea into a reviewed GitHub starter repo with safe defaults and human-readable receipts.

## Target users

- Builders with ideas away from their desk
- Beginners who find GitHub setup intimidating on a phone
- Developers who want a fast capture-to-repo flow
- Teams that want early project structure without opening a full IDE

## Primary job to be done

When inspiration hits, the user should be able to capture the idea, shape it into a repo plan, review the generated starter files, approve the GitHub action, and leave with a real repository plus a next-step roadmap.

## MVP journey

1. Capture an idea by typing or using device dictation.
2. Convert the idea into a structured project brief.
3. Generate a repo plan with name, description, visibility, stack, starter files, and next issues.
4. Run a safety scan against generated content.
5. Ask for explicit user approval before creating anything on GitHub.
6. Create the repo and starter commit.
7. Write a receipt trail that explains what happened.

## Non-goals for MVP

- Full mobile IDE
- Blind AI commits
- Background autonomous repository changes
- Production secret management
- Complex CI/CD deployment orchestration

## Opinionated defaults

- Recommend private repos for early ideas.
- Never include secrets in generated files.
- Show diffs before writes.
- Commit to a branch first when editing an existing repo.
- Keep language beginner-friendly.
- Preserve a clear receipt trail.

## Success metrics

- Time from idea capture to repo plan under one minute.
- User can understand every planned GitHub action before approving.
- Generated repos include README, license, gitignore, starter files, and next issues.
- Safety scan blocks obvious secrets and risky generated content.

## Future lanes

- GitHub OAuth and secure token storage
- Voice capture with transcription history
- Template library for common stacks
- Offline idea drafts
- Repo health dashboard
- Netlify/Vercel deployment hooks
- Codex/Copilot handoff mode
