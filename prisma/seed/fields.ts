import { PrismaClient, TipoCampo } from "../../src/generated/prisma/client";

export async function seedFields(prisma: PrismaClient) {
    const fields = [
        {
            clave: "familia_numerosa_devengo_2026",
            tipo: TipoCampo.BOOLEAN,
            descripcion: "Título de familia numerosa válido en el devengo del 1 de enero de 2026.",
        },
        {
            clave: "categoria_familia_numerosa",
            tipo: TipoCampo.STRING,
            descripcion: "Categoría del título de familia numerosa válido el 1 de enero de 2026.",
        },
        {
            clave: "vivienda_habitual",
            tipo: TipoCampo.BOOLEAN,
            descripcion: "El inmueble constituye la vivienda habitual en el devengo del 1 de enero de 2026.",
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
            clave: "compostaje_alta_censo_anterior_2026",
            tipo: TipoCampo.BOOLEAN,
            descripcion:
                "Acogido al programa municipal y dado de alta en su censo antes de finalizar 2025.",
        },
        {
            clave: "compostaje_vivienda_vinculada",
            tipo: TipoCampo.BOOLEAN,
            descripcion: "La vivienda objeto de la tasa está vinculada al programa municipal de compostaje.",
        },
        {
            clave: "compostaje_cumplimiento_efectivo",
            tipo: TipoCampo.BOOLEAN,
            descripcion: "Cumplimiento efectivo del programa municipal de compostaje domiciliario.",
        },
        {
            clave: "renta_familiar_ejercicio_anterior_dentro_limite_iprem",
            tipo: TipoCampo.BOOLEAN,
            descripcion: "Hecho determinado al devengo del 1 de enero de 2026: renta de 2025 de la unidad de convivencia empadronada en la vivienda <= 1,5 × IPREM. Sin umbral monetario inferido.",
        },
        {
            clave: "vehiculo_matriculado_historico",
            tipo: TipoCampo.BOOLEAN,
            descripcion: "Vehículo matriculado oficialmente como histórico.",
        },
        {
            clave: "vehiculo_epoca_acreditado",
            tipo: TipoCampo.BOOLEAN,
            descripcion: "Condición de vehículo de época acreditada; no se infiere de su antigüedad.",
        },
        {
            clave: "vehiculo_antiguedad_fabricacion",
            tipo: TipoCampo.NUMBER,
            descripcion: "Antigüedad desde la fabricación del vehículo, en años.",
        },
        {
            clave: "vehiculo_movilidad_reducida_devengo_2026",
            tipo: TipoCampo.BOOLEAN,
            descripcion: "Vehículo para persona de movilidad reducida al devengo del 1 de enero de 2026.",
        },
        {
            clave: "vehiculo_titular_persona_discapacidad_devengo_2026",
            tipo: TipoCampo.BOOLEAN,
            descripcion: "Vehículo matriculado a nombre de la persona con discapacidad al devengo del 1 de enero de 2026.",
        },
        {
            clave: "vehiculo_uso_exclusivo_discapacidad_devengo_2026",
            tipo: TipoCampo.BOOLEAN,
            descripcion: "Vehículo para uso exclusivo de la persona con discapacidad al devengo del 1 de enero de 2026.",
        },
        {
            clave: "discapacidad_porcentaje_devengo_2026",
            tipo: TipoCampo.NUMBER,
            descripcion: "Porcentaje de discapacidad acreditado en el devengo del 1 de enero de 2026.",
        },
        {
            clave: "unidad_familiar_hijo_0_a_3",
            tipo: TipoCampo.BOOLEAN,
            descripcion: "La unidad familiar tiene un hijo de 0 a 3 años para la autorización ORA solicitada.",
        },
        {
            clave: "solicitante_empadronado_valladolid",
            tipo: TipoCampo.BOOLEAN,
            descripcion: "El solicitante de la autorización está empadronado en Valladolid.",
        },
        {
            clave: "familia_numerosa_titulo_vigente_actual",
            tipo: TipoCampo.BOOLEAN,
            descripcion: "Título de familia numerosa vigente para la autorización ORA solicitada; no se refiere al devengo del 1 de enero de 2026.",
        },
        {
            clave: "categoria_familia_numerosa_actual",
            tipo: TipoCampo.STRING,
            descripcion: "Categoría actual del título de familia numerosa para la autorización ORA solicitada.",
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
