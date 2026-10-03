import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";

import {
    OperadorLogico,
    OperadorRegla,
    TipoBonificacion,
    TipoCampo,
    TipoRespuesta,
} from "@/generated/prisma/client";
import type { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { runSeed } from "../../../../prisma/seed/index";

afterAll(async () => {
    await prisma.$disconnect();
});

describe("conservative seed cleanup", () => {
    it("preserves obsolete keys legitimately referenced by another municipality", async () => {
        const rollback = new Error("Rollback cleanup test fixtures");
        const suffix = randomUUID().slice(0, 8);
        const municipioSlug = `test-cleanup-${suffix}`;
        const obsoleteKeys = ["familia_numerosa", "participa_programa_compostaje"];

        await expect(prisma.$transaction(async (tx) => {
            const municipio = await tx.municipio.create({
                data: {
                    codigoIne: suffix,
                    slug: municipioSlug,
                    nombre: "Municipio de prueba",
                    provincia: "Prueba",
                    comunidad: "Prueba",
                },
            });
            const fields = [];
            for (const clave of obsoleteKeys) {
                const field = await tx.campoEvaluable.upsert({
                    where: { clave },
                    update: {},
                    create: { clave, tipo: TipoCampo.BOOLEAN },
                });
                fields.push(field);
                const question = await tx.preguntaTest.upsert({
                    where: { clave },
                    update: {},
                    create: { clave, pregunta: "Pregunta antigua de prueba", tipo: TipoRespuesta.BOOLEAN },
                });
                await tx.preguntaCampo.upsert({
                    where: { preguntaId_campoId: { preguntaId: question.id, campoId: field.id } },
                    update: {},
                    create: { preguntaId: question.id, campoId: field.id },
                });
            }
            await tx.beneficio.create({
                data: {
                    municipioId: municipio.id,
                    tributo: "TEST",
                    slug: "cleanup-references",
                    titulo: "Beneficio de prueba con claves antiguas",
                    ejercicioDesde: 2026,
                    tipo: TipoBonificacion.EXENCION,
                    gruposReglas: {
                        create: {
                            operador: OperadorLogico.AND,
                            reglas: {
                                create: fields.map((field) => ({
                                    campoId: field.id,
                                    operador: OperadorRegla.EQ,
                                    valor: true,
                                })),
                            },
                        },
                    },
                },
            });

            // El seed sólo usa los delegates presentes en el cliente transaccional.
            // La transacción revierte tanto las fixtures como la reconstrucción del seed.
            await runSeed(tx as PrismaClient);

            for (const clave of obsoleteKeys) {
                expect(await tx.campoEvaluable.findUnique({ where: { clave } })).not.toBeNull();
                const question = await tx.preguntaTest.findUniqueOrThrow({
                    where: { clave },
                    include: { campos: { include: { campo: true } } },
                });
                expect(question.campos.some((link) => link.campo.clave === clave)).toBe(true);
            }
            expect(await tx.regla.count({
                where: {
                    campo: { clave: { in: obsoleteKeys } },
                    grupo: { beneficio: { municipio: { slug: municipioSlug } } },
                },
            })).toBe(2);
            expect(await tx.regla.count({
                where: {
                    campo: { clave: { in: obsoleteKeys } },
                    grupo: { OR: [
                        { beneficio: { municipio: { slug: "valladolid" }, ejercicioDesde: 2026 } },
                        { tramo: { beneficio: { municipio: { slug: "valladolid" }, ejercicioDesde: 2026 } } },
                    ] },
                },
            })).toBe(0);
            throw rollback;
        }, { timeout: 15_000 })).rejects.toBe(rollback);
    });
});
