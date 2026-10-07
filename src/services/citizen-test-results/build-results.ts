import { evaluateGroups } from "@/domain/eligibility/evaluate-groups";
import { indexQuestionnaire, resultKey } from "@/services/citizen-test/configuration";
import {
    CitizenTestConfigurationError,
    type CitizenTestData,
    type CitizenTestFlow,
} from "@/services/citizen-test/types";
import type {
    CitizenBenefitResult,
    CitizenBenefitResultStatus,
    CitizenTestResults,
    MissingInformation,
    StructuredCitizenResult,
    UnresolvedCitizenResult,
} from "./types";

function compare(a: string, b: string): number {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}
const identityKey = (c: Pick<CitizenBenefitResult, "municipalitySlug" | "tax" | "benefitSlug" | "exercise">) =>
    JSON.stringify([c.municipalitySlug, c.tax, c.benefitSlug, c.exercise]);
const statuses = {
    MATCH: "COMPATIBLE", UNKNOWN: "POSSIBLE", NO_MATCH: "NOT_COMPATIBLE",
} as const satisfies Record<CitizenTestFlow["candidates"][number]["status"], CitizenBenefitResultStatus>;

function descriptor(result: StructuredCitizenResult | undefined): StructuredCitizenResult {
    if (!result || typeof result.type !== "string" || !result.type ||
        (result.value !== null && typeof result.value !== "string") ||
        (result.unit !== null && typeof result.unit !== "string")) {
        throw new CitizenTestConfigurationError("Missing or invalid structured result");
    }
    return { type: result.type, value: result.value, unit: result.unit };
}

export function buildCitizenTestResults(data: CitizenTestData, flow: CitizenTestFlow): CitizenTestResults {
    const { byField } = indexQuestionnaire(data);
    const candidates = new Map(data.candidates.map(c => [c.key, c]));
    const identities = new Set(data.candidates.map(identityKey));
    if (identities.size !== data.candidates.length || flow.candidates.length !== candidates.size) {
        throw new CitizenTestConfigurationError("Inconsistent results candidate set");
    }
    const skipped = new Set(flow.state.skippedFields);
    function missing(fields: string[]): MissingInformation[] {
        return [...new Set(fields)].sort(compare).map(fieldKey => {
            const question = byField.get(fieldKey);
            if (!question) throw new CitizenTestConfigurationError(`No active usable question: ${fieldKey}`);
            return {
                fieldKey, questionKey: question.key, question: question.text,
                reason: skipped.has(fieldKey) ? "SKIPPED" : "UNANSWERED",
            };
        });
    }
    const seen = new Set<string>();
    const benefits = flow.candidates.map(evaluation => {
        const candidate = candidates.get(evaluation.key);
        if (!candidate || seen.has(evaluation.key) || identityKey(candidate) !== identityKey(evaluation) ||
            candidate.benefit.id !== evaluation.benefitId) {
            throw new CitizenTestConfigurationError(`Inconsistent results candidate: ${evaluation.key}`);
        }
        seen.add(evaluation.key);
        const { benefit } = candidate;
        const matched = new Map<string, StructuredCitizenResult>();
        const unresolved = new Map<string, { result: StructuredCitizenResult; fields: string[] }>();
        const trancheById = new Map(benefit.tranches.map(t => [t.id, t]));
        function trancheResult(id: string) {
            if (!trancheById.has(id)) throw new CitizenTestConfigurationError(`Missing tranche: ${id}`);
            return descriptor(benefit.trancheDetails[id]);
        }
        function collectTrancheResults() {
            for (const id of evaluation.matchedTrancheIds) {
                const result = trancheResult(id);
                matched.set(resultKey(result), result);
            }
            for (const id of evaluation.unknownTrancheIds) {
                const result = trancheResult(id);
                const key = resultKey(result);
                if (matched.has(key)) continue;
                // The flow retains only the union. Recover provenance with the existing
                // evaluator, never replacing its candidate status or tranche selections.
                const fields = evaluateGroups(trancheById.get(id)!.groups, flow.state.answers).missingFields;
                const previous = unresolved.get(key);
                unresolved.set(key, { result, fields: [...(previous?.fields ?? []), ...fields] });
            }
        }
        // Validate all referenced IDs, including equivalent UNKNOWN pathways we suppress.
        evaluation.matchedTrancheIds.forEach(id => trancheResult(id));
        evaluation.unknownTrancheIds.forEach(id => trancheResult(id));
        let candidateMissing: MissingInformation[] = [];
        if (benefit.tranches.length === 0) {
            const result = descriptor(benefit.result);
            if (evaluation.status === "MATCH") matched.set(resultKey(result), result);
            if (evaluation.status === "UNKNOWN") {
                unresolved.set(resultKey(result), { result, fields: evaluation.missingFields });
            }
        } else {
            collectTrancheResults();
            if (evaluation.status === "UNKNOWN" && evaluation.unknownTrancheIds.length === 0) {
                candidateMissing = missing(evaluation.missingFields);
            }
        }
        const matchedResults = [...matched].sort(([a], [b]) => compare(a, b)).map(([, r]) => r);
        const unresolvedResults: UnresolvedCitizenResult[] = [...unresolved]
            .sort(([a], [b]) => compare(a, b))
            .map(([, { result, fields }]) => ({ ...result, missingInformation: missing(fields) }));
        return {
            municipalitySlug: candidate.municipalitySlug, tax: candidate.tax,
            benefitSlug: candidate.benefitSlug, exercise: candidate.exercise,
            status: statuses[evaluation.status], matchedResults, unresolvedResults,
            missingInformation: candidateMissing,
        };
    }).sort((a, b) => compare(identityKey(a), identityKey(b)));
    const summary = { compatible: 0, possible: 0, notCompatible: 0 };
    for (const benefit of benefits) {
        if (benefit.status === "COMPATIBLE") summary.compatible++;
        else if (benefit.status === "POSSIBLE") summary.possible++;
        else summary.notCompatible++;
    }
    return { complete: flow.complete, summary, benefits };
}
