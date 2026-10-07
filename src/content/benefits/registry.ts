import type { BenefitContentKey, BenefitEditorialContent } from "./types";
import { valladolidIbiFamiliaNumerosa } from "./valladolid-ibi-familia-numerosa";

const editorialRegistry: readonly {
    key: BenefitContentKey;
    content: BenefitEditorialContent;
}[] = [{
    key: {
        municipalitySlug: "valladolid",
        tax: "IBI",
        benefitSlug: "familia-numerosa",
        exercise: 2026,
    },
    content: valladolidIbiFamiliaNumerosa,
}];

// Exact identifiers use the database tax convention (IBI), not URL casing.
// The exercise prevents the 2026 explanations leaking into later exercises.
export function getBenefitEditorialContent(
    key: BenefitContentKey,
): BenefitEditorialContent | null {
    return editorialRegistry.find(({ key: registered }) =>
        registered.municipalitySlug === key.municipalitySlug
        && registered.tax === key.tax
        && registered.benefitSlug === key.benefitSlug
        && registered.exercise === key.exercise,
    )?.content ?? null;
}
