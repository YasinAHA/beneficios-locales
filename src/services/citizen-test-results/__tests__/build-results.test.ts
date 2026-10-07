import { describe, expect, it } from "vitest";
import type { Answers, RuleGroup } from "@/domain/eligibility/types";
import { evaluateBenefitEligibility } from "@/services/eligibility/evaluate-benefit-eligibility";
import { applyCitizenTestAction, evaluateCitizenTest } from "@/services/citizen-test/flow";
import { CitizenTestConfigurationError, type CitizenTestData } from "@/services/citizen-test/types";
import { buildCitizenTestResults } from "../build-results";
import type { StructuredCitizenResult } from "../types";

const descriptor = (value: string | null = "40", type = "PORCENTAJE", unit: string | null = "cuota") => ({ type, value, unit });
const groups = (field: string): RuleGroup[] => [{ operator: "AND", rules: [{ field: { key: field, type: "BOOLEAN" }, operator: "EQ", value: true }] }];
function dataset(results: StructuredCitizenResult[] = [], gate = false): CitizenTestData {
    const fields = [...results.map((_, i) => `field-${i}`), ...(gate ? ["gate"] : [])];
    return {
        candidates: [{
            key: "candidate", municipalitySlug: "example", tax: "TAX", benefitSlug: "benefit", exercise: 2026,
            benefit: {
                id: "private-id", result: descriptor(), eligibility: { groups: gate ? groups("gate") : [] },
                tranches: results.map((_, i) => ({ id: `route-${i}`, groups: groups(`field-${i}`) })),
                trancheDetails: Object.fromEntries(results.map((r, i) => [`route-${i}`, { name: `Route ${i}`, ...r }])),
            },
        }],
        questions: fields.map((field, order) => ({
            key: `question-${field}`, text: `Configured ${field}?`, responseType: "BOOLEAN", options: null,
            help: null, active: true, order, fields: [{ key: field, type: "BOOLEAN" }],
        })),
    };
}
function project(data: CitizenTestData, answers: Answers = {}, skippedFields: string[] = []) {
    return buildCitizenTestResults(data, evaluateCitizenTest(data, { answers, skippedFields }));
}
const one = (data: CitizenTestData, answers: Answers = {}, skipped: string[] = []) => project(data, answers, skipped).benefits[0];
function freeze(value: unknown) {
    if (value && typeof value === "object") {
        Object.values(value).forEach(freeze);
        Object.freeze(value);
    }
}

