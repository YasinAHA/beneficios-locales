# Valladolid public benefit content — V0 completion

## Goal

Complete the citizen-facing editorial content for the remaining seven Valladolid
V0 benefits using the public-benefit content architecture already validated by
the IBI large-family pilot.

This feature must prove that the existing `PublicBenefit` architecture can
represent the full Valladolid V0 dataset without turning the editorial layer
into a second fiscal rules engine.

The existing Valladolid IBI large-family content is the reference implementation.

## Context

The project already contains:

- the complete structured Valladolid V0 dataset in Prisma;
- the eligibility domain and application service;
- the `PublicBenefit` composition layer;
- typed editorial content;
- deterministic editorial lookup;
- structured-fact references for values that must remain sourced from Prisma;
- one completed pilot:
  `/valladolid/ibi/familia-numerosa`.

The database/domain model remains the source of truth for structured and
computable fiscal facts.

The editorial layer explains those facts to citizens and preserves reviewed
warnings, procedural guidance and explicit uncertainties.

## Architectural boundary

Preserve the existing principle:

- structured/computable fiscal facts -> Prisma/domain model;
- citizen-facing explanation -> editorial content.

Do not create a second source of truth for:

- benefit type;
- percentage/value;
- tranche definitions;
- exercise validity;
- eligibility rule definitions;
- official-source relationships;
- structured application deadlines already represented in Prisma.

Citizen-facing prose may explain structured requirements and results, but it
must not become an alternative eligibility implementation.

Do not redesign the eligibility engine to accommodate editorial content.

## Scope

Add editorial content for exactly these seven Valladolid 2026 benefits:

1. IVTM sustainable mobility;
2. waste fee — large family;
3. waste fee — income/IPREM;
4. waste fee — composting;
5. ORA — families;
6. IVTM — disability;
7. IVTM — historic/period vehicle.

Together with the existing IBI large-family pilot, this completes the eight
Valladolid V0 editorial records.

Do not add:

- Madrid content;
- 2027 content;
- new benefits;
- UI components;
- Next.js pages/routes;
- homepage changes;
- questionnaire UI;
- result UI;
- Prisma schema changes;
- migrations;
- CMS functionality;
- cross-benefit compatibility calculation;
- new fiscal research;
- new fiscal assumptions.

## General implementation rules

Use the existing typed editorial-content contract and registry.

Prefer adding content records and registry entries over changing application
logic.

Small extensions to the editorial contract or structured-fact resolver are
allowed only when one of the canonical Valladolid records genuinely cannot be
represented faithfully with the current contract.

If an extension is necessary:

1. keep it generic rather than benefit-specific;
2. keep structured fiscal facts sourced from Prisma;
3. add focused tests;
4. report why the existing contract was insufficient.

Do not add abstractions merely in anticipation of Madrid or future years.

## Fiscal safety

The canonical content below is already reviewed.

Do not perform new fiscal research and do not silently "improve" or infer facts
that are not present here.

Preserve uncertainty as uncertainty.

In particular:

- do not invent document checklists;
- do not invent application deadlines;
- do not infer compatibility between benefits;
- do not convert practical guidance into a legal requirement;
- do not convert a warning into an eligibility rule;
- do not hardcode an IPREM euro threshold;
- do not assume any GLP vehicle automatically receives a 40% benefit;
- do not assume a vehicle older than 30 years automatically qualifies as
  "de época";
- do not infer persistence/renewal rules where they are not confirmed;
- do not reuse the sustainable-mobility new-registration rule for disability
  or historic vehicles unless explicitly supported.

If the existing structured data contradicts the canonical content below,
report the discrepancy instead of silently changing either side.

---

# Canonical Valladolid editorial content

## 1. IVTM sustainable mobility

Public path:

`/valladolid/ivtm/bonificaciones`

Structured benefit slug / editorial registry key:

`movilidad-sostenible`

The public path is future routing/SEO metadata. It is not the structured benefit
slug and must not be used as the current `getPublicBenefit` lookup key.

### Citizen-facing result

The structured Valladolid data contains the applicable mobility tranches.

The reviewed categories are:

- electric vehicles;
- non-diesel hybrid vehicles;
- GLP / other qualifying non-diesel vehicles;
- qualifying non-diesel vehicles according to the applicable CO2 condition.

Do not duplicate the structured percentages as machine-readable editorial
values.

The public explanation may render the percentages from the structured tranches.

Multiple structured tranches may match. Do not introduce logic that assumes
tranche results must be mutually exclusive.

### Important date

