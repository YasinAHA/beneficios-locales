import { describe, expect, it } from "vitest";
import type { FieldType, Rule, RuleGroup } from "@/domain/eligibility/types";
import { applyCitizenTestAction, evaluateCitizenTest } from "../flow";
import { resultKey } from "../configuration";
import {
    CitizenTestConfigurationError,
    CitizenTestResponseError,
    type CitizenTestCandidate,
    type CitizenTestData,
    type CitizenTestQuestion,
    type CitizenTestState,
} from "../types";

const empty = (): CitizenTestState => ({ answers: {}, skippedFields: [] });
const rule = (key: string, type: FieldType = "BOOLEAN", value: unknown = true, operator: Rule["operator"] = "EQ"): Rule =>
    ({ field: { key, type }, operator, value });
const group = (...rules: Rule[]): RuleGroup => ({ operator: "AND", rules });
const result = (value: string | null = "40", type = "PORCENTAJE", unit: string | null = "cuota") =>
    ({ name: "Pathway", type, value, unit });
const candidate = (key: string, groups: RuleGroup[] = []): CitizenTestCandidate => ({
    key, municipalitySlug: "example", tax: "example", benefitSlug: key, exercise: 2026,
    benefit: { id: key, result: result(), eligibility: { groups }, tranches: [], trancheDetails: {} },
});
const question = (key: string, responseType: CitizenTestQuestion["responseType"] = "BOOLEAN", order = 0): CitizenTestQuestion => ({
    key, text: `Question ${key}`, help: null, responseType,
    options: responseType === "SELECT" ? ["a", "b"] : null,
    order, active: true,
    fields: [{ key, type: responseType === "SELECT" || responseType === "TEXT" ? "STRING" : responseType }],
});
function pathways(secondResult = result()): CitizenTestData {
    const c = candidate("paths");
    c.benefit.tranches = [
        { id: "first", groups: [group(rule("a"))] },
        { id: "second", groups: [group(rule("b"), rule("c"))] },
    ];
    c.benefit.trancheDetails = { first: result(), second: secondResult };
    return { candidates: [c], questions: [question("a"), question("b"), question("c")] };
}

