# Citizen test results

`buildCitizenTestResults(data: CitizenTestData, flow: CitizenTestFlow)` is a pure,
in-memory projection of a valid current flow. It performs no database queries,
stores no state and does not validate answers again. Pass the data that produced
the flow; after revisions, pass the newly evaluated flow.

The output contains `complete` copied from the flow, a benefit-count `summary`
(`compatible`, `possible`, `notCompatible`) and all candidate `benefits`, including
rejected candidates. Each benefit preserves `municipalitySlug`, `tax`,
`benefitSlug`, `exercise`, `status`, `matchedResults`, `unresolvedResults` and
`missingInformation`. Logical identity allows a future caller to resolve
`getPublicBenefit(identity)` separately; editorial content is not duplicated.

Engine `MATCH` maps to `COMPATIBLE`, `UNKNOWN` to `POSSIBLE`, and `NO_MATCH` to
`NOT_COMPATIBLE`. Compatibility is according to supplied answers, not a grant,
recognized entitlement or administrative approval. Incomplete flows are valid;
completed flows may still contain possible benefits after skips.

Descriptors preserve `{ type, value, unit }` from the mapper, with decimal values
as strings and nulls unchanged. Fixed benefits use `benefit.result`; benefits
with tranches use the flow's selected IDs and `trancheDetails`. Equivalence uses
the citizen-test `resultKey()` tuple `[type,value,unit]`, including nulls. Equivalent
pathways collapse into one descriptor. An equivalent UNKNOWN pathway contributes
neither a duplicate outcome nor missing information after a MATCH. Different
UNKNOWN outcomes remain unresolved even when the benefit is compatible.

Each unresolved descriptor owns its `missingInformation`, merged across equivalent
UNKNOWN pathways. The existing `evaluateGroups` evaluator recovers per-tranche
missing fields because the flow retains only their union; it does not replace
the flow's status or selections. For a fixed UNKNOWN result, the flow's missing
fields belong directly to that result. When a general gate prevents tranche
evaluation, results remain empty and benefit-level `missingInformation` describes
the gate. No tranche outcomes or tranche questions are inferred behind that gate.
These two locations avoid duplicating the same information in a global list.

Missing information includes the field key, configured question key/text and
`SKIPPED` (explicitly omitted) or `UNANSWERED` (not yet supplied). Skips remain
outside fiscal answers. The existing questionnaire index enforces safe active
1:1 question mappings. Broken descriptors, referenced tranches, candidate sets,
identities or relevant question mappings throw `CitizenTestConfigurationError`.

Output uses ordinary objects and arrays suitable for JSON/server-to-client use.
Benefits sort by code-unit comparison of their JSON logical identity tuple;
descriptors sort by code-unit comparison of `resultKey()`; missing information
sorts by field key. This is structural order, with no locale dependency, fiscal
preference, ranking, saving estimate or aggregation of benefits. Input data,
answers, skips and evaluations are never mutated.