For ordinary annual IVTM liability, the relevant situation is the ordinary
devengo on 1 January 2026.

For first acquisition, the tax period starts on the acquisition date.

Keep this distinction explanatory unless already represented structurally.

### Application deadline

The ordinary 2026 application deadline is:

`6 April 2026`.

New registrations may request the benefit during the fiscal year.

Do not present this as retroactive.

### Documentation

The complete operational document checklist has not been confirmed.

Do not invent one.

### Warning / explicit uncertainty

There is unresolved interpretative caution around the 120 g CO2 condition and
its relationship with GLP / the other non-diesel category.

Therefore:

- do not state that every GLP vehicle automatically receives the 40% benefit;
- preserve the existing structured rule;
- expose the caution editorially rather than creating a new rule.

Compatibility with the IVTM disability exemption or historic-vehicle benefit
has not been established.

Do not claim compatibility or incompatibility.

---

## 2. Waste fee — large family

Public path:

`/valladolid/tasa-residuos/familia-numerosa`

### Citizen-facing result

The benefit is a reduction of the variable part of the waste fee.

Obtain the percentage from the structured benefit data rather than duplicating
it as a machine-readable editorial value.

### Requirements / important date

The reviewed content requires:

- the relevant large-family title;
- habitual residence;
- the relevant situation at the 1 January 2026 devengo.

Explain these requirements to the citizen without recreating the eligibility
rules in editorial code.

### Application deadline

The 2026 deadline is:

`5 November 2026`.

A late application applies to the following tax period rather than the current
one.

### Renewal / persistence

Annual reapplication is not required while the relevant circumstances remain
unchanged.

Renewals of the large-family title must be provided in time.

### Compatibility

Compatibility with the waste-fee income/IPREM benefit is documented.

Their combined effect may reach at most 100% of the variable part.

This is editorial compatibility information only.

Do not implement cross-benefit calculation in this feature.

Do not extend this compatibility statement to composting.

---

## 3. Waste fee — income/IPREM

Public path:

`/valladolid/tasa-residuos/renta-iprem`

### Citizen-facing result

The structured benefit data contains the applicable reduction of the variable
part of the waste fee.

Do not duplicate the percentage as a machine-readable editorial value.

### Requirements

The reviewed condition is based on prior-year household income being at or
below 1.5 times the applicable IPREM.

For the 2026 benefit, the relevant income is 2025 income.

For this purpose, the reviewed concept of the household/cohabitation unit is
based on the people registered at the dwelling.

### IPREM safety

Do not hardcode a euro threshold.

The exact applicable IPREM modality and resulting municipal euro threshold have
not been confirmed sufficiently for publication.

In particular, do not publish `10,800 EUR` or another derived amount.

Preserve the existing structured representation of the verified IPREM
condition.

### Application deadline

The 2026 deadline is:

`5 November 2026`.

A late application applies to the following tax period.

### Documentation

The exact operational document checklist has not been confirmed.

Do not invent it.

### Renewal / persistence

Persistence without reapplication has not been confirmed.

Do not claim that it renews automatically.

### Compatibility

Compatibility with the waste-fee large-family benefit is documented.

Their combined effect may reach at most 100% of the variable part.

Do not implement the cap or combination calculation in this feature.

Compatibility with composting has not been documented.

Do not infer it.

---

## 4. Waste fee — composting

Public path:

`/valladolid/tasa-residuos/compostaje`

Structured benefit slug / editorial registry key:

`compostaje-domiciliario`

The public path is future routing/SEO metadata. It is not the structured benefit
slug and must not be used as the current `getPublicBenefit` lookup key.

### Citizen-facing result

The structured benefit represents a reduction of the variable part of the
waste fee.

Do not duplicate the percentage as a machine-readable editorial value.

The citizen-facing explanation must preserve the operational peculiarity:

- the taxpayer initially pays 100% of the waste fee;
- after recognition/verification, the corresponding amount is refunded.

For the reviewed 2026 process, the refund is expected in the first quarter of
2027.

### Requirements

The reviewed content includes:

- enrollment in the composting program during the previous year;
- for the 2026 benefit, enrollment before the end of 2025;
- one linked Valladolid dwelling;
- effective compliance with the composting program;
- municipal verification.

### Application deadline

The fiscal 2026 deadline is:

`5 November 2026`.

The effect of a late application has not been confirmed.

Do not infer it from the other waste-fee benefits.

### Documentation / procedure

Confirmed practical elements include:

- proof/confirmation of participation in the composting program;
- a bank account for the refund.

