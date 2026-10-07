import { getBenefitEditorialContent } from "@/content/benefits/registry";
import type { EditorialText } from "@/content/benefits/types";
import { mapBenefitToEvaluatable } from "@/services/eligibility/mapper";
import type { BenefitWithPublicData } from "./types";

export function composePublicBenefit(benefit: BenefitWithPublicData, exercise: number) {
    if (exercise < benefit.ejercicioDesde
        || (benefit.ejercicioHasta !== null && exercise > benefit.ejercicioHasta)) {
        throw new Error("Benefit is not valid for the requested exercise");
    }
    const content = getBenefitEditorialContent({
        municipalitySlug: benefit.municipio.slug,
        tax: benefit.tributo,
        benefitSlug: benefit.slug,
        exercise,
    });
    const evaluation = mapBenefitToEvaluatable(benefit);
    const render = (text: EditorialText): string => text.map((part) => {
        if (typeof part === "string") return part;
        const fact = part.fact;
        switch (fact) {
            case "applicationDeadline": {
                const deadline = benefit.tramite?.plazoHasta;
                if (!deadline) throw new Error("Editorial content requires a structured application deadline");
                return new Intl.DateTimeFormat("es-ES", {
                    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
                }).format(deadline);
            }
            case "tranchePercentages": {
                const tranches = benefit.tramos;
                if (!tranches.length || tranches.some((tranche) =>
                    tranche.tipo !== "PORCENTAJE" || tranche.valor === null)) {
                    throw new Error("Editorial content requires structured percentage tranches");
                }
                return [...new Set(tranches.map((tranche) => `${tranche.valor!.toString()} %`))].join(" o ");
            }
            default: {
                const unsupportedFact: never = fact;
                throw new Error(`Unsupported editorial fact: ${unsupportedFact}`);
            }
        }
    }).join("");

    return {
        // Prisma data stays separate from editorial explanations. This is a
        // server application representation, not a JSON/route response.
        structured: { data: benefit, evaluation },
        editorial: content === null ? null : {
            ...content,
            seo: { ...content.seo, description: render(content.seo.description) },
            whatYouGet: render(content.whatYouGet),
            applicationDeadlineExplanation: render(content.applicationDeadlineExplanation),
            applicationSteps: content.applicationSteps.map(render),
        },
        editorialStatus: content === null ? "missing" as const : "available" as const,
    };
}

export type PublicBenefit = ReturnType<typeof composePublicBenefit>;
