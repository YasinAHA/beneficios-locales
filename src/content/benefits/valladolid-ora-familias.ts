import type { BenefitEditorialContent } from "./types";

export const valladolidOraFamilias: BenefitEditorialContent = {
    title: "Exención de ORA para familias en Valladolid",
    seo: {
        title: "ORA para familias en Valladolid",
        description: ["Consulta la ", { fact: "benefitResult" }, " de ORA por las vías alternativas de hijo de 0 a 3 años o familia numerosa especial."],
    },
    summary: "Existen dos vías alternativas para la autorización ORA familiar. Ambas requieren que el solicitante esté empadronado en Valladolid.",
    whatYouGet: ["El resultado previsto es una ", { fact: "benefitResult" }, " de ORA. Puede ser necesario iniciar la sesión gratuita de estacionamiento aplicable; pueden existir zonas o regímenes excluidos."],
    requirements: [
        "Vía A: unidad familiar con hijo de 0 a 3 años y solicitante empadronado en Valladolid.",
        "O bien, vía B: título vigente de familia numerosa de categoría especial y solicitante empadronado en Valladolid. Las vías son alternativas, no requisitos acumulativos.",
        "La autorización se refiere a un vehículo y está sujeta a las reglas de titularidad aplicables, cuya comprobación es administrativa.",
    ],
    keyDateExplanation: "La autorización tiene vigencia hasta el 31 de diciembre. Esa fecha es el fin de la autorización, no un plazo de solicitud.",
    applicationDeadlineExplanation: ["No está confirmado un mes universal para la primera solicitud. La autorización termina el 31 de diciembre y la renovación tiene lugar en enero; no son un plazo universal de primera solicitud."],
    documentation: {
        confirmed: [
            "Documentación normativa: libro de familia o documentación oficial equivalente, cuando corresponda a la vía aplicable.",
            "Documentación normativa: título de familia numerosa, cuando corresponda a la vía aplicable.",
        ],
        checklistStatus: "unconfirmed",
    },
    applicationSteps: [
        ["Identifica la vía alternativa aplicable y el empadronamiento del solicitante en Valladolid."],
        ["Solicita la autorización para un vehículo y comprueba las reglas de titularidad aplicables."],
        ["Aporta la documentación normativa que corresponda. Como orientación operativa, el concesionario puede pedir DNI/NIE, permiso de circulación, evidencia de las condiciones del vehículo, situación del IVTM en Valladolid o documentación de determinados supuestos de renting; estos elementos no se convierten aquí en requisitos legales de elegibilidad."],
        ["Comprueba si debes iniciar una sesión gratuita de estacionamiento y las zonas o regímenes excluidos."],
    ],
    renewalExplanation: "La autorización tiene vigencia hasta el 31 de diciembre y se renueva en enero.",
    warnings: [
        "Las dos vías son alternativas y sus resultados no se suman.",
        "La documentación normativa y la orientación operativa del concesionario tienen funciones distintas; no todo documento operativo es un requisito legal de elegibilidad.",
        "La exención no garantiza que puedas estacionar sin iniciar la sesión gratuita aplicable ni en cualquier zona o régimen.",
    ],
    uncertainties: [
        { topic: "child-age-boundary", explanation: "No está resuelta la interpretación exacta del límite de edad en la vía del hijo de 0 a 3 años." },
        { topic: "renting-ownership", explanation: "No está resuelto el tratamiento del renting frente a la redacción normativa sobre titularidad." },
        { topic: "first-application-period", explanation: "No está confirmado el período exacto de primera solicitud ni un mes universal." },
    ],
};
