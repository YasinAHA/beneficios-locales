import { afterAll, describe, expect, it } from "vitest";

import type { Answers } from "@/domain/eligibility/types";
import { prisma } from "@/lib/prisma";
import { ordenanzas2026Url } from "../../../../prisma/seed/municipalities/valladolid/sources";
import { evaluateBenefitEligibility } from "../evaluate-benefit-eligibility";
import { getEvaluatableBenefit } from "../get-benefit";

afterAll(async () => {
    await prisma.$disconnect();
});

async function getBenefit(tax: string, benefitSlug: string) {
    const benefit = await getEvaluatableBenefit({
        municipalitySlug: "valladolid", tax, benefitSlug, exercise: 2026,
    });
    if (!benefit) throw new Error(`Missing seeded benefit: ${tax}/${benefitSlug}`);
    return benefit;
}

describe("Valladolid V0 fiscal dataset 2026", () => {
    it.each([
        ["general", "40"], ["especial", "90"],
    ])("IBI category %s has the correct percentage", async (category, value) => {
        const benefit = await getBenefit("IBI", "familia-numerosa");
        const result = evaluateBenefitEligibility(benefit, {
            familia_numerosa_devengo_2026: true,
            vivienda_habitual: true,
            categoria_familia_numerosa: category,
        });
        expect(result.status).toBe("MATCH");
        expect(result.matchedTrancheIds).toHaveLength(1);
        expect(benefit.trancheDetails[result.matchedTrancheIds[0]]).toMatchObject({
            type: "PORCENTAJE", value, unit: "cuota",
        });
    });

    it.each(["IBI", "TASA_RESIDUOS"])("%s requires a title at accrual, not a current title", async (tax) => {
        const benefit = await getBenefit(tax, "familia-numerosa");
        const answers = { vivienda_habitual: true, categoria_familia_numerosa: "general" };
        expect(evaluateBenefitEligibility(benefit, {
            ...answers, familia_numerosa: true,
        })).toMatchObject({ status: "UNKNOWN", missingFields: ["familia_numerosa_devengo_2026"] });
        expect(evaluateBenefitEligibility(benefit, {
            ...answers, familia_numerosa_devengo_2026: false,
        }).status).toBe("NO_MATCH");
        expect(evaluateBenefitEligibility(benefit, {
            ...answers, familia_numerosa_devengo_2026: true,
        }).status).toBe("MATCH");
        expect(evaluateBenefitEligibility(benefit, {
            ...answers, vivienda_habitual: false, familia_numerosa_devengo_2026: true,
        }).status).toBe("NO_MATCH");
    });

    it("income eligibility uses a determined IPREM fact without an invented monetary threshold", async () => {
        const benefit = await getBenefit("TASA_RESIDUOS", "renta-iprem");
        const key = "renta_familiar_ejercicio_anterior_dentro_limite_iprem";
        const incomeRule = benefit.eligibility.groups.flatMap((group) => group.rules)
            .find((rule) => rule.field.key === key);
        expect(incomeRule).toMatchObject({ field: { type: "BOOLEAN" }, operator: "EQ", value: true });
        expect(benefit.eligibility.groups.flatMap((group) => group.rules)
            .every((rule) => rule.field.type === "BOOLEAN")).toBe(true);
        expect(evaluateBenefitEligibility(benefit, { vivienda_habitual: true })
            .missingFields).toEqual([key]);
        expect(evaluateBenefitEligibility(benefit, { vivienda_habitual: true, [key]: true }).status).toBe("MATCH");
        expect(evaluateBenefitEligibility(benefit, { vivienda_habitual: true, [key]: false }).status).toBe("NO_MATCH");
        expect(evaluateBenefitEligibility(benefit, { vivienda_habitual: false, [key]: true }).status).toBe("NO_MATCH");
    });

    it("composting requires prior census registration, linked dwelling and effective compliance", async () => {
        const benefit = await getBenefit("TASA_RESIDUOS", "compostaje-domiciliario");
        const answers: Answers = {
            compostaje_alta_censo_anterior_2026: true,
            compostaje_vivienda_vinculada: true,
            compostaje_cumplimiento_efectivo: true,
        };
        expect(evaluateBenefitEligibility(benefit, answers).status).toBe("MATCH");
        for (const key of Object.keys(answers)) {
            expect(evaluateBenefitEligibility(benefit, { ...answers, [key]: false }).status).toBe("NO_MATCH");
        }
        expect(evaluateBenefitEligibility(benefit, {
            participa_programa_compostaje: true,
            compostaje_vivienda_vinculada: true,
            compostaje_cumplimiento_efectivo: true,
        })).toMatchObject({ status: "UNKNOWN", missingFields: ["compostaje_alta_censo_anterior_2026"] });
    });

    it.each([
        [true, false, 5, "MATCH", 1],
        [false, true, 31, "MATCH", 1],
        [false, true, 30, "NO_MATCH", 0],
        [false, false, 40, "NO_MATCH", 0],
        [true, true, 31, "MATCH", 2],
    ])("historical=%s, accredited period=%s, age=%s yields %s", async (historic, period, age, status, matches) => {
        const benefit = await getBenefit("IVTM", "historico-epoca");
        const result = evaluateBenefitEligibility(benefit, {
            vehiculo_matriculado_historico: historic,
            vehiculo_epoca_acreditado: period,
            vehiculo_antiguedad_fabricacion: age,
        });
        expect(result.status).toBe(status);
        expect(result.matchedTrancheIds).toHaveLength(matches);
        for (const id of result.matchedTrancheIds) {
            expect(benefit.trancheDetails[id]).toMatchObject({ value: "100", unit: "cuota" });
        }
    });

    it("does not infer period accreditation from age", async () => {
        const benefit = await getBenefit("IVTM", "historico-epoca");
        expect(evaluateBenefitEligibility(benefit, {
            vehiculo_matriculado_historico: false, vehiculo_antiguedad_fabricacion: 40,
        })).toMatchObject({ status: "UNKNOWN", missingFields: ["vehiculo_epoca_acreditado"] });
    });

    it.each([
        [true, false, false, 0, "MATCH", 1],
        [false, true, true, 33, "MATCH", 1],
        [false, true, true, 32, "NO_MATCH", 0],
        [false, false, true, 60, "NO_MATCH", 0],
        [false, true, false, 60, "NO_MATCH", 0],
        [true, true, true, 60, "MATCH", 2],
    ])("disability mobility=%s, ownership=%s, exclusive=%s, degree=%s yields %s", async (mobility, ownership, exclusive, degree, status, matches) => {
        const benefit = await getBenefit("IVTM", "discapacidad");
        const result = evaluateBenefitEligibility(benefit, {
            vehiculo_movilidad_reducida_devengo_2026: mobility,
            vehiculo_titular_persona_discapacidad_devengo_2026: ownership,
            vehiculo_uso_exclusivo_discapacidad_devengo_2026: exclusive,
            discapacidad_porcentaje_devengo_2026: degree,
        });
        expect(result.status).toBe(status);
        expect(result.matchedTrancheIds).toHaveLength(matches);
        for (const id of result.matchedTrancheIds) {
            expect(benefit.trancheDetails[id]).toMatchObject({ type: "EXENCION", value: null, unit: "cuota" });
        }
    });

    it("can determine mobility-reduced exemption without the other pathway's facts", async () => {
        const benefit = await getBenefit("IVTM", "discapacidad");
        const result = evaluateBenefitEligibility(benefit, { vehiculo_movilidad_reducida_devengo_2026: true });
        expect(result.status).toBe("MATCH");
        expect(result.matchedTrancheIds).toHaveLength(1);
        expect(result.unknownTrancheIds).toHaveLength(1);
        expect(evaluateBenefitEligibility(benefit, { discapacidad_porcentaje: 60 }).status).toBe("UNKNOWN");
    });

    it("preserves official primary sources, amounts and administrative deadlines", async () => {
        const benefits = await prisma.beneficio.findMany({
            where: { municipio: { slug: "valladolid" }, ejercicioDesde: 2026 },
            include: { tramite: true, fuentes: { include: { fuente: true } } },
        });
        expect(benefits).toHaveLength(8);
        for (const benefit of benefits) {
            const primary = benefit.fuentes.filter((source) => source.esPrincipal);
            expect(primary).toHaveLength(1);
            expect(primary[0].fuente.url).toBe(ordenanzas2026Url);
            expect(benefit.tramite?.requiereSolicitud).toBe(true);
            const deadline = benefit.tributo === "IBI" ? "2026-06-05"
                : benefit.tributo === "IVTM" ? "2026-04-06" : "2026-11-05";
            if (benefit.slug === "movilidad-sostenible") {
                expect(benefit.tramite?.plazoDescripcion).toContain("6 de abril de 2026");
                expect(benefit.tramite?.plazoDescripcion).toContain("nuevas matriculaciones");
            } else if (benefit.tributo === "ORA") {
                expect(benefit.tipo).toBe("EXENCION");
                expect(benefit.valor).toBeNull();
                expect(benefit.tramite?.plazoHasta).toBeNull();
                expect(benefit.tramite?.plazoDescripcion).toContain("31 de diciembre");
                expect(benefit.tramite?.plazoDescripcion).toContain("Renovación anual en enero");
            } else {
                expect(benefit.tramite?.plazoHasta?.toISOString().slice(0, 10)).toBe(deadline);
            }
            if (benefit.tributo === "TASA_RESIDUOS") {
                expect(benefit.unidad).toBe("parte_variable");
                expect(benefit.valor?.toString()).toBe(benefit.slug === "familia-numerosa" ? "50" : "75");
            }
        }
        const compost = benefits.find((benefit) => benefit.slug === "compostaje-domiciliario");
        expect(compost?.tramite?.plazoDescripcion).toContain("solicitud fiscal separada");
        expect(compost?.tramite?.plazoDescripcion).toContain("100 %");
        expect(compost?.tramite?.plazoDescripcion).toContain("primer trimestre del año siguiente");
        expect(benefits.filter((benefit) => benefit.tributo === "ORA")).toHaveLength(1);
    });

    it("Valladolid V0 does not depend on obsolete field or question keys", async () => {
        const rules = await prisma.regla.findMany({
            where: {
                grupo: { OR: [
                    { beneficio: { municipio: { slug: "valladolid" }, ejercicioDesde: 2026 } },
                    { tramo: { beneficio: { municipio: { slug: "valladolid" }, ejercicioDesde: 2026 } } },
                ] },
            },
            include: { campo: { include: { preguntaCampos: { include: { pregunta: true } } } } },
        });
        expect(rules.length).toBeGreaterThan(0);
        const obsoleteKeys = ["familia_numerosa", "participa_programa_compostaje"];
        for (const rule of rules) {
            expect(obsoleteKeys).not.toContain(rule.campo.clave);
            for (const link of rule.campo.preguntaCampos) {
                expect(obsoleteKeys).not.toContain(link.pregunta.clave);
            }
        }
    });

    it("exposes the temporal meaning of income", async () => {
        const question = await prisma.preguntaTest.findUniqueOrThrow({
            where: { clave: "renta_familiar_ejercicio_anterior_dentro_limite_iprem" },
        });
        for (const text of ["2025", "1,5 × IPREM", "personas empadronadas", "1 de enero de 2026"]) {
            expect(question.pregunta).toContain(text);
        }
    });
});
