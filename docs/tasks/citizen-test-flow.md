# Citizen Test Flow — Valladolid V0

## Status

Implementation task.

This document defines the application/domain orchestration required for the first
general adaptive citizen test.

The fiscal rules, Valladolid V0 dataset, eligibility engine and public editorial
content already exist and are not redesigned by this task.

---

# 1. Product goal

Build the reusable adaptive questionnaire flow that allows a citizen to start from:

> "I do not know which municipal benefit to search for."

and progressively answer questions about their circumstances so the application can
determine which of the existing Valladolid V0 benefits may be relevant.

The questionnaire must not be a fixed list of every seeded question.

It must ask only questions that can still provide useful information for the current
test state.

The flow must preserve the conservative semantics of the existing eligibility
engine.

---

# 2. V0 scope

This feature covers:

- municipality: Valladolid;
- exercise: 2026;
- the complete existing set of eight Valladolid V0 benefits;
- loading the candidate benefits required by the general test;
- loading the active citizen questions associated with executable fields;
- questionnaire state;
- citizen answers;
- explicitly skipped / "I don't know" fields;
- evaluation of all candidate benefits from partial answers;
- determination of which unanswered fields remain useful;
- deterministic selection of the next useful question;
- questionnaire completion;
- reevaluation after answer changes;
- validation/translation between citizen question responses and the field-key answer
  map consumed by the eligibility engine;
- deterministic, testable application/domain contracts;
- automated tests for adaptive behavior.

The implementation must be reusable enough that a future municipality can use the
same orchestration policy with its own candidate benefits/questions.

The feature may contain Valladolid-specific application configuration for selecting
the V0 candidate set, but the adaptive algorithm itself must not hardcode Valladolid
field keys or fiscal rules.

---

# 3. Explicit non-goals

Do NOT implement in this feature:

- the final citizen-facing questionnaire UI;
- the final results page;
- final citizen-facing MATCH / UNKNOWN / NO_MATCH wording;
- accounts;
- authentication;
- questionnaire persistence;
- database sessions;
- answer history persistence;
- analytics;
- Madrid;
- 2027 fiscal data;
- new fiscal rules;
- new inferred fiscal dependencies;
- cross-benefit economic summation;
- cross-benefit compatibility rules;
- a final homepage;
- sitemap / robots / Search Console work;
- a CMS;
- generative fiscal answers;
- multi-vehicle support;
- multi-property support.

Do not add UI merely to demonstrate the flow.

The feature is complete when the orchestration can be exercised and verified through
application/domain tests.

---

# 4. Existing source of truth

The implementation must reuse the existing repository contracts.

Relevant existing concepts include:

- `PreguntaTest`
- `PreguntaCampo`
- `CampoEvaluable`
- `Beneficio`
- `TramoBeneficio`
- `GrupoRegla`
- `Regla`
- existing Valladolid V0 seed data;
- existing eligibility domain evaluators;
- `getEvaluatableBenefit`;
- `evaluateBenefitEligibility`;
- existing public-benefit composition where useful for inspection, but public
  editorial content must not drive executable questionnaire decisions.

The existing eligibility engine remains the executable fiscal truth.

The questionnaire orchestrator decides what is worth asking.

It does NOT decide whether a fiscal rule matches by itself.

---

# 5. Critical architecture boundary

Preserve this separation:

```text
seeded fiscal rules
        ↓
eligibility engine
        ↓
questionnaire orchestration
        ↓
future citizen UI / results
```

The eligibility engine answers:

> Given these answers, what is the current eligibility state?

The questionnaire orchestration answers:

> Given the current eligibility state and the remaining executable possibilities,
> what information is still useful to ask for?

The future results layer will answer:

> How should this state be explained to a citizen?

Do not merge these responsibilities.

---

# 6. Fiscal safety invariants

The orchestrator MUST NOT:

- create fiscal predicates;
- change existing predicates;
- infer an unanswered field from another answer;
- convert absence into `false`;
- convert "I don't know" into a fiscal value;
- assume dependencies based only on question wording;
- infer that an electric vehicle has a particular fuel answer;
- infer period-vehicle accreditation from vehicle age;
- infer IPREM eligibility from an amount unless an approved executable rule exists;
- resolve the documented GLP/CO2 uncertainty by adding a dependency;
- turn editorial warnings into executable rules;
- turn administrative documentation into eligibility predicates.

