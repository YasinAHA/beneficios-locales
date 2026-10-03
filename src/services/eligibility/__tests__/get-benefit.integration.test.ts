import { afterAll, describe, expect, it } from "vitest";

import { evaluateBenefit } from "@/domain/eligibility/evaluate-benefit";
import { evaluateTranches } from "@/domain/eligibility/evaluate-tranches";
import { prisma } from "@/lib/prisma";

import { getEvaluatableBenefit } from "../get-benefit";
import { evaluateBenefitEligibility } from "../evaluate-benefit-eligibility";

afterAll(async () => {
    await prisma.$disconnect();
});

describe("getEvaluatableBenefit integration", () => {
    it("evaluates the seeded Valladolid IBI benefit end to end", async () => {
        const benefit = await getEvaluatableBenefit({
            municipalitySlug: "valladolid",
            tax: "IBI",
            benefitSlug: "familia-numerosa",
            exercise: 2026,
        });

        expect(benefit).not.toBeNull();

        if (!benefit) {
            throw new Error("Expected seeded Valladolid IBI benefit");
        }

        const answers = {
            familia_numerosa: true,
            vivienda_habitual: true,
            categoria_familia_numerosa: "especial",
        };

        expect(
            evaluateBenefit(benefit.eligibility, answers),
        ).toEqual({
            status: "MATCH",
            missingFields: [],
        });

        const tranches = evaluateTranches(
            benefit.tranches,
            answers,
        );
        expect(tranches.matches).toHaveLength(1);

        const matchedTranche = tranches.matches[0];

        expect(matchedTranche).toBeDefined();

        if (!matchedTranche) {
            throw new Error("Expected one matching IBI tranche");
        }

        expect(
            benefit.trancheDetails[matchedTranche.tranche.id],
        ).toEqual({
            name: "Familia numerosa de categoría especial",
            type: "PORCENTAJE",
            value: "90",
            unit: "cuota",
        });

        expect(tranches.unknown).toEqual([]);

        expect(
            tranches.matches.map(({ tranche }) => tranche.id),
        ).toHaveLength(1);

        expect(tranches.unknown).toEqual([]);
    });

    it("distinguishes benefits with the same slug by tax", async () => {
        const ibi = await getEvaluatableBenefit({
            municipalitySlug: "valladolid",
            tax: "IBI",
            benefitSlug: "familia-numerosa",
            exercise: 2026,
        });

        const waste = await getEvaluatableBenefit({
            municipalitySlug: "valladolid",
            tax: "TASA_RESIDUOS",
            benefitSlug: "familia-numerosa",
            exercise: 2026,
        });

        expect(ibi).not.toBeNull();
        expect(waste).not.toBeNull();

        expect(ibi?.id).not.toBe(waste?.id);
        expect(ibi?.tranches).toHaveLength(2);
        expect(waste?.tranches).toHaveLength(0);
    });

    it("returns null when the benefit is not valid for the requested exercise", async () => {
        const benefit = await getEvaluatableBenefit({
            municipalitySlug: "valladolid",
            tax: "IBI",
            benefitSlug: "familia-numerosa",
            exercise: 2025,
        });

        expect(benefit).toBeNull();
    });

    it("preserves multiple matching IVTM tranches from the seeded data", async () => {
        const benefit = await getEvaluatableBenefit({
            municipalitySlug: "valladolid",
            tax: "IVTM",
            benefitSlug: "movilidad-sostenible",
            exercise: 2026,
        });

        expect(benefit).not.toBeNull();

        if (!benefit) {
            throw new Error("Expected seeded Valladolid IVTM benefit");
        }

        const result = evaluateBenefitEligibility(benefit, {
            vehiculo_tipo_motor: "combustion",
            vehiculo_combustible: "glp",
            vehiculo_emisiones_co2: 100,
        });

        expect(result.status).toBe("MATCH");
        expect(result.missingFields).toEqual([]);
        expect(result.unknownTrancheIds).toEqual([]);
        expect(result.matchedTrancheIds).toHaveLength(2);

        const matchedTrancheNames = result.matchedTrancheIds.map(
            (trancheId) => benefit.trancheDetails[trancheId]?.name,
        );

        expect(matchedTrancheNames).toEqual([
            "Vehículo que utiliza GLP",
            "Vehículo no diésel con emisiones de hasta 120 g CO₂/km",
        ]);
    });
});