describe("citizen results projection", () => {
    it.each([[true, "COMPATIBLE"], [undefined, "POSSIBLE"], [false, "NOT_COMPATIBLE"]] as const)(
        "maps engine status for gate answer %s", (answer, status) => {
            const data = dataset([], true);
            expect(one(data, answer === undefined ? {} : { gate: answer }).status).toBe(status);
        },
    );
    it("projects fixed MATCH exclusively from the mapped descriptor", () => {
        const data = dataset();
        data.candidates[0].benefit.result = descriptor(null, "EXENCION", null);
        expect(one(data).matchedResults).toEqual([descriptor(null, "EXENCION", null)]);
    });
    it("counts candidates once, including a match with distinct unresolved results", () => {
        const data = dataset([descriptor(), descriptor("90")]);
        const other = dataset([], true).candidates[0];
        data.candidates.push({ ...other, key: "possible", benefitSlug: "possible" }, { ...other, key: "rejected", benefitSlug: "rejected", benefit: { ...other.benefit, eligibility: { groups: groups("reject") } } });
        data.questions.push(...dataset([], true).questions, { ...dataset([], true).questions[0], key: "reject", fields: [{ key: "reject", type: "BOOLEAN" }] });
        expect(project(data, { "field-0": true, reject: false }).summary).toEqual({ compatible: 1, possible: 1, notCompatible: 1 });
    });
    it("deduplicates multiple equivalent MATCH pathways", () => {
        expect(one(dataset([descriptor(), descriptor()]), { "field-0": true, "field-1": true }).matchedResults).toEqual([descriptor()]);
    });
    it("suppresses equivalent UNKNOWN outcomes and their missing fields after MATCH", () => {
        const result = one(dataset([descriptor(), descriptor()]), { "field-0": true });
        expect(result.unresolvedResults).toEqual([]);
        expect(result.missingInformation).toEqual([]);
    });
    it("keeps distinct UNKNOWN outcomes without downgrading MATCH", () => {
        const result = one(dataset([descriptor(), descriptor("90")]), { "field-0": true });
        expect(result.status).toBe("COMPATIBLE");
        expect(result.matchedResults).toEqual([descriptor()]);
        expect(result.unresolvedResults).toEqual([{ ...descriptor("90"), missingInformation: [{ fieldKey: "field-1", questionKey: "question-field-1", question: "Configured field-1?", reason: "UNANSWERED" }] }]);
    });
    it("merges equivalent UNKNOWN pathways and their missing information", () => {
        const result = one(dataset([descriptor(), descriptor()]));
        expect(result.unresolvedResults).toHaveLength(1);
        expect(result.unresolvedResults[0].missingInformation.map(m => m.fieldKey)).toEqual(["field-0", "field-1"]);
    });
    it("associates skipped and unanswered fields with their own distinct pending result", () => {
        const result = one(dataset([descriptor(), descriptor("90")]), {}, ["field-0"]);
        expect(result.unresolvedResults.map(r => [r.value, r.missingInformation.map(m => [m.fieldKey, m.reason])]))
            .toEqual([["40", [["field-0", "SKIPPED"]]], ["90", [["field-1", "UNANSWERED"]]]]);
        expect(result.missingInformation).toEqual([]);
    });
    it("orders matched descriptors structurally rather than by percentage preference", () => {
        const result = one(dataset([descriptor("90"), descriptor("40"), descriptor("100")]), {
            "field-0": true, "field-1": true, "field-2": true,
        });
        expect(result.matchedResults.map(r => r.value)).toEqual(["100", "40", "90"]);
    });
    it.each([
        descriptor("40", "IMPORTE"), descriptor("40", "PORCENTAJE", "other"),
        descriptor(null), descriptor("40", "PORCENTAJE", null),
    ])("preserves distinct type/value/unit including null: %j", result => {
        expect(one(dataset([descriptor(), result]), { "field-0": true }).unresolvedResults).toHaveLength(1);
    });
    it("deduplicates descriptors with null values and units", () => {
        const result = descriptor(null, "EXENCION", null);
        expect(one(dataset([result, result]), { "field-0": true }).unresolvedResults).toEqual([]);
    });
    it("marks skipped relevant information without manufacturing fiscal answers", () => {
        const data = dataset([], true);
        const flow = evaluateCitizenTest(data, { answers: {}, skippedFields: ["gate"] });
        const result = buildCitizenTestResults(data, flow);
        expect(result.complete).toBe(true);
        expect(result.benefits[0].status).toBe("POSSIBLE");
        expect(result.benefits[0].unresolvedResults[0].missingInformation[0].reason).toBe("SKIPPED");
        expect(flow.state.answers).toEqual({});
    });
    it("supports partial results and unanswered information", () => {
        const result = project(dataset([], true));
        expect(result.complete).toBe(false);
        expect(result.benefits[0].unresolvedResults[0].missingInformation[0].reason).toBe("UNANSWERED");
    });
    it("keeps general gate information without speculating on tranche outcomes", () => {
        const result = one(dataset([descriptor(), descriptor("90")], true));
        expect(result.unresolvedResults).toEqual([]);
        expect(result.missingInformation.map(m => m.fieldKey)).toEqual(["gate"]);
    });
    it("keeps per-result provenance, excluding resolved OR and failed branches", () => {
        const data = dataset([descriptor(), descriptor("90"), descriptor("80")]);
        data.candidates[0].benefit.tranches[0].groups = [{ operator: "OR", rules: [...groups("field-0")[0].rules, ...groups("field-1")[0].rules] }];
        const result = one(data, { "field-0": true, "field-2": false });
        expect(result.unresolvedResults).toHaveLength(1);
        expect(result.unresolvedResults[0].value).toBe("90");
        expect(result.unresolvedResults[0].missingInformation.map(m => m.fieldKey)).toEqual(["field-1"]);
    });
    it("revises results without retaining state", () => {
        const data = dataset([], true);
        const a = evaluateCitizenTest(data, { answers: { gate: true }, skippedFields: [] });
        const b = applyCitizenTestAction(data, a.state, { type: "answer", questionKey: "question-gate", value: false });
        expect(buildCitizenTestResults(data, b).benefits[0].status).toBe("NOT_COMPATIBLE");
        expect(buildCitizenTestResults(data, a).benefits[0].status).toBe("COMPATIBLE");
    });
    it("uses code-unit descriptor order, independent of tranche, candidate and missing field ordering", () => {
        const data = dataset([descriptor("90"), descriptor("40"), descriptor("100")]);
        data.candidates.push({ ...data.candidates[0], key: "other", benefitSlug: "a-benefit" });
        const flow = evaluateCitizenTest(data);
        const original = buildCitizenTestResults(data, flow);
        expect(original.benefits[0].unresolvedResults.map(r => r.value)).toEqual(["100", "40", "90"]);
        data.candidates.reverse(); data.questions.reverse();
        data.candidates[0].benefit.tranches.reverse();
        flow.candidates.reverse();
        flow.candidates.forEach(c => { c.missingFields.reverse(); c.unknownTrancheIds.reverse(); });
        expect(buildCitizenTestResults(data, flow)).toEqual(original);
    });
    it("serializes using only ordinary objects, arrays, strings, numbers, booleans and null", () => {
        const result = project(dataset([descriptor(null), descriptor("90")]));
        expect(JSON.parse(JSON.stringify(result))).toEqual(result);
        function inspect(value: unknown) {
            if (value !== null && typeof value === "object") {
                expect([Object.prototype, Array.prototype]).toContain(Object.getPrototypeOf(value));
                Object.values(value).forEach(inspect);
            } else expect(["string", "number", "boolean", "object"]).toContain(typeof value);
        }
        inspect(result);
    });
    it("preserves frozen inputs, answers, skips, evaluations and eligibility output", () => {
        const data = dataset([descriptor(), descriptor("90")]);
        const flow = evaluateCitizenTest(data, { answers: { "field-0": true }, skippedFields: ["field-1"] });
        const snapshot = JSON.stringify({ data, flow });
        const evaluation = evaluateBenefitEligibility(data.candidates[0].benefit, flow.state.answers);
        freeze(data); freeze(flow);
        buildCitizenTestResults(data, flow);
        expect(JSON.stringify({ data, flow })).toBe(snapshot);
        expect(evaluateBenefitEligibility(data.candidates[0].benefit, flow.state.answers)).toEqual(evaluation);
    });
});

