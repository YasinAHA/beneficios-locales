import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { applyCitizenTestAction, evaluateCitizenTest } from "@/services/citizen-test/flow";
import { loadValladolidCitizenTest } from "@/services/citizen-test/load";
import type { CitizenTestData, CitizenTestState } from "@/services/citizen-test/types";
import { buildCitizenTestResults } from "../build-results";

let data: CitizenTestData;
beforeAll(async () => { data = await loadValladolidCitizenTest(); });
afterAll(async () => { await prisma.$disconnect(); });
function subset(tax: string, slug: string): CitizenTestData {
    const candidates = data.candidates.filter(c => c.tax === tax && c.benefitSlug === slug);
    const fields = new Set(candidates.flatMap(c => [...c.benefit.eligibility.groups, ...c.benefit.tranches.flatMap(t => t.groups)]
        .flatMap(g => g.rules.map(r => r.field.key))));
    return { candidates, questions: data.questions.filter(q => q.fields.some(f => fields.has(f.key))) };
}
function project(tax: string, slug: string, answers: CitizenTestState["answers"], skippedFields: string[] = []) {
    const selected = subset(tax, slug);
    const flow = evaluateCitizenTest(selected, { answers, skippedFields });
    return buildCitizenTestResults(selected, flow).benefits[0];
}
const percentage = (value: string, unit = "cuota") => ({ type: "PORCENTAJE", value, unit });
const exemption = { type: "EXENCION", value: null, unit: "cuota" };

