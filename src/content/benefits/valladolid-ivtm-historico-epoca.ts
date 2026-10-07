import type { BenefitEditorialContent } from "./types";

export const valladolidIvtmHistoricoEpoca: BenefitEditorialContent = {
    title: "Bonificación del IVTM para vehículos históricos o de época en Valladolid",
    seo: {
        title: "IVTM para vehículos históricos o de época en Valladolid",
        description: ["Consulta la ", { fact: "benefitResult" }, " del IVTM y las vías de matrícula histórica o condición acreditada de época; la antigüedad por sí sola no basta."],
    },
    summary: "La matrícula histórica oficial o la condición acreditada de vehículo de época con más de 30 años son vías alternativas. Ser antiguo o llamarse clásico no acredita por sí solo la condición de época.",
    whatYouGet: ["El resultado previsto es una ", { fact: "benefitResult" }, " de la cuota del IVTM. Es una bonificación, no una exención; las vías no suman sus resultados."],
    requirements: [
        "Una vía corresponde al vehículo oficialmente matriculado como histórico.",
        "O bien, la otra vía exige condición acreditada de vehículo de época y antigüedad de fabricación superior a 30 años. Las vías son alternativas, no acumulativas.",
        "Más de 30 años por sí solos no acreditan la condición de vehículo de época: también se requiere la acreditación o calificación aplicable.",
    ],
    keyDateExplanation: "En el padrón anual ordinario, la situación relevante es el devengo del 1 de enero. En la primera adquisición, el período impositivo comienza en la fecha de adquisición aplicable; esto no establece reglas adicionales de solicitud.",
    applicationDeadlineExplanation: ["El plazo ordinario de 2026 termina el ", { fact: "applicationDeadline" }, ". El tratamiento de primeras adquisiciones no está confirmado aquí."],
    documentation: { confirmed: [], checklistStatus: "unconfirmed" },
    applicationSteps: [
        ["Identifica la vía de matrícula histórica oficial o de condición acreditada de época con más de 30 años."],
        ["Comprueba con el procedimiento municipal la definición y acreditación de vehículo de época; el listado completo de documentos no está confirmado."],
        ["Para el padrón ordinario, presenta la solicitud hasta el ", { fact: "applicationDeadline" }, "."],
    ],
    renewalExplanation: "No está confirmada la persistencia ni la renovación. No presupongas renovación automática.",
    warnings: [
        "Tener más de 30 años NO convierte automáticamente al vehículo en vehículo de época. Antigüedad, denominación coloquial de clásico y condición acreditada de época no son equivalentes.",
        "Las vías son alternativas y sus resultados no se suman.",
        "El comienzo del período en la primera adquisición no permite inferir una excepción de solicitud durante el ejercicio.",
    ],
    uncertainties: [
        { topic: "period-accreditation", explanation: "No están confirmadas la definición municipal exacta ni la acreditación exigida para vehículo de época." },
        { topic: "documentation-checklist", explanation: "No está confirmado el listado operativo completo de documentos para la vía de época." },
        { topic: "renewal", explanation: "No están confirmadas la persistencia ni la renovación." },
        { topic: "first-acquisition", explanation: "No está confirmado el tratamiento de primeras adquisiciones." },
        { topic: "compatibility", explanation: "No está confirmada la compatibilidad con otros beneficios del IVTM." },
    ],
};
