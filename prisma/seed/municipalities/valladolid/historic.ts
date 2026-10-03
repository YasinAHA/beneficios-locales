import {
    EstadoRevision,
    OperadorLogico,
    OperadorRegla,
    PrismaClient,
    TipoBonificacion,
} from "../../../../src/generated/prisma/client";

type FieldMap = Map<string, { id: bigint; clave: string }>;

export async function seedValladolidHistoric(
    prisma: PrismaClient,
    municipioId: bigint,
    fields: FieldMap,
    sourceId: bigint,
) {
    const historico = fields.get("vehiculo_matriculado_historico");
    const epoca = fields.get("vehiculo_epoca_acreditado");
    const antiguedad = fields.get("vehiculo_antiguedad_fabricacion");

    if (!historico || !epoca || !antiguedad) {
        throw new Error("Faltan campos evaluables para IVTM histórico/de época");
    }

    await prisma.beneficio.create({
        data: {
            municipioId,
            tributo: "IVTM",
            slug: "historico-epoca",
            titulo: "Bonificación del IVTM para vehículos históricos o de época",
            descripcionCorta: "Bonificación del 100 % de la cuota por matrícula histórica oficial o por condición acreditada de época con antigüedad de fabricación superior a 30 años.",
            descripcion: "Dos vías para la misma bonificación: matrícula oficial como histórico, o condición acreditada de época y antigüedad de fabricación superior a 30 años. La antigüedad no acredita por sí sola la condición de época.",
            ejercicioDesde: 2026,
            ejercicioHasta: 2026,
            tipo: TipoBonificacion.PORCENTAJE,
            valor: 100,
            unidad: "cuota",
            estado: EstadoRevision.VIGENTE,
            fechaUltimaRevision: new Date("2026-10-03T00:00:00.000Z"),
            fuentes: { create: { fuenteId: sourceId, esPrincipal: true } },
            tramite: {
                create: {
                    requiereSolicitud: true,
                    plazoDescripcion: "Plazo ordinario: hasta el 6 de abril de 2026.",
                    plazoHasta: new Date("2026-04-06T00:00:00.000Z"),
                },
            },
            // El servicio existente devuelve MATCH si algún tramo coincide.
            // Cada vía conserva su AND; no se usa un OR entre grupos hermanos.
            // Ambos tramos describen el mismo 100 %, sin sumarlos.
            tramos: {
                create: [
                    {
                        nombre: "Vehículo matriculado oficialmente como histórico",
                        tipo: TipoBonificacion.PORCENTAJE,
                        valor: 100,
                        unidad: "cuota",
                        orden: 10,
                        gruposReglas: { create: {
                            operador: OperadorLogico.AND,
                            reglas: { create: {
                                campoId: historico.id,
                                operador: OperadorRegla.EQ,
                                valor: true,
                            } },
                        } },
                    },
                    {
                        nombre: "Vehículo de época acreditado con más de 30 años",
                        tipo: TipoBonificacion.PORCENTAJE,
                        valor: 100,
                        unidad: "cuota",
                        orden: 20,
                        gruposReglas: { create: {
                            operador: OperadorLogico.AND,
                            reglas: { create: [
                                { campoId: epoca.id, operador: OperadorRegla.EQ, valor: true, orden: 10 },
                                { campoId: antiguedad.id, operador: OperadorRegla.GT, valor: 30, orden: 20 },
                            ] },
                        } },
                    },
                ],
            },
        },
    });
}
