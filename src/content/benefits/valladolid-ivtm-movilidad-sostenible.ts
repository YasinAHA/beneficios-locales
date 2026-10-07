import type { BenefitEditorialContent } from "./types";

export const valladolidIvtmMovilidadSostenible: BenefitEditorialContent = {
    title: "Bonificaciones del IVTM por movilidad sostenible en Valladolid",
    seo: {
        title: "IVTM movilidad sostenible en Valladolid",
        description: ["Consulta los porcentajes del IVTM por movilidad sostenible: ", { fact: "tranchePercentages" }, ", requisitos, plazo ordinario y cautelas sobre GLP y CO₂."],
    },
    summary: "Los vehículos eléctricos, híbridos no diésel y determinados vehículos GLP o no diésel pueden acceder a los tramos de movilidad sostenible, según las condiciones aplicables.",
    whatYouGet: ["Los tramos prevén ", { fact: "tranchePercentages" }, " de la cuota. Puede coincidir más de un tramo: los resultados no se suman ni son necesariamente excluyentes. Comprueba la categoría y sus condiciones; no se garantiza la bonificación a todo vehículo GLP."],
    requirements: [
        "Los tramos distinguen vehículos eléctricos, híbridos no diésel, vehículos que utilizan GLP y vehículos no diésel sujetos a la condición aplicable de emisiones de CO₂.",
        "La relación entre la condición de 120 g CO₂/km y la categoría GLP u otros no diésel requiere cautela interpretativa; no basta con asumir que usar GLP garantiza el resultado.",
    ],
    keyDateExplanation: "En el padrón anual ordinario, la situación relevante es el devengo del 1 de enero de 2026. En la primera adquisición, el período impositivo comienza en la fecha de adquisición.",
    applicationDeadlineExplanation: ["El plazo ordinario de 2026 termina el ", { fact: "applicationDeadline" }, ". Las nuevas matriculaciones pueden solicitar estas bonificaciones durante el ejercicio; esta excepción no implica retroactividad."],
    documentation: { confirmed: [], checklistStatus: "unconfirmed" },
    applicationSteps: [
        ["Comprueba los tramos aplicables y la cautela interpretativa sobre GLP y CO₂."],
        ["Para el padrón ordinario, presenta la solicitud hasta el ", { fact: "applicationDeadline" }, ". Para nuevas matriculaciones, revisa la excepción de solicitud durante el ejercicio."],
        ["Comprueba con el procedimiento municipal la documentación aplicable; el listado operativo completo no está confirmado."],
    ],
    renewalExplanation: "No se dispone aquí de una regla confirmada de persistencia o renovación; no presupongas renovación automática.",
    warnings: [
        "No afirmes que todo vehículo GLP recibe automáticamente la bonificación del tramo GLP: permanece la cautela sobre la condición de CO₂.",
        "Varios tramos pueden coincidir y sus resultados no se suman.",
        "La excepción de nuevas matriculaciones no debe entenderse como retroactiva.",
    ],
    uncertainties: [
        { topic: "glp-co2", explanation: "No está resuelta la interpretación de la condición de 120 g CO₂/km en relación con GLP y la otra categoría no diésel." },
        { topic: "documentation-checklist", explanation: "No está confirmado el listado operativo completo de documentos." },
        { topic: "compatibility", explanation: "No se ha establecido la compatibilidad ni incompatibilidad con la exención por discapacidad o la bonificación para vehículos históricos." },
    ],
};
