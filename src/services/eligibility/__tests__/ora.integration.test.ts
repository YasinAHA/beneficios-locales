import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { evaluateBenefitEligibility } from "../evaluate-benefit-eligibility";
import { getEvaluatableBenefit } from "../get-benefit";

afterAll(async () => {
    await prisma.$disconnect();
});

async function getOra() {
    const benefit = await getEvaluatableBenefit({
        municipalitySlug: "valladolid",
        tax: "ORA",
        benefitSlug: "familias",
        exercise: 2026,
    });
    if (!benefit) throw new Error("Missing seeded Valladolid ORA families benefit");
    return benefit;
}

describe("Valladolid ORA families 2026", () => {
    it.each([
        ["path A", true, false, "general", true, "MATCH", 1],
        ["path B", false, true, "especial", true, "MATCH", 1],
        ["neither path", false, false, "general", true, "NO_MATCH", 0],
        ["general category alone", false, true, "general", true, "NO_MATCH", 0],
        ["special category without valid title", false, false, "especial", true, "NO_MATCH", 0],
        ["both paths", true, true, "especial", true, "MATCH", 2],
        ["neither path without residence", true, true, "especial", false, "NO_MATCH", 0],
    ])("evaluates %s faithfully", async (_label, child, title, category, resident, status, matches) => {
        const benefit = await getOra();
        expect(benefit.eligibility.groups).toEqual([]);
        expect(benefit.tranches).toHaveLength(2);
        expect(benefit.tranches.map((tranche) => tranche.groups[0].operator)).toEqual(["AND", "AND"]);

        const result = evaluateBenefitEligibility(benefit, {
            unidad_familiar_hijo_0_a_3: child,
            familia_numerosa_titulo_vigente_actual: title,
            categoria_familia_numerosa_actual: category,
            solicitante_empadronado_valladolid: resident,
        });
        expect(result.status).toBe(status);
        expect(result.matchedTrancheIds).toHaveLength(matches);
        expect(result.unknownTrancheIds).toEqual([]);
        expect(result.missingFields).toEqual([]);
        if (matches === 1) {
            const expectedPath = child ? benefit.tranches[0] : benefit.tranches[1];
            expect(result.matchedTrancheIds).toEqual([expectedPath.id]);
        }
        for (const id of result.matchedTrancheIds) {
            expect(benefit.trancheDetails[id]).toMatchObject({ type: "EXENCION", value: null, unit: "cuota" });
        }
    });

    it("keeps MATCH and the unresolved path B and its missing fields", async () => {
        const benefit = await getOra();
        expect(evaluateBenefitEligibility(benefit, {
            unidad_familiar_hijo_0_a_3: true,
            solicitante_empadronado_valladolid: true,
        })).toEqual({
            benefitId: benefit.id,
            status: "MATCH",
            matchedTrancheIds: [benefit.tranches[0].id],
            unknownTrancheIds: [benefit.tranches[1].id],
            missingFields: ["familia_numerosa_titulo_vigente_actual", "categoria_familia_numerosa_actual"],
        });
    });

    it("keeps MATCH and the unresolved path A and its missing field", async () => {
        const benefit = await getOra();
        expect(evaluateBenefitEligibility(benefit, {
            familia_numerosa_titulo_vigente_actual: true,
            categoria_familia_numerosa_actual: "especial",
            solicitante_empadronado_valladolid: true,
        })).toEqual({
            benefitId: benefit.id,
            status: "MATCH",
            matchedTrancheIds: [benefit.tranches[1].id],
            unknownTrancheIds: [benefit.tranches[0].id],
            missingFields: ["unidad_familiar_hijo_0_a_3"],
        });
    });

    it("does not reuse the family title or category at accrual for current ORA eligibility", async () => {
        const benefit = await getOra();
        expect(evaluateBenefitEligibility(benefit, {
            unidad_familiar_hijo_0_a_3: false,
            solicitante_empadronado_valladolid: true,
            familia_numerosa_devengo_2026: true,
            categoria_familia_numerosa: "especial",
        })).toMatchObject({
            status: "UNKNOWN",
            matchedTrancheIds: [],
            unknownTrancheIds: [benefit.tranches[1].id],
            missingFields: ["familia_numerosa_titulo_vigente_actual", "categoria_familia_numerosa_actual"],
        });
    });

    it("links each ORA input to its active question", async () => {
        const questions = await prisma.preguntaTest.findMany({
            where: { clave: { in: [
                "unidad_familiar_hijo_0_a_3",
                "solicitante_empadronado_valladolid",
                "familia_numerosa_titulo_vigente_actual",
                "categoria_familia_numerosa_actual",
            ] } },
            include: { campos: { include: { campo: true } } },
        });
        expect(questions).toHaveLength(4);
        for (const question of questions) {
            expect(question.activa).toBe(true);
            expect(question.campos.map((link) => link.campo.clave)).toEqual([question.clave]);
        }
    });
});
