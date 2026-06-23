# RepoRider Architecture

RepoRider is designed as a small, phone-first system with clear boundaries between capture, planning, safety, approval, GitHub execution, and receipts.

## Layers

### 1. Capture layer

Collects raw user intent from typed input, device dictation, pasted text, screenshots, or later native voice transcription.

Current skeleton:

- `src/components/IdeaCapture.tsx`

### 2. Planning layer

Turns the raw idea into a structured `RepoPlan`.

Current skeleton:

- `src/lib/repoPlanner.ts`
- `src/types.ts`

### 3. Safety layer

Checks generated files and actions before any GitHub write. MVP checks should focus on obvious secrets, risky filenames, unclear visibility, and unsafe automation defaults.

Current skeleton:

- `src/lib/safetyScan.ts`

### 4. Approval layer

Requires the user to review the repo plan and explicitly approve before any remote mutation.

Future components:

- Diff preview
- Permission explanation
- GitHub action summary

### 5. GitHub adapter layer

Will wrap GitHub API operations behind small commands:

- Create repository
- Create branch
- Create/update files
- Open issues
- Open draft pull request
- Fetch repo metadata

Future path suggestion:

- `src/lib/github/client.ts`
- `src/lib/github/actions.ts`

### 6. Receipt layer

Records every meaningful action in human-readable form.

Current skeleton:

- `src/lib/receiptLedger.ts`
- `src/components/ReceiptTimeline.tsx`

## Safety-first execution model

```text
Idea -> Plan -> Safety Scan -> Human Approval -> GitHub Write -> Receipt
```

RepoRider should never silently skip the approval step.

## Data model anchors

- `RepoPlan`: proposed repo name, description, visibility, stack, files, and issues
- `SafetyFinding`: warnings or blockers discovered before execution
- `RepoReceipt`: event trail for user-visible accountability

## Local-first principle

Early idea drafts should be safe to create without network access. GitHub actions should only happen after explicit approval and connection state checks.

## Open architecture questions

- Native app versus Expo-first long-term
- Direct GitHub REST from app versus small backend broker
- Storage choice for local draft queue
- Whether advanced AI generation happens locally, through a hosted model, or through user-provided provider keys
