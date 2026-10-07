# Public benefit page — Valladolid IBI large family

## Goal

Build the first real citizen-facing benefit landing page for Beneficios Locales:

`/valladolid/ibi/familia-numerosa`

This page is the pilot for the reusable public benefit page architecture.

The goal is not to build one hardcoded Valladolid page. The goal is to prove that
the existing `PublicBenefit` application contract can drive a useful, accessible,
SEO-friendly public page without duplicating fiscal truth in the UI.

Only the Valladolid 2026 IBI large-family benefit is published in this feature.

The resulting architecture should make publishing the remaining Valladolid V0
benefits substantially cheaper later, but those routes/pages are out of scope now.

---

# Existing architecture is authoritative

Before editing, inspect and reuse the current repository architecture, especially:

- `src/services/public-benefits/`
- `src/content/benefits/`
- the existing Valladolid IBI large-family editorial content;
- the existing structured Prisma benefit data;
- the existing eligibility/application services;
- `AGENTS.md`.

The page must consume the existing `PublicBenefit` composition.

Do not create a second fiscal/content model for the UI.

Do not copy fiscal percentages, deadlines, requirements, warnings,
uncertainties, procedures or source information into the route component.

The existing structured + editorial composition remains the source of truth.

---

# Route

Implement:

`/valladolid/ibi/familia-numerosa`

Use the Next.js App Router.

This page should be a Server Component by default.

Do not add `"use client"` unless a specific interaction genuinely requires it.

For this feature, no client-side interaction is expected to be necessary.

---

# Data loading

Load the Valladolid 2026 IBI large-family benefit through the existing
public-benefit application service.

Use the existing identifiers:

- municipality: `valladolid`
- tax: `IBI`
- structured benefit slug: `familia-numerosa`
- exercise: `2026`

Do not query Prisma directly from the page if the existing public-benefit
service already provides the required data.

Do not duplicate the composition logic in the route.

If the benefit unexpectedly cannot be resolved, use appropriate Next.js
not-found behavior rather than rendering misleading or partially invented
content.

---

# Reusable page architecture

The route should remain thin.

Create reusable presentation components where they represent stable concepts
of a public benefit page.

A reasonable conceptual structure is:

```text
PublicBenefitPage
├── Breadcrumbs
├── BenefitHero
├── BenefitResult
├── RequirementsSection
├── DatesSection
├── DocumentationSection
├── ApplicationSteps
├── RenewalSection
├── WarningsSection
├── UncertaintiesSection
└── SourcesSection
```

This is conceptual, not a mandatory one-file-per-item requirement.

Do not create unnecessary abstractions merely to match this diagram.

Prefer a small number of meaningful reusable components over many trivial
wrappers.

Components must receive already-composed public-benefit data or explicit
presentation props.

They must not perform their own Prisma queries or contain benefit-specific
fiscal constants.

Do not add `if Valladolid IBI` presentation branches to reusable components.

---

# Information hierarchy

The page should help a citizen quickly answer:

1. What benefit is this?
2. What can I get?
3. Could it apply to me?
4. What date or deadline matters?
5. What documentation is known?
6. How do I request it?
7. Does it persist or need renewal?
8. What should I be careful about?
9. What information remains uncertain?
10. Where does the information come from?

The page should therefore expose the relevant existing `PublicBenefit`
information in a clear hierarchy.

For the pilot IBI page this includes, as available from the existing contract:

- municipality;
- tax;
- exercise;
- citizen-facing title;
- summary;
- structured result/tranches;
- requirements;
- key-date explanation;
- application deadline explanation;
- documentation guidance;
- ordered application steps;
- renewal/persistence explanation;
- warnings;
- explicit uncertainties;
- official sources.

Do not manufacture content for an empty field.

---

# Structured result

The economic result must come from structured public-benefit data.

For Valladolid IBI large family, the page must represent the existing general
and special-category percentage results from the structured tranches.

Do not hardcode `40%` or `90%` in the route or presentation components.

Do not infer, combine or sum tranche values.

The existing rendered editorial content may already contain values resolved by
the composition layer; reuse it appropriately.

The UI must not become a second structured-fact resolver.

---

# Sources

Expose the benefit's existing sources to the citizen.

Clearly distinguish the primary/official source where the current data model
provides that information.

Use the existing source title and URL.

External source links should be semantically clear and safe.

Do not invent source labels, URLs or authority levels that are not represented
by the existing data.

Do not perform new fiscal research in this feature.

---

# Warnings and uncertainties

Warnings and uncertainties are intentional product information, not errors.

Render them clearly but without alarmist styling.

A citizen should be able to distinguish:

- normal explanatory information;
- important cautions/warnings;
- facts that remain explicitly uncertain.

Do not silently hide uncertainties to make the page appear more definitive.

Do not convert uncertainty into eligibility logic.

Do not present `gradoCerteza` or any confidence percentage to the user.

---

# Documentation

The existing editorial contract distinguishes confirmed documentation from an
incomplete/unconfirmed checklist.

Represent that distinction faithfully.

Do not imply that the displayed documents form a complete checklist when the
content says otherwise.

Do not invent missing documents.

---

# SEO metadata

Implement route metadata using Next.js metadata APIs.

Use the existing editorial SEO title and description from `PublicBenefit`.

Do not duplicate the SEO title or description as constants in the route.

The page should have an appropriate canonical URL for:

`/valladolid/ibi/familia-numerosa`

Do not add sitemap generation in this feature.

Do not add structured-data/schema.org markup unless it can be implemented
cleanly from existing verified data without inventing semantics. It is not
required for completion.

---

# Root application shell

The current Next.js starter still contains placeholder metadata and English
document language.

