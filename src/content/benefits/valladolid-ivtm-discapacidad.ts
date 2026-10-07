import type { BenefitEditorialContent } from "./types";

export const valladolidIvtmDiscapacidad: BenefitEditorialContent = {
    title: "Exención del IVTM por discapacidad en Valladolid",
    seo: {
        title: "IVTM por discapacidad o movilidad reducida en Valladolid",
        description: ["Consulta la ", { fact: "benefitResult" }, " del IVTM por discapacidad o movilidad reducida, las vías alternativas y el plazo ordinario."],
    },
    summary: "El beneficio se aplica por vías alternativas para vehículos de movilidad reducida o vehículos a nombre de una persona con discapacidad para su uso exclusivo.",
    whatYouGet: ["El resultado previsto es una ", { fact: "benefitResult" }, " completa del IVTM."],
    requirements: [
        "Una vía corresponde al vehículo para personas con movilidad reducida.",
        "O bien, la otra vía corresponde al vehículo matriculado a nombre de una persona con discapacidad para su uso exclusivo, con un grado de discapacidad de al menos el 33 %. No se exige cumplir ambas vías simultáneamente.",
        "Sólo un vehículo por beneficiario puede disfrutar simultáneamente de la exención cuando se aplica esta restricción.",
    ],
    keyDateExplanation: "La causa y la documentación relevante deben existir en el devengo. En el padrón anual ordinario, normalmente corresponde al 1 de enero.",
    applicationDeadlineExplanation: ["El plazo ordinario de 2026 termina el ", { fact: "applicationDeadline" }, ". No está confirmado aquí el tratamiento de primeras adquisiciones fuera del padrón anual ordinario."],
    documentation: {
        confirmed: [
            "Según la vía y el caso, declaración o prueba del destino del vehículo.",
            "Permiso de circulación y tarjeta técnica del vehículo, según corresponda.",
            "Certificado de discapacidad con fecha relevante, grado y vigencia, cuando corresponda.",
            "Prueba del conductor en el seguro o del transporte, cuando sea aplicable.",
        ],
        checklistStatus: "unconfirmed",
    },
    applicationSteps: [
        ["Identifica la vía alternativa y comprueba la causa y documentación en el devengo."],
        ["Comprueba la restricción de un vehículo y aporta sólo la documentación aplicable a tu vía y situación."],
        ["Para el padrón ordinario, presenta la solicitud hasta el ", { fact: "applicationDeadline" }, "."],
    ],
    renewalExplanation: "La exención puede persistir mientras no cambien la clasificación del vehículo ni la causa que la justifica.",
    warnings: [
        "Es una exención completa, no una bonificación porcentual.",
        "Las vías son alternativas; no se exige cumplir ambas y los resultados no se suman.",
        "No todos los documentos enumerados son obligatorios en todas las vías.",
        "No se traslada a este beneficio la excepción de nuevas matriculaciones de movilidad sostenible.",
    ],
    uncertainties: [
        { topic: "first-acquisition", explanation: "No está confirmado aquí el tratamiento de primeras adquisiciones fuera del padrón anual ordinario." },
    ],
};
