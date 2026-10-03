import {
    EstadoRevision,
    OperadorLogico,
    OperadorRegla,
    PrismaClient,
    TipoBonificacion,
} from "../../../../src/generated/prisma/client";

type FieldMap = Map<string, { id: bigint; clave: string }>;

export async function seedValladolidOra(
    prisma: PrismaClient,
    municipioId: bigint,
    fields: FieldMap,
    sourceId: bigint,
) {
    const hijo = fields.get("unidad_familiar_hijo_0_a_3");
    const empadronado = fields.get("solicitante_empadronado_valladolid");
    const titulo = fields.get("familia_numerosa_titulo_vigente_actual");
    const categoria = fields.get("categoria_familia_numerosa_actual");

    if (!hijo || !empadronado || !titulo || !categoria) {
        throw new Error("Faltan campos evaluables para ORA familias");
    }

    await prisma.beneficio.create({
        data: {
            municipioId,
            tributo: "ORA",
            slug: "familias",
            titulo: "Exención de ORA para familias",
            descripcionCorta: "Exención para unidades familiares con hijo de 0 a 3 años o familias numerosas de categoría especial, con solicitante empadronado en Valladolid.",
            descripcion: "Dos vías alternativas hacia la misma exención: unidad familiar con hijo de 0 a 3 años y solicitante empadronado en Valladolid; o familia numerosa de categoría especial, título vigente y solicitante empadronado en Valladolid. Los resultados de las vías no se suman.",
            ejercicioDesde: 2026,
            ejercicioHasta: 2026,
            tipo: TipoBonificacion.EXENCION,
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
                    plazoDescripcion: "La autorización de 2026 tiene vigencia hasta el 31 de diciembre. Renovación anual en enero.",
                    procedimiento: "Solicitud de autorización ORA para familias.",
                    observaciones: "Sólo un vehículo. La titularidad o vínculo del vehículo según la vía y las exclusiones operativas de determinadas zonas o situaciones requieren comprobación administrativa; no se evalúan automáticamente.",
                },
            },
            // Cada vía conserva su AND y produce la misma exención.
            // El servicio admite vías coincidentes sin sumar sus resultados.
            tramos: {
                create: [
                    {
                        nombre: "Unidad familiar con hijo de 0 a 3 años",
                        tipo: TipoBonificacion.EXENCION,
                        valor: null,
                        unidad: "cuota",
                        orden: 10,
                        gruposReglas: {
                            create: {
                                operador: OperadorLogico.AND,
                                reglas: {
                                    create: [
                                        {
                                            campoId: hijo.id,
                                            operador: OperadorRegla.EQ,
                                            valor: true,
                                            orden: 10,
                                        },
                                        {
                                            campoId: empadronado.id,
                                            operador: OperadorRegla.EQ,
                                            valor: true,
                                            orden: 20,
                                        },
                                    ],
                                },
                            },
                        },
                    },
                    {
                        nombre: "Familia numerosa de categoría especial con título vigente",
                        tipo: TipoBonificacion.EXENCION,
                        valor: null,
                        unidad: "cuota",
                        orden: 20,
                        gruposReglas: {
                            create: {
                                operador: OperadorLogico.AND,
                                reglas: {
                                    create: [
                                        {
                                            campoId: titulo.id,
                                            operador: OperadorRegla.EQ,
                                            valor: true,
                                            orden: 10,
                                        },
                                        {
                                            campoId: categoria.id,
                                            operador: OperadorRegla.EQ,
                                            valor: "especial",
                                            orden: 20,
                                        },
                                        {
                                            campoId: empadronado.id,
                                            operador: OperadorRegla.EQ,
                                            valor: true,
                                            orden: 30,
                                        },
                                    ],
                                },
                            },
                        },
                    },
                ],
            },
        },
    });
}
