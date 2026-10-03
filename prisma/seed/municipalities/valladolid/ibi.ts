import {
    EstadoRevision,
    OperadorLogico,
    OperadorRegla,
    PrismaClient,
    TipoBonificacion,
} from "../../../../src/generated/prisma/client";

type FieldMap = Map<string, { id: bigint; clave: string }>;

export async function seedValladolidIbi(
    prisma: PrismaClient,
    municipioId: bigint,
    fields: FieldMap,
    sourceId: bigint,
) {
    const familiaNumerosa = fields.get("familia_numerosa_devengo_2026");
    const categoria = fields.get("categoria_familia_numerosa");
    const viviendaHabitual = fields.get("vivienda_habitual");

    if (!familiaNumerosa || !categoria || !viviendaHabitual) {
        throw new Error("Faltan campos evaluables para IBI familia numerosa");
    }

    const beneficio = await prisma.beneficio.create({
        data: {
            municipioId,
            tributo: "IBI",
            slug: "familia-numerosa",
            titulo: "Bonificación del IBI para familias numerosas",
            descripcionCorta:
                "Bonificación del IBI de la vivienda habitual para familias numerosas.",
            descripcion:
                "Las familias numerosas pueden beneficiarse de una bonificación del IBI de su vivienda habitual en función de la categoría de su título.",
            ejercicioDesde: 2026,
            ejercicioHasta: 2026,
            tipo: TipoBonificacion.PORCENTAJE,
            valor: null,
            unidad: "cuota",
            estado: EstadoRevision.VIGENTE,
            fechaUltimaRevision: new Date("2026-10-03T00:00:00.000Z"),

            fuentes: {
                create: {
                    fuenteId: sourceId,
                    esPrincipal: true,
                },
            },

            tramite: {
                create: {
                    requiereSolicitud: true,
                    plazoDescripcion:
                        "Antes de finalizar el período voluntario del IBI: 5 de junio de 2026.",
                    plazoHasta: new Date("2026-06-05T00:00:00.000Z"),
                },
            },
        },
    });

    await prisma.grupoRegla.create({
        data: {
            beneficioId: beneficio.id,
            operador: OperadorLogico.AND,
            orden: 10,
            reglas: {
                create: [
                    {
                        campoId: familiaNumerosa.id,
                        operador: OperadorRegla.EQ,
                        valor: true,
                        descripcionUsuario:
                            "El título de familia numerosa debía ser válido en el devengo del 1 de enero de 2026.",
                        orden: 10,
                    },
                    {
                        campoId: viviendaHabitual.id,
                        operador: OperadorRegla.EQ,
                        valor: true,
                        descripcionUsuario:
                            "El inmueble debe constituir la vivienda habitual.",
                        orden: 20,
                    },
                ],
            },
        },
    });

    const tramoGeneral = await prisma.tramoBeneficio.create({
        data: {
            beneficioId: beneficio.id,
            nombre: "Familia numerosa de categoría general",
            tipo: TipoBonificacion.PORCENTAJE,
            valor: 40,
            unidad: "cuota",
            orden: 10,
        },
    });

    await prisma.grupoRegla.create({
        data: {
            tramoId: tramoGeneral.id,
            operador: OperadorLogico.AND,
            orden: 10,
            reglas: {
                create: {
                    campoId: categoria.id,
                    operador: OperadorRegla.EQ,
                    valor: "general",
                    descripcionUsuario:
                        "El título de familia numerosa debe ser de categoría general.",
                    orden: 10,
                },
            },
        },
    });

    const tramoEspecial = await prisma.tramoBeneficio.create({
        data: {
            beneficioId: beneficio.id,
            nombre: "Familia numerosa de categoría especial",
            tipo: TipoBonificacion.PORCENTAJE,
            valor: 90,
            unidad: "cuota",
            orden: 20,
        },
    });

    await prisma.grupoRegla.create({
        data: {
            tramoId: tramoEspecial.id,
            operador: OperadorLogico.AND,
            orden: 10,
            reglas: {
                create: {
                    campoId: categoria.id,
                    operador: OperadorRegla.EQ,
                    valor: "especial",
                    descripcionUsuario:
                        "El título de familia numerosa debe ser de categoría especial.",
                    orden: 10,
                },
            },
        },
    });
}
