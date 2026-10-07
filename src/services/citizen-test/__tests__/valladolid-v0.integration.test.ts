import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { applyCitizenTestAction, evaluateCitizenTest } from "../flow";
import { loadValladolidCitizenTest } from "../load";
import type { CitizenTestData, CitizenTestFlow, CitizenTestState } from "../types";

let data: CitizenTestData;
beforeAll(async () => { data = await loadValladolidCitizenTest(); });
afterAll(async () => { await prisma.$disconnect(); });

const state = (answers: CitizenTestState["answers"] = {}): CitizenTestState => ({ answers, skippedFields: [] });
const find = (flow: CitizenTestFlow, tax: string, slug: string) => flow.candidates.find(c => c.tax === tax && c.benefitSlug === slug)!;
function only(tax: string, slug: string): CitizenTestData {
    const candidates = data.candidates.filter(c => c.tax === tax && c.benefitSlug === slug);
    const fields = new Set(candidates.flatMap(c => [...c.benefit.eligibility.groups, ...c.benefit.tranches.flatMap(t => t.groups)]
        .flatMap(g => g.rules.map(r => r.field.key))));
    return { candidates, questions: data.questions.filter(q => q.fields.some(f => fields.has(f.key))) };
}

describe("Valladolid V0 citizen test integration", () => {
    it("loads exactly eight approved 2026 candidates and all 21 active safe mappings", () => {
        expect(data.candidates).toHaveLength(8);
        expect(data.questions).toHaveLength(21);
        expect(new Set(data.candidates.map(c => c.key)).size).toBe(8);
        expect(data.candidates.every(c => c.municipalitySlug === "valladolid" && c.exercise === 2026)).toBe(true);
        expect(data.questions.every(q => q.active && q.fields.length === 1)).toBe(true);
        const flow = evaluateCitizenTest(data);
        expect(flow.nextQuestion).toMatchObject({ key: "vivienda_habitual", usefulnessReach: 3 });
        expect(flow.usefulFields).not.toContain("categoria_familia_numerosa");
    });

    it("shares habitual residence and accrual family facts without merging ORA current facts", () => {
        const first = applyCitizenTestAction(data, state(), { type: "answer", questionKey: "vivienda_habitual", value: true });
        const flow = applyCitizenTestAction(data, first.state, { type: "answer", questionKey: "familia_numerosa_devengo_2026", value: true });
        expect(find(flow, "TASA_RESIDUOS", "familia-numerosa").status).toBe("MATCH");
        expect(find(flow, "IBI", "familia-numerosa")).toMatchObject({ status: "UNKNOWN", missingFields: ["categoria_familia_numerosa"] });
        expect(find(flow, "ORA", "familias").status).toBe("UNKNOWN");
        expect(flow.state.answers).not.toHaveProperty("familia_numerosa_titulo_vigente_actual");
        const rejected = applyCitizenTestAction(data, first.state, { type: "answer", questionKey: "vivienda_habitual", value: false });
        for (const [tax, slug] of [["IBI", "familia-numerosa"], ["TASA_RESIDUOS", "familia-numerosa"], ["TASA_RESIDUOS", "renta-iprem"]]) {
            expect(find(rejected, tax, slug).status).toBe("NO_MATCH");
        }
        expect(rejected.usefulFields).not.toContain("categoria_familia_numerosa");
    });

    it.each([["general", "40"], ["especial", "90"]])("asks IBI category only after the gate and preserves %s result", (category, value) => {
        const subset = only("IBI", "familia-numerosa");
        expect(evaluateCitizenTest(subset).usefulFields).not.toContain("categoria_familia_numerosa");
        const gated = evaluateCitizenTest(subset, state({ vivienda_habitual: true, familia_numerosa_devengo_2026: true }));
        expect(gated.nextQuestion?.key).toBe("categoria_familia_numerosa");
        const answered = applyCitizenTestAction(subset, gated.state, { type: "answer", questionKey: "categoria_familia_numerosa", value: category });
        expect(answered.complete).toBe(true);
        expect(subset.candidates[0].benefit.trancheDetails[answered.candidates[0].matchedTrancheIds[0]].value).toBe(value);
    });

    it("investigates distinct mobility outcomes after an electric match without inferring fuel", () => {
        const subset = only("IVTM", "movilidad-sostenible");
        const flow = evaluateCitizenTest(subset, state({ vehiculo_tipo_motor: "electrico" }));
        expect(flow.candidates[0]).toMatchObject({ status: "MATCH" });
        expect(flow.candidates[0].matchedTrancheIds).toHaveLength(1);
        expect(flow.usefulFields).toEqual(["vehiculo_combustible", "vehiculo_emisiones_co2"]);
        expect(flow.state.answers).not.toHaveProperty("vehiculo_combustible");
        expect(flow.complete).toBe(false);
    });

    it("GLP establishes the equivalent 40% result, suppressing CO2 but preserving multiple explicit matches", () => {
        const subset = only("IVTM", "movilidad-sostenible");
        const flow = evaluateCitizenTest(subset, state({ vehiculo_tipo_motor: "hibrido", vehiculo_combustible: "glp" }));
        expect(flow.complete).toBe(true);
        expect(flow.candidates[0].matchedTrancheIds).toHaveLength(2);
        expect(flow.candidates[0].unknownTrancheIds).toHaveLength(1);
        expect(flow.candidates[0].missingFields).toEqual(["vehiculo_emisiones_co2"]);
        const explicit = applyCitizenTestAction(subset, flow.state, { type: "answer", questionKey: "vehiculo_emisiones_co2", value: 100 });
        expect(explicit.candidates[0].matchedTrancheIds).toHaveLength(3);
        const revised = applyCitizenTestAction(subset, flow.state, { type: "answer", questionKey: "vehiculo_combustible", value: "gasolina" });
        expect(revised.usefulFields).toEqual(["vehiculo_emisiones_co2"]);
    });

    it("eliminates diesel mobility branches after explicit combustion/diesel answers", () => {
        const flow = evaluateCitizenTest(only("IVTM", "movilidad-sostenible"), state({ vehiculo_tipo_motor: "combustion", vehiculo_combustible: "diesel" }));
        expect(flow.candidates[0].status).toBe("NO_MATCH");
        expect(flow.complete).toBe(true);
        expect(flow.usefulFields).not.toContain("vehiculo_emisiones_co2");
    });

    it("uses explicit waste income and compost facts, eliminating failed compost conditions", () => {
        const income = only("TASA_RESIDUOS", "renta-iprem");
        const gated = evaluateCitizenTest(income, state({ vivienda_habitual: true }));
        expect(gated.nextQuestion?.key).toBe("renta_familiar_ejercicio_anterior_dentro_limite_iprem");
        const matched = applyCitizenTestAction(income, gated.state, { type: "answer", questionKey: gated.nextQuestion!.key, value: true });
        expect(matched.candidates[0].status).toBe("MATCH");
        const compost = only("TASA_RESIDUOS", "compostaje-domiciliario");
        const failed = applyCitizenTestAction(compost, state(), { type: "answer", questionKey: "compostaje_alta_censo_anterior_2026", value: false });
        expect(failed.complete).toBe(true);
        expect(failed.candidates[0].status).toBe("NO_MATCH");
        const complete = evaluateCitizenTest(compost, state({ compostaje_alta_censo_anterior_2026: true, compostaje_vivienda_vinculada: true, compostaje_cumplimiento_efectivo: true }));
        expect(complete.candidates[0].status).toBe("MATCH");
    });

    it("completes historic match without period facts and reopens the period pathway on revision", () => {
        const subset = only("IVTM", "historico-epoca");
        const historic = applyCitizenTestAction(subset, state(), { type: "answer", questionKey: "vehiculo_matriculado_historico", value: true });
        expect(historic.complete).toBe(true);
        expect(historic.candidates[0].unknownTrancheIds).toHaveLength(1);
        const revised = applyCitizenTestAction(subset, historic.state, { type: "answer", questionKey: "vehiculo_matriculado_historico", value: false });
        expect(revised.usefulFields).toEqual(["vehiculo_antiguedad_fabricacion", "vehiculo_epoca_acreditado"]);
        const period = evaluateCitizenTest(subset, state({ vehiculo_matriculado_historico: false, vehiculo_epoca_acreditado: true, vehiculo_antiguedad_fabricacion: 31 }));
        expect(period.candidates[0].status).toBe("MATCH");
        expect(period.complete).toBe(true);
    });

    it("completes disability mobility pathway without demanding the equivalent exclusive-use facts", () => {
        const subset = only("IVTM", "discapacidad");
        const flow = applyCitizenTestAction(subset, state(), { type: "answer", questionKey: "vehiculo_movilidad_reducida_devengo_2026", value: true });
        expect(flow.complete).toBe(true);
        expect(flow.candidates[0].unknownTrancheIds).toHaveLength(1);
        const other = evaluateCitizenTest(subset, state({ vehiculo_movilidad_reducida_devengo_2026: false, vehiculo_titular_persona_discapacidad_devengo_2026: true, vehiculo_uso_exclusivo_discapacidad_devengo_2026: true }));
        expect(other.nextQuestion?.key).toBe("discapacidad_porcentaje_devengo_2026");
        expect(applyCitizenTestAction(subset, other.state, { type: "answer", questionKey: other.nextQuestion!.key, value: 33 }).complete).toBe(true);
    });

    it("deduplicates ORA result reach and suppresses an equivalent family pathway after a child match", () => {
        const subset = only("ORA", "familias");
        expect(evaluateCitizenTest(subset).nextQuestion?.key).toBe("unidad_familiar_hijo_0_a_3");
        // Both equivalent pathways count as one result, so static order breaks the tie.
        const child = evaluateCitizenTest(subset, state({ unidad_familiar_hijo_0_a_3: true, solicitante_empadronado_valladolid: true }));
        expect(child.complete).toBe(true);
        expect(child.candidates[0].unknownTrancheIds).toHaveLength(1);
        const family = evaluateCitizenTest(subset, state({ unidad_familiar_hijo_0_a_3: false, solicitante_empadronado_valladolid: true, familia_numerosa_titulo_vigente_actual: true }));
        expect(family.nextQuestion?.key).toBe("categoria_familia_numerosa_actual");
        expect(applyCitizenTestAction(subset, family.state, { type: "answer", questionKey: family.nextQuestion!.key, value: "especial" }).candidates[0].status).toBe("MATCH");
    });

    it("allows full-test completion with legitimate UNKNOWN candidates through explicit skips", () => {
        let flow = evaluateCitizenTest(data);
        let count = 0;
        while (flow.nextQuestion) {
            flow = applyCitizenTestAction(data, flow.state, { type: "skip", questionKey: flow.nextQuestion.key });
            if (++count > data.questions.length) throw new Error("Question was reselected after skip");
        }
        expect(flow.complete).toBe(true);
        expect(flow.state.answers).toEqual({});
        expect(flow.candidates.every(c => c.status === "UNKNOWN")).toBe(true);
        expect(flow.state.skippedFields).not.toContain("categoria_familia_numerosa");
    });

    it("completes the complete eight-benefit test when all candidates are explicitly rejected", () => {
        const flow = evaluateCitizenTest(data, state({
            vivienda_habitual: false,
            compostaje_alta_censo_anterior_2026: false,
            vehiculo_tipo_motor: "combustion", vehiculo_combustible: "diesel",
            vehiculo_matriculado_historico: false, vehiculo_epoca_acreditado: false,
            vehiculo_movilidad_reducida_devengo_2026: false, vehiculo_titular_persona_discapacidad_devengo_2026: false,
            solicitante_empadronado_valladolid: false,
        }));
        expect(flow.candidates.every(c => c.status === "NO_MATCH")).toBe(true);
        expect(flow.complete).toBe(true);
    });
});