The citizen journey contains two distinct processes:

1. enrollment/participation in the composting program;
2. application for the fiscal benefit.

Do not collapse these into one procedure.

Practical program guidance may include training or verification visits, but do
not silently convert operational guidance into new fiscal eligibility rules.

### Renewal / persistence

Persistence has not been confirmed.

Do not claim automatic renewal.

### Compatibility

Compatibility with the other waste-fee benefits has not been confirmed.

Do not infer it.

---

## 5. ORA — families

Public path:

`/valladolid/ora/familias`

### Citizen-facing result

This is an exemption, not a percentage bonus.

Use the structured benefit type/result as the source of truth.

### Alternative routes

The structured eligibility data represents two legal routes:

- route A: child aged 0–3 plus applicant registered in Valladolid;
- route B: special-category large-family title plus applicant registered in
  Valladolid.

Preserve the alternative-route semantics.

Do not turn the two routes into cumulative requirements.

### Vehicle / applicant conditions

The reviewed content includes:

- Valladolid registration of the applicant;
- one vehicle;
- applicable vehicle titularity rules.

Keep administrative cardinality/titularity restrictions explanatory unless
they are already structured.

### Application / renewal

The authorization runs until 31 December.

Renewal takes place in January.

A confirmed universal first-application month has not been established.

Do not invent one.

### Documentation

Normative documentation includes:

- family book or equivalent official documentation where applicable;
- large-family title where applicable.

Operational/concessionaire guidance may additionally request items such as:

- DNI/NIE;
- circulation permit;
- vehicle-condition evidence;
- Valladolid IVTM status;
- documentation for certain renting situations.

Keep the distinction between normative requirements and operational guidance.

Do not silently promote every operational item into a legal eligibility rule.

### Parking operation

The exemption does not necessarily mean that no parking-session action is
required.

The user may still need to initiate the applicable free parking session.

Excluded areas or parking regimes may apply.

### Explicit uncertainties

Preserve these unresolved points:

- exact age-boundary interpretation for the child route;
- treatment of renting vehicles versus the normative titularity wording;
- exact first-application period.

---

## 6. IVTM — disability

Public path:

`/valladolid/ivtm/discapacidad`

### Citizen-facing result

This is a complete IVTM exemption.

Do not describe it as a `100% bonus`.

Use the structured result type as the source of truth.

### Alternative routes

The reviewed content contains alternative routes including:

- a vehicle for people with reduced mobility;
- a vehicle registered in the name of a disabled person for exclusive use.

For the second route, the reviewed disability threshold is at least 33%.

Preserve alternative-route semantics.

Do not require both routes simultaneously.

Only one vehicle may benefit simultaneously where the reviewed restriction
applies.

### Important date

The relevant cause/documentation must exist at the tax devengo.

For ordinary annual liability this is normally 1 January.

### Application deadline

The ordinary 2026 deadline is:

`6 April 2026`.

### Documentation

Reviewed documentation includes, as applicable:

- declaration/evidence of vehicle destination;
- circulation permit;
- technical vehicle card;
- disability certificate including relevant date, degree and validity;
- insurance-driver evidence or proof of transport where applicable.

Represent applicability carefully; do not imply that every listed document is
mandatory in every route.

### Renewal / persistence

The exemption may persist while the vehicle classification and qualifying cause
remain unchanged.

### Explicit uncertainty

The treatment of first acquisitions outside the ordinary annual roll has not
been confirmed here.

Do not import the sustainable-mobility new-registration rule into this benefit.

---

## 7. IVTM — historic/period vehicle

Public path:

`/valladolid/ivtm/vehiculo-historico`

Structured benefit slug / editorial registry key:

`historico-epoca`

The public path is future routing/SEO metadata. It is not the structured benefit
slug and must not be used as the current `getPublicBenefit` lookup key.

### Citizen-facing result

This is a 100% IVTM bonus.

It is not an exemption.

Use the structured result type/value as the source of truth rather than storing
a second machine-readable editorial result.

### Alternative routes

The reviewed content contains two routes:

- officially classified historic vehicle;
- qualifying period vehicle (`vehículo de época`) older than 30 years with the
  required accreditation/qualification.

### Critical warning

Being more than 30 years old does NOT automatically make a vehicle a qualifying
`vehículo de época`.

Do not equate:

- age over 30 years;
- colloquial "classic vehicle";
- legally/administratively qualifying `vehículo de época`.

Preserve the structured rule and expose this distinction prominently in the
editorial content.

### Important date