Only explicit citizen answers may populate the eligibility `Answers` map.

---

# 7. V0 citizen context boundary

One questionnaire execution concerns:

- one citizen / household context;
- one relevant habitual dwelling context;
- one vehicle context when vehicle questions become relevant;
- Valladolid;
- exercise 2026.

The current model does not distinguish multiple vehicles or multiple properties.

Do not simulate that capability.

Do not silently reuse one vehicle answer for several different vehicles.

Multi-asset questionnaire support is outside V0.

---

# 8. Questionnaire state

The questionnaire must have an explicit state contract representing at least:

- supplied answers;
- fields explicitly skipped by the citizen.

Conceptually:

```ts
type CitizenTestState = {
  answers: Answers;
  skippedFields: string[];
};
```

The final implementation may use an equivalent immutable/set-oriented representation
if it is clearer and serializable at the application boundary.

Do not persist this state in the database in V0.

Everything else that can safely be derived from this state and repository data should
prefer derivation over duplicated mutable state.

---

# 9. Answers contract

The eligibility engine currently consumes field-key answers.

The questionnaire layer must preserve that boundary.

A supplied citizen answer must become:

```text
CampoEvaluable.clave → boolean | number | string
```

only after it has been validated against the question/field contract.

Do not use question database IDs as fiscal answer keys.

Do not use benefit/tranche database IDs as stable logical questionnaire identifiers.

BigInt database IDs may be mapped to strings where existing application contracts
already require it.

---

# 10. Response validation

Before a response enters `Answers`, validate it using the available question and field
metadata.

At minimum:

## BOOLEAN

Only boolean values are valid.

## NUMBER

Only finite numbers are valid.

Do not silently coerce arbitrary strings into numbers.

## SELECT

The supplied value must be one of the configured options for the active question.

The existing eligibility engine validates primitive string type but does not validate
question options. The questionnaire boundary must prevent an arbitrary string from
becoming a valid SELECT answer.

## TEXT

The model supports TEXT questions even though Valladolid V0 currently seeds none.

Do not invent behavior beyond what is necessary for a safe generic contract.

If TEXT is supported by the implemented generic validator, it must map compatibly to
a STRING field.

## Question ↔ field compatibility

Reject inconsistent question/field type mappings explicitly.

Do not silently coerce incompatible types.

---

# 11. "I don't know" / skipped semantics

"I don't know" is questionnaire state, NOT a fiscal answer.

It MUST NOT become:

```ts
answers[field] = false;
answers[field] = 0;
answers[field] = "";
answers[field] = "unknown";
```

Instead the field is recorded in `skippedFields` and remains absent from `answers`.

Therefore the eligibility engine may legitimately continue to return `UNKNOWN`.

A skipped field must not be immediately selected again as the next question during
the same state of the questionnaire.

Skipping a field must not make a benefit `NO_MATCH`.

---

# 12. Answering after skipping

If the citizen later supplies a valid answer for a previously skipped field:

- store the answer;
- remove that field from `skippedFields`;
- reevaluate the questionnaire normally.

If the citizen explicitly changes an answered field to "I don't know":

- remove its fiscal answer;
- add it to `skippedFields`;
- reevaluate normally.

---

# 13. Answer revision

Previous answers may be changed.

The flow must not depend on irreversible traversal of a hardcoded decision tree.

After an answer is changed, questionnaire state must be reevaluated from the current
answer map.

Previously supplied answers that temporarily become irrelevant MUST NOT be silently
deleted.

They may become useful again after another answer is revised.

Only an explicit citizen action may replace/remove an existing answer.

---

# 14. Candidate benefits

The V0 general Valladolid test evaluates exactly the eight existing approved
Valladolid V0 benefits for exercise 2026.

The candidate-loading application contract must not require the caller to already know
a tax + benefit slug.

The current single-benefit getter may be reused internally where appropriate, but the
general questionnaire needs an explicit candidate-loading contract.

Do not infer candidates from editorial registry entries.

Candidate inclusion comes from structured executable benefit data.

Do not start Madrid.

Do not include 2027 data.

---

# 15. Candidate status

Each candidate must remain independently evaluable using the existing eligibility
semantics.

The questionnaire layer must preserve, rather than redefine, existing concepts such
as:

