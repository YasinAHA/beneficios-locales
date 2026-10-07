import type { BenefitEditorialContent } from "./types";

export const valladolidResiduosRentaIprem: BenefitEditorialContent = {
    title: "Reducción de la tasa de residuos por renta/IPREM en Valladolid",
    seo: {
        title: "Tasa de residuos por renta/IPREM en Valladolid",
        description: ["Consulta la ", { fact: "benefitResult" }, " de la parte variable por renta del año anterior y las cautelas sobre el IPREM."],
    },
    summary: "La reducción tiene en cuenta la renta de 2025 de la unidad de convivencia y el límite aplicable de 1,5 veces el IPREM, sin publicar un umbral en euros no confirmado.",
    whatYouGet: ["Se prevé una ", { fact: "benefitResult" }, " de la parte variable de la tasa de residuos."],
    requirements: [
        "La renta del año anterior debe ser igual o inferior a 1,5 veces el IPREM aplicable. Para 2026 se considera la renta de 2025.",
        "La unidad de convivencia se basa en las personas empadronadas en la vivienda habitual.",
    ],
    keyDateExplanation: "Se considera la renta de 2025 y la situación relevante al devengo del 1 de enero de 2026.",
    applicationDeadlineExplanation: ["El plazo de 2026 termina el ", { fact: "applicationDeadline" }, ". Una solicitud tardía se aplica al período impositivo siguiente."],
    documentation: { confirmed: [], checklistStatus: "unconfirmed" },
    applicationSteps: [
        ["Identifica la renta de 2025 de las personas empadronadas en la vivienda y comprueba el límite aplicable; no uses una cifra en euros deducida sin confirmación."],
        ["Comprueba la documentación del procedimiento municipal; el listado operativo exacto no está confirmado."],
        ["Presenta la solicitud hasta el ", { fact: "applicationDeadline" }, "."],
    ],
    renewalExplanation: "No está confirmada la persistencia sin una nueva solicitud. No presupongas renovación automática.",
    warnings: [
        "La modalidad exacta de IPREM aplicable y el umbral municipal resultante en euros no están suficientemente confirmados para su publicación.",
        "Es compatible con la reducción para familias numerosas: el efecto conjunto puede alcanzar como máximo el 100 % de la parte variable. Esta explicación no calcula la combinación ni el límite.",
        "No está documentada la compatibilidad con compostaje.",
    ],
    uncertainties: [
        { topic: "iprem-modality", explanation: "No están suficientemente confirmados la modalidad exacta de IPREM ni el umbral municipal en euros." },
        { topic: "documentation-checklist", explanation: "No está confirmado el listado operativo exacto de documentos." },
        { topic: "renewal", explanation: "No está confirmada la persistencia sin nueva solicitud." },
        { topic: "composting-compatibility", explanation: "No está documentada la compatibilidad con compostaje." },
    ],
};
