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
            clave: "familia_numerosa",
            pregunta: "¿Tienes actualmente título de familia numerosa?",
            tipo: TipoRespuesta.BOOLEAN,
            opciones: Prisma.DbNull,
            ayuda:
                "Selecciona sí únicamente si dispones de un título de familia numerosa vigente.",
            orden: 10,
            fields: ["familia_numerosa"],
        },
        {
            clave: "categoria_familia_numerosa",
            pregunta: "¿Qué categoría figura en tu título de familia numerosa?",
            tipo: TipoRespuesta.SELECT,
            opciones: ["general", "especial"],
            ayuda:
                "Consulta la categoría indicada en tu título de familia numerosa.",
            orden: 20,
            fields: ["categoria_familia_numerosa"],
        },
        {
            clave: "vivienda_habitual",
            pregunta: "¿El inmueble es tu vivienda habitual?",
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
            clave: "participa_programa_compostaje",
            pregunta:
                "¿Estás acogido a un programa de compostaje domiciliario individual?",
            tipo: TipoRespuesta.BOOLEAN,
            opciones: Prisma.DbNull,
            ayuda: null,
            orden: 70,
            fields: ["participa_programa_compostaje"],
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