- `MATCH`
- `UNKNOWN`
- `NO_MATCH`
- `missingFields`
- matched tranche IDs;
- unresolved tranche IDs.

A benefit with `NO_MATCH` is settled for questionnaire purposes.

A benefit with `UNKNOWN` may still require useful information.

A benefit with `MATCH` is NOT automatically settled for questionnaire purposes.

---

# 16. Why MATCH does not always mean complete

The existing engine intentionally allows:

- multiple matching tranches;
- a matched tranche together with unresolved tranches.

Therefore the adaptive questionnaire must distinguish:

1. an unresolved pathway that could still change the useful result;
2. an unresolved alternative pathway that can only establish a result already known
   through another matched pathway.

Do not globally implement:

```text
MATCH → stop asking about this benefit
```

That would be incorrect for the current dataset.

---

# 17. Result equivalence

For questionnaire usefulness only, two tranches may be considered result-equivalent
when their structured economic result descriptors are equal.

Use structured result data, not tranche names or editorial prose.

The comparison must account for the structured result dimensions already represented
by the mapped benefit/tranche data, including as applicable:

- result type;
- value;
- unit.

Do not compare only percentage values.

Do not use database IDs to determine equivalence.

Do not infer legal equivalence from similar wording.

This equivalence exists only to decide whether investigating another unresolved route
can still change the citizen-useful result.

It does not modify eligibility-engine output.

---

# 18. Equivalent alternative pathways

If:

- at least one tranche has `MATCH`; and
- another unresolved tranche can only produce the same structured result;

then the unresolved equivalent tranche does not need to generate further questions
for V0 questionnaire completion.

Examples in the current Valladolid dataset include alternative pathways that establish
the same exemption or same bonus result.

The engine may continue to report that tranche as unresolved.

The questionnaire simply treats its missing fields as no longer useful.

Do not mutate the engine result to hide that unresolved tranche.

---

# 19. Distinct unresolved results

If an unresolved tranche can still produce a structured result that is not already
established by the benefit's matched tranches, its unresolved fields remain potentially
useful.

A benefit therefore may already have `MATCH` while still generating useful questions.

This is particularly important for benefits whose tranches represent different
economic outcomes.

Preserve multiple matches.

Do not sum them.

Do not select a "best" economic result in this feature.

---

# 20. General eligibility gating

Preserve the current service semantics:

- unresolved general eligibility is resolved before tranche questions become relevant;
- general `NO_MATCH` settles the benefit;
- tranche fields must not be asked merely because they exist if general eligibility
  is still unresolved or already failed.

Do not create a second independent interpretation of general eligibility.

---

# 21. Useful field definition

A field is useful for the current questionnaire state only when all of the following
hold:

1. it is not already answered;
2. it is not currently skipped;
3. it is linked to an active usable citizen question;
4. it belongs to an executable unresolved condition that can still affect a
   questionnaire-relevant outcome;
5. the containing benefit has not been settled as `NO_MATCH`;
6. if the benefit already has a matched result, the field can still contribute to a
   distinct unresolved structured result rather than only proving an equivalent
   pathway.

The implementation must derive usefulness from executable rule structure and current
evaluation.

Do not maintain a manually hardcoded list such as:

```ts
if (field === "...") ask ...
```

---

# 22. Useful questions

Current Valladolid V0 uses one question per field and one field per question.

The schema is more general: `PreguntaCampo` is many-to-many.

Do not accidentally encode the current one-to-one seed shape as a database invariant.

For V0, the orchestration must at minimum safely support the existing seeded shape.

If a generic many-to-many mapping cannot be interpreted safely without an explicit
answer transformation, fail explicitly rather than guessing how one response should
populate multiple fiscal fields.

Do not redesign Prisma solely to solve hypothetical future mappings.

---

# 23. Active questions

Only active questions are eligible for citizen selection.

If an executable useful field has no safe active question mapping, the flow must expose
an explicit configuration/data error.

It must NOT:

- silently ignore the field;
- silently mark it skipped;
- silently complete the test;
- fabricate a question.

This invariant prevents an apparently complete questionnaire from hiding missing
executable coverage.

---

# 24. Deterministic next-question policy

Given the same:

- candidate dataset;
- question dataset;
- answers;
- skipped fields;

the selected next question must always be identical.

Selection policy:

