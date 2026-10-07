# Citizen test orchestration

`loadValladolidCitizenTest()` loads the eight VIGENTE executable candidates for
Valladolid, exercise 2026, with their complete rule/tranche graph in one Prisma
`findMany`. A second set-based query loads active questions intersecting the
executable fields, including **all** their mappings. No editorial registry drives
candidate selection. Incorrect candidate count or duplicate logical candidates fail.
Reuse this loaded `CitizenTestData` for every pure evaluation/action.

`evaluateCitizenTest(data, state?)` starts or reevaluates a flow. It returns validated
state, independent candidate identities and unchanged eligibility-service results,
useful field keys, completion and nullable next-question rendering metadata.
`applyCitizenTestAction(data, state, action)` accepts an answer (question key and
unknown response) or skip (question key), and returns the fully reevaluated flow.
Neither function depends on Prisma, React, Next.js or browser APIs.

State consists only of field-key `Answers` and serializable `skippedFields`.
Every supplied value is validated before calling the eligibility service, including
caller-supplied state. BOOLEAN requires a boolean, NUMBER a finite number, TEXT a
string mapped to STRING, and SELECT an exact member of its configured string array.
There is no coercion. Undefined entries are rejected rather than treated as answers.
Answers are copied into a null-prototype record so inherited properties cannot supply
fiscal facts. Skip removes the answer; answering removes the skip. Other supplied
answers remain intact, even when temporarily irrelevant. No state is persisted.

Usefulness is derived with the existing evaluators:

1. Unresolved general eligibility contributes only its engine-reported missing fields;
   it represents one unresolved candidate gate. Failed general eligibility contributes
   nothing. Tranche questions are gated until general eligibility matches.
2. After general MATCH, each UNKNOWN tranche contributes its engine-reported missing
   fields, except when its structured result already equals a matched tranche result.
   Resolved AND/OR conditions and failed tranches contribute nothing.
3. Result equivalence compares the tuple `[type, value, unit]`, including nulls, within
   a benefit. Decimal values use the existing mapper's canonical Prisma Decimal string.
   Pathway names, IDs and prose are excluded. Eligibility output is never changed.
4. Answered and skipped fields are excluded. Every remaining field must resolve to one
   active usable question. Reach is the number of distinct outcome tokens touched:
   `(candidate key, general gate)` or `(candidate key, structured result tuple)`.
   Equivalent unresolved pathways touching the same field count once; distinct results
   and different candidates count separately. Skipped facts are not presumed false.
5. Choose greatest reach, then ascending question order, then ascending question key
   using deterministic code-unit comparison, independent of database IDs or locale.
   Completion means no useful unanswered/unskipped question remains. UNKNOWN can remain
   because of skips or because an unresolved equivalent pathway adds no useful result.

Configuration errors are distinct from invalid response errors and fiscal UNKNOWN.
They cover absent active useful mappings, zero/multiple field links, duplicate field
or question mappings, incompatible or conflicting primitive types, malformed SELECT
options (nonempty unique string array required), invalid question identity/order,
missing structured tranche results and duplicate logical candidates. Many-to-many
translations require an explicit transformation contract outside this V0 scope;
they are rejected here. No dependencies are inferred from wording or municipal facts.

There is no fixed total-question count, economic aggregation, best-result selection,
citizen-facing result wording, UI, fiscal seed modification or schema modification.