describe("results configuration errors", () => {
    it("fails when relevant pending information has no usable question", () => {
        const data = dataset([], true); const flow = evaluateCitizenTest(data);
        data.questions = [];
        expect(() => buildCitizenTestResults(data, flow)).toThrow(CitizenTestConfigurationError);
    });
    it("does not demand questions for suppressed equivalent pathways", () => {
        const data = dataset([descriptor(), descriptor()]);
        const flow = evaluateCitizenTest(data, { answers: { "field-0": true }, skippedFields: [] });
        data.questions.pop();
        expect(buildCitizenTestResults(data, flow).benefits[0].unresolvedResults).toEqual([]);
    });
    it.each(["matchedTrancheIds", "unknownTrancheIds"] as const)("rejects missing detail for %s", field => {
        const data = dataset([descriptor()]); const flow = evaluateCitizenTest(data);
        flow.candidates[0][field] = ["absent"];
        expect(() => buildCitizenTestResults(data, flow)).toThrow(CitizenTestConfigurationError);
        flow.candidates[0][field] = ["route-0"];
        delete data.candidates[0].benefit.trancheDetails["route-0"];
        expect(() => buildCitizenTestResults(data, flow)).toThrow(CitizenTestConfigurationError);
    });
    it("rejects invalid fixed descriptors", () => {
        const data = dataset(); const flow = evaluateCitizenTest(data);
        data.candidates[0].benefit.result.type = "";
        expect(() => buildCitizenTestResults(data, flow)).toThrow(CitizenTestConfigurationError);
    });
    it("rejects unsafe question mapping", () => {
        const data = dataset([], true); const flow = evaluateCitizenTest(data);
        data.questions[0].fields.push({ key: "gate", type: "BOOLEAN" });
        expect(() => buildCitizenTestResults(data, flow)).toThrow(CitizenTestConfigurationError);
    });
    it("rejects duplicate logical identities even when candidate keys differ", () => {
        const data = dataset(); const flow = evaluateCitizenTest(data);
        data.candidates.push({ ...data.candidates[0], key: "different" });
        flow.candidates.push({ ...flow.candidates[0], key: "different" });
        expect(() => buildCitizenTestResults(data, flow)).toThrow(CitizenTestConfigurationError);
    });
    it("rejects duplicate or mismatched flow candidates", () => {
        const data = dataset(); const flow = evaluateCitizenTest(data);
        flow.candidates[0].benefitSlug = "wrong";
        expect(() => buildCitizenTestResults(data, flow)).toThrow(CitizenTestConfigurationError);
    });
    it("rejects repeated flow candidates even when the list length is correct", () => {
        const data = dataset();
        data.candidates.push({ ...data.candidates[0], key: "other", benefitSlug: "other" });
        const flow = evaluateCitizenTest(data);
        flow.candidates[1] = flow.candidates[0];
        expect(() => buildCitizenTestResults(data, flow)).toThrow(CitizenTestConfigurationError);
    });
});