describe("Valladolid V0 citizen results integration", () => {
    it.each([["general", "40"], ["especial", "90"]])("projects IBI %s category", (category, value) => {
        const result = project("IBI", "familia-numerosa", {
            vivienda_habitual: true, familia_numerosa_devengo_2026: true, categoria_familia_numerosa: category,
        });
        expect(result.status).toBe("COMPATIBLE");
        expect(result.matchedResults).toEqual([percentage(value)]);
        expect(result.unresolvedResults).toEqual([]);
    });
    it("keeps both IBI possibilities when category is skipped", () => {
        const result = project("IBI", "familia-numerosa", { vivienda_habitual: true, familia_numerosa_devengo_2026: true }, ["categoria_familia_numerosa"]);
        expect(result.status).toBe("POSSIBLE");
        expect(result.unresolvedResults.map(r => r.value)).toEqual(["40", "90"]);
        for (const r of result.unresolvedResults) {
            expect(r.missingInformation).toEqual([expect.objectContaining({ fieldKey: "categoria_familia_numerosa", reason: "SKIPPED" })]);
        }
    });
    it("projects electric mobility while retaining distinct pending outcomes and provenance", () => {
        const result = project("IVTM", "movilidad-sostenible", { vehiculo_tipo_motor: "electrico" });
        expect(result.status).toBe("COMPATIBLE");
        expect(result.matchedResults).toEqual([percentage("75")]);
        expect(result.unresolvedResults.map(r => r.value)).toEqual(["40"]);
        expect(result.unresolvedResults[0].missingInformation.map(m => m.fieldKey)).toEqual(["vehiculo_combustible", "vehiculo_emisiones_co2"]);
    });
    it("merges equivalent unresolved mobility 40% routes", () => {
        const result = project("IVTM", "movilidad-sostenible", {});
        expect(result.status).toBe("POSSIBLE");
        expect(result.unresolvedResults.map(r => r.value)).toEqual(["40", "50", "75"]);
        expect(result.unresolvedResults.filter(r => r.value === "40")).toHaveLength(1);
    });
    it.each([undefined, 100])("deduplicates multiple matching mobility routes with emissions %s", emissions => {
        const result = project("IVTM", "movilidad-sostenible", {
            vehiculo_tipo_motor: "hibrido", vehiculo_combustible: "glp",
            ...(emissions === undefined ? {} : { vehiculo_emisiones_co2: emissions }),
        });
        expect(result.matchedResults).toEqual([percentage("40"), percentage("50")]);
        expect(result.unresolvedResults).toEqual([]);
        expect(result.missingInformation).toEqual([]);
    });
    it("projects the fixed waste family result", () => {
        const result = project("TASA_RESIDUOS", "familia-numerosa", { vivienda_habitual: true, familia_numerosa_devengo_2026: true });
        expect(result.status).toBe("COMPATIBLE");
        expect(result.matchedResults).toEqual([percentage("50", "parte_variable")]);
    });
    it("projects the fixed waste income result", () => {
        const result = project("TASA_RESIDUOS", "renta-iprem", { vivienda_habitual: true, renta_familiar_ejercicio_anterior_dentro_limite_iprem: true });
        expect(result.status).toBe("COMPATIBLE");
        expect(result.matchedResults).toEqual([percentage("75", "parte_variable")]);
    });
    it("preserves possible waste income when the income fact is omitted", () => {
        const result = project("TASA_RESIDUOS", "renta-iprem", { vivienda_habitual: true }, ["renta_familiar_ejercicio_anterior_dentro_limite_iprem"]);
        expect(result.status).toBe("POSSIBLE");
        expect(result.unresolvedResults).toEqual([{ ...percentage("75", "parte_variable"), missingInformation: [expect.objectContaining({ reason: "SKIPPED" })] }]);
    });
    it("projects fixed composting result and excludes a failed condition", () => {
        const result = project("TASA_RESIDUOS", "compostaje-domiciliario", {
            compostaje_alta_censo_anterior_2026: true, compostaje_vivienda_vinculada: true, compostaje_cumplimiento_efectivo: true,
        });
        expect(result.status).toBe("COMPATIBLE");
        expect(result.matchedResults).toEqual([percentage("75", "parte_variable")]);
        expect(project("TASA_RESIDUOS", "compostaje-domiciliario", { compostaje_alta_censo_anterior_2026: false }).status).toBe("NOT_COMPATIBLE");
    });
    it.each([
        ["IVTM", "historico-epoca", { vehiculo_matriculado_historico: true }, percentage("100")],
        ["IVTM", "discapacidad", { vehiculo_movilidad_reducida_devengo_2026: true }, exemption],
        ["ORA", "familias", { unidad_familiar_hijo_0_a_3: true, solicitante_empadronado_valladolid: true }, exemption],
    ] as const)("suppresses equivalent pending pathways for %s %s", (tax, slug, answers, expected) => {
        const selected = subset(tax, slug);
        const flow = evaluateCitizenTest(selected, { answers, skippedFields: [] });
        expect(flow.candidates[0].unknownTrancheIds).toHaveLength(1);
        expect(flow.candidates[0].missingFields.length).toBeGreaterThan(0);
        const snapshot = JSON.stringify(flow);
        const result = buildCitizenTestResults(selected, flow).benefits[0];
        expect(result.status).toBe("COMPATIBLE");
        expect(result.matchedResults).toEqual([expected]);
        expect(result.unresolvedResults).toEqual([]);
        expect(result.missingInformation).toEqual([]);
        expect(JSON.stringify(flow)).toBe(snapshot);
    });
    it("retains all eight candidates and summary for an incomplete test", () => {
        const results = buildCitizenTestResults(data, evaluateCitizenTest(data));
        expect(results.complete).toBe(false);
        expect(results.benefits).toHaveLength(8);
        expect(results.summary).toEqual({ compatible: 0, possible: 8, notCompatible: 0 });
    });
    it("retains all eight explicitly rejected candidates", () => {
        const flow = evaluateCitizenTest(data, { answers: {
            vivienda_habitual: false, compostaje_alta_censo_anterior_2026: false,
            vehiculo_tipo_motor: "combustion", vehiculo_combustible: "diesel",
            vehiculo_matriculado_historico: false, vehiculo_epoca_acreditado: false,
            vehiculo_movilidad_reducida_devengo_2026: false, vehiculo_titular_persona_discapacidad_devengo_2026: false,
            solicitante_empadronado_valladolid: false,
        }, skippedFields: [] });
        const results = buildCitizenTestResults(data, flow);
        expect(results.complete).toBe(true);
        expect(results.benefits).toHaveLength(8);
        expect(results.summary).toEqual({ compatible: 0, possible: 0, notCompatible: 8 });
        expect(results.benefits.every(b => b.status === "NOT_COMPATIBLE" && b.matchedResults.length === 0 && b.unresolvedResults.length === 0)).toBe(true);
    });
    it("completes through skips with eight possible results and no false rejection", () => {
        let flow = evaluateCitizenTest(data);
        let count = 0;
        while (flow.nextQuestion) {
            flow = applyCitizenTestAction(data, flow.state, { type: "skip", questionKey: flow.nextQuestion.key });
            if (++count > data.questions.length) throw new Error("Repeated skipped question");
        }
        const snapshot = JSON.stringify(flow);
        const results = buildCitizenTestResults(data, flow);
        expect(results.complete).toBe(true);
        expect(results.benefits).toHaveLength(8);
        expect(results.summary).toEqual({ compatible: 0, possible: 8, notCompatible: 0 });
        const missing = results.benefits.flatMap(b => [...b.missingInformation, ...b.unresolvedResults.flatMap(r => r.missingInformation)]);
        expect(missing.length).toBeGreaterThan(0);
        expect(missing.every(m => m.reason === "SKIPPED")).toBe(true);
        expect(JSON.stringify(flow)).toBe(snapshot);
    });
});
