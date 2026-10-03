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

    console.log("✅ Seed completado.");
}