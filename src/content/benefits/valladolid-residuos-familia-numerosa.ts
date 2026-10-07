import type { BenefitEditorialContent } from "./types";

export const valladolidResiduosFamiliaNumerosa: BenefitEditorialContent = {
    title: "Reducción de la tasa de residuos para familias numerosas en Valladolid",
    seo: {
        title: "Tasa de residuos para familias numerosas en Valladolid",
        description: ["Consulta la ", { fact: "benefitResult" }, " de la parte variable, los requisitos del título y el plazo de solicitud."],
    },
    summary: "Las familias numerosas que cumplen los requisitos en el devengo pueden obtener una reducción de la parte variable de la tasa de su vivienda habitual.",
    whatYouGet: ["Se prevé una ", { fact: "benefitResult" }, " de la parte variable de la tasa de residuos."],
    requirements: [
        "Debes disponer del título de familia numerosa relevante en el devengo del 1 de enero de 2026.",
        "La vivienda debe ser tu residencia habitual en la situación relevante al devengo.",
    ],
    keyDateExplanation: "Los requisitos se refieren al devengo del 1 de enero de 2026.",
    applicationDeadlineExplanation: ["El plazo de 2026 termina el ", { fact: "applicationDeadline" }, ". La solicitud fuera de plazo se aplica al período impositivo siguiente, no al actual."],
    documentation: { confirmed: [], checklistStatus: "unconfirmed" },
    applicationSteps: [
        ["Comprueba el título y la vivienda habitual en el devengo."],
        ["Presenta la solicitud hasta el ", { fact: "applicationDeadline" }, "."],
        ["Aporta en tiempo las renovaciones del título de familia numerosa."],
    ],
    renewalExplanation: "No se requiere una nueva solicitud anual mientras las circunstancias relevantes permanezcan sin cambios. Debes aportar en tiempo las renovaciones del título de familia numerosa.",
    warnings: [
        "La compatibilidad con la reducción por renta/IPREM está documentada: el efecto conjunto puede alcanzar como máximo el 100 % de la parte variable. Esta explicación no calcula un resultado combinado.",
        "Esta compatibilidad no se extiende al compostaje, cuya compatibilidad no está confirmada.",
        "Una solicitud tardía produce efectos en el período siguiente.",
    ],
    uncertainties: [
        { topic: "documentation-checklist", explanation: "No se proporciona un listado operativo completo confirmado de documentos." },
        { topic: "composting-compatibility", explanation: "No está confirmada la compatibilidad con compostaje." },
    ],
};
