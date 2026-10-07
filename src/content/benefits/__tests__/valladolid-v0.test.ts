import { describe, expect, it } from "vitest";
import { getBenefitEditorialContent } from "../registry";

const records = [
    ["IBI", "familia-numerosa"],
    ["IVTM", "movilidad-sostenible"],
    ["TASA_RESIDUOS", "familia-numerosa"],
    ["TASA_RESIDUOS", "renta-iprem"],
    ["TASA_RESIDUOS", "compostaje-domiciliario"],
    ["ORA", "familias"],
    ["IVTM", "discapacidad"],
    ["IVTM", "historico-epoca"],
] as const;

function content(tax: string, benefitSlug: string) {
    return getBenefitEditorialContent({ municipalitySlug: "valladolid", tax, benefitSlug, exercise: 2026 })!;
}

describe("Valladolid V0 editorial content", () => {
    it.each(records)("resolves %s/%s deterministically without fallback", (tax, benefitSlug) => {
        const key = { municipalitySlug: "valladolid", tax, benefitSlug, exercise: 2026 };
        expect(getBenefitEditorialContent(key)).not.toBeNull();
        expect(getBenefitEditorialContent({ ...key })).toEqual(getBenefitEditorialContent(key));
        for (const change of [
            { municipalitySlug: "madrid" }, { tax: tax.toLowerCase() },
            { benefitSlug: "missing" }, { exercise: 2025 }, { exercise: 2027 },
        ]) expect(getBenefitEditorialContent({ ...key, ...change })).toBeNull();
    });

    it.each([
        ["IVTM", "bonificaciones"], ["TASA_RESIDUOS", "compostaje"], ["IVTM", "vehiculo-historico"],
    ])("does not register the future public path as an alias: %s/%s", (tax, slug) => {
        expect(content(tax, slug)).toBeNull();
    });

    it.each(records.slice(1))("keeps results and deadlines as references for %s/%s", (tax, slug) => {
        const record = content(tax, slug);
        expect(record.whatYouGet).toContainEqual({ fact: slug === "movilidad-sostenible" ? "tranchePercentages" : "benefitResult" });
        if (tax === "ORA") {
            expect(record.applicationDeadlineExplanation).not.toContainEqual({ fact: "applicationDeadline" });
        } else {
            expect(record.applicationDeadlineExplanation).toContainEqual({ fact: "applicationDeadline" });
            expect(JSON.stringify(record)).not.toMatch(/6 de abril|5 de noviembre/);
        }
        expect(record).not.toHaveProperty("rules");
        expect(record).not.toHaveProperty("compatibilityCalculation");
    });

    it("preserves mobility uncertainty and multiple matching tranches", () => {
        const record = content("IVTM", "movilidad-sostenible");
        expect(record.uncertainties.map((item) => item.topic)).toEqual(["glp-co2", "documentation-checklist", "compatibility"]);
        expect(record.uncertainties[0].explanation).toMatch(/120.*GLP/);
        expect(record.warnings.join(" ")).toContain("No afirmes que todo vehículo GLP");
        expect(record.whatYouGet.join(" ")).toContain("más de un tramo");
        expect(record.applicationDeadlineExplanation.join(" ")).toContain("no implica retroactividad");
        expect(record.documentation.confirmed).toEqual([]);
    });

    it("does not publish an IPREM euro threshold or claim automatic renewal", () => {
        const record = content("TASA_RESIDUOS", "renta-iprem");
        expect(record.requirements.join(" ")).toMatch(/1,5.*2025/);
        expect(record.requirements.join(" ")).toContain("personas empadronadas");
        expect(JSON.stringify(record)).not.toMatch(/10[., ]?800|\d[\d., ]*\s*(?:EUR|€|euros)/);
        expect(record.uncertainties.map((item) => item.topic)).toEqual(["iprem-modality", "documentation-checklist", "renewal", "composting-compatibility"]);
        expect(record.renewalExplanation).toContain("No está confirmada");
    });

    it.each(["familia-numerosa", "renta-iprem"])("keeps documented waste compatibility explanatory for %s", (slug) => {
        const record = content("TASA_RESIDUOS", slug);
        expect(record.warnings.join(" ")).toMatch(/100 % de la parte variable/);
        expect(record.warnings.join(" ")).toContain("no calcula");
        expect(record.warnings.join(" ")).toContain("compostaje");
    });

    it("preserves composting's two processes and full initial payment before refund", () => {
        const record = content("TASA_RESIDUOS", "compostaje-domiciliario");
        expect(record.applicationSteps[0].join(" ")).toContain("Proceso de programa");
        expect(record.applicationSteps[1].join(" ")).toContain("Proceso fiscal separado");
        expect(record.whatYouGet.join(" ")).toMatch(/100 %.*reconocimiento.*comprobación.*devuelve.*primer trimestre de 2027/);
        expect(record.documentation.confirmed.join(" ")).toMatch(/participación.*Cuenta bancaria/);
        expect(record.uncertainties.map((item) => item.topic)).toEqual(["late-application", "renewal", "compatibility"]);
        expect(record.warnings.join(" ")).toContain("no se presentan aquí como nuevos requisitos fiscales");
    });

    it("separates ORA's alternative routes, normative documents and operational guidance", () => {
        const record = content("ORA", "familias");
        expect(record.requirements.join(" ")).toMatch(/Vía A.*O bien, vía B.*alternativas, no requisitos acumulativos/);
        expect(record.documentation.confirmed.every((item) => item.startsWith("Documentación normativa:"))).toBe(true);
        expect(record.applicationSteps.flat().join(" ")).toMatch(/orientación operativa.*DNI\/NIE.*renting.*no se convierten aquí en requisitos legales/);
        expect(record.renewalExplanation).toMatch(/31 de diciembre.*enero/);
        expect(record.uncertainties.map((item) => item.topic)).toEqual(["child-age-boundary", "renting-ownership", "first-application-period"]);
        expect(record.warnings.join(" ")).toContain("sesión gratuita");
    });

    it("preserves disability's alternative routes and applicable documentation", () => {
        const record = content("IVTM", "discapacidad");
        expect(record.requirements.join(" ")).toMatch(/O bien.*33 %.*No se exige cumplir ambas/);
        expect(record.warnings.join(" ")).toContain("no una bonificación porcentual");
        expect(JSON.stringify(record)).not.toMatch(/100\s*%/);
        expect(record.warnings.join(" ")).toContain("No todos los documentos");
        expect(record.uncertainties[0].topic).toBe("first-acquisition");
        expect(record.applicationDeadlineExplanation.join(" ")).not.toContain("pueden solicitar");
    });

    it("requires period accreditation in addition to age and preserves historic uncertainties", () => {
        const record = content("IVTM", "historico-epoca");
        expect(record.requirements.join(" ")).toMatch(/O bien.*acreditada.*superior a 30.*alternativas/);
        expect(record.warnings[0]).toMatch(/NO convierte automáticamente.*clásico.*no son equivalentes/);
        expect(record.uncertainties.map((item) => item.topic)).toEqual(["period-accreditation", "documentation-checklist", "renewal", "first-acquisition", "compatibility"]);
        expect(record.documentation.confirmed).toEqual([]);
    });
});
