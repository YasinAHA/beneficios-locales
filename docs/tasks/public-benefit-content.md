# Public benefit content — V0

## Goal

Introduce the application/content layer required to compose the structured fiscal
data already stored in Prisma with citizen-facing editorial content.

This feature is infrastructure for future public benefit pages.

It must not implement UI or Next.js routes yet.

## Context

The project already has:

- municipalities and benefits stored in Prisma;
- benefit validity by exercise;
- benefit result type/value/unit;
- eligibility rules and rule groups;
- benefit tranches;
- official sources;
- procedures;
- evaluable fields and questions;
- a domain eligibility engine;
- an application eligibility service.

The database and eligibility engine are the source of truth for structured and
computable fiscal facts.

Public pages additionally need explanatory content that is useful to citizens
but should not become part of the eligibility engine.

Examples include:

- summaries;
- explanatory requirements;
- important dates;
- documentation guidance;
- step-by-step application guidance;
- renewal/persistence explanations;
- warnings;
- explicit uncertainties;
- SEO metadata.

## Architectural boundary

Do not turn the eligibility engine into a fiscal content system.

Use this principle:

- structured/computable fiscal facts -> Prisma/domain model;
- citizen-facing explanation -> editorial content.

Do not duplicate structured fiscal facts in editorial content when they can be
obtained reliably from the existing Prisma data.

In particular, avoid creating a second source of truth for:

- benefit type;
- percentage/value;
- tranches;
- exercise validity;
- rule definitions;
- source relationships.

## Storage decision for V0

Editorial content must be stored as typed TypeScript content in the repository.

Do not:

- add Prisma models;
- add Prisma columns;
- create migrations;
- introduce a CMS;
- use Markdown parsing;
- fetch editorial content from an external service.

The design should allow this storage decision to change later without affecting
the eligibility domain.

## Public benefit composition

Introduce an application-facing representation that composes:

1. structured benefit data loaded from Prisma;
2. typed editorial content.

The exact naming and file decomposition may be chosen during implementation,
but the resulting public representation must keep structured fiscal data and
editorial content conceptually separate.

A public benefit should be able to expose the information needed later by:

- SEO benefit pages;
- eligibility test results;
- other citizen-facing benefit views.

Do not build those consumers in this feature.

## Editorial content contract

The typed editorial content should support at least:

- SEO title;
- SEO description;
- citizen-facing summary;
- explanatory requirements;
- key-date explanation;
- application-deadline explanation;
- documentation guidance;
- ordered application steps;
- renewal/persistence explanation;
- warnings;
- explicit uncertainties.

Prefer structures that preserve semantic meaning over one large HTML or
Markdown string.

The contract may distinguish confirmed information from pending/uncertain
information where useful.

Do not expose a numeric confidence score.

Documentary confidence such as "very high" is an internal editorial concept,
not a probability that a citizen qualifies.

## Content lookup

Editorial content must be resolvable deterministically for a benefit.

Use stable domain identifiers already available in the project, such as the
municipality slug, tax and benefit slug, rather than database IDs.

Missing editorial content must have explicit behavior.

Do not silently return unrelated or fallback content for another benefit.

## Valladolid pilot

Implement editorial content for ONE benefit only:

`/valladolid/ibi/familia-numerosa`

This is a pilot for the content architecture.

Do not add the other seven Valladolid benefits in this feature.

### Canonical editorial facts

Citizen-facing title:

`Bonificación del IBI para familias numerosas en Valladolid`

SEO title:

`Bonificación IBI familia numerosa en Valladolid`

SEO description:

`Consulta la bonificación del IBI para familias numerosas en Valladolid: 40 % o 90 %, requisitos, fecha clave, plazo 2026 y cómo solicitarla.`

Summary:

A household that had a valid large-family title and satisfied the housing
requirements on 1 January 2026 may be eligible for an IBI benefit on its
habitual residence.

Important date:

The fiscal situation is evaluated at the IBI accrual date:

`1 January 2026`.

Application deadline for 2026:

`5 June 2026`.

The content must explain that being a large family at the time the user visits
the website is not sufficient by itself; the relevant situation for IBI 2026
is the situation at accrual.

### Documentation

Confirmed by the canonical fiscal review:

- valid large-family title at the accrual date;
- relevant modifications must be evidenced when applicable.

The complete operational document checklist of the current municipal procedure
has not been confirmed.

Do not invent additional mandatory documents.

### Procedure

The citizen-facing procedure should preserve this sequence:

1. verify that the requirements were satisfied on 1 January 2026;
2. identify whether the large-family category was general or special;
3. submit the municipal application before 5 June 2026;
4. provide the valid large-family title and documentation applicable to the
   concrete situation;
5. communicate later changes that may affect the benefit;
6. if the habitual residence changes, verify whether a new application is
   required for the new property.

### Renewal/persistence

Once granted, the benefit may continue while the requirements remain satisfied
and the large-family title remains valid.

Renewed titles must be provided within the applicable period.

A change of habitual residence requires reassessing the benefit for the new
property.

### Warnings

The content must preserve at least these cautions:

- eligibility depends on the situation at 1 January 2026;
- co-ownership rules can affect the applicable benefit;
- garages, storage rooms and other separate properties must not automatically
  be presented as covered;
- the regulation refers to the large-family title, not merely the card.

### Explicit uncertainty

The complete current operational document checklist from the municipal
electronic office is not confirmed.

This uncertainty must remain visible in the content model and must not be
silently converted into mandatory-document claims.

## Existing structured data

Do not duplicate the 40 % / 90 % benefit amounts in the editorial content if
they are already represented by the seeded benefit/tranches.

Do not duplicate eligibility rules merely to produce explanatory copy.

The future public representation should obtain structured results from the
existing benefit data.

## Fiscal safety

Editorial content must never turn uncertainty into certainty.

For this feature:

- do not invent municipal requirements;
- do not infer missing documentation;
- do not broaden documented compatibility rules;
- do not derive new eligibility rules from prose;
- do not modify the existing Valladolid eligibility rules unless a concrete
  implementation defect proves it necessary.

If such a defect is discovered, report it instead of expanding scope silently.

## Scope

Implement:

- typed editorial-content contract;
- deterministic content lookup/registry;
- Valladolid IBI large-family editorial content;
- application-level composition of existing structured benefit data with
  editorial content;
- tests for the new behavior.

Do not implement:

- UI components;
- Next.js pages or routes;
- homepage changes;
- eligibility questionnaire UI;
- result UI;
- the other seven Valladolid editorial records;
- Madrid data;
- 2027 data;
- Prisma schema changes;
- migrations;
- CMS functionality;
- cross-benefit compatibility calculation;
- fiscal-rule redesign.

## Testing expectations

Tests should cover at least:

- successful lookup of the Valladolid IBI editorial content;
- deterministic lookup by stable identifiers;
- explicit behavior when editorial content does not exist;
- composition with the existing structured benefit representation;
- preservation of explicit uncertainty;
- absence of duplicated 40 % / 90 % amounts in the editorial content;
- no regression of the existing eligibility behavior.

Prefer testing public behavior rather than implementation details.

## Validation

Before reporting completion, run:

`pnpm validate`

Report any failure rather than bypassing it.

## Completion criteria

The feature is complete when:

- one typed Valladolid editorial record exists for IBI large family;
- it can be deterministically resolved;
- it can be composed with the existing structured benefit data;
- fiscal amounts/rules remain sourced from the existing structured data;
- the unconfirmed documentation checklist remains explicitly uncertain;
- no Prisma or UI changes were introduced;
- tests pass;
- `pnpm validate` passes.