describe("citizen test adaptive flow", () => {
    it("prioritizes shared reach above order, applies one answer to every candidate", () => {
        const data = {
            candidates: [candidate("one", [group(rule("shared"), rule("local"))]), candidate("two", [group(rule("shared"))])],
            questions: [question("local", "BOOLEAN", 1), question("shared", "BOOLEAN", 100)],
        };
        expect(evaluateCitizenTest(data).nextQuestion).toMatchObject({ key: "shared", usefulnessReach: 2 });
        const flow = applyCitizenTestAction(data, empty(), { type: "answer", questionKey: "shared", value: false });
        expect(flow.candidates.map(c => c.status)).toEqual(["NO_MATCH", "NO_MATCH"]);
        expect(flow).toMatchObject({ complete: true, nextQuestion: null, usefulFields: [] });
    });

    it("gates tranche questions on general eligibility", () => {
        const data = pathways(result("90"));
        data.candidates[0].benefit.eligibility.groups = [group(rule("gate"))];
        data.questions.push(question("gate", "BOOLEAN", 500));
        expect(evaluateCitizenTest(data).usefulFields).toEqual(["gate"]);
        expect(evaluateCitizenTest(data, { answers: { gate: false }, skippedFields: [] }).complete).toBe(true);
        expect(evaluateCitizenTest(data, { answers: { gate: true }, skippedFields: [] }).usefulFields).toEqual(["a", "b", "c"]);
    });

    it("does not ask fields from resolved OR groups or failed sibling branches", () => {
        const data = {
            candidates: [candidate("or", [{ operator: "OR" as const, rules: [rule("a"), rule("b")] }, group(rule("c"))])],
            questions: [question("a"), question("b"), question("c")],
        };
        expect(evaluateCitizenTest(data, { answers: { a: true }, skippedFields: [] }).usefulFields).toEqual(["c"]);
        expect(evaluateCitizenTest(data, { answers: { c: false }, skippedFields: [] }).complete).toBe(true);
        expect(evaluateCitizenTest(data, { answers: { a: false }, skippedFields: [] }).usefulFields).toEqual(["b", "c"]);
    });

    it("suppresses only equivalent unresolved results and leaves engine output intact", () => {
        const flow = evaluateCitizenTest(pathways(), { answers: { a: true }, skippedFields: [] });
        expect(flow).toMatchObject({ complete: true, nextQuestion: null });
        expect(flow.candidates[0]).toMatchObject({ status: "MATCH", matchedTrancheIds: ["first"], unknownTrancheIds: ["second"], missingFields: ["b", "c"] });
    });

    it.each([result("90"), result("40", "IMPORTE"), result("40", "PORCENTAJE", "parte_variable")])(
        "preserves distinct unresolved values, types and units: %j", descriptor => {
            const flow = evaluateCitizenTest(pathways(descriptor), { answers: { a: true }, skippedFields: [] });
            expect(flow.candidates[0].status).toBe("MATCH");
            expect(flow.usefulFields).toEqual(["b", "c"]);
            expect(flow.complete).toBe(false);
        },
    );

    it("compares nullable exemptions structurally, ignoring names and IDs", () => {
        const a = result(null, "EXENCION");
        expect(resultKey(a)).toBe(resultKey({ ...a, name: "Different route" }));
        expect(resultKey(a)).not.toBe(resultKey(result("0", "EXENCION")));
        expect(resultKey(a)).not.toBe(resultKey(result(null, "EXENCION", null)));
    });

    it("preserves multiple matching tranches without collapsing them", () => {
        const flow = evaluateCitizenTest(pathways(), { answers: { a: true, b: true, c: true }, skippedFields: [] });
        expect(flow.candidates[0].matchedTrancheIds).toEqual(["first", "second"]);
        expect(flow.complete).toBe(true);
    });

    it("deduplicates equivalent outcome reach per field, but counts distinct results", () => {
        const data = pathways();
        data.candidates[0].benefit.tranches[1].groups = [group(rule("a"))];
        data.questions = [question("a")];
        expect(evaluateCitizenTest(data).nextQuestion?.usefulnessReach).toBe(1);
        data.candidates[0].benefit.trancheDetails.second = result("90");
        expect(evaluateCitizenTest(data).nextQuestion?.usefulnessReach).toBe(2);
    });

    it("removes settled candidates from current reach", () => {
        const data = {
            candidates: [candidate("one", [group(rule("shared"), rule("gate"))]), candidate("two", [group(rule("shared"))])],
            questions: [question("shared"), question("gate")],
        };
        expect(evaluateCitizenTest(data, { answers: { gate: false }, skippedFields: [] }).nextQuestion)
            .toMatchObject({ key: "shared", usefulnessReach: 1 });
    });

    it("uses ascending order then stable question key, independent of dataset ordering", () => {
        const data = {
            candidates: [candidate("one", [group(rule("z"), rule("b"), rule("a"))])],
            questions: [question("z", "BOOLEAN", 0), question("b", "BOOLEAN", 1), question("a", "BOOLEAN", 1)],
        };
        expect(evaluateCitizenTest(data).nextQuestion?.key).toBe("z");
        const state = { answers: {}, skippedFields: ["z"] };
        expect(evaluateCitizenTest(data, state).nextQuestion?.key).toBe("a");
        data.questions.reverse();
        data.candidates[0].benefit.eligibility.groups[0].rules.reverse();
        expect(evaluateCitizenTest(data, state).nextQuestion?.key).toBe("a");
    });

    it("skips outside Answers, completes UNKNOWN, supports later answer and answer-to-skip", () => {
        const data = { candidates: [candidate("one", [group(rule("a"))])], questions: [question("a")] };
        const original = empty();
        const skipped = applyCitizenTestAction(data, original, { type: "skip", questionKey: "a" });
        expect(skipped.state).toEqual({ answers: {}, skippedFields: ["a"] });
        expect(skipped.complete).toBe(true);
        expect(skipped.candidates[0].status).toBe("UNKNOWN");
        const answered = applyCitizenTestAction(data, skipped.state, { type: "answer", questionKey: "a", value: true });
        expect(answered.state.skippedFields).toEqual([]);
        expect(answered.candidates[0].status).toBe("MATCH");
        expect(applyCitizenTestAction(data, answered.state, { type: "skip", questionKey: "a" }).state).toEqual(skipped.state);
        expect(original).toEqual(empty());
    });

    it("revises answers through reevaluation and retains temporarily irrelevant supplied answers", () => {
        const data = pathways(result("90"));
        data.candidates[0].benefit.eligibility.groups = [group(rule("gate"))];
        data.questions.push(question("gate"));
        const initial = { answers: { gate: true, b: true }, skippedFields: [] };
        const rejected = applyCitizenTestAction(data, initial, { type: "answer", questionKey: "gate", value: false });
        expect(rejected.complete).toBe(true);
        expect(rejected.state.answers.b).toBe(true);
        const reopened = applyCitizenTestAction(data, rejected.state, { type: "answer", questionKey: "gate", value: true });
        expect(reopened.usefulFields).toEqual(["a", "c"]);
        expect(initial.answers.gate).toBe(true);
    });

    it("settles candidates with no rules or tranches as MATCH", () => {
        expect(evaluateCitizenTest({ candidates: [candidate("unconditional")], questions: [] })).toMatchObject({
            complete: true, candidates: [{ status: "MATCH" }],
        });
    });
});

