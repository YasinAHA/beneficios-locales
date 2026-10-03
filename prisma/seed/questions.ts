import {
    Prisma,
    PrismaClient,
    TipoRespuesta,
} from "../../src/generated/prisma/client";

type FieldMap = Map<string, { id: bigint; clave: string }>;

export async function seedQuestions(
    prisma: PrismaClient,
    fields: FieldMap,
) {
    const questions = [
        {
            clave: "familia_numerosa_devengo_2026",
            pregunta: "¿Tu título de familia numerosa era válido el 1 de enero de 2026?",
            tipo: TipoRespuesta.BOOLEAN,
            opciones: Prisma.DbNull,
            ayuda:
                "Se pregunta por la fecha de devengo de 2026, no por la situación actual.",
            orden: 10,
            fields: ["familia_numerosa_devengo_2026"],
        },
        {
            clave: "categoria_familia_numerosa",
            pregunta: "¿Qué categoría figuraba en tu título de familia numerosa válido el 1 de enero de 2026?",
            tipo: TipoRespuesta.SELECT,
            opciones: ["general", "especial"],
            ayuda:
                "Consulta la categoría indicada en tu título de familia numerosa.",
            orden: 20,
            fields: ["categoria_familia_numerosa"],
        },
        {
            clave: "vivienda_habitual",
            pregunta: "¿El inmueble era tu vivienda habitual el 1 de enero de 2026?",
            tipo: TipoRespuesta.BOOLEAN,
            opciones: Prisma.DbNull,
            ayuda: null,
            orden: 30,
            fields: ["vivienda_habitual"],
        },
        {
            clave: "vehiculo_tipo_motor",
            pregunta: "¿Qué tipo de motorización tiene tu vehículo?",
            tipo: TipoRespuesta.SELECT,
            opciones: ["electrico", "hibrido", "combustion"],
            ayuda: null,
            orden: 40,
            fields: ["vehiculo_tipo_motor"],
        },
        {
            clave: "vehiculo_combustible",
            pregunta: "¿Qué combustible utiliza tu vehículo?",
            tipo: TipoRespuesta.SELECT,
            opciones: ["diesel", "gasolina", "glp", "otro"],
            ayuda: null,
            orden: 50,
            fields: ["vehiculo_combustible"],
        },
        {
            clave: "vehiculo_emisiones_co2",
            pregunta: "¿Cuántos gramos de CO₂ por kilómetro emite tu vehículo?",
            tipo: TipoRespuesta.NUMBER,
            opciones: Prisma.DbNull,
            ayuda:
                "Puedes consultar este dato en la documentación o ficha técnica del vehículo.",
            orden: 60,
            fields: ["vehiculo_emisiones_co2"],
        },
        {
            clave: "compostaje_alta_censo_anterior_2026",
            pregunta:
                "¿Estás acogido al programa municipal de compostaje domiciliario y estabas dado de alta en su censo antes de finalizar 2025?",
            tipo: TipoRespuesta.BOOLEAN,
            opciones: Prisma.DbNull,
            ayuda: null,
            orden: 70,
            fields: ["compostaje_alta_censo_anterior_2026"],
        },
        {
            clave: "compostaje_vivienda_vinculada",
            pregunta: "¿La vivienda por la que pagas la tasa está vinculada al programa municipal de compostaje?",
            tipo: TipoRespuesta.BOOLEAN,
            opciones: Prisma.DbNull,
            ayuda: null,
            orden: 80,
            fields: ["compostaje_vivienda_vinculada"],
        },
        {
            clave: "compostaje_cumplimiento_efectivo",
            pregunta: "¿Cumples efectivamente las condiciones del programa municipal de compostaje domiciliario?",
            tipo: TipoRespuesta.BOOLEAN,
            opciones: Prisma.DbNull,
            ayuda: "La devolución queda sujeta a comprobación municipal.",
            orden: 90,
            fields: ["compostaje_cumplimiento_efectivo"],
        },
        {
            clave: "renta_familiar_ejercicio_anterior_dentro_limite_iprem",
            pregunta: "¿Se ha determinado que, al devengo del 1 de enero de 2026, la renta de 2025 de tu unidad de convivencia (personas empadronadas en la vivienda) no superaba 1,5 × IPREM?",
            tipo: TipoRespuesta.BOOLEAN,
            opciones: Prisma.DbNull,
            ayuda: "Responde sí sólo si este hecho está comprobado. No se convierte el límite a una cifra monetaria no verificada.",
            orden: 100,
            fields: ["renta_familiar_ejercicio_anterior_dentro_limite_iprem"],
        },
        {
            clave: "vehiculo_matriculado_historico",
            pregunta: "¿El vehículo está matriculado oficialmente como histórico?",
            tipo: TipoRespuesta.BOOLEAN,
            opciones: Prisma.DbNull,
            ayuda: null,
            orden: 110,
            fields: ["vehiculo_matriculado_historico"],
        },
        {
            clave: "vehiculo_epoca_acreditado",
            pregunta: "¿Está acreditada la condición de vehículo de época?",
            tipo: TipoRespuesta.BOOLEAN,
            opciones: Prisma.DbNull,
            ayuda: "La antigüedad por sí sola no acredita esta condición.",
            orden: 120,
            fields: ["vehiculo_epoca_acreditado"],
        },
        {
            clave: "vehiculo_antiguedad_fabricacion",
            pregunta: "¿Qué antigüedad tiene el vehículo desde su fabricación, en años?",
            tipo: TipoRespuesta.NUMBER,
            opciones: Prisma.DbNull,
            ayuda: null,
            orden: 130,
            fields: ["vehiculo_antiguedad_fabricacion"],
        },
        {
            clave: "vehiculo_movilidad_reducida_devengo_2026",
            pregunta: "¿Era un vehículo para persona de movilidad reducida el 1 de enero de 2026?",
            tipo: TipoRespuesta.BOOLEAN,
            opciones: Prisma.DbNull,
            ayuda: "Se pregunta por la condición del vehículo en el devengo, no por una dificultad de movilidad actual.",
            orden: 140,
            fields: ["vehiculo_movilidad_reducida_devengo_2026"],
        },
        {
            clave: "vehiculo_titular_persona_discapacidad_devengo_2026",
            pregunta: "¿Estaba el vehículo matriculado a nombre de la persona con discapacidad el 1 de enero de 2026?",
            tipo: TipoRespuesta.BOOLEAN,
            opciones: Prisma.DbNull,
            ayuda: null,
            orden: 150,
            fields: ["vehiculo_titular_persona_discapacidad_devengo_2026"],
        },
        {
            clave: "vehiculo_uso_exclusivo_discapacidad_devengo_2026",
            pregunta: "¿Estaba destinado el vehículo al uso exclusivo de la persona con discapacidad el 1 de enero de 2026?",
            tipo: TipoRespuesta.BOOLEAN,
            opciones: Prisma.DbNull,
            ayuda: null,
            orden: 160,
            fields: ["vehiculo_uso_exclusivo_discapacidad_devengo_2026"],
        },
        {
            clave: "discapacidad_porcentaje_devengo_2026",
            pregunta: "¿Qué porcentaje de discapacidad estaba acreditado el 1 de enero de 2026?",
            tipo: TipoRespuesta.NUMBER,
            opciones: Prisma.DbNull,
            ayuda: "Consulta la acreditación válida en la fecha de devengo.",
            orden: 170,
            fields: ["discapacidad_porcentaje_devengo_2026"],
        },
        {
            clave: "unidad_familiar_hijo_0_a_3",
            pregunta: "¿Tu unidad familiar tiene un hijo de 0 a 3 años?",
            tipo: TipoRespuesta.BOOLEAN,
            opciones: Prisma.DbNull,
            ayuda: "Se pregunta por la situación de la unidad familiar para la autorización ORA que solicitas.",
            orden: 180,
            fields: ["unidad_familiar_hijo_0_a_3"],
        },
        {
            clave: "solicitante_empadronado_valladolid",
            pregunta: "¿Está el solicitante de la autorización ORA empadronado en Valladolid?",
            tipo: TipoRespuesta.BOOLEAN,
            opciones: Prisma.DbNull,
            ayuda: null,
            orden: 190,
            fields: ["solicitante_empadronado_valladolid"],
        },
        {
            clave: "familia_numerosa_titulo_vigente_actual",
            pregunta: "¿Tienes un título de familia numerosa vigente para la autorización ORA que solicitas?",
            tipo: TipoRespuesta.BOOLEAN,
            opciones: Prisma.DbNull,
            ayuda: "Se pregunta por la vigencia actual, no por la vigencia en el devengo del 1 de enero de 2026.",
            orden: 200,
            fields: ["familia_numerosa_titulo_vigente_actual"],
        },
        {
            clave: "categoria_familia_numerosa_actual",
            pregunta: "¿Qué categoría figura actualmente en tu título de familia numerosa?",
            tipo: TipoRespuesta.SELECT,
            opciones: ["general", "especial"],
            ayuda: "Consulta la categoría del título vigente para la autorización ORA solicitada.",
            orden: 210,
            fields: ["categoria_familia_numerosa_actual"],
        },
    ];

    await Promise.all(
        questions.map(async (question) => {
            const { fields: fieldKeys, ...questionData } = question;

            const saved = await prisma.preguntaTest.upsert({
                where: {
                    clave: question.clave,
                },
                update: questionData,
                create: questionData,
            });

            await Promise.all(
                fieldKeys.map((fieldKey) => {
                    const field = fields.get(fieldKey);

                    if (!field) {
                        throw new Error(
                            `Campo evaluable no encontrado: ${fieldKey}`,
                        );
                    }

                    return prisma.preguntaCampo.upsert({
                        where: {
                            preguntaId_campoId: {
                                preguntaId: saved.id,
                                campoId: field.id,
                            },
                        },
                        update: {},
                        create: {
                            preguntaId: saved.id,
                            campoId: field.id,
                        },
                    });
                }),
            );
        }),
    );
}
