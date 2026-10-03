import {
    EstadoRevision,
    OperadorLogico,
    OperadorRegla,
    PrismaClient,
    TipoBonificacion,
} from "../../../../src/generated/prisma/client";

type FieldMap = Map<string, { id: bigint; clave: string }>;

export async function seedValladolidWaste(
    prisma: PrismaClient,
    municipioId: bigint,
    fields: FieldMap,
    familiaNumerosaSourceId: bigint,
    compostajeSourceId: bigint,
) {
    const familiaNumerosa = fields.get("familia_numerosa_devengo_2026");
    const viviendaHabitual = fields.get("vivienda_habitual");
    const compostaje = fields.get("compostaje_alta_censo_anterior_2026");
    const vinculada = fields.get("compostaje_vivienda_vinculada");
    const cumplimiento = fields.get("compostaje_cumplimiento_efectivo");
    const renta = fields.get("renta_familiar_ejercicio_anterior_dentro_limite_iprem");

    if (!familiaNumerosa || !viviendaHabitual || !compostaje || !vinculada || !cumplimiento || !renta) {
        throw new Error("Faltan campos evaluables para la tasa de residuos");
    }

    const familia = await prisma.beneficio.create({
        data: {
            municipioId,
            tributo: "TASA_RESIDUOS",
            slug: "familia-numerosa",
            titulo:
                "Bonificación de la tasa de residuos para familias numerosas",
            descripcionCorta:
                "Reducción del 50 % de la parte variable de la tasa para familias numerosas.",
            ejercicioDesde: 2026,
            ejercicioHasta: 2026,
            tipo: TipoBonificacion.PORCENTAJE,
            valor: 50,
            unidad: "parte_variable",
            estado: EstadoRevision.VIGENTE,
            fechaUltimaRevision: new Date("2026-10-03T00:00:00.000Z"),

            tramite: {
                create: {
                    requiereSolicitud: true,
                    plazoDescripcion:
                        "Hasta finalizar el período voluntario: 5 de noviembre de 2026. Fuera de plazo puede producir efectos en el período siguiente.",
                    plazoHasta: new Date("2026-11-05T00:00:00.000Z"),
                },
            },
            fuentes: {
                create: {
                    fuenteId: familiaNumerosaSourceId,
                    esPrincipal: true,
                },
            },
        },
    });

    await prisma.grupoRegla.create({
        data: {
            beneficioId: familia.id,
            operador: OperadorLogico.AND,
            reglas: {
                create: [
                    {
                        campoId: familiaNumerosa.id,
                        operador: OperadorRegla.EQ,
                        valor: true,
                        orden: 10,
                    },
                    {
                        campoId: viviendaHabitual.id,
                        operador: OperadorRegla.EQ,
                        valor: true,
                        orden: 20,
                    },
                ],
            },
        },
    });

    const beneficioCompostaje = await prisma.beneficio.create({
        data: {
            municipioId,
            tributo: "TASA_RESIDUOS",
            slug: "compostaje-domiciliario",
            titulo:
                "Bonificación de la tasa de residuos por compostaje domiciliario",
            descripcionCorta:
                "Bonificación del 75 % de la parte variable para contribuyentes acogidos a un programa de compostaje domiciliario individual.",
            ejercicioDesde: 2026,
            ejercicioHasta: 2026,
            tipo: TipoBonificacion.PORCENTAJE,
            valor: 75,
            unidad: "parte_variable",
            estado: EstadoRevision.VIGENTE,
            fechaUltimaRevision: new Date("2026-10-03T00:00:00.000Z"),

            tramite: {
                create: {
                    requiereSolicitud: true,
                    plazoHasta: new Date("2026-11-05T00:00:00.000Z"),
                    plazoDescripcion: "Requiere solicitud fiscal separada hasta el 5 de noviembre de 2026. Se paga inicialmente el 100 % de la tasa; tras comprobación se devuelve el 75 % de la parte variable durante el primer trimestre del año siguiente.",
                },
            },

            fuentes: {
                create: {
                    fuenteId: compostajeSourceId,
                    esPrincipal: true,
                },
            },
        },
    });

    await prisma.grupoRegla.create({
        data: {
            beneficioId: beneficioCompostaje.id,
            operador: OperadorLogico.AND,
            reglas: {
                create: [
                    {
                        campoId: compostaje.id,
                        operador: OperadorRegla.EQ,
                        valor: true,
                        descripcionUsuario:
                            "Debes estar acogido al programa municipal y dado de alta en el censo antes de finalizar 2025.",
                        orden: 10,
                    },
                    {
                        campoId: vinculada.id,
                        operador: OperadorRegla.EQ,
                        valor: true,
                        orden: 20,
                    },
                    {
                        campoId: cumplimiento.id,
                        operador: OperadorRegla.EQ,
                        valor: true,
                        orden: 30,
                    },
                ],
            },
        },
    });

    const beneficioRenta = await prisma.beneficio.create({
        data: {
            municipioId,
            tributo: "TASA_RESIDUOS",
            slug: "renta-iprem",
            titulo: "Bonificación de la tasa de residuos por renta familiar",
            descripcionCorta: "Bonificación del 75 % de la parte variable por renta familiar del ejercicio anterior no superior a 1,5 × IPREM.",
            descripcion: "Se considera la renta de 2025 de la unidad de convivencia/personas empadronadas en la vivienda, con requisitos al devengo del 1 de enero de 2026. El límite debe estar determinado, sin inferir una cifra monetaria.",
            ejercicioDesde: 2026,
            ejercicioHasta: 2026,
            tipo: TipoBonificacion.PORCENTAJE,
            valor: 75,
            unidad: "parte_variable",
            estado: EstadoRevision.VIGENTE,
            fechaUltimaRevision: new Date("2026-10-03T00:00:00.000Z"),
            fuentes: {
                create: {
                    fuenteId: familiaNumerosaSourceId,
                    esPrincipal: true,
                },
            },
            tramite: {
                create: {
                    requiereSolicitud: true,
                    plazoHasta: new Date("2026-11-05T00:00:00.000Z"),
                    plazoDescripcion: "Hasta el 5 de noviembre de 2026. Fuera de plazo puede producir efectos en el período siguiente.",
                },
            },
        },
    });
    await prisma.grupoRegla.create({
        data: {
            beneficioId: beneficioRenta.id,
            operador: OperadorLogico.AND,
            reglas: {
                create: [
                    {
                        campoId: viviendaHabitual.id,
                        operador: OperadorRegla.EQ,
                        valor: true,
                        orden: 10,
                    },
                    {
                        campoId: renta.id,
                        operador: OperadorRegla.EQ,
                        valor: true,
                        orden: 20,
                    },
                ],
            },
        },
    });
}