As part of this feature, perform only the minimal shell cleanup required for
the first real public page:

- set the document language to Spanish (`lang="es"`);
- remove the `Create Next App` metadata;
- establish sensible site-level fallback metadata for Beneficios Locales;
- remove the starter font inconsistency where Geist is loaded but `body`
  explicitly forces Arial/Helvetica;
- keep the shell reusable for future pages.

Do not redesign the entire application shell.

Do not build the final navigation or footer in this feature unless a minimal
element is genuinely necessary for the benefit page.

---

# Home page

The existing `/` route is still the Create Next App starter.

Do not build the real Beneficios Locales homepage in this feature.

Remove or simplify starter-specific branding/assets only if required to avoid
shipping misleading Next.js/Vercel placeholder content during development.

A complete homepage is a separate feature.

Do not let homepage work expand the scope of this task.

---

# Styling and component philosophy

Use Tailwind CSS for layout and composition.

Follow this principle:

> Use existing accessible primitives when they remove real implementation
> complexity; keep domain composition and product information architecture
> under our control.

Do not reinvent complex accessible UI primitives.

Do not introduce a heavy visual framework such as Material UI, Ant Design or
Chakra solely for this page.

`shadcn/ui` is allowed where an existing primitive provides clear value.

If shadcn is introduced:

- initialize only the minimum infrastructure required;
- add only components actually used by this feature;
- do not install a catalogue of unused components;
- keep generated/adapted components within the repository;
- do not make the page visually dependent on unnecessary JavaScript.

Simple semantic sections, cards and layout do not need a library merely for
the sake of using one.

If no shadcn primitive provides meaningful value for this static page, it is
acceptable not to install shadcn yet.

---

# Visual direction

The page is a public information product, not an internal admin dashboard.

Prioritize:

- clarity;
- trust;
- calm presentation;
- strong information hierarchy;
- readable line lengths;
- generous spacing;
- mobile-first responsiveness;
- obvious distinction between result, requirements, procedure and cautions;
- restrained visual treatment.

Avoid:

- dashboard-like dense grids;
- excessive cards around every paragraph;
- decorative gradients without purpose;
- excessive badges;
- unnecessary animations;
- glassmorphism;
- dark-pattern urgency;
- visual claims of official-government status.

The product must not visually impersonate Valladolid City Council or another
public administration.

---

# Responsive behavior

The page must work from small mobile screens through desktop.

Mobile must not be an afterthought.

Avoid fixed widths that create horizontal scrolling.

Content order should remain meaningful without relying on a multi-column
desktop layout.

Use a readable maximum content width on larger screens.

---

# Accessibility

Use semantic HTML.

The page should have:

- one meaningful `h1`;
- logical heading hierarchy;
- landmarks where appropriate;
- accessible link text;
- sufficient contrast;
- visible keyboard focus;
- no interaction that depends only on color;
- no important information represented only visually.

Do not add ARIA where native semantic HTML already expresses the meaning.

---

# CTA / citizen test

The citizen eligibility test does not exist yet.

Do not add a button or link that pretends the test is available.

Do not create a fake `/test` route.

Do not create disabled controls that look actionable.

The reusable page architecture may leave a natural place for a future CTA, but
no non-functional test CTA should be rendered in this feature.

The real test CTA will be added when the test experience exists.

---

# Out of scope

Do not implement:

- the other seven Valladolid benefit routes;
- dynamic generic routing for every benefit;
- Madrid;
- 2027 data;
- the citizen eligibility test;
- results UI for the test;
- the final homepage;
- a full navigation system;
- sitemap generation;
- Search Console integration;
- analytics;
- authentication;
- user accounts;
- favorites/history;
- a CMS;
- Prisma schema changes;
- migrations;
- fiscal seed changes;
- eligibility-engine redesign;
- compatibility calculations;
- new fiscal research;
- automatic fiscal-content generation.

If a fiscal or structured-data contradiction is discovered, stop and report it
before changing the underlying data.

---

# Testing

Add focused tests for the public page architecture.

Prefer behavior and public output over implementation-detail tests.

At minimum cover:

- the Valladolid IBI public benefit resolves for the route identifiers;
- the page/presentation receives structured percentage results rather than
  hardcoded route values;
- SEO metadata is derived from existing editorial SEO content;
- missing benefit data follows the intended not-found behavior where practical
  to test;
- warnings and explicit uncertainties remain represented;
- official source information is represented;
- no fake test CTA is rendered.

Do not make tests brittle by asserting large blocks of exact prose or Tailwind
class strings.

Preserve all existing tests.

---

# Validation

Before completion run:

```bash
pnpm validate
```

If the environment cannot execute `scripts/validate.sh` because of the known
Windows LF/CRLF working-tree issue, do not modify the validation script merely
to work around the environment.

Run the underlying validation checks individually and report the limitation
explicitly.

Do not commit.

---

# Completion criteria

This feature is complete when:

- `/valladolid/ibi/familia-numerosa` renders from the existing
  `PublicBenefit` application layer;
- no fiscal truth is duplicated in the route/presentation layer;
- the page establishes a reusable public-benefit presentation architecture;
- the IBI general/special results come from structured data;
- requirements, dates, documentation, procedure, renewal, warnings,
  uncertainties and sources are faithfully represented;
- metadata uses the existing editorial SEO content;
- the document shell is minimally corrected for a Spanish public product;
- the page is responsive and accessible;
- no fake eligibility-test CTA exists;
- no additional benefit routes are published;
- no fiscal, Prisma or eligibility behavior is changed;
- focused tests pass;
- the existing test suite does not regress;
- validation passes, apart from any explicitly reported environment-only
  LF/CRLF execution limitation.