For ordinary annual IVTM liability, the relevant situation is the 1 January
devengo.

For first acquisition, the tax period starts on the applicable acquisition
date.

Do not infer additional application rules from that statement.

### Application deadline

The ordinary 2026 deadline is:

`6 April 2026`.

### Documentation

The complete documentation required to prove the `vehículo de época` route has
not been confirmed.

Do not invent club certificates, technical reports or other mandatory
documents.

### Renewal / persistence

Persistence has not been confirmed.

Do not claim automatic renewal.

### Explicit uncertainties

Preserve these unresolved points:

- exact municipal definition/accreditation of `vehículo de época`;
- exact operational document checklist;
- persistence/renewal;
- treatment of first acquisitions;
- compatibility with other IVTM benefits.

---

# Cross-benefit rules for this feature

Do not build a compatibility engine.

The only documented compatibility statement that should be represented is:

- waste-fee large-family + waste-fee income/IPREM:
  compatible, with a combined maximum of 100% of the variable part.

This is citizen-facing explanatory information.

Do not calculate the combined result.

Do not infer compatibility for:

- composting;
- sustainable mobility;
- disability;
- historic vehicles;
- ORA;
- IBI.

The existing IBI large-family compatibility with the separate VPO IBI benefit
does not require implementation here because that other benefit is outside the
current Valladolid V0 dataset.

# Registry

Public paths documented in this task are future citizen-facing routing/SEO
paths. They are not necessarily identical to the structured `Beneficio.slug`.

For this feature, editorial registry keys must use the exact existing structured
benefit slugs from Prisma/seed data.

Do not implement public-path aliases or routing in this feature.

Register the seven new records using the existing deterministic registry.

Use:

- municipality slug;
- tax;
- benefit slug;
- exercise.

Do not use database IDs.

All records in this feature are for Valladolid exercise 2026.

Missing content must continue returning the existing explicit missing result.

# Structured-fact rendering

Reuse structured facts from Prisma wherever the existing data can reliably
provide them.

At minimum:

- percentages/values must not become duplicated machine-readable editorial
  values;
- benefit type must remain structured;
- structured application deadlines must remain the deadline source of truth.

If a new generic structured-fact reference is required to represent one of the
seven records faithfully, extend the resolver minimally and exhaustively.

Do not add benefit-specific rendering branches.

## Known structured-data audit note

For IVTM sustainable mobility, the reviewed ordinary 2026 deadline is
6 April 2026, but the current structured seed may expose that date only through
`Tramite.plazoDescripcion` and not through `Tramite.plazoHasta`.

Do not hardcode the date into editorial content and do not parse
`plazoDescripcion` to manufacture a structured date.

Treat this as a structured-data discrepancy and report it before implementing
deadline rendering for this benefit.

# Tests

Add focused tests covering all seven new records.

Tests should verify at least:

- deterministic lookup for every Valladolid V0 editorial record;
- no fallback to another benefit/year;
- explicit uncertainties remain present where specified;
- percentages/results remain sourced from structured data;
- structured application deadlines are used where available;
- alternative legal routes are not editorially converted into cumulative
  requirements;
- IPREM content contains no hardcoded euro threshold;
- GLP/CO2 uncertainty remains explicit;
- composting preserves the pay-first/refund-later flow and the two-process
  distinction;
- ORA preserves the distinction between normative documentation and
  operational guidance;
- disability is described as an exemption, not a 100% bonus;
- historic vehicle content does not imply that age >30 alone is sufficient;
- documented waste-fee compatibility is explanatory only and no combination
  calculation is introduced;
- existing IBI large-family content still works;
- existing eligibility behavior does not regress.

Prefer public behavior tests over tests coupled to implementation details.

Do not reproduce the eligibility engine's complete test suite in this feature.

# Validation

Before reporting completion, run:

`pnpm validate`

If the Codex sandbox again reports the known Windows CRLF `git diff --check`
discrepancy while tests, TypeScript, lint and build pass, report it exactly.

Do not modify the validation script or Git configuration to work around that
environment-specific discrepancy.

# Completion criteria

This feature is complete when:

- all eight Valladolid V0 benefits have typed editorial content;
- all eight resolve deterministically;
- the seven new records compose with their existing structured Prisma data;
- structured fiscal results remain sourced from Prisma;
- all specified warnings and uncertainties are preserved;
- no unsupported fiscal claims are introduced;
- no Prisma/schema/migration changes are made;
- no UI/routes are added;
- existing eligibility behavior remains intact;
- tests pass;
- `pnpm validate` passes in the normal repository environment.