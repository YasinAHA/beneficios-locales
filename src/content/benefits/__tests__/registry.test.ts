import { describe, expect, it } from "vitest";
import { getBenefitEditorialContent } from "../registry";

const key = {
    municipalitySlug: "valladolid", tax: "IBI",
    benefitSlug: "familia-numerosa", exercise: 2026,
};

describe("benefit editorial lookup", () => {
    it("resolves the pilot deterministically using stable identifiers", () => {
        const content = getBenefitEditorialContent(key);
        expect(content?.title).toBe("Bonificación del IBI para familias numerosas en Valladolid");
        expect(content?.seo.title).toBe("Bonificación IBI familia numerosa en Valladolid");
        expect(getBenefitEditorialContent({ ...key })).toEqual(content);
    });

    it.each([
        { municipalitySlug: "madrid" },
        { tax: "TASA_RESIDUOS" },
        { tax: "ibi" },
        { benefitSlug: "movilidad-sostenible" },
        { exercise: 2027 },
        { exercise: 2025 },
        { benefitSlug: "familia-numerosa/2026" },
    ])("returns null without fallback for %j", (change) => {
        expect(getBenefitEditorialContent({ ...key, ...change })).toBeNull();
    });

    it("keeps uncertainty explicit and confirms only the reviewed documentation", () => {
        const content = getBenefitEditorialContent(key)!;
        expect(content.documentation).toEqual({
            confirmed: [
                "Título de familia numerosa válido en la fecha de devengo.",
                "Acreditación de las modificaciones relevantes cuando corresponda.",
            ],
            checklistStatus: "unconfirmed",
        });
        expect(content.uncertainties).toEqual([{
            topic: "documentation-checklist",
            explanation: expect.stringContaining("No está confirmado el listado operativo completo"),
        }]);
    });

    it("stores references instead of duplicated amounts or rule definitions", () => {
        const content = getBenefitEditorialContent(key)!;
        expect(JSON.stringify(content)).not.toMatch(/40|90/);
        expect(content.seo.description).toContainEqual({ fact: "tranchePercentages" });
        expect(content.whatYouGet).toContainEqual({ fact: "tranchePercentages" });
        expect(content.applicationDeadlineExplanation).toContainEqual({ fact: "applicationDeadline" });
        expect(JSON.stringify(content)).not.toContain("familia_numerosa_devengo_2026");
    });

    it("explains the reviewed requirements without maintaining computable rules", () => {
        const content = getBenefitEditorialContent(key)!;
        const requirements = content.requirements.join(" ");
        expect(requirements).toContain("1 de enero de 2026");
        expect(requirements).toContain("Ser familia numerosa cuando visitas esta web no basta");
        expect(requirements).toContain("título, no solo al carné");
        expect(requirements).toContain("vivienda habitual");
        expect(requirements).toContain("garajes, trasteros u otros inmuebles separados");
        expect(requirements).toContain("cotitularidad");
        expect(requirements).toContain("general o especial");
        expect(requirements).not.toContain("Consulta los requisitos");
        expect(content).not.toHaveProperty("rules");
        expect(content).not.toHaveProperty("groups");
    });
});
