import { PrismaClient, TipoCampo } from "../../src/generated/prisma/client";

export async function seedFields(prisma: PrismaClient) {
    const fields = [
        {
            clave: "familia_numerosa",
            tipo: TipoCampo.BOOLEAN,
            descripcion: "La unidad familiar tiene la condición de familia numerosa.",
        },
        {
            clave: "categoria_familia_numerosa",
            tipo: TipoCampo.STRING,
            descripcion: "Categoría del título de familia numerosa.",
        },
        {
            clave: "vivienda_habitual",
            tipo: TipoCampo.BOOLEAN,
            descripcion: "El inmueble constituye la vivienda habitual.",
        },
        {
            clave: "vehiculo_tipo_motor",
            tipo: TipoCampo.STRING,
            descripcion: "Tipo de motorización del vehículo.",
        },
        {
            clave: "vehiculo_combustible",
            tipo: TipoCampo.STRING,
            descripcion: "Combustible utilizado por el vehículo.",
        },
        {
            clave: "vehiculo_emisiones_co2",
            tipo: TipoCampo.NUMBER,
            descripcion: "Emisiones oficiales de CO₂ del vehículo en g/km.",
        },
        {
            clave: "participa_programa_compostaje",
            tipo: TipoCampo.BOOLEAN,
            descripcion:
                "El contribuyente está acogido a un programa de compostaje domiciliario individual.",
        },
    ];

    const savedFields = await Promise.all(
        fields.map((field) =>
            prisma.campoEvaluable.upsert({
                where: { clave: field.clave },
                update: {
                    tipo: field.tipo,
                    descripcion: field.descripcion,
                },
                create: field,
            }),
        ),
    );

    return new Map(savedFields.map((field) => [field.clave, field]));
}