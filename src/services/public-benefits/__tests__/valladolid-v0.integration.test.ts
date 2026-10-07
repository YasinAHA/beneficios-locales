import { afterAll, describe, expect, it } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { getBenefitEditorialContent } from "@/content/benefits/registry";
import { prisma } from "@/lib/prisma";
import { getEvaluatableBenefit } from "@/services/eligibility/get-benefit";
import { evaluateBenefitEligibility } from "@/services/eligibility/evaluate-benefit-eligibility";
import { composePublicBenefit } from "../compose-public-benefit";
import { getPublicBenefit } from "../get-public-benefit";

afterAll(async () => { await prisma.$disconnect(); });

const records = [
    ["IVTM", "movilidad-sostenible", "6 de abril de 2026"],
    ["TASA_RESIDUOS", "familia-numerosa", "5 de noviembre de 2026"],
    ["TASA_RESIDUOS", "renta-iprem", "5 de noviembre de 2026"],
    ["TASA_RESIDUOS", "compostaje-domiciliario", "5 de noviembre de 2026"],
    ["ORA", "familias", null],
    ["IVTM", "discapacidad", "6 de abril de 2026"],
    ["IVTM", "historico-epoca", "6 de abril de 2026"],
] as const;

async function getRecord(tax: string, benefitSlug: string) {
    const key = { municipalitySlug: "valladolid", tax, benefitSlug, exercise: 2026 };
    const benefit = await getPublicBenefit(key);
    if (!benefit || !benefit.editorial) throw new Error(`Expected public content for ${tax}/${benefitSlug}`);
    return { key, benefit };
}

