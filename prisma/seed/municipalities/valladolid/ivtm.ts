import {
    EstadoRevision,
    OperadorLogico,
    OperadorRegla,
    PrismaClient,
    TipoBonificacion,
} from "../../../../src/generated/prisma/client";

type FieldMap = Map<string, { id: bigint; clave: string }>;

export async function seedValladolidIvtm(
    prisma: PrismaClient,
    municipioId: bigint,
    fields: FieldMap,
    sourceId: bigint,
) {
    const tipoMotor = fields.get("vehiculo_tipo_motor");
    const combustible = fields.get("vehiculo_combustible");
    const emisiones = fields.get("vehiculo_emisiones_co2");

    if (!tipoMotor || !combustible || !emisiones) {
        throw new Error("Faltan campos evaluables para IVTM");
    }

    const beneficio = await prisma.beneficio.create({
        data: {
            municipioId,
            tributo: "IVTM",
            slug: "movilidad-sostenible",
            titulo: "Bonificaciones del IVTM por movilidad sostenible",
            descripcionCorta:
                "Bonificaciones para determinados vehículos eléctricos, híbridos y de bajas emisiones.",
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
                        "Padrón ordinario: hasta el 6 de abril de 2026. Para nuevas matriculaciones existe una regla específica que permite solicitar estas bonificaciones durante el ejercicio.",
                },
            },
        },
    });

    // Sin grupos de elegibilidad:
    // por definición V1 esto significa TRUE.
    // Son los tramos los que determinan qué bonificación corresponde.

    const electrico = await prisma.tramoBeneficio.create({
        data: {
            beneficioId: beneficio.id,
            nombre: "Vehículo eléctrico",
            tipo: TipoBonificacion.PORCENTAJE,
            valor: 75,
            unidad: "cuota",
            orden: 10,
        },
    });

    await prisma.grupoRegla.create({
        data: {
            tramoId: electrico.id,
            operador: OperadorLogico.AND,
            reglas: {
                create: {
                    campoId: tipoMotor.id,
                    operador: OperadorRegla.EQ,
                    valor: "electrico",
                    descripcionUsuario:
                        "El vehículo debe estar dotado de motor eléctrico.",
                },
            },
        },
    });

    const hibrido = await prisma.tramoBeneficio.create({
        data: {
            beneficioId: beneficio.id,
            nombre: "Vehículo híbrido no diésel",
            tipo: TipoBonificacion.PORCENTAJE,
            valor: 50,
            unidad: "cuota",
            orden: 20,
        },
    });

    await prisma.grupoRegla.create({
        data: {
            tramoId: hibrido.id,
            operador: OperadorLogico.AND,
            reglas: {
                create: [
                    {
                        campoId: tipoMotor.id,
                        operador: OperadorRegla.EQ,
                        valor: "hibrido",
                        descripcionUsuario:
                            "El vehículo debe estar dotado de motor híbrido.",
                        orden: 10,
                    },
                    {
                        campoId: combustible.id,
                        operador: OperadorRegla.NEQ,
                        valor: "diesel",
                        descripcionUsuario:
                            "Los vehículos híbridos diésel están excluidos.",
                        orden: 20,
                    },
                ],
            },
        },
    });

    const glp = await prisma.tramoBeneficio.create({
        data: {
            beneficioId: beneficio.id,
            nombre: "Vehículo que utiliza GLP",
            tipo: TipoBonificacion.PORCENTAJE,
            valor: 40,
            unidad: "cuota",
            orden: 30,
        },
    });

    await prisma.grupoRegla.create({
        data: {
            tramoId: glp.id,
            operador: OperadorLogico.AND,
            reglas: {
                create: {
                    campoId: combustible.id,
                    operador: OperadorRegla.EQ,
                    valor: "glp",
                    descripcionUsuario:
                        "El vehículo debe utilizar gas licuado de petróleo (GLP).",
                },
            },
        },
    });

    const bajasEmisiones = await prisma.tramoBeneficio.create({
        data: {
            beneficioId: beneficio.id,
            nombre: "Vehículo no diésel con emisiones de hasta 120 g CO₂/km",
            tipo: TipoBonificacion.PORCENTAJE,
            valor: 40,
            unidad: "cuota",
            orden: 40,
        },
    });

    await prisma.grupoRegla.create({
        data: {
            tramoId: bajasEmisiones.id,
            operador: OperadorLogico.AND,
            reglas: {
                create: [
                    {
                        campoId: combustible.id,
                        operador: OperadorRegla.NEQ,
                        valor: "diesel",
                        orden: 10,
                    },
                    {
                        campoId: emisiones.id,
                        operador: OperadorRegla.LTE,
                        valor: 120,
                        orden: 20,
                    },
                ],
            },
        },
    });
}
