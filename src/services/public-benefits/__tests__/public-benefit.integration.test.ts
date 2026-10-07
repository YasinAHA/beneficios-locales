import { afterAll, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import * as editorialRegistry from "@/content/benefits/registry";
import { getBenefitEditorialContent } from "@/content/benefits/registry";
import type { EditorialText } from "@/content/benefits/types";
import { prisma } from "@/lib/prisma";
import { evaluateBenefitEligibility } from "@/services/eligibility/evaluate-benefit-eligibility";
import { getEvaluatableBenefit } from "@/services/eligibility/get-benefit";
import { composePublicBenefit } from "../compose-public-benefit";
import { getPublicBenefit } from "../get-public-benefit";

const key = {
    municipalitySlug: "valladolid", tax: "IBI",
    benefitSlug: "familia-numerosa", exercise: 2026,
};

afterAll(async () => { await prisma.$disconnect(); });

async function getPilot() {
    const benefit = await getPublicBenefit(key);
    if (!benefit) throw new Error("Expected seeded Valladolid IBI benefit");
    return benefit;
}

describe("public benefit composition", () => {
    it("composes seeded fiscal data, sources, procedure and existing eligibility representation", async () => {
        const benefit = await getPilot();
        expect(benefit.editorialStatus).toBe("available");
        expect(benefit.structured.evaluation).toEqual(await getEvaluatableBenefit(key));
        expect(benefit.structured.data).toMatchObject({
            tributo: "IBI", slug: "familia-numerosa", tipo: "PORCENTAJE",
            valor: null, unidad: "cuota", ejercicioDesde: 2026, ejercicioHasta: 2026,
        });
        expect(benefit.structured.data.tramos.map((tranche) => tranche.valor?.toString())).toEqual(["40", "90"]);
        expect(benefit.structured.data.fuentes.some((source) => source.esPrincipal)).toBe(true);
        expect(benefit.structured.data.gruposReglas[0].reglas[0].descripcionUsuario).toContain("1 de enero de 2026");
        expect(benefit.editorial?.seo.description).toBe("Consulta la bonificación del IBI para familias numerosas en Valladolid: 40 % o 90 %, requisitos, fecha clave, plazo 2026 y cómo solicitarla.");
        expect(benefit.editorial?.whatYouGet).toBe("Los porcentajes previstos para esta bonificación del IBI son 40 % o 90 %, según la categoría del título de familia numerosa. Se aplicará el resultado que corresponda a tu situación; estos porcentajes no se suman.");
        expect(benefit.editorial?.requirements).toEqual(getBenefitEditorialContent(key)?.requirements);
        expect(benefit.editorial?.applicationDeadlineExplanation).toContain("5 de junio de 2026");
        expect(benefit.editorial?.applicationSteps).toEqual([
            "Verifica que los requisitos se cumplían el 1 de enero de 2026.",
            "Identifica si la categoría del título de familia numerosa era general o especial.",
            "Presenta la solicitud municipal antes del 5 de junio de 2026.",
            "Aporta el título de familia numerosa válido y la documentación aplicable a tu situación concreta.",
            "Comunica los cambios posteriores que puedan afectar a la bonificación.",
            "Si cambia la vivienda habitual, comprueba si se requiere una nueva solicitud para el nuevo inmueble.",
        ]);
        expect(benefit.editorial?.documentation.checklistStatus).toBe("unconfirmed");
        expect(benefit.editorial?.uncertainties).toEqual(getBenefitEditorialContent(key)?.uncertainties);
    });

    it("resolves amounts and deadlines from supplied data without mutating the editorial record", async () => {
        const benefit = await getPilot();
        const original = JSON.stringify(getBenefitEditorialContent(key));
        const data = benefit.structured.data;
        const composed = composePublicBenefit({
            ...data,
            tramos: data.tramos.map((tranche) => ({ ...tranche, valor: new Prisma.Decimal("25") })),
            tramite: { ...data.tramite!, plazoHasta: new Date("2026-06-04T00:00:00Z") },
        }, 2026);
        expect(composed.editorial?.seo.description).toContain("25 %,");
        expect(composed.editorial?.seo.description).not.toMatch(/40|90/);
        expect(composed.editorial?.whatYouGet).toContain("25 %,");
        expect(composed.editorial?.whatYouGet).not.toMatch(/40|90/);
        expect(composed.editorial?.applicationDeadlineExplanation).toContain("4 de junio de 2026");
        expect(composed.editorial?.applicationSteps[2]).toContain("4 de junio de 2026");
        expect(JSON.stringify(getBenefitEditorialContent(key))).toBe(original);
    });

    it("rejects an unsupported fact instead of resolving it as a percentage", async () => {
        const { data } = (await getPilot()).structured;
        const content = getBenefitEditorialContent(key)!;
        const lookup = vi.spyOn(editorialRegistry, "getBenefitEditorialContent").mockReturnValue({
            ...content,
            // Simulate invalid content crossing the typed application boundary.
            whatYouGet: [{ fact: "unsupported" }] as unknown as EditorialText,
        });
        try {
            expect(() => composePublicBenefit(data, 2026)).toThrow("Unsupported editorial fact: unsupported");
        } finally {
            lookup.mockRestore();
        }
    });

    it("fails explicitly if a referenced structured fact is missing", async () => {
        const { data } = (await getPilot()).structured;
        expect(() => composePublicBenefit({ ...data, tramite: null }, 2026)).toThrow("structured application deadline");
        expect(() => composePublicBenefit({ ...data, tramos: [] }, 2026)).toThrow("structured percentage tranches");
        expect(() => composePublicBenefit(data, 2027)).toThrow("not valid");
    });

    it("retains structured data when another seeded benefit has no editorial content", async () => {
        const benefit = await getPublicBenefit({ ...key, tax: "TASA_RESIDUOS" });
        expect(benefit).toMatchObject({ editorialStatus: "missing", editorial: null });
        expect(benefit?.structured.data.tributo).toBe("TASA_RESIDUOS");
    });

    it.each([{ exercise: 2025 }, { exercise: 2027 }, { benefitSlug: "missing" }])(
        "returns null for an absent or invalid database benefit %j", async (change) => {
            expect(await getPublicBenefit({ ...key, ...change })).toBeNull();
        },
    );

    it.each([["general", "40"], ["especial", "90"]])(
        "preserves eligibility and the %s category result", async (category, value) => {
            const { evaluation } = (await getPilot()).structured;
            const answers = { vivienda_habitual: true, categoria_familia_numerosa: category };
            const result = evaluateBenefitEligibility(evaluation, { ...answers, familia_numerosa_devengo_2026: true });
            expect(result.status).toBe("MATCH");
            expect(result.matchedTrancheIds).toHaveLength(1);
            expect(evaluation.trancheDetails[result.matchedTrancheIds[0]].value).toBe(value);
            expect(evaluateBenefitEligibility(evaluation, { ...answers, familia_numerosa: true })).toMatchObject({
                status: "UNKNOWN", missingFields: ["familia_numerosa_devengo_2026"],
            });
            expect(evaluateBenefitEligibility(evaluation, { ...answers, familia_numerosa_devengo_2026: false }).status).toBe("NO_MATCH");
            expect(evaluateBenefitEligibility(evaluation, { ...answers, familia_numerosa_devengo_2026: true, vivienda_habitual: false }).status).toBe("NO_MATCH");
        },
    );
});