1. derive all currently useful unanswered/unskipped fields;
2. resolve those fields to safe active citizen questions;
3. calculate how many still-relevant candidate outcomes each question can affect;
4. prefer the question with the greatest current usefulness reach;
5. break ties using `PreguntaTest.orden` ascending;
6. break any remaining tie using a stable logical key such as question `clave`
   ascending.

Do not use database IDs as the final deterministic tie-breaker.

---

# 25. Usefulness reach

"Usefulness reach" is not a fiscal score and not a probability.

It exists only to reduce unnecessary citizen effort.

It should represent how broadly a question can affect the still-relevant unresolved
questionnaire state.

A shared field that can resolve/eliminate conditions across several still-relevant
benefits/outcomes may therefore be preferred over a field affecting only one.

Do not assign manually tuned fiscal weights in V0.

Do not use result percentage/value as question priority.

Do not prioritize a benefit because its economic value appears larger.

---

# 26. Static question order

`PreguntaTest.orden` is a deterministic tie-breaker, not the primary adaptive
algorithm.

Do not implement the questionnaire as:

```text
Q01 → Q02 → Q03 → ... → Q21
```

Questions that can no longer affect a useful outcome must disappear from the remaining
flow.

---

# 27. Completion

The questionnaire is complete when there is no remaining useful question that is both:

- unanswered; and
- not explicitly skipped.

Completion does NOT require every candidate benefit to have a non-UNKNOWN eligibility
status.

A valid completed questionnaire may contain a mixture of:

- `MATCH`
- `UNKNOWN`
- `NO_MATCH`

`UNKNOWN` after completion can legitimately mean that a potentially relevant benefit
could not be fully resolved because the citizen skipped or did not know required
information.

Do not force answers merely to eliminate UNKNOWN.

---

# 28. No fixed total-question contract

Do not expose questionnaire completion as:

```text
question 4 of 21
```

The number of questions is adaptive and cannot be known from the total seeded question
count.

The flow contract must not require the future UI to present a fixed total.

If progress information is exposed, it must be derived honestly from current
questionnaire state and must not imply that every seeded question will be asked.

Final visual progress design is outside this feature.

---

# 29. Orchestration output

Provide a clear application/domain result that allows future UI layers to know at
least:

- current answers;
- current skipped fields;
- candidate evaluation states;
- whether the questionnaire is complete;
- the next question when one exists.

Candidate evaluation information must preserve enough existing engine output for the
future results feature, including as applicable:

- benefit identity;
- status;
- missing fields;
- matched tranche IDs;
- unresolved tranche IDs.

Do not produce final citizen-facing result prose in this feature.

Do not assert legal entitlement.

---

# 30. Next-question output

The next-question representation should contain the information required by a future
UI to render the question safely without querying Prisma directly.

At minimum, as applicable:

- stable question key;
- citizen question text;
- response type;
- configured options;
- help text;
- mapped field key.

Do not expose Prisma objects directly to the UI contract.

Do not require future client components to understand rule groups.

---

# 31. Application boundaries

Prefer explicit application/service functions over UI-driven orchestration.

The future UI should be able to conceptually perform operations such as:

```text
start test
        ↓
obtain current flow state + next question
        ↓
submit answer OR skip
        ↓
reevaluate
        ↓
obtain next state
```

Exact function/type names are an implementation decision, but responsibilities must
remain explicit and testable without React.

Do not place adaptive business logic in Next.js route/page components.

---

# 32. Database access

Database access belongs in the application/service data-loading boundary.

Pure adaptive decision logic should operate on mapped application/domain data whenever
practical.

Do not query Prisma from React components.

Avoid one database query per candidate when a clear set-based query can load the V0
candidate graph safely.

Do not optimize prematurely at the expense of correctness, but avoid obvious N+1
questionnaire loading.

---

# 33. Seed/data changes

No fiscal seed changes are expected for this feature.

Do not change:

- Valladolid rules;
- percentages;
- exemptions;
- dates;
- question wording;
- question order;
- field keys;
- benefit slugs;
- tranche definitions;

merely to make orchestration easier.

If implementation reveals a genuine contradiction in existing seed data, STOP and
report it rather than changing fiscal data.

---

# 34. Prisma/schema changes

No Prisma schema change is expected.

Do not add:

- questionnaire sessions;
- dependencies;
- priorities;
- skipped-answer tables;
- result-equivalence columns;
- test-run tables;

unless an unavoidable blocker is demonstrated first.

If the current repository cannot satisfy the task without a schema change, STOP and
report the blocker before modifying the schema.

---

# 35. Error handling

Configuration/data inconsistencies must fail explicitly.

Examples include:

- useful executable field with no active usable question;
- incompatible question and field primitive types;
- unsafe many-to-many mapping that would require guessing response translation;
- malformed SELECT options;
- duplicate/ambiguous mapping that prevents deterministic response translation.

Do not turn configuration errors into citizen `UNKNOWN`.

`UNKNOWN` is an eligibility state, not a substitute for broken questionnaire data.

---

# 36. Tests — minimum behavioral contract

Add focused tests proving at least the following behavior.

## Shared answers

A field shared by several benefits affects all relevant candidates from one citizen
answer.

## Branch elimination

When an answer makes a branch/benefit `NO_MATCH`, questions that can only affect that
settled branch stop being useful.

## General eligibility gating

Tranche questions are not asked before unresolved general eligibility has been
sufficiently resolved.

## Equivalent alternative pathway

If one pathway matches and another unresolved pathway can only establish the same
structured result, the unresolved equivalent pathway does not force further
questions.

## Distinct economic result

If one tranche matches but another unresolved tranche can establish a distinct
structured result, its relevant unanswered fields remain eligible for questioning.

## Multiple matches

Multiple matching tranches remain preserved in candidate evaluation.

The questionnaire must not sum or collapse them.

## Skip / "I don't know"

Skipping:

- does not add a fiscal answer;
- does not create `NO_MATCH`;
- prevents immediate reselection of that field;
- permits completion with `UNKNOWN` where appropriate.

## Answer after skip

Supplying a valid answer later removes the field from skipped state and reevaluates
normally.

## Revision

Changing an earlier answer recalculates candidate usefulness from current answers.

Previously supplied answers are not silently deleted because they temporarily became
irrelevant.

## Completion

When no useful unanswered/unskipped question remains, the questionnaire is complete.

This includes a case where one or more candidates remain `UNKNOWN` solely because
required fields were skipped.

## All candidates rejected

If all candidate benefits are settled `NO_MATCH`, the questionnaire completes without
asking unrelated questions.

## Determinism

The same candidate/question data and same state always produce the same next question.

Test tie-breaking.

## SELECT validation

An arbitrary string outside configured options is rejected before it reaches the
eligibility engine.

This specifically protects existing `NEQ` rules from accidental arbitrary-string
matches.

## Numeric validation

Reject non-finite or incompatible numeric responses.

## Missing active question

A useful executable field with no safe active question causes an explicit
configuration failure.

## Unsafe mapping

An ambiguous question/field mapping that cannot be translated safely must fail rather
than guess.

---

# 37. Valladolid integration coverage

Add integration coverage using the real Valladolid V0 data.

At minimum demonstrate representative adaptive behavior for:

- shared family/habitual-residence facts;
- IBI family category tranches;
- sustainable mobility overlapping tranches;
- waste family/income/compost conditions;
- historic versus period pathways;
- disability alternative pathways;
- ORA alternative pathways;
- at least one skipped field leading to a legitimate completed UNKNOWN candidate.

Do not duplicate every existing fiscal boundary test.

Reuse the existing eligibility tests as the source of truth for rule semantics.

The new tests should focus on orchestration behavior.

---

# 38. Existing tests

All existing eligibility, seed, public-benefit and editorial tests must continue to
pass unchanged unless a genuine pre-existing defect is demonstrated.

Do not weaken existing assertions to make the new orchestration pass.

---

# 39. Suggested code organization

Choose names that fit the existing repository, but keep responsibilities visibly
separated.

A reasonable shape may include concepts under:

```text
src/services/citizen-test/
```

for:

- application-facing types;
- candidate/question loading;
- answer validation;
- flow evaluation;
- useful-field derivation;
- next-question selection.

Pure logic may be extracted further if that materially improves testability.

Do not create abstraction layers merely to match this suggested folder list.

Do not introduce a framework for workflows/state machines unless the existing
requirements demonstrate a concrete need.

A simple deterministic functional orchestration is preferred.

---

# 40. No hardcoded Valladolid rule logic