describe("Valladolid V0 public composition", () => {
    it("resolves exactly the complete eight seeded Valladolid records", async () => {
        const benefits = await prisma.beneficio.findMany({
            where: { municipio: { slug: "valladolid" }, ejercicioDesde: 2026 },
        });
        expect(benefits).toHaveLength(8);
        for (const data of benefits) {
            const { benefit } = await getRecord(data.tributo, data.slug);
            expect(benefit.editorialStatus).toBe("available");
            expect(benefit.structured.data.slug).toBe(data.slug);
        }
    });

    it.each(records)("composes %s/%s with structured results and deadline", async (tax, slug, deadline) => {
        const { key, benefit } = await getRecord(tax, slug);
        const { data } = benefit.structured;
        expect(benefit.structured.evaluation).toEqual(await getEvaluatableBenefit(key));
        expect(benefit.editorial?.uncertainties).toEqual(getBenefitEditorialContent(key)?.uncertainties);
        expect(data.fuentes.some((source) => source.esPrincipal)).toBe(true);
        if (slug === "movilidad-sostenible") {
            for (const tranche of data.tramos) {
                expect(benefit.editorial?.whatYouGet).toContain(`${tranche.valor!.toString()} %`);
            }
        } else if (data.tipo === "EXENCION") {
            expect(benefit.editorial?.whatYouGet).toContain("exención");
            expect(benefit.editorial?.whatYouGet).not.toMatch(/100\s*%/);
        } else {
            expect(benefit.editorial?.whatYouGet).toContain(`bonificación del ${data.valor!.toString()} %`);
        }
        if (deadline) {
            expect(benefit.editorial?.applicationDeadlineExplanation).toContain(deadline);
            expect(benefit.editorial?.applicationSteps.join(" ")).toContain(deadline);
        } else {
            expect(data.tramite?.plazoHasta).toBeNull();
            expect(benefit.editorial?.applicationDeadlineExplanation).toContain("No está confirmado un mes universal");
        }
    });

    it.each(records)("renders changed structured facts for %s/%s without duplicating editorial values", async (tax, slug, deadline) => {
        const { key, benefit } = await getRecord(tax, slug);
        const { data } = benefit.structured;
        const original = JSON.stringify(getBenefitEditorialContent(key));
        const changed = composePublicBenefit({
            ...data,
            tipo: "PORCENTAJE",
            valor: new Prisma.Decimal("23"),
            tramos: data.tramos.map((tranche) => ({ ...tranche, valor: new Prisma.Decimal("23") })),
            tramite: { ...data.tramite!, plazoHasta: new Date("2026-09-17T00:00:00Z") },
        }, 2026);
        expect(changed.editorial?.whatYouGet).toContain("23 %");
        expect(changed.editorial?.seo.description).toContain("23 %");
        if (deadline) {
            expect(changed.editorial?.applicationDeadlineExplanation).toContain("17 de septiembre de 2026");
            expect(changed.editorial?.applicationDeadlineExplanation).not.toContain(deadline);
            expect(changed.editorial?.applicationSteps.join(" ")).toContain("17 de septiembre de 2026");
        } else {
            expect(changed.editorial?.applicationDeadlineExplanation).not.toContain("17 de septiembre");
        }
        expect(JSON.stringify(getBenefitEditorialContent(key))).toBe(original);
    });

    it.each(records.filter(([, , deadline]) => deadline !== null))(
        "fails explicitly when %s/%s has no structured deadline despite procedure prose", async (tax, slug) => {
            const { benefit } = await getRecord(tax, slug);
            const { data } = benefit.structured;
            expect(data.tramite?.plazoDescripcion).toBeTruthy();
            expect(() => composePublicBenefit({
                ...data, tramite: { ...data.tramite!, plazoHasta: null },
            }, 2026)).toThrow("structured application deadline");
        },
    );

    it("rejects missing benefit values and explicitly unsupported result types", async () => {
        const { benefit } = await getRecord("TASA_RESIDUOS", "renta-iprem");
        const { data } = benefit.structured;
        expect(() => composePublicBenefit({ ...data, valor: null }, 2026)).toThrow("structured benefit percentage");
        for (const tipo of ["IMPORTE", "REDUCCION", "OTRO"] as const) {
            expect(() => composePublicBenefit({ ...data, tipo }, 2026)).toThrow(`Unsupported structured benefit result type: ${tipo}`);
        }
        const exemption = composePublicBenefit({ ...data, tipo: "EXENCION", valor: null }, 2026);
        expect(exemption.editorial?.whatYouGet).toContain("exención");
        expect(exemption.editorial?.whatYouGet).not.toContain("75 %");
    });

    it("rejects missing or non-percentage mobility tranches", async () => {
        const { benefit } = await getRecord("IVTM", "movilidad-sostenible");
        const { data } = benefit.structured;
        for (const tramos of [[], data.tramos.map((tranche) => ({ ...tranche, valor: null })),
            data.tramos.map((tranche) => ({ ...tranche, tipo: "EXENCION" as const }))]) {
            expect(() => composePublicBenefit({ ...data, tramos }, 2026)).toThrow("structured percentage tranches");
        }
    });

    it("preserves simultaneous mobility matches without summing their results", async () => {
        const { benefit } = await getRecord("IVTM", "movilidad-sostenible");
        const result = evaluateBenefitEligibility(benefit.structured.evaluation, {
            vehiculo_tipo_motor: "hibrido", vehiculo_combustible: "glp", vehiculo_emisiones_co2: 100,
        });
        expect(result.status).toBe("MATCH");
        expect(result.matchedTrancheIds).toHaveLength(3);
        expect(result).not.toHaveProperty("combinedValue");
        expect(benefit.editorial?.whatYouGet).toContain("no se suman");
    });

    it.each([
        ["IVTM", "bonificaciones"], ["TASA_RESIDUOS", "compostaje"], ["IVTM", "vehiculo-historico"],
    ])("does not resolve future path aliases %s/%s", async (tax, benefitSlug) => {
        expect(await getPublicBenefit({ municipalitySlug: "valladolid", tax, benefitSlug, exercise: 2026 })).toBeNull();
    });
});
