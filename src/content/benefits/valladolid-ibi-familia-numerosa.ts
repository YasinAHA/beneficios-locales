import type { BenefitEditorialContent } from "./types";

export const valladolidIbiFamiliaNumerosa: BenefitEditorialContent = {
    title: "Bonificación del IBI para familias numerosas en Valladolid",
    seo: {
        title: "Bonificación IBI familia numerosa en Valladolid",
        description: [
            "Consulta la bonificación del IBI para familias numerosas en Valladolid: ",
            { fact: "tranchePercentages" },
            ", requisitos, fecha clave, plazo 2026 y cómo solicitarla.",
        ],
    },
    summary: "Si el hogar tenía un título de familia numerosa válido y cumplía los requisitos de vivienda el 1 de enero de 2026, puede tener derecho a una bonificación del IBI de su vivienda habitual.",
    whatYouGet: [
        "Los porcentajes previstos para esta bonificación del IBI son ",
        { fact: "tranchePercentages" },
        ", según la categoría del título de familia numerosa. Se aplicará el resultado que corresponda a tu situación; estos porcentajes no se suman.",
    ],
    requirements: [
        "Comprueba la situación de tu título de familia numerosa en el devengo del 1 de enero de 2026. Ser familia numerosa cuando visitas esta web no basta por sí solo; la normativa se refiere al título, no solo al carné.",
        "La bonificación se refiere a la vivienda habitual. No des por incluidos automáticamente los garajes, trasteros u otros inmuebles separados.",
        "Si la vivienda tiene varios titulares, las reglas de cotitularidad pueden afectar a la bonificación aplicable. Identifica también si la categoría del título era general o especial para conocer el resultado que te corresponde.",
    ],
    keyDateExplanation: "La situación fiscal se evalúa en el devengo del IBI: el 1 de enero de 2026.",
    applicationDeadlineExplanation: [
        "Para el IBI 2026, presenta la solicitud municipal antes del ",
        { fact: "applicationDeadline" },
        ".",
    ],
    documentation: {
        confirmed: [
            "Título de familia numerosa válido en la fecha de devengo.",
            "Acreditación de las modificaciones relevantes cuando corresponda.",
        ],
        checklistStatus: "unconfirmed",
    },
    applicationSteps: [
        ["Verifica que los requisitos se cumplían el 1 de enero de 2026."],
        ["Identifica si la categoría del título de familia numerosa era general o especial."],
        ["Presenta la solicitud municipal antes del ", { fact: "applicationDeadline" }, "."],
        ["Aporta el título de familia numerosa válido y la documentación aplicable a tu situación concreta."],
        ["Comunica los cambios posteriores que puedan afectar a la bonificación."],
        ["Si cambia la vivienda habitual, comprueba si se requiere una nueva solicitud para el nuevo inmueble."],
    ],
    renewalExplanation: "Una vez concedida, la bonificación puede continuar mientras se mantengan los requisitos y siga vigente el título de familia numerosa. Los títulos renovados deben aportarse dentro del período aplicable. Un cambio de vivienda habitual requiere revisar la bonificación para el nuevo inmueble.",
    warnings: [
        "La elegibilidad depende de la situación a 1 de enero de 2026.",
        "Las reglas de cotitularidad pueden afectar a la bonificación aplicable.",
        "Los garajes, trasteros y otros inmuebles separados no deben considerarse automáticamente incluidos.",
        "La normativa se refiere al título de familia numerosa, no solo al carné.",
    ],
    uncertainties: [{
        topic: "documentation-checklist",
        explanation: "No está confirmado el listado operativo completo de documentos del procedimiento municipal vigente en la sede electrónica. Las indicaciones anteriores no constituyen ese listado completo.",
    }],
};
