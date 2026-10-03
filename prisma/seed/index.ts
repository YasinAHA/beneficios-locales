import { PrismaClient } from "../../src/generated/prisma/client";
import { seedFields } from "./fields";
import { seedQuestions } from "./questions";
import { seedValladolid } from "./municipalities/valladolid";

export async function runSeed(prisma: PrismaClient) {
    console.log("🌱 Sembrando campos evaluables...");
    const fields = await seedFields(prisma);

    console.log("🌱 Sembrando preguntas...");
    await seedQuestions(prisma, fields);

    console.log("🌱 Sembrando Valladolid...");
    await seedValladolid(prisma, fields);

    // Retiramos sólo las claves antiguas que ya no utiliza ningún beneficio.
    const obsoleteKeys = ["familia_numerosa", "participa_programa_compostaje"];
    await prisma.preguntaTest.deleteMany({
        where: {
            clave: { in: obsoleteKeys },
            campos: { every: { campo: { reglas: { none: {} } } } },
        },
    });
    await prisma.campoEvaluable.deleteMany({
        where: {
            clave: { in: obsoleteKeys },
            reglas: { none: {} },
            preguntaCampos: { none: {} },
        },
    });

    console.log("✅ Seed completado.");
}
