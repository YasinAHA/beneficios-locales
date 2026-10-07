import type { BenefitContentKey, BenefitEditorialContent } from "./types";
import { valladolidIbiFamiliaNumerosa } from "./valladolid-ibi-familia-numerosa";
import { valladolidIvtmMovilidadSostenible } from "./valladolid-ivtm-movilidad-sostenible";
import { valladolidResiduosFamiliaNumerosa } from "./valladolid-residuos-familia-numerosa";
import { valladolidResiduosRentaIprem } from "./valladolid-residuos-renta-iprem";
import { valladolidResiduosCompostaje } from "./valladolid-residuos-compostaje";
import { valladolidOraFamilias } from "./valladolid-ora-familias";
import { valladolidIvtmDiscapacidad } from "./valladolid-ivtm-discapacidad";
import { valladolidIvtmHistoricoEpoca } from "./valladolid-ivtm-historico-epoca";

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
}, {
    key: { municipalitySlug: "valladolid", tax: "IVTM", benefitSlug: "movilidad-sostenible", exercise: 2026 },
    content: valladolidIvtmMovilidadSostenible,
}, {
    key: { municipalitySlug: "valladolid", tax: "TASA_RESIDUOS", benefitSlug: "familia-numerosa", exercise: 2026 },
    content: valladolidResiduosFamiliaNumerosa,
}, {
    key: { municipalitySlug: "valladolid", tax: "TASA_RESIDUOS", benefitSlug: "renta-iprem", exercise: 2026 },
    content: valladolidResiduosRentaIprem,
}, {
    key: { municipalitySlug: "valladolid", tax: "TASA_RESIDUOS", benefitSlug: "compostaje-domiciliario", exercise: 2026 },
    content: valladolidResiduosCompostaje,
}, {
    key: { municipalitySlug: "valladolid", tax: "ORA", benefitSlug: "familias", exercise: 2026 },
    content: valladolidOraFamilias,
}, {
    key: { municipalitySlug: "valladolid", tax: "IVTM", benefitSlug: "discapacidad", exercise: 2026 },
    content: valladolidIvtmDiscapacidad,
}, {
    key: { municipalitySlug: "valladolid", tax: "IVTM", benefitSlug: "historico-epoca", exercise: 2026 },
    content: valladolidIvtmHistoricoEpoca,
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
