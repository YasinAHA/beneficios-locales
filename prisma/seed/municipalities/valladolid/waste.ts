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
    const familiaNumerosa = fields.get("familia_numerosa");
    const viviendaHabitual = fields.get("vivienda_habitual");
    const compostaje = fields.get("participa_programa_compostaje");

    if (!familiaNumerosa || !viviendaHabitual || !compostaje) {
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
                        "Debe solicitarse conforme al plazo establecido para la bonificación de la tasa.",
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
                create: {
                    campoId: compostaje.id,
                    operador: OperadorRegla.EQ,
                    valor: true,
                    descripcionUsuario:
                        "Debes estar acogido a un programa de compostaje domiciliario individual.",
                },
            },
        },
    });
}