@AGENTS.md

# Milio — engineering context

**Handoff package:** `~/Documents/pessoais/handoff 3/`
**Build playbook:** `~/Documents/pessoais/handoff 3/build-order.md` — read this before every commit.
**Screenshots:** `~/Documents/pessoais/milio/screenshots/` (also in `handoff 3/screenshots/`)

## Current stage

**Stage 1 in progress** — Auth + identity.
Stage 0 (domain layer) is complete: 101 tests green.

See `handoff 3/build-order.md` for the full 15-stage dependency chain.
Start at the lowest-numbered stage that isn't done and work bottom-up.

## Key commands

```bash
pnpm test:domain      # vitest — pure domain tests (fast, ~300ms)
pnpm test             # jest   — integration tests (component-level)
pnpm typecheck        # tsc --noEmit
```

A stage is done when:
1. Every `.feature` file listed under "Features green" in `build-order.md` passes.
2. The end-to-end demo in `build-order.md` works on the simulator.
3. All earlier stages still pass.

## Architecture rules

- `src/domain/` is pure TS — no React, no RN, no expo imports. Lint enforces this.
- Domain tests → Vitest (`pnpm test:domain`).
- Integration tests (component rendering) → Jest (`pnpm test`).
- Feature files live in `src/features/*/` and have a header block stating their build stage.
- All UI strings go through `t()` — no hardcoded text in JSX.
