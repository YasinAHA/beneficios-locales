<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project rules — beneficios-locales

## Package manager

- Use `pnpm` only.
- Do not introduce npm or yarn lockfiles.

## Architecture

- Keep domain logic independent from Next.js, Prisma, and UI concerns.
- The eligibility engine lives in `src/domain/eligibility` and is pure TypeScript.
- Do not modify the eligibility engine semantics unless the task explicitly requires it.
- Database-to-domain translation belongs in the service/mapper layer.

## Eligibility rules

- Rules inside a `GrupoRegla` use the group's `AND` or `OR` operator.
- Sibling `GrupoRegla` instances are combined with implicit `AND`.
- Zero eligibility groups means `MATCH`.
- An empty rule group is invalid.
- Multiple benefit tranches may match simultaneously.
- `TramoBeneficio` may represent economic variants or alternative legal pathways to the same result.
- Each pathway must be faithfully representable with the existing rules and groups.
- Multiple matching tranches do not imply an economic sum; do not add their results together.
- The current rule model must not be treated as supporting arbitrary nested boolean expressions.
- In particular, do not represent `(A AND B) OR (C AND D)` unless the model explicitly supports it.
- If a fiscal requirement cannot be represented faithfully, report the limitation instead of approximating it.

## Fiscal data

- Never invent fiscal requirements, thresholds, deadlines, compatibility rules, or documentation.
- Do not infer compatibility between benefits unless explicitly documented.
- Do not hardcode an IPREM-derived monetary threshold unless the applicable amount and interpretation have been verified.
- Preserve the temporal meaning of legal requirements: current status, accrual date, application date, and previous exercise are not interchangeable.
- Keep eligibility, economic result, administrative procedure, and cross-benefit compatibility as separate concerns.
- Do not turn the eligibility engine into a universal fiscal DSL.

## Database

- Do not modify `prisma/schema.prisma` or create migrations unless the task explicitly authorizes it.
- Seeds must remain repeatable and produce stable logical data.
- Do not write tests that depend on auto-incremented database IDs.
- Use the existing `Fuente` / `BeneficioFuente` model for sources.

## Scope control

- Make the smallest change that satisfies the active task specification.
- Do not perform unrelated refactors.
- Do not introduce abstractions solely for hypothetical future requirements.
- When the specification conflicts with the current architecture, stop that part and report the conflict instead of silently redesigning the system.

## Git

- Do not create or switch branches unless explicitly instructed.
- Do not commit or push unless explicitly instructed.
- Do not discard existing working-tree changes that were not created by the current task.

## Validation

Before reporting an implementation as complete, run the checks required by the active task.

For the current project baseline, this normally includes:

- `pnpm exec vitest run`
- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `pnpm build`
- `git diff --check`

Report failures rather than hiding or bypassing them.

## Task specifications

Task-specific requirements live under `docs/tasks/`.

When a task specification conflicts with these general rules, do not guess which behavior is intended. Report the conflict unless the task explicitly states that it overrides a project rule.