The implementation may configure:

```text
municipality = valladolid
exercise = 2026
```

for the V0 entry point.

It must NOT contain logic such as:

```ts
if (fieldKey === "vivienda_habitual") ...
if (benefitSlug === "discapacidad") ...
if (tax === "IVTM") ...
```

to decide fiscal behavior or question usefulness.

Adaptive behavior must emerge from mapped executable rule/result structure.

---

# 41. Performance expectations

The V0 dataset is small.

Favor correctness, determinism and readability over complex optimization.

However:

- avoid obvious N+1 database access;
- avoid repeated database loading for every pure decision;
- reuse a loaded questionnaire/candidate graph while evaluating one state where
  practical.

No caching infrastructure is required by this task.

---

# 42. Server/client boundary

The orchestration must be usable from server-side application code.

Do not make the core flow depend on browser APIs, React state, Next navigation, or
client components.

The later questionnaire UI may choose its transport/state strategy separately.

This feature should leave that choice open.

---

# 43. Fiscal/editorial uncertainty

Preserve existing approved uncertainty.

Examples include, but are not limited to:

- IPREM threshold/modal interpretation;
- GLP/CO2 interpretation;
- exact "vehículo de época" accreditation;
- compost administrative verification;
- ORA age-boundary/editorial cautions.

The adaptive flow must not resolve those uncertainties by inventing executable facts.

A future results/UI layer may explain them using approved editorial content.

---

# 44. Acceptance criteria

The feature is accepted when:

1. a general Valladolid 2026 test can load the complete existing executable candidate
   set;
2. active questions can be safely mapped to executable fields;
3. valid citizen answers can be translated into the existing `Answers` contract;
4. invalid answers are rejected before eligibility evaluation;
5. skipped fields remain absent from fiscal answers;
6. all candidates can be reevaluated from partial state;
7. useful unanswered fields can be derived without hardcoded fiscal field keys;
8. equivalent unresolved pathways do not cause unnecessary questions after an
   equivalent result has matched;
9. unresolved distinct results remain investigable;
10. next-question selection is deterministic and prioritizes current usefulness reach,
    then question order, then stable logical key;
11. the questionnaire can complete with legitimate UNKNOWN candidates after skipped
    information;
12. answer revision recomputes the flow without irreversible tree state;
13. configuration inconsistencies fail explicitly;
14. no Prisma schema change is required;
15. no fiscal seed/rule change is required;
16. no UI/results implementation is introduced;
17. all new focused/integration tests pass;
18. all existing tests pass;
19. TypeScript passes;
20. lint passes;
21. production build passes;
22. `git diff --check` passes;
23. `pnpm validate` passes.

---

# 45. Implementation audit before editing

Before modifying code, inspect the current repository and verify this task against the
real implementation.

Specifically confirm:

1. the exact mapped result fields available for comparing tranche result equivalence;
2. whether the existing eligibility mapper preserves enough tranche-to-rule information
   for useful-field derivation;
3. the safest set-based Prisma query for the eight Valladolid candidates;
4. the exact shape of `PreguntaTest.opciones`;
5. the current active-question loading behavior;
6. whether question/field type compatibility can be validated without schema changes;
7. whether any current Valladolid mapping violates the one-question/one-field shape;
8. whether any useful field lacks an active question;
9. whether the current seeded data contains result-equivalent tranches exactly as
   assumed by this task;
10. whether the useful-field algorithm can be implemented without changing eligibility
    semantics.

If any material contradiction is found between this task and the repository, STOP
before implementation and report it.

Minor naming/organization differences are not blockers.

---

# 46. Required implementation report

When implementation is complete, report:

1. files created and modified;
2. final application/domain contracts;
3. how candidates/questions are loaded;
4. how answers are validated;
5. how skipped fields are represented;
6. exact useful-field algorithm;
7. exact result-equivalence comparison;
8. exact usefulness-reach calculation;
9. exact deterministic tie-break sequence;
10. exact completion rule;
11. how answer revision works;
12. configuration errors detected explicitly;
13. Valladolid integration scenarios covered;
14. test counts/results;
15. TypeScript result;
16. lint result;
17. production build result;
18. `pnpm validate` result;
19. confirmation that Prisma schema and fiscal seed/rules were not changed;
20. any deviations from this task and why.

Do not commit.