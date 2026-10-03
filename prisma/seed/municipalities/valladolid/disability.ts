import {
    EstadoRevision,
    OperadorLogico,
    OperadorRegla,
    PrismaClient,
    TipoBonificacion,
} from "../../../../src/generated/prisma/client";

type FieldMap = Map<string, { id: bigint; clave: string }>;

export async function seedValladolidDisability(
    prisma: PrismaClient,
    municipioId: bigint,
    fields: FieldMap,
    sourceId: bigint,
) {
    const movilidad = fields.get("vehiculo_movilidad_reducida_devengo_2026");
    const titular = fields.get("vehiculo_titular_persona_discapacidad_devengo_2026");
    const exclusivo = fields.get("vehiculo_uso_exclusivo_discapacidad_devengo_2026");
    const porcentaje = fields.get("discapacidad_porcentaje_devengo_2026");

    if (!movilidad || !titular || !exclusivo || !porcentaje) {
        throw new Error("Faltan campos evaluables para IVTM discapacidad");
    }

    await prisma.beneficio.create({
        data: {
            municipioId,
            tributo: "IVTM",
            slug: "discapacidad",
            titulo: "Exención del IVTM por discapacidad o movilidad reducida",
            descripcionCorta: "Exención para vehículos de movilidad reducida o matriculados a nombre de una persona con discapacidad para su uso exclusivo.",
            ejercicioDesde: 2026,
            ejercicioHasta: 2026,
            tipo: TipoBonificacion.EXENCION,
            valor: null,
            unidad: "cuota",
            estado: EstadoRevision.VIGENTE,
            fechaUltimaRevision: new Date("2026-10-03T00:00:00.000Z"),
            fuentes: { create: { fuenteId: sourceId, esPrincipal: true } },
            tramite: {
                create: {
                    requiereSolicitud: true,
                    plazoHasta: new Date("2026-04-06T00:00:00.000Z"),
                    plazoDescripcion: "Padrón ordinario 2026: hasta el 6 de abril.",
                    observaciones: "Sólo un vehículo puede disfrutar simultáneamente de esta exención por beneficiario. El certificado, seguro y demás documentación deben ser válidos y referirse al momento del devengo. Una vez reconocida, persiste mientras no cambien las circunstancias. Estas comprobaciones administrativas y la persistencia no se evalúan automáticamente.",
                },
            },
            // Las vías son alternativas de la misma exención, sin acumulación.
            tramos: {
                create: [
                    {
                        nombre: "Vehículo para persona de movilidad reducida",
                        tipo: TipoBonificacion.EXENCION,
                        valor: null,
                        unidad: "cuota",
                        orden: 10,
                        gruposReglas: { create: {
                            operador: OperadorLogico.AND,
                            reglas: { create: {
                                campoId: movilidad.id,
                                operador: OperadorRegla.EQ,
                                valor: true,
                            } },
                        } },
                    },
                    {
                        nombre: "Vehículo a nombre de persona con discapacidad para uso exclusivo",
                        tipo: TipoBonificacion.EXENCION,
                        valor: null,
                        unidad: "cuota",
                        orden: 20,
                        gruposReglas: { create: {
                            operador: OperadorLogico.AND,
                            reglas: { create: [
                                { campoId: titular.id, operador: OperadorRegla.EQ, valor: true, orden: 10 },
                                { campoId: exclusivo.id, operador: OperadorRegla.EQ, valor: true, orden: 20 },
                                { campoId: porcentaje.id, operador: OperadorRegla.GTE, valor: 33, orden: 30 },
                            ] },
                        } },
                    },
                ],
            },
        },
    });
}
