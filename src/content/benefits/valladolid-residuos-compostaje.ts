import type { BenefitEditorialContent } from "./types";

export const valladolidResiduosCompostaje: BenefitEditorialContent = {
    title: "Reducción de la tasa de residuos por compostaje en Valladolid",
    seo: {
        title: "Tasa de residuos por compostaje en Valladolid",
        description: ["Consulta la ", { fact: "benefitResult" }, " de la parte variable por compostaje, la solicitud fiscal separada y la devolución posterior."],
    },
    summary: "La participación en el programa de compostaje y la solicitud del beneficio fiscal son dos procesos distintos. La reducción se devuelve después del pago inicial de la tasa.",
    whatYouGet: ["Se prevé una ", { fact: "benefitResult" }, " de la parte variable. Inicialmente pagas el 100 % de la tasa de residuos; tras el reconocimiento y la comprobación municipal se devuelve el importe correspondiente. Para el proceso de 2026, la devolución se espera en el primer trimestre de 2027."],
    requirements: [
        "Debes estar inscrito en el programa de compostaje durante el año anterior: para 2026, el alta debe ser anterior al final de 2025.",
        "Debe existir una vivienda vinculada en Valladolid.",
        "Se requiere cumplimiento efectivo del programa y verificación municipal.",
    ],
    keyDateExplanation: "Para el beneficio de 2026, el alta en el programa corresponde al año anterior, antes de finalizar 2025.",
    applicationDeadlineExplanation: ["El plazo de la solicitud fiscal de 2026 termina el ", { fact: "applicationDeadline" }, ". El efecto de una solicitud tardía no está confirmado."],
    documentation: {
        confirmed: ["Justificante o confirmación de participación en el programa de compostaje.", "Cuenta bancaria para la devolución."],
        checklistStatus: "unconfirmed",
    },
    applicationSteps: [
        ["Proceso de programa: inscripción y participación en el compostaje, con alta antes de finalizar 2025 para el beneficio de 2026."],
        ["Proceso fiscal separado: presenta la solicitud del beneficio hasta el ", { fact: "applicationDeadline" }, ", con la confirmación de participación y una cuenta bancaria para la devolución."],
        ["Paga inicialmente el 100 % de la tasa. Tras el reconocimiento y la verificación, se devuelve el importe correspondiente; se espera en el primer trimestre de 2027."],
    ],
    renewalExplanation: "No está confirmada la persistencia del beneficio. No presupongas renovación automática.",
    warnings: [
        "La participación en el programa no sustituye a la solicitud fiscal separada.",
        "La formación o las visitas de verificación pueden formar parte de la orientación práctica del programa; no se presentan aquí como nuevos requisitos fiscales.",
        "No está confirmado el efecto de una solicitud fuera de plazo; no se aplica por analogía el de las otras reducciones de residuos.",
        "No está confirmada la compatibilidad con otros beneficios de residuos.",
    ],
    uncertainties: [
        { topic: "late-application", explanation: "No está confirmado el efecto de una solicitud fiscal tardía." },
        { topic: "renewal", explanation: "No está confirmada la persistencia ni renovación automática." },
        { topic: "compatibility", explanation: "No está confirmada la compatibilidad con otros beneficios de la tasa de residuos." },
    ],
};