describe("citizen response safety and configuration", () => {
    const dataFor = (type: CitizenTestQuestion["responseType"]) => {
        const q = question("value", type);
        return { candidates: [candidate("one", [group(rule("value", q.fields[0].type, type === "SELECT" ? "a" : type === "NUMBER" ? 1 : type === "TEXT" ? "hello" : true, "NEQ"))])], questions: [q] };
    };

    it("rejects an arbitrary SELECT string before a NEQ rule can match, including direct state input", () => {
        const data = dataFor("SELECT");
        expect(() => applyCitizenTestAction(data, empty(), { type: "answer", questionKey: "value", value: "arbitrary" })).toThrow(CitizenTestResponseError);
        expect(() => evaluateCitizenTest(data, { answers: { value: "arbitrary" }, skippedFields: [] })).toThrow(CitizenTestResponseError);
        expect(applyCitizenTestAction(data, empty(), { type: "answer", questionKey: "value", value: "b" }).candidates[0].status).toBe("MATCH");
    });

    it.each([NaN, Infinity, -Infinity, "1", null, true, undefined])("rejects invalid numeric response %s", value => {
        expect(() => applyCitizenTestAction(dataFor("NUMBER"), empty(), { type: "answer", questionKey: "value", value })).toThrow(CitizenTestResponseError);
    });

    it.each(["false", 0, null])("rejects invalid boolean response %s", value => {
        expect(() => applyCitizenTestAction(dataFor("BOOLEAN"), empty(), { type: "answer", questionKey: "value", value })).toThrow(CitizenTestResponseError);
    });

    it("accepts finite numeric values and STRING-compatible TEXT without coercion", () => {
        expect(applyCitizenTestAction(dataFor("NUMBER"), empty(), { type: "answer", questionKey: "value", value: 2 }).state.answers.value).toBe(2);
        expect(applyCitizenTestAction(dataFor("TEXT"), empty(), { type: "answer", questionKey: "value", value: "hello" }).state.answers.value).toBe("hello");
        expect(() => applyCitizenTestAction(dataFor("TEXT"), empty(), { type: "answer", questionKey: "value", value: 2 })).toThrow(CitizenTestResponseError);
    });

    it.each([null, [], ["a", 1], ["a", "a"], [{ value: "a", label: "A" }]])("fails explicitly on malformed SELECT options %j", options => {
        const data = dataFor("SELECT");
        data.questions[0].options = options;
        expect(() => evaluateCitizenTest(data)).toThrow(/Malformed SELECT options/);
    });

    it("fails on missing or inactive useful question instead of silently completing", () => {
        const data = dataFor("BOOLEAN");
        data.questions[0].active = false;
        expect(() => evaluateCitizenTest(data)).toThrow(/No active usable question/);
        data.questions = [];
        expect(() => evaluateCitizenTest(data)).toThrow(CitizenTestConfigurationError);
    });

    it("fails explicitly on zero-field and repeated question-key mappings", () => {
        const data = dataFor("BOOLEAN");
        data.questions[0].fields = [];
        expect(() => evaluateCitizenTest(data)).toThrow(/Unsafe question mapping/);
        data.questions = [question("value"), question("value")];
        expect(() => evaluateCitizenTest(data)).toThrow(/Ambiguous/);
    });

    it("provides safe rendering metadata with stable question and mapped field keys", () => {
        const data = dataFor("SELECT");
        data.questions[0].key = "question-key";
        data.questions[0].help = "Configured help";
        expect(evaluateCitizenTest(data).nextQuestion).toEqual({
            key: "question-key", fieldKey: "value", text: "Question value", responseType: "SELECT",
            options: ["a", "b"], help: "Configured help", usefulnessReach: 1,
        });
        expect(applyCitizenTestAction(data, empty(), { type: "answer", questionKey: "question-key", value: "b" }).state.answers).toEqual({ value: "b" });
    });

    it("does not require questions for fields in already eliminated branches", () => {
        const data = { candidates: [candidate("one", [group(rule("gate"), rule("missing"))])], questions: [question("gate")] };
        expect(evaluateCitizenTest(data, { answers: { gate: false }, skippedFields: [] }).complete).toBe(true);
        expect(() => evaluateCitizenTest(data, { answers: { gate: true }, skippedFields: [] })).toThrow(CitizenTestConfigurationError);
    });

    it("rejects incompatible types, multiple fields, duplicate mappings and inconsistent field metadata", () => {
        const data = dataFor("BOOLEAN");
        data.questions[0].responseType = "NUMBER";
        expect(() => evaluateCitizenTest(data)).toThrow(/Incompatible/);
        data.questions[0] = question("value");
        data.questions[0].fields.push({ key: "extra", type: "BOOLEAN" });
        expect(() => evaluateCitizenTest(data)).toThrow(/Unsafe question mapping/);
        data.questions = [question("value"), { ...question("value"), key: "another" }];
        expect(() => evaluateCitizenTest(data)).toThrow(/Ambiguous/);
        data.questions = [question("value")];
        data.questions[0].fields[0].type = "STRING";
        expect(() => evaluateCitizenTest(data)).toThrow(/Inconsistent executable field/);
    });

    it("rejects unknown questions, unknown state fields and conflicting answer/skip state", () => {
        const data = dataFor("BOOLEAN");
        expect(() => applyCitizenTestAction(data, empty(), { type: "skip", questionKey: "unknown" })).toThrow(CitizenTestResponseError);
        expect(() => evaluateCitizenTest(data, { answers: { unknown: true }, skippedFields: [] })).toThrow(CitizenTestConfigurationError);
        expect(() => evaluateCitizenTest(data, { answers: {}, skippedFields: ["unknown"] })).toThrow(CitizenTestConfigurationError);
        expect(() => evaluateCitizenTest(data, { answers: { value: true }, skippedFields: ["value"] })).toThrow(CitizenTestResponseError);
    });

    it("fails on missing structured results, conflicting executable types and duplicate candidates", () => {
        const data = pathways();
        delete data.candidates[0].benefit.trancheDetails.second;
        expect(() => evaluateCitizenTest(data)).toThrow(/Missing structured result/);
        const simple = dataFor("BOOLEAN");
        simple.candidates[0].benefit.eligibility.groups.push(group(rule("value", "STRING", "a")));
        expect(() => evaluateCitizenTest(simple)).toThrow(/Conflicting field type/);
        expect(() => evaluateCitizenTest({ candidates: [candidate("same"), candidate("same")], questions: [] })).toThrow(/Duplicate candidate/);
    });

    it("does not treat inherited JavaScript properties as explicit fiscal answers", () => {
        const data = { candidates: [candidate("one", [group(rule("constructor", "STRING", "supplied"))])], questions: [question("constructor", "TEXT")] };
        expect(evaluateCitizenTest(data).candidates[0].status).toBe("UNKNOWN");
        expect(applyCitizenTestAction(data, empty(), { type: "answer", questionKey: "constructor", value: "supplied" }).candidates[0].status).toBe("MATCH");
    